import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';
import { generateUniqueEmail } from '../utils/emailGenerator';

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

    const email = await generateUniqueEmail(userId);
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
      take: 50 // Optimization: Only fetch the latest 50 messages
    });
    res.json(messages);
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
        sender: 'system@tempgenpro.com',
        subject: 'Your Verification Code',
        body: `Your code is: ${otpCode}`,
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
