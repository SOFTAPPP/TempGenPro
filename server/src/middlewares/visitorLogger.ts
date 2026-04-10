import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const visitorLogger = async (req: Request, res: Response, next: NextFunction) => {
  // We only log if it's not an internal/admin request or a basic health check
  // and we don't want to log every single static asset request if express serves them.
  // Generally, logging visits to the main app layout or API endpoints is enough.

  if (req.path === '/health') {
    return next();
  }

  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    const path = req.path;

    // We can also throttle this so we don't spam the DB with the same IP in a short period
    // But for "whoever comes to my website", a log entry per request or per session is requested.
    // Let's log every request for now as requested, but ideally we'd filter for unique sessions.

    // Asynchronous logging so we don't block the response
    prisma.visitorLog.create({
      data: {
        ip,
        userAgent,
        path,
      }
    }).catch((err: any) => console.error('Failed to log visitor:', err));


  } catch (error) {
    console.error('Visitor logging error:', error);
  }

  next();
};
