const { z } = require('zod');

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE']).optional(),
});

module.exports = { updateUserSchema };
