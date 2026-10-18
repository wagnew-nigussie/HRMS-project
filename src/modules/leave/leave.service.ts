import { Prisma } from '@prisma/client';
import { eachDayOfInterval, isWeekend, startOfDay } from 'date-fns';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

function workingDays(start: Date, end: Date, startHalf: boolean, endHalf: boolean, holidays: Date[]) {
  const days = eachDayOfInterval({ start, end }).filter(
    (d) => !isWeekend(d) &&
      !holidays.some((h) => startOfDay(h).getTime() === startOfDay(d).getTime()),
  );
  let total = days.length;
  if (startHalf && total > 0) total -= 0.5;
  if (endHalf && total > 0) total -= 0.5;
  return Math.max(total, 0);
}

export async function createRequest(employeeId: string, input: {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  startHalfDay?: boolean;
  endHalfDay?: boolean;
}) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (end < start) throw new AppError(422, 'INVALID_RANGE', 'End date is before start date');

  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlap) throw new AppError(409, 'OVERLAP', 'Leave overlaps with an existing request');

  const leaveType = await prisma.leaveType.findUnique({ where: { id: input.leaveTypeId } });
  if (!leaveType) throw new AppError(404, 'LEAVE_TYPE_NOT_FOUND', 'Leave type not found');

  const holidays = (await prisma.holiday.findMany({
    where: { date: { gte: start, lte: end } },
  })).map((h) => h.date);

  const days = workingDays(start, end, !!input.startHalfDay, !!input.endHalfDay, holidays);
  if (days <= 0) throw new AppError(422, 'NO_WORKING_DAYS', 'Range contains no working days');

  const year = start.getUTCFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: input.leaveTypeId, year } },
  });
  if (!balance) {
    throw new AppError(422, 'NO_BALANCE', 'No leave balance exists for this type');
  }
  const available = Number(balance.entitled) - Number(balance.used) - Number(balance.pending);
  if (available < days) {
    throw new AppError(422, 'INSUFFICIENT_BALANCE',
      `Insufficient balance. Available ${available}, requested ${days}`);
  }

  return prisma.$transaction(async (tx) => {
    const req = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        startDate: start,
        endDate: end,
        startHalfDay: !!input.startHalfDay,
        endHalfDay: !!input.endHalfDay,
        days: new Prisma.Decimal(days),
        reason: input.reason,
        approvals: {
          create: Array.from({ length: leaveType.approvalLevels }, (_, i) => ({
            level: i,
            status: 'PENDING' as const,
          })),
        },
      },
    });
    await tx.leaveBalance.update({
      where: { id: balance.id },
      data: { pending: { increment: new Prisma.Decimal(days) } },
    });
    return req;
  });
}

export async function approve(requestId: string, approverId: string) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Leave request not found');
    if (req.status !== 'PENDING') throw new AppError(422, 'INVALID_STATE', 'Request not pending');

    const step = await tx.approvalStep.findFirst({
      where: { leaveRequestId: requestId, level: req.currentLevel },
    });
    if (!step) throw new AppError(422, 'NO_STEP', 'No pending approval step');

    await tx.approvalStep.update({
      where: { id: step.id },
      data: { status: 'APPROVED', approverId, decidedAt: new Date() },
    });

    const nextLevel = req.currentLevel + 1;
    const isFinal = nextLevel >= req.leaveType.approvalLevels;

    if (isFinal) {
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', currentLevel: nextLevel },
      });
      const year = req.startDate.getUTCFullYear();
      await tx.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: req.employeeId,
            leaveTypeId: req.leaveTypeId,
            year,
          },
        },
        data: {
          pending: { decrement: req.days },
          used:    { increment: req.days },
        },
      });
    } else {
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: { currentLevel: nextLevel },
      });
    }

    return { requestId, isFinal, nextLevel };
  });
}
