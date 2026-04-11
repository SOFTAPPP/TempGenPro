import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { simpleParser } from 'mailparser';
import { emitNewEmail, emitToUser, broadcastAdminUserUpdate } from '../utils/socket.js';
import { clearBanCache } from '../middlewares/auth.js';
import { syncAdminStats } from './adminController.js';

// ⚡ Debounced admin stats sync: coalesces multiple emails to one DB query burst
let statsDebounceTimer: NodeJS.Timeout | null = null;
const debouncedSyncStats = () => {
  if (statsDebounceTimer) return; // Already scheduled
  statsDebounceTimer = setTimeout(() => {
    statsDebounceTimer = null;
    syncAdminStats().catch(() => {}); // Fire and forget
  }, 30_000); // Sync admin stats at most once every 30 seconds
};

import { purgeTrackers } from '../utils/deTracker';

export const receiveEmail = async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const incomingSecret = req.headers['x-webhook-secret'];

    // Security Check
    if (webhookSecret && incomingSecret !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, from, subject, raw, text, html } = req.body;
    const emailTo = to?.toLowerCase().trim();

    if (!emailTo) {
      return res.status(400).json({ error: 'Recipient required' });
    }

    // ⚡ STEP 1: Fast Recipient Lookup
    const tempEmail = await prisma.tempEmail.findUnique({
      where: { email: emailTo, isActive: true },
      select: { id: true, email: true, userId: true }
    });

    if (!tempEmail) {
      return res.status(404).json({ error: 'Email not found or inactive' });
    }

    // ⚡ STEP 2: Respond IMMEDIATELY (Disconnect sender)
    res.status(202).json({ status: 'Accepted', message: 'Email queued for processing' });

    // ⚡ STEP 3: Background Processing (Doesn't block Cloudflare)
    setImmediate(async () => {
      try {
        let finalBody = text || html || '';
        let emailSubject = subject || '(No Subject)';

        // 🚀 Parallel parsing if raw is present
        if (raw) {
          const parsed = await simpleParser(raw);
          finalBody = parsed.html || parsed.text || '';
          emailSubject = parsed.subject || emailSubject;
        }

        // 🛡️ Privacy Shield (De-Tracker) Integration
        const { cleanedHtml, trackersBlocked } = purgeTrackers(finalBody);
        finalBody = cleanedHtml;

        // 🛡️ Platform Policy Enforcement (Auto-Ban)
        const checkContent = `${emailSubject} ${finalBody} ${from}`.toLowerCase();
        const isProhibited = checkContent.includes('facebook') || checkContent.includes('instagram');

        if (isProhibited && tempEmail.userId) {
          await prisma.user.update({
            where: { id: tempEmail.userId },
            data: { isBanned: true }
          });
          clearBanCache(tempEmail.userId);
          emitToUser(tempEmail.userId, 'user_banned', { message: 'Policy violation ban.' });
          broadcastAdminUserUpdate();
          return; // Stop processing
        }

        // 🔍 OTP Extraction
        let otpMatch = emailSubject.match(/\b\d{4,8}\b/);
        if (!otpMatch) otpMatch = finalBody.match(/\b\d{4,8}\b/);
        const otpCode = otpMatch ? otpMatch[0] : undefined;

        // 💾 Save to DB
        const message = await prisma.message.create({
          data: {
            tempEmailId: tempEmail.id,
            sender: from,
            subject: emailSubject,
            body: finalBody || '(No content)',
            otpCode: otpCode,
            trackersBlocked: trackersBlocked
          }
        });

        // 📡 Broadcast to User Dashboard
        emitNewEmail(tempEmail.email, message);
        if (tempEmail.userId) {
          emitToUser(tempEmail.userId, 'new_email_global', { email: tempEmail.email, message });
        }
        debouncedSyncStats();

      } catch (err) {
        console.error('[Webhook Background] Error:', err);
      }
    });

  } catch (error) {
    console.error('[Webhook] Fatal error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};
