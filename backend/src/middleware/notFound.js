// Catches any request that did not match a defined route.
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
    error: null,
  });
};

module.exports = notFound;
