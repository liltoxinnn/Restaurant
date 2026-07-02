// Validates req.body against a Zod schema. On failure, responds with the
// standard error shape and a flattened map of field errors. On success,
// replaces req.body with the parsed (and coerced) data.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const flattened = result.error.flatten();
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: flattened.fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

module.exports = validate;
