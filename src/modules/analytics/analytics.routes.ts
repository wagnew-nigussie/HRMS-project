import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { prisma } from '../../config/prisma';

export const analyticsRouter = Router();

analyticsRouter.get('/headcount', authenticate, requireRole(['ADMIN', 'HR_MANAGER']), async (_req, res, next) => {
  try {
    const total = await prisma.employee.count();
    const active = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const byDept = await prisma.employee.groupBy({
      by: ['department'],
      _count: { _all: true },
    });
    const byDepartment = byDept.map(d => ({ department: d.department, total: d._count._all }));
    
    res.json({ total, active, byDepartment });
  } catch (e) { next(e); }
});
