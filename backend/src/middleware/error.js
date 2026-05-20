/* eslint-disable no-unused-vars */

function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  let status = err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Unexpected server error';
  let details;

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // CastError (bad ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Zod
  if (err.name === 'ZodError') {
    status = 400;
    message = 'Validation failed';
    details = err.issues?.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
  }

  res.status(status).json({
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
