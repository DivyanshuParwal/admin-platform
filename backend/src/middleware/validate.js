/**
 * Tiny helper that wraps a Zod schema into Express middleware. Replaces the
 * given request part with the parsed result on success.
 */
function validate(schema, part = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[part]);
    if (!parsed.success) {
      return next(parsed.error);
    }
    req[part] = parsed.data;
    return next();
  };
}

module.exports = { validate };
