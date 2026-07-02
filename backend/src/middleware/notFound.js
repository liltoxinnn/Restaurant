// Catches any request that did not match a defined route. The path is
// truncated defensively before being echoed back in the response.
const notFound = (req, res, next) => {
  const safePath = String(req.originalUrl).slice(0, 200);
  res.status(404).json({
    success: false,
    message: `Route not found - ${safePath}`,
    error: null,
  });
};

module.exports = notFound;
