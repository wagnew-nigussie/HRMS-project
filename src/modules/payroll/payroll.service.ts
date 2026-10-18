import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { D, round2 } from '../../utils/decimal';

const WORKING_DAYS_IN_MONTH = 22;

export async function computeForEmployee(employeeId: string, period: string, region = 'DEFAULT') {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');

  const [year, month] = period.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  let proratedBase = D(emp.baseSalary);
  const hire = new Date(emp.hireDate);
  if (hire > monthStart) {
    const remainingDays = Math.max(
      0,
      Math.ceil((monthEnd.getTime() - hire.getTime()) / 86_400_000) + 1,
    );
    proratedBase = round2(D(emp.baseSalary).mul(D(remainingDays).div(WORKING_DAYS_IN_MONTH)));
  }

  const allowances = D(0);
  const bonus = D(0);
  const overtime = D(0);
  const gross = round2(proratedBase.plus(allowances).plus(bonus).plus(overtime));

  const brackets = await prisma.taxBracket.findMany({
    where: { region }, orderBy: { minAmount: 'asc' },
  });
  let remaining = gross;
  let tax = D(0);
  for (const b of brackets) {
    if (remaining.lte(0)) break;
    const min = D(b.minAmount);
    const max = b.maxAmount ? D(b.maxAmount) : null;
    const band = max ? max.minus(min) : remaining;
    const taxableInBand = remaining.lt(band) ? remaining : band;
    tax = tax.plus(taxableInBand.mul(D(b.rate)));
    remaining = remaining.minus(taxableInBand);
  }
  tax = round2(tax);

  const deductions = D(0);
  const net = round2(gross.minus(tax).minus(deductions));

  return {
    gross, tax, deductions, net,
    breakdown: {
      period,
      proratedBase: proratedBase.toString(),
      allowances: allowances.toString(),
      bonus: bonus.toString(),
      overtime: overtime.toString(),
      bracketsApplied: brackets.length,
    },
  };
}

export async function runPayroll(period: string, idempotencyKey: string, region = 'DEFAULT') {
  const existing = await prisma.payrollRun.findUnique({ where: { idempotencyKey } });
  if (existing) return existing;

  const run = await prisma.payrollRun.create({
    data: { period, idempotencyKey, status: 'PROCESSING' },
  });

  const employees = await prisma.employee.findMany({ select: { id: true } });
  let totalGross = D(0);
  let totalNet = D(0);

  for (const emp of employees) {
    const r = await computeForEmployee(emp.id, period, region);
    totalGross = totalGross.plus(r.gross);
    totalNet = totalNet.plus(r.net);

    await prisma.payslip.create({
      data: {
        payrollRunId: run.id,
        employeeId: emp.id,
        gross: r.gross,
        tax: r.tax,
        deductions: r.deductions,
        net: r.net,
        breakdown: r.breakdown,
      },
    });
  }

  return prisma.payrollRun.update({
    where: { id: run.id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
      totalGross: round2(totalGross),
      totalNet: round2(totalNet),
    },
  });
}
