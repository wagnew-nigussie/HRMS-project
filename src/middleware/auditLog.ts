import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export const audit = (
  action: string,
  resource: string,
  getResourceId?: (req: Request) => string | undefined,
) => (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400) return;
    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.user?.id ?? null,
          action,
          resource,
          resourceId: getResourceId?.(req) ?? null,
          ipAddress: req.ip,
          metadata: { method: req.method, path: req.originalUrl },
        },
      });
    } catch (e) {
      logger.error({ e }, 'audit write failed');
    }
  });
  next();
};
