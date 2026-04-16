/**
 * Response Helper Utility
 * Standardizes all API responses with consistent structure
 */

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data
  });
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorType - Type of error (default: 'error')
 * @param {*} details - Additional error details
 */
const errorResponse = (res, message = 'An error occurred', statusCode = 500, errorType = 'error', details = null) => {
  const response = {
    success: false,
    status: errorType,
    message,
    error: {
      type: errorType,
      message
    }
  };

  // Add details in development mode
  if (details && process.env.NODE_ENV === 'development') {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {*} errors - Validation errors object
 */
const validationError = (res, message = 'Validation failed', errors = null) => {
  const response = {
    success: false,
    status: 'validation_error',
    message,
    error: {
      type: 'validation_error',
      message
    }
  };

  if (errors) {
    response.error.errors = errors;
  }

  return res.status(400).json(response);
};

/**
 * Unauthorized Response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401, 'unauthorized');
};

/**
 * Forbidden Response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403, 'forbidden');
};

/**
 * Not Found Response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404, 'not_found');
};

/**
 * Conflict Response (e.g., duplicate entry)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 */
const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, 409, 'conflict');
};

/**
 * Created Response (for POST requests)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const createdResponse = (res, data = null, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * No Content Response (for DELETE requests)
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

module.exports = {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse,
  noContentResponse
};
