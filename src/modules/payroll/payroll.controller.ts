import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import * as svc from './payroll.service';

export const run = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, idempotencyKey, region } = req.body;
    if (!period || !idempotencyKey) {
      return res.status(400).json({ code: 'MISSING_FIELDS' });
    }
    res.json(await svc.runPayroll(period, idempotencyKey, region));
  } catch (e) { next(e); }
};

export const myPayslips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.employeeId;
    if (!id) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    res.json(await prisma.payslip.findMany({ where: { employeeId: id }, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
};
