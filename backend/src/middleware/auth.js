const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');
const { AppError } = require('../utils/apiResponse');

// Verifies the JWT Bearer token and attaches the authenticated user to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError('Not authorized, invalid or expired token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, username: true, email: true, role: true },
  });

  if (!user) {
    throw new AppError('Not authorized, user no longer exists', 401);
  }

  req.user = user;
  next();
});

// Restricts a route to the given list of roles. Must run after `protect`.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw new AppError('Not authorized', 401);
  }

  if (!roles.includes(req.user.role)) {
    throw new AppError(
      `Role '${req.user.role}' is not allowed to access this resource`,
      403
    );
  }

  next();
};

module.exports = { protect, authorize };
