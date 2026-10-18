import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { redis } from '../config/redis';

export type AccessPayload = { sub: string; role: string; employeeId?: string | null };
export type RefreshPayload = { sub: string; jti: string; family: string };

export function signAccessToken(p: AccessPayload) {
  return jwt.sign(p, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as SignOptions);
}

export function signRefreshToken(p: { sub: string; family?: string }) {
  const jti = randomUUID();
  const family = p.family ?? randomUUID();
  const token = jwt.sign({ sub: p.sub, jti, family }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
  return { token, jti, family };
}

export const verifyAccessToken = (t: string) =>
  jwt.verify(t, env.JWT_ACCESS_SECRET) as AccessPayload;

export const verifyRefreshToken = (t: string) =>
  jwt.verify(t, env.JWT_REFRESH_SECRET) as RefreshPayload;

export async function revokeJti(jti: string, ttl = 7 * 24 * 3600) {
  await redis.set(`revoked:jti:${jti}`, '1', 'EX', ttl);
}
export async function isJtiRevoked(jti: string) {
  return (await redis.exists(`revoked:jti:${jti}`)) === 1;
}
export async function revokeFamily(family: string, ttl = 7 * 24 * 3600) {
  await redis.set(`revoked:family:${family}`, '1', 'EX', ttl);
}
export async function isFamilyRevoked(family: string) {
  return (await redis.exists(`revoked:family:${family}`)) === 1;
}
