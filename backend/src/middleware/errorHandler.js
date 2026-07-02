const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');

// Global error handling middleware. Every thrown/forwarded error in the
// application ends up here and is converted into the standard
// { success: false, message, error } response shape.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: `Duplicate value for field: ${err.meta?.target}`,
        error: err.meta || null,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: err.meta?.cause || 'Record not found',
        error: err.meta || null,
      });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Operation failed because of a related record constraint',
        error: err.meta || null,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Database request error',
      error: err.meta || null,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired token',
      error: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error:
      err.error ||
      (process.env.NODE_ENV === 'development' ? err.stack : undefined),
  });
};

module.exports = errorHandler;
