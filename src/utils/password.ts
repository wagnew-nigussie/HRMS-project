import bcrypt from 'bcrypt';
import { env } from '../config/env';

export const hashPassword = (p: string) => bcrypt.hash(p, env.BCRYPT_COST);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);
