import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

export function rateLimit(name: string, limit: number, windowSec: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rl:${name}:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    if (count > limit) return res.status(429).json({ code: 'RATE_LIMITED' });
    next();
  };
}
