import { z } from 'zod';

export const updateEmployeeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    department: z.string().optional(),
    jobTitle: z.string().optional(),
    baseSalary: z.union([z.string(), z.number()]).optional(),
    managerId: z.string().uuid().nullable().optional(),
  }),
});

export const idParam = z.object({ params: z.object({ id: z.string().uuid() }) });
