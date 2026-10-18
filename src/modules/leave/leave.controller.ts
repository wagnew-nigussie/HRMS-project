import { Request, Response, NextFunction } from 'express';
import * as svc from './leave.service';
import { prisma } from '../../config/prisma';
import { emitToAll } from '../../utils/socket';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.employeeId;
    if (!id) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    const result = await svc.createRequest(id, req.body);
    res.status(201).json(result);

    const me = await prisma.employee.findUnique({ where: { id } });
    if (me) {
      emitToAll('leave:new', { name: me.firstName + ' ' + me.lastName, leaveId: result.id });
    }
  } catch (e) { next(e); }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.employeeId;
    if (!id) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    res.json(await prisma.leaveRequest.findMany({ where: { employeeId: id }, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
};

export const pending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: { employee: { select: { firstName: true, lastName: true } }, leaveType: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (e) { next(e); }
};

export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try { 
    const result = await svc.approve(req.params.id, req.user!.id);
    emitToAll('leave:approved', { leaveId: req.params.id });
    res.json(result); 
  } catch (e) { next(e); }
};

export const types = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await prisma.leaveType.findMany()); } catch (e) { next(e); }
};
