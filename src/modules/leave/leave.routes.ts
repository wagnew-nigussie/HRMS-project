import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import * as ctrl from './leave.controller';

export const leaveRouter = Router();
leaveRouter.get('/types', authenticate, ctrl.types);
leaveRouter.post('/requests', authenticate, ctrl.create);
leaveRouter.get('/requests/me', authenticate, ctrl.me);
leaveRouter.get('/requests/pending', authenticate, requireRole(['ADMIN', 'HR_MANAGER']), ctrl.pending);
leaveRouter.post('/requests/:id/approve', authenticate, requireRole(['ADMIN', 'HR_MANAGER']), ctrl.approve);
