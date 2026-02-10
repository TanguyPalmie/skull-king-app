const config = require('../config');

/**
 * Global error handler middleware.
 * Catches all errors passed via next(err), logs them in development,
 * and returns a structured JSON response.
 */
function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500;

  if (config.NODE_ENV === 'development') {
    console.error('[ErrorHandler]', err);
  }

  const response = {
    error: err.message || 'Internal server error',
  };

  if (config.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
