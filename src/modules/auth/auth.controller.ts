import { Request, Response, NextFunction } from 'express';
import * as svc from './auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = await svc.register(req.body);
    res.status(201).json({ id: u.id, email: u.email, role: u.role });
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.login(req.body.email, req.body.password)); }
  catch (e) { next(e); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.refresh(req.body.refreshToken)); }
  catch (e) { next(e); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.logout(req.body?.refreshToken); res.status(204).end(); }
  catch (e) { next(e); }
};
