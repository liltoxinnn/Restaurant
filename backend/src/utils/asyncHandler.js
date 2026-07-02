// Wraps an async route/controller handler and forwards any rejected
// promise to Express's error handling middleware, avoiding repeated
// try/catch blocks in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
