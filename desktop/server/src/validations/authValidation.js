const { z } = require('zod');

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Note: `role` is intentionally NOT accepted here. Public registration always
// creates an EMPLOYEE account; only an existing ADMIN can change a user's
// role via PUT /api/users/:id. This prevents privilege escalation through
// self-registration.
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: strongPassword,
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema, strongPassword };
