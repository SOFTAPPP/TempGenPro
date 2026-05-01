import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { emitToUser } from '../utils/socket';
import bcrypt from 'bcryptjs';

export const getAllUserData = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        password: true, // 
        rawPassword: true,
        createdAt: true,
        tempEmails: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
            messages: {
              select: {
                id: true,
                sender: true,
                subject: true,
                receivedAt: true,
              },
              orderBy: { receivedAt: 'desc' },
              take: 20 // Limit to last 20 messages per inbox
            }
          }
        }
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Admin Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch user data for admin dashboard' });
  }
};

export const syncAdminStats = async () => {
  try {
    const [totalUsers, totalTempEmails, activeTempEmails, totalMessages, totalVisitorLogs] = await Promise.all([
      prisma.user.count(),
      prisma.tempEmail.count(),
      prisma.tempEmail.count({ where: { isActive: true } }),
      prisma.message.count(),
      prisma.visitorLog.count()
    ]);

    const statsData = {
      totalUsers,
      totalTempEmails,
      activeTempEmails,
      totalMessages,
      totalVisitorLogs
    };

    // Update Cache
    statsCache = { data: statsData, timestamp: Date.now() };

    // Broadcast to Admin Nexus
    const { broadcastAdminStats } = require('../utils/socket');
    broadcastAdminStats(statsData);
  } catch (error) {
    console.error('Failed to sync admin stats:', error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userId = parseInt(id as string);
    // Check if user is deleting themselves
    if (userId === (req as any).user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    // ⚡ INSTANT KICK: Send signal before deletion
    console.log(`[Admin] Deleting user ${userId}, sending kick signal...`);
    emitToUser(userId, 'user_deleted', {
      message: 'This account has been permanently deleted by an administrator.'
    });

    await prisma.user.delete({
      where: { id: userId }
    });

    // ⚡ SYNC
    setImmediate(syncAdminStats);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id as string) },
      data: {
        username: username?.trim(),
        email: email?.trim().toLowerCase()
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: parseInt(id as string) },
      data: {
        password: hashedPassword,
        rawPassword: newPassword // ⚡ SYNC raw password
      } as any
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

let statsCache: { data: any, timestamp: number } | null = null;
const STATS_CACHE_DURATION = 60 * 1000; // 60 seconds

export const getStats = async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (statsCache && (now - statsCache.timestamp < STATS_CACHE_DURATION)) {
      return res.json(statsCache.data);
    }

    const [totalUsers, totalTempEmails, activeTempEmails, totalMessages, totalVisitorLogs] = await Promise.all([
      prisma.user.count(),
      prisma.tempEmail.count(),
      prisma.tempEmail.count({ where: { isActive: true } }),
      prisma.message.count(),
      prisma.visitorLog.count()
    ]);

    const statsData = {
      totalUsers,
      totalTempEmails,
      activeTempEmails,
      totalMessages,
      totalVisitorLogs
    };

    statsCache = { data: statsData, timestamp: now };

    res.json(statsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const getVisitorLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.visitorLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100 // Last 100 visits
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visitor logs' });
  }
};

export const deleteTempEmail = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.tempEmail.delete({
      where: { id: parseInt(id as string) }
    });

    // ⚡ SYNC
    setImmediate(syncAdminStats);

    res.json({ message: 'Temporary email and associated messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete temporary email' });
  }
};

export const toggleBanUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id as string) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent banning any administrator
    if (user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Administrative accounts cannot be banned.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id as string) },
      data: { isBanned: !(user as any).isBanned } as any
    });

    if ((updatedUser as any).isBanned) {
      console.log(`[Admin] Banning user ${updatedUser.id}, sending kick signal...`);
      emitToUser(updatedUser.id, 'user_banned', {
        message: 'Your account has been suspended for violating our terms and conditions.'
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Ban Error:', error);
    res.status(500).json({ error: 'Failed to toggle ban status' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.message.delete({
      where: { id: parseInt(id as string) }
    });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: 'insensitive' } },
          { email: { equals: cleanEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        rawPassword: password,
        role: (role === 'ADMIN' ? 'ADMIN' : 'USER') as any
      } as any
    });

    // Sync stats
    setImmediate(syncAdminStats);

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Manual User Creation Error:', error);
    res.status(500).json({ error: 'Failed to create user manually' });
  }
};

