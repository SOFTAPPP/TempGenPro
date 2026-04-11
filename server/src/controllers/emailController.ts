import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';
import { generateUniqueEmail } from '../utils/emailGenerator';
import { syncAdminStats } from './adminController';
import { generateNoiseForEmail } from '../utils/noiseEngine';

export const getUserEmails = async (req: AuthRequest, res: Response) => {
  try {
    const emails = await prisma.tempEmail.findMany({
      where: { userId: req.user?.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createEmail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = (req as any).user?.role;

    // ⚡ ENTITLEMENT CHECK: Limit users to 5 nodes, Admins are unlimited
    if (userRole !== 'ADMIN') {
      const activeCount = await prisma.tempEmail.count({
        where: { userId, isActive: true }
      });

      if (activeCount >= 5) {
        return res.status(403).json({
          error: 'INVENTORY FULL: Free tier supports a maximum of 5 active relay nodes. Please disconnect an existing node to deploy a new one.'
        });
      }
    }

    const { type, includePersona } = req.body;
    let forcedDomain;

    if (userRole === 'ADMIN') {
      if (type === 'social') {
        forcedDomain = 'mysocialrelay.com';
      } else if (type === 'main') {
        forcedDomain = 'tempgenpro.com';
      }
    }

    const email = await generateUniqueEmail(userId, forcedDomain, includePersona !== false);

    // ⚡ Debounced sync
    setImmediate(() => syncAdminStats().catch(() => {}));

    res.status(201).json(email);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteEmail = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.tempEmail.update({
      where: { id: parseInt(id), userId: req.user?.id },
      data: { isActive: false }
    });

    // ⚡ Debounced sync
    setImmediate(() => syncAdminStats().catch(() => {}));

    res.json({ message: 'Email deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getEmailMessages = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const messages = await prisma.message.findMany({
      where: { tempEmailId: parseInt(id), tempEmail: { userId: req.user?.id } },
      orderBy: { receivedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        sender: true,
        subject: true,
        receivedAt: true,
        otpCode: true,
        trackersBlocked: true,
        // ⚡ Optimization: Only send a small snippet for the list view
        body: true 
      }
    });

    // Manually truncate bodies in-memory to save bandwidth while keeping the 'body' property for logic
    const optimizedMessages = messages.map(m => ({
      ...m,
      body: m.body.substring(0, 200) + (m.body.length > 200 ? '...' : ''),
      trackersBlocked: m.trackersBlocked || 0
    }));

    res.json(optimizedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMessageDetail = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const message = await prisma.message.findFirst({
      where: { id, tempEmail: { userId: req.user?.id } }
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Simulated OTP feature
export const generateSimulationOTP = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const tempEmailId = parseInt(id);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = await prisma.oTP.create({
      data: { tempEmailId, code: otpCode }
    });

    await prisma.message.create({
      data: {
        tempEmailId,
        sender: 'security-noreply@tempgenpro.com',
        subject: `🔒 Verification Code: ${otpCode}`,
        body: `Hello,\n\nYour one-time security code is: ${otpCode}. \n\nThis code is required to verify your identity. For security reasons, do not share this code with anyone. \n\nRegards,\nSecurity Team`,
        otpCode
      }
    });

    res.json({ message: 'OTP sent', otp });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    // Find message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id,
        tempEmail: { userId: req.user?.id }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    await prisma.message.delete({ where: { id } });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const toggleCamouflage = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const emailNode = await prisma.tempEmail.findFirst({
      where: { id, userId: req.user?.id }
    });

    if (!emailNode) {
      return res.status(404).json({ error: 'Relay node not found' });
    }

    const updated = await prisma.tempEmail.update({
      where: { id },
      data: { camouflageEnabled: !emailNode.camouflageEnabled }
    });

    if (updated.camouflageEnabled) {
      // ⚡ Instant manifesting: Trigger one noise packet immediately
      generateNoiseForEmail(updated.id, updated.email, updated.userId).catch(() => {});
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
