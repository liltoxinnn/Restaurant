const { z } = require('zod');

const createEmployeePaymentSchema = z.object({
  employeeId: z.coerce.number().int().positive('employeeId is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentType: z.enum(['SALARY', 'BONUS', 'ADVANCE', 'OVERTIME', 'DEDUCTION']),
  paymentDate: z.coerce.date().optional(),
  month: z.string().min(1, 'Month is required (e.g. 2026-07)'),
  notes: z.string().optional().nullable(),
});

const updateEmployeePaymentSchema = createEmployeePaymentSchema.partial();

module.exports = { createEmployeePaymentSchema, updateEmployeePaymentSchema };
