import { Request, Response, NextFunction } from 'express';
import * as svc from './attendance.service';

export const clockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.employeeId;
    if (!id) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    const { lat, lng } = req.body ?? {};
    res.status(201).json(await svc.clockIn(id, req.ip ?? '', lat, lng));
  } catch (e) { next(e); }
};

export const clockOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.employeeId;
    if (!id) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    res.json(await svc.clockOut(id));
  } catch (e) { next(e); }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.employeeId;
    if (!id) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    res.json(await svc.me(id, req.query.from as string, req.query.to as string));
  } catch (e) { next(e); }
};
