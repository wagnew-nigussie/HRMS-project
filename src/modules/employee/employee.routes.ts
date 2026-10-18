import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { prisma } from '../../config/prisma';
import { idParam, updateEmployeeSchema } from './employee.schema';
import * as ctrl from './employee.controller';

export const employeeRouter = Router();

employeeRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const emp = await prisma.employee.findUnique({ where: { userId: req.user!.id } });
    if (!emp) return res.status(404).json({ code: 'NOT_FOUND' });
    res.json(emp);
  } catch (e) { next(e); }
});

employeeRouter.get('/', authenticate, requireRole(['ADMIN', 'HR_MANAGER', 'FINANCE']), ctrl.list);
employeeRouter.get('/:id', authenticate, validate(idParam), ctrl.getOne);
employeeRouter.patch('/:id', authenticate, validate(updateEmployeeSchema), ctrl.update);
