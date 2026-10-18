import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { prisma } from '../../config/prisma';
export const analyticsRouter = Router();
analyticsRouter.get('/headcount', authenticate, requireRole(['ADMIN', 'HR_MANAGER']), async (_req, res, next) => {
  try { res.json({ total: await prisma.employee.count() }); } catch (e) { next(e); }
});
