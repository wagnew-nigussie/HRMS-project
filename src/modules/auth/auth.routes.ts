import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { rateLimit } from '../../middleware/rateLimit';
import * as ctrl from './auth.controller';
import { loginSchema, registerSchema, refreshSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), ctrl.register);
authRouter.post('/login', rateLimit('login', 10, 60), validate(loginSchema), ctrl.login);
authRouter.post('/refresh', validate(refreshSchema), ctrl.refresh);
authRouter.post('/logout', ctrl.logout);
