const {
  errorResponse,
  validationError,
  notFoundResponse
} = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err.stack || err.message);

  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.entries(err.errors).map(([field, detail]) => ({
      field,
      message: detail.message
    }));
    return validationError(res, err.message || 'Validation failed', errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return errorResponse(res, `${field} already exists`, 409, 'conflict');
  }

  if (err.name === 'CastError') {
    return validationError(res, `Invalid ${err.path || 'value'}`);
  }

  if (err.type === 'entity.parse.failed') {
    return validationError(res, 'Invalid JSON payload');
  }

  if (err.message && err.message.startsWith('CORS blocked')) {
    return errorResponse(res, err.message, 403, 'forbidden');
  }

  return errorResponse(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    err.statusCode || 500,
    'error',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

const notFoundHandler = (req, res) => notFoundResponse(res, 'Route not found');

module.exports = {
  errorHandler,
  notFoundHandler
};
