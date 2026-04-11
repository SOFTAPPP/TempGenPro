import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

import prisma from '../utils/prisma.js';

// Simple in-memory cache for banned status to avoid DB query on every single request
const banCache = new Map<number, { isBanned: boolean, timestamp: number }>();
const BAN_CACHE_TTL = 30000; // 30 seconds

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number; username: string; role: string };

    // Check cache first
    const cached = banCache.get(verified.id);
    let isBanned = false;

    if (cached && (Date.now() - cached.timestamp < BAN_CACHE_TTL)) {
      isBanned = cached.isBanned;
    } else {
      // Check DB and update cache
      const user = await prisma.user.findUnique({
        where: { id: verified.id },
        select: { isBanned: true } as any
      });
      isBanned = !!(user as any)?.isBanned;
      banCache.set(verified.id, { isBanned, timestamp: Date.now() });
    }

    if (isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended for violating our terms and conditions.' });
    }

    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Permission denied. Admin access required.' });
  }
};
