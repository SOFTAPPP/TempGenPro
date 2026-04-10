import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { simpleParser } from 'mailparser';
import { emitNewEmail, emitToUser } from '../utils/socket.js';

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

    // 🔍 Auto-extract OTP Code
    const otpMatch = finalBody.match(/\b\d{4,8}\b/);
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
    });

    console.log(`[Webhook] ✅ Processed in ${Date.now() - startTime}ms`);
    res.status(201).json({ message: 'Email received', id: message.id });
  } catch (error) {
    console.error('[Webhook] 💀 Fatal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
