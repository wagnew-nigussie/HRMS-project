import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { employeeRouter } from './modules/employee/employee.routes';
import { attendanceRouter } from './modules/attendance/attendance.routes';
import { leaveRouter } from './modules/leave/leave.routes';
import { payrollRouter } from './modules/payroll/payroll.routes';
import { documentRouter } from './modules/document/document.routes';
import { aiResumeRouter } from './modules/ai-resume/ai-resume.routes';
import { performanceRouter } from './modules/performance/performance.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';

const app = express();

// Enable GZIP compression for faster page loads
app.use(compression());

app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/leave', leaveRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/ai-screening', aiResumeRouter);
app.use('/api/v1/performance', performanceRouter);
app.use('/api/v1/analytics', analyticsRouter);

app.use(express.static(path.join(process.cwd(), 'public')));
app.use(errorHandler);
export { app };
