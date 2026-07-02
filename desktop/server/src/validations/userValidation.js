const { z } = require('zod');
const { strongPassword } = require('./authValidation');

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email('Invalid email address').optional(),
  password: strongPassword.optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE']).optional(),
});

module.exports = { updateUserSchema };
