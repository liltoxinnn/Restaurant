const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const { AppError } = require('../utils/apiResponse');

// Detects a database foreign-key/RESTRICT violation regardless of which
// Prisma error class it surfaces as (Postgres reports RESTRICT violations
// as SQLSTATE 23001, which Prisma does not map to a known P-code, so it
// arrives as a generic/unknown error whose raw message must never be sent
// to the client as-is).
const isForeignKeyRestrictError = (err) =>
  typeof err.message === 'string' &&
  (err.message.includes('foreign key constraint') || err.message.toLowerCase().includes('violates restrict'));

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
        message: 'This action was blocked because the record is still referenced by other data.',
        error: err.meta || null,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Database request error',
      error: err.meta || null,
    });
  }

  // Foreign-key RESTRICT violations that Prisma doesn't recognize as a known
  // error code (e.g. deleting a stock item still used by a menu recipe)
  // surface as PrismaClientUnknownRequestError. Give a clean message instead
  // of the raw query-engine dump.
  if (
    (err instanceof Prisma.PrismaClientUnknownRequestError || err instanceof Prisma.PrismaClientRustPanicError) &&
    isForeignKeyRestrictError(err)
  ) {
    return res.status(409).json({
      success: false,
      message: 'This action was blocked because the record is still referenced by other data. Remove those references first.',
      error: null,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired token',
      error: err.message,
    });
  }

  // Errors we deliberately threw ourselves carry a safe, human-readable
  // message. Anything else is unexpected and must never leak internal
  // details (file paths, queries, stack traces) to the client.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.error || null,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error. Please try again.',
    error: process.env.NODE_ENV === 'development' ? err.message : null,
  });
};

module.exports = errorHandler;
