import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './attendance.controller';

export const attendanceRouter = Router();
attendanceRouter.post('/clock-in', authenticate, ctrl.clockIn);
attendanceRouter.post('/clock-out', authenticate, ctrl.clockOut);
attendanceRouter.get('/me', authenticate, ctrl.me);
