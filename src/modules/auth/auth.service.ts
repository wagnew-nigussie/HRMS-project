import { createHash } from 'crypto';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { hashPassword, verifyPassword } from '../../utils/password';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  revokeJti, isJtiRevoked, revokeFamily, isFamilyRevoked,
} from '../../utils/jwt';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const REFRESH_MS = 7 * 24 * 3600 * 1000;

export async function register(input: {
  email: string; password: string; role: any;
  firstName: string; lastName: string; employeeCode: string;
  baseSalary: string | number; hireDate: string;
}) {
  const dup = await prisma.user.findUnique({ where: { email: input.email } });
  if (dup) throw new AppError(409, 'EMAIL_TAKEN', 'Email already in use');

  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, passwordHash, role: input.role, status: 'ACTIVE' },
    });
    await tx.employee.create({
      data: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        employeeCode: input.employeeCode,
        hireDate: new Date(input.hireDate),
        baseSalary: input.baseSalary.toString(),
      },
    });
    return user;
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is not active');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    employeeId: user.employee?.id ?? null,
  });
  const { token: refreshToken, family } = signRefreshToken({ sub: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha(refreshToken),
      family,
      expiresAt: new Date(Date.now() + REFRESH_MS),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  if (await isFamilyRevoked(payload.family) || await isJtiRevoked(payload.jti)) {
    throw new AppError(401, 'REFRESH_REVOKED', 'Refresh token revoked');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: sha(refreshToken) } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    await revokeFamily(payload.family);
    throw new AppError(401, 'REFRESH_INVALID', 'Refresh token invalid');
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  await revokeJti(payload.jti);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { employee: true },
  });
  if (!user) throw new AppError(401, 'USER_NOT_FOUND', 'User not found');

  const accessToken = signAccessToken({
    sub: user.id, role: user.role, employeeId: user.employee?.id ?? null,
  });
  const { token: newRefresh, family } = signRefreshToken({ sub: user.id, family: payload.family });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha(newRefresh),
      family,
      expiresAt: new Date(Date.now() + REFRESH_MS),
    },
  });

  return { accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await revokeJti(payload.jti);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: sha(refreshToken) },
      data: { revokedAt: new Date() },
    });
  } catch { /* ignore */ }
}
