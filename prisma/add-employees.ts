import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    { email: 'hr@hrms.local', role: 'HR_MANAGER', first: 'Sarah', last: 'HR', code: 'EMP-HR-01' },
    { email: 'emp@hrms.local', role: 'EMPLOYEE', first: 'John', last: 'Doe', code: 'EMP-STAFF-01' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        role: u.role as any,
        status: 'ACTIVE',
        employee: {
          create: {
            firstName: u.first,
            lastName: u.last,
            employeeCode: u.code,
            hireDate: new Date(),
            baseSalary: '5000.00'
          }
        }
      }
    });
  }
  console.log('Dummy employees created:');
  console.log('HR Manager: hr@hrms.local / Password123!');
  console.log('Employee: emp@hrms.local / Password123!');
}

main().finally(() => prisma.$disconnect());
