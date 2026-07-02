const { z } = require('zod');

const createExpenseSchema = z.object({
  name: z.string().min(2, 'Expense name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE', 'ONLINE']).optional(),
  expenseDate: z.coerce.date().optional(),
  description: z.string().optional().nullable(),
});

const updateExpenseSchema = createExpenseSchema.partial();

module.exports = { createExpenseSchema, updateExpenseSchema };
