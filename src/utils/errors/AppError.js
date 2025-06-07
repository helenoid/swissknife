/**
 * Custom application error class with enhanced error handling capabilities
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, stack = '') {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Check if error is operational (expected) vs programming error
   */
  static isOperational(error) {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Create a validation error
   */
  static validation(message, field = null) {
    const fullMessage = field ? `Validation error for ${field}: ${message}` : `Validation error: ${message}`;
    return new AppError(fullMessage, 400, true);
  }

  /**
   * Create a not found error
   */
  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, true);
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message = 'Unauthorized access') {
    return new AppError(message, 401, true);
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message = 'Access forbidden') {
    return new AppError(message, 403, true);
  }

  /**
   * Create an internal server error
   */
  static internal(message = 'Internal server error') {
    return new AppError(message, 500, false);
  }

  /**
   * Create a bad request error
   */
  static badRequest(message = 'Bad request') {
    return new AppError(message, 400, true);
  }

  /**
   * Create a conflict error
   */
  static conflict(message = 'Resource conflict') {
    return new AppError(message, 409, true);
  }

  /**
   * Create a timeout error
   */
  static timeout(message = 'Request timeout') {
    return new AppError(message, 408, true);
  }
}

module.exports = AppError;
