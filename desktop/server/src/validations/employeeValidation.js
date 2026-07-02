const { z } = require('zod');

const createEmployeeSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  position: z.string().min(2, 'Position is required'),
  salary: z.coerce.number().nonnegative('Salary must be a positive number'),
  startDate: z.coerce.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

module.exports = { createEmployeeSchema, updateEmployeeSchema };
