import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { simpleParser } from 'mailparser';
import { emitNewEmail, emitToUser, broadcastAdminUserUpdate } from '../utils/socket.js';
import { clearBanCache } from '../middlewares/auth.js';

export const receiveEmail = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[Webhook] 📥 New Incoming Request at ${new Date().toISOString()}`);

  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const incomingSecret = req.headers['x-webhook-secret'];

    // Security Check
    if (webhookSecret && incomingSecret !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, from, subject, raw, text, html } = req.body;

    let finalBody = text || html || '';
    let emailSubject = subject || '(No Subject)';

    // 🚀 Robust parsing of raw emails
    if (raw) {
      console.time('[Webhook] 📧 Parsing Time');
      const parsed = await simpleParser(raw);
      finalBody = parsed.text || parsed.html || '';
      emailSubject = parsed.subject || emailSubject;
      console.timeEnd('[Webhook] 📧 Parsing Time');
    }

    const emailTo = to.toLowerCase().trim();

    // Find the recipient in local Postgres
    const tempEmail = await prisma.tempEmail.findUnique({
      where: { email: emailTo, isActive: true },
      select: { id: true, email: true, userId: true }
    });

    if (!tempEmail) {
      console.log(`[Webhook] ❌ No active relay for: ${emailTo} (Took ${Date.now() - startTime}ms)`);
      return res.status(404).json({ error: 'Email not found or inactive' });
    }

    // 🛡️ Platform Policy Enforcement (Facebook & Instagram Auto-Ban)
    const checkContent = `${emailSubject} ${finalBody} ${from}`.toLowerCase();
    const isProhibited = checkContent.includes('facebook') || checkContent.includes('instagram');

    if (isProhibited && tempEmail.userId) {
      console.log(`[Webhook] 🚨 PROHIBITED CONTENT: Auto-banning User ${tempEmail.userId} for ${isProhibited ? 'Social Media' : 'Keyword'} violation.`);
      
      // 1. Permanently flag user as banned in DB
      await prisma.user.update({
        where: { id: tempEmail.userId },
        data: { isBanned: true }
      });
      clearBanCache(tempEmail.userId);

      // 2. Emit instant socket signal to kick user
      emitToUser(tempEmail.userId, 'user_banned', {
        message: 'Your account has been automatically suspended for using restricted platform keywords (Facebook/Instagram). Please contact support to appeal.'
      });

      // 3. Notify Admin dashboard to refresh user list
      broadcastAdminUserUpdate();

      console.log(`[Webhook] 🛡️ User ${tempEmail.userId} suspended and kicked.`);
      
      // Block the email from ever reaching the inbox
      return res.status(403).json({ error: 'Account suspended due to policy violation.' });
    }

    // 🔍 Improved Auto-extract OTP Code
    // First, try to find a code in the Subject (highest reliability)
    let otpMatch = emailSubject.match(/\b\d{4,8}\b/);

    // If not in subject, search the Body
    if (!otpMatch) {
      otpMatch = finalBody.match(/\b\d{4,8}\b/);
      
      // Anti-Static/Zip Logic: If we found 94025 (Facebook HQ Zip), it's likely wrong
      if (otpMatch && otpMatch[0] === '94025') {
        const allMatches = finalBody.match(/\b\d{5,8}\b/g);
        if (allMatches && allMatches.length > 1) {
          // Find the first 5-8 digit number that isn't the zip code
          const realCode = allMatches.find((code: string) => code !== '94025');
          if (realCode) otpMatch = [realCode];
        }
      }
    }

    const otpCode = otpMatch ? otpMatch[0] : undefined;

    console.time('[Webhook] 💾 DB Save Time');
    const message = await prisma.message.create({
      data: {
        tempEmailId: tempEmail.id,
        sender: from,
        subject: emailSubject,
        body: finalBody || '(No content)',
        otpCode: otpCode
      }
    });
    console.timeEnd('[Webhook] 💾 DB Save Time');

    // ⚡ Real-time update via Socket.io
    setImmediate(() => {
      emitNewEmail(tempEmail.email, message);
      if (tempEmail.userId) {
        emitToUser(tempEmail.userId, 'new_email_global', { email: tempEmail.email, message });
      }
      
      const { syncAdminStats } = require('./adminController');
      syncAdminStats();
    });

    console.log(`[Webhook] ✅ Processed in ${Date.now() - startTime}ms`);
    res.status(201).json({ message: 'Email received', id: message.id });
  } catch (error) {
    console.error('[Webhook] 💀 Fatal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
