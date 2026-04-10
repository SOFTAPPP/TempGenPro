import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });


    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret');

    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: 'insensitive' } },
          { email: { equals: cleanIdentifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if ((user as any).isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended for violating our terms and conditions.' });
    }

    const validPassword = await bcrypt.compare(cleanPassword, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret');

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error('[Login] Server Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { tempEmails: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const tempEmails = await prisma.tempEmail.findMany({
      where: { userId },
      include: {
        _count: { select: { messages: true } }
      }
    });

    const totalMessages = tempEmails.reduce((acc, curr) => acc + (curr._count?.messages || 0), 0);

    res.json({
      ...user,
      totalMessages
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
