/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // If it's not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  // Set locals in development mode
  if (process.env.NODE_ENV === 'development') {
    res.locals.message = error.message;
    res.locals.error = error;
  }
  
  // Log the error
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    statusCode: error.statusCode,
    isOperational: error.isOperational
  });
  
  // Send the error response
  return res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

/**
 * Not found middleware
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Validation middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, message));
    }
    next();
  };
};

module.exports = {
  ApiError,
  errorHandler,
  notFound,
  validateRequest
};
