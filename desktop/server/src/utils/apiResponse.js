// Standard success response shape used across the whole API:
// { success: true, message, data }
const success = (res, { message = 'Success', data = null, statusCode = 200 } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Custom error class carrying an HTTP status code. Thrown inside
// controllers and caught by the global error middleware, which then
// builds the standard { success: false, message, error } response.
class AppError extends Error {
  constructor(message, statusCode = 500, error = null) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { success, AppError };
