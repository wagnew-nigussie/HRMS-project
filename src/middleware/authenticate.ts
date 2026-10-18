import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  role: string;
  employeeId?: string | null;
}
declare global {
  namespace Express {
    interface Request { user?: AuthUser; }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing token' });
  }
  try {
    const p = verifyAccessToken(header.slice(7));
    req.user = { id: p.sub, role: p.role, employeeId: p.employeeId };
    next();
  } catch {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}
