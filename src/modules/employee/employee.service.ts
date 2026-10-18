import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { AuthUser } from '../../middleware/authenticate';

export async function list(requester: AuthUser) {
  const where = requester.role === 'EMPLOYEE' && requester.employeeId
    ? { id: requester.employeeId } : {};
  return prisma.employee.findMany({
    where,
    include: { user: { select: { email: true, role: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOne(id: string, requester: AuthUser) {
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { email: true, role: true, status: true } } },
  });
  if (!emp) throw new AppError(404, 'NOT_FOUND', 'Employee not found');
  if (requester.role === 'EMPLOYEE' && requester.employeeId !== id) {
    throw new AppError(403, 'FORBIDDEN', 'Cannot view other employees');
  }
  return emp;
}

export async function update(id: string, raw: any, requester: AuthUser) {
  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) throw new AppError(404, 'NOT_FOUND', 'Employee not found');

  let data = { ...raw };
  if (requester.role === 'EMPLOYEE') {
    if (requester.employeeId !== id) throw new AppError(403, 'FORBIDDEN', 'Not your profile');
    const allowed = ['phone', 'address', 'emergencyContact'];
    data = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  }
  if (data.baseSalary !== undefined) {
    if (!['ADMIN', 'HR_MANAGER'].includes(requester.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Only HR can edit salary');
    }
    data.baseSalary = data.baseSalary.toString();
  }
  return prisma.employee.update({ where: { id }, data });
}
