import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { prisma } from '../../config/prisma';

export const performanceRouter = Router();

performanceRouter.get('/okrs/me', authenticate, async (req, res, next) => {
  try { res.json(await prisma.okrGoal.findMany({ where: { employeeId: req.user!.employeeId! } })); } catch (e) { next(e); }
});

performanceRouter.post('/okrs', authenticate, async (req, res, next) => {
  try {
    const okr = await prisma.okrGoal.create({
      data: {
        employeeId: req.user!.employeeId!,
        cycle: '2026-Q4',
        objective: req.body.objective,
        keyResults: [],
        weight: 1.0
      }
    });
    res.status(201).json(okr);
  } catch (e) { next(e); }
});
