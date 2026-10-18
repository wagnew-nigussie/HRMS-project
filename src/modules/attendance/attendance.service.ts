import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export async function clockIn(employeeId: string, ip: string, lat?: number, lng?: number) {
  const open = await prisma.attendance.findFirst({ where: { employeeId, status: 'OPEN' } });
  if (open) throw new AppError(409, 'ALREADY_CLOCKED_IN', 'You are already clocked in');

  return prisma.attendance.create({
    data: {
      employeeId,
      clockInAt: new Date(),
      ipAddress: ip,
      latitude: lat ?? null,
      longitude: lng ?? null,
      verification: lat != null ? 'GPS' : 'IP',
    },
  });
}

export async function clockOut(employeeId: string) {
  const open = await prisma.attendance.findFirst({ where: { employeeId, status: 'OPEN' } });
  if (!open) throw new AppError(422, 'NOT_CLOCKED_IN', 'No open attendance session');

  return prisma.attendance.update({
    where: { id: open.id },
    data: { clockOutAt: new Date(), status: 'CLOSED' },
  });
}

export async function me(employeeId: string, from?: string, to?: string) {
  return prisma.attendance.findMany({
    where: {
      employeeId,
      clockInAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    orderBy: { clockInAt: 'desc' },
  });
}
