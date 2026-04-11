import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// ⚡ IP Throttle Map: one log per IP per 5 minutes to prevent DB spam
const IP_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
const ipThrottleMap = new Map<string, number>();

// Clean up old throttle entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, ts] of ipThrottleMap.entries()) {
    if (now - ts > IP_THROTTLE_MS) ipThrottleMap.delete(ip);
  }
}, 10 * 60 * 1000);

export const visitorLogger = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const shouldSkip =
    path === '/health' ||
    path.startsWith('/socket.io') ||
    path.startsWith('/uploads/');

  if (!shouldSkip) {
    // ⚡ Capture Both: Store both the cleaned IPv4 and the raw mapped signature for the audit log
    const rawIp = (req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const cleanIp = rawIp.startsWith('::ffff:') ? rawIp.substring(7) : rawIp;
    
    // If it's pure IPv4, force the mapped version for the "Both" view. If native IPv6, just show the one.
    const ip = !cleanIp.includes(':') ? `${cleanIp}, ::ffff:${cleanIp}` : cleanIp;
    
    const now = Date.now();
    const lastLogged = ipThrottleMap.get(ip);

    // ⚡ Only create a DB record if this IP hasn't been logged recently
    if (!lastLogged || now - lastLogged > IP_THROTTLE_MS) {
      ipThrottleMap.set(ip, now);
      // Fire-and-forget: do NOT await, do NOT block the response pipeline
      prisma.visitorLog.create({
        data: { ip, userAgent: req.headers['user-agent'], path }
      }).catch(() => { /* silently ignore log failures */ });
    }
  }

  next(); // Always call next immediately — logging is fully non-blocking
};
