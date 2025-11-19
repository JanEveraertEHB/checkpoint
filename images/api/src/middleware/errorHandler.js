/**
 * Standardized Error Handler Middleware
 * Implements Liskov Substitution Principle by providing consistent error responses
 * Centralizes error handling to follow Single Responsibility Principle
 */

/**
 * Standard HTTP status codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Error response structure
 * @typedef {Object} ErrorResponse
 * @property {boolean} success - Always false for errors
 * @property {string} error - Error type/name
 * @property {string} message - Human-readable error message
 * @property {Array<Object>} [details] - Additional error details (for validation errors)
 * @property {string} [stack] - Stack trace (only in development)
 */

/**
 * Format error response consistently
 * @param {Error} err - Error object
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {ErrorResponse} Formatted error response
 */
function formatErrorResponse(err, includeStack = false) {
  const response = {
    success: false,
    error: err.name || 'Error',
    message: err.message || 'An error occurred'
  };

  // Add validation details if present
  if (err.details) {
    response.details = err.details;
  }

  // Add stack trace in development
  if (includeStack && err.stack) {
    response.stack = err.stack;
  }

  return response;
}

/**
 * Determine HTTP status code from error
 * @param {Error} err - Error object
 * @returns {number} HTTP status code
 */
function getStatusCode(err) {
  // If error has statusCode property, use it
  if (err.statusCode) {
    return err.statusCode;
  }

  // Map error names to status codes
  const errorStatusMap = {
    'ValidationError': HTTP_STATUS.BAD_REQUEST,
    'AuthorizationError': HTTP_STATUS.FORBIDDEN,
    'AuthenticationError': HTTP_STATUS.UNAUTHORIZED,
    'NotFoundError': HTTP_STATUS.NOT_FOUND,
    'ConflictError': HTTP_STATUS.CONFLICT,
    'UnprocessableEntityError': HTTP_STATUS.UNPROCESSABLE_ENTITY
  };

  return errorStatusMap[err.name] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

/**
 * Log error appropriately based on severity
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {number} statusCode - HTTP status code
 */
function logError(err, req, statusCode) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    error: err.message,
    stack: err.stack
  };

  // Only log server errors and authentication issues
  if (statusCode >= 500) {
    console.error('Server Error:', JSON.stringify(logData, null, 2));
  } else if (statusCode === HTTP_STATUS.UNAUTHORIZED) {
    console.warn('Authentication Error:', JSON.stringify(logData, null, 2));
  }
}

/**
 * Main error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Determine status code
  const statusCode = getStatusCode(err);

  // Log error
  logError(err, req, statusCode);

  // Check if in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Format error response
  const errorResponse = formatErrorResponse(err, isDevelopment);

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 Not Found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.method} ${req.path} not found`);
  error.name = 'NotFoundError';
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
}

/**
 * Async route handler wrapper to catch errors
 * Wraps async route handlers to automatically catch and pass errors to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error classes
 */
class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = HTTP_STATUS.BAD_REQUEST;
    this.details = details;
  }
}

class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = HTTP_STATUS.FORBIDDEN;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = HTTP_STATUS.NOT_FOUND;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = HTTP_STATUS.CONFLICT;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  HTTP_STATUS,
  // Export custom error classes
  ValidationError,
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
  ConflictError
};
