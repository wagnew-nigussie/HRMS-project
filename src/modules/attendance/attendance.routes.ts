import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { prisma } from '../../config/prisma';
import * as ctrl from './attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.post('/clock-in', authenticate, ctrl.clockIn);
attendanceRouter.post('/clock-out', authenticate, ctrl.clockOut);
attendanceRouter.get('/me', authenticate, ctrl.me);

// Admin/HR Route to see everyone's attendance
attendanceRouter.get('/all', authenticate, requireRole(['ADMIN', 'HR_MANAGER']), async (req, res, next) => {
  try {
    const records = await prisma.attendance.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { clockInAt: 'desc' },
      take: 100
    });
    res.json(records);
  } catch (e) { next(e); }
});
