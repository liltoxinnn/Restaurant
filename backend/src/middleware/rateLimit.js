const rateLimit = require('express-rate-limit');

// Throttles brute-force / credential-stuffing attempts against the
// authentication endpoints without affecting the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again later.',
    error: null,
  },
});

module.exports = { authLimiter };
