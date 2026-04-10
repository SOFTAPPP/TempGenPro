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

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number; username: string; role: string };
    
    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: verified.id },
      select: { isBanned: true } as any
    });

    if ((user as any)?.isBanned) {
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
