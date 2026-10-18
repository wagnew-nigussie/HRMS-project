import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@hrms.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('AdminPass123!', 12),
        role: Role.ADMIN,
        status: 'ACTIVE',
        employee: {
          create: {
            firstName: 'System',
            lastName: 'Admin',
            employeeCode: 'EMP-0001',
            hireDate: new Date(),
            baseSalary: '0.00',
          },
        },
      },
    });
    console.log('Admin created: admin@hrms.local / AdminPass123!');
  }

  const leaveTypes = [
    { name: 'Annual', accrualRate: '1.67', approvalLevels: 2, probationAllowed: true },
    { name: 'Sick',   accrualRate: '1.00', approvalLevels: 1, probationAllowed: true },
    { name: 'Unpaid', accrualRate: '0.00', approvalLevels: 1, probationAllowed: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({ where: { name: lt.name }, update: {}, create: lt });
  }

  const brackets = [
    { minAmount: '0.00',    maxAmount: '2000.00',  rate: '0.0000' },
    { minAmount: '2000.00', maxAmount: '5000.00',  rate: '0.1000' },
    { minAmount: '5000.00', maxAmount: '10000.00', rate: '0.2000' },
    { minAmount: '10000.00', maxAmount: null,      rate: '0.3000' },
  ];
  for (const b of brackets) {
    const found = await prisma.taxBracket.findFirst({
      where: { region: 'DEFAULT', minAmount: b.minAmount },
    });
    if (!found) {
      await prisma.taxBracket.create({ data: { region: 'DEFAULT', ...b } });
    }
  }
  // Give Admin a leave balance so we can test requests
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@hrms.local' }, include: { employee: true } });
  const annualLeave = await prisma.leaveType.findUnique({ where: { name: 'Annual' } });
  if (adminUser?.employee && annualLeave) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: adminUser.employee.id, leaveTypeId: annualLeave.id, year: new Date().getFullYear() } },
      update: { entitled: 20 },
      create: { employeeId: adminUser.employee.id, leaveTypeId: annualLeave.id, year: new Date().getFullYear(), entitled: 20 }
    });
  }
  console.log('Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
