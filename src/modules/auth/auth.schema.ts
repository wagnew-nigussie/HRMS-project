import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(12),
    role: z.enum(['ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'FINANCE']).default('EMPLOYEE'),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    employeeCode: z.string().min(1),
    baseSalary: z.union([z.string(), z.number()]),
    hireDate: z.string().datetime(),
  }),
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20) }),
});
