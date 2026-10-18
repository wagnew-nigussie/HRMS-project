import { Request, Response, NextFunction } from 'express';
import * as svc from './employee.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.list(req.user!)); } catch (e) { next(e); }
};
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getOne(req.params.id, req.user!)); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.update(req.params.id, req.body, req.user!)); } catch (e) { next(e); }
};
