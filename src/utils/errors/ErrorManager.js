const AppError = require('./AppError');

/**
 * Centralized error management system
 */
class ErrorManager {
  constructor() {
    this.errorHandlers = new Map();
    this.globalHandler = null;
    this.errorStats = {
      total: 0,
      operational: 0,
      programming: 0,
      byStatusCode: new Map()
    };
  }

  /**
   * Register an error handler for specific error types
   */
  registerHandler(errorType, handler) {
    if (typeof handler !== 'function') {
      throw new AppError('Error handler must be a function', 400);
    }
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Set global error handler
   */
  setGlobalHandler(handler) {
    if (typeof handler !== 'function') {
      throw new AppError('Global error handler must be a function', 400);
    }
    this.globalHandler = handler;
  }

  /**
   * Handle an error using registered handlers
   */
  handle(error, context = {}) {
    this.updateStats(error);

    // Try specific handler first
    const errorType = error.constructor.name;
    const specificHandler = this.errorHandlers.get(errorType);
    
    if (specificHandler) {
      return specificHandler(error, context);
    }

    // Fall back to global handler
    if (this.globalHandler) {
      return this.globalHandler(error, context);
    }

    // Default handling
    return this.defaultHandler(error, context);
  }

  /**
   * Default error handling
   */
  defaultHandler(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    if (error instanceof AppError) {
      errorInfo.statusCode = error.statusCode;
      errorInfo.isOperational = error.isOperational;
    }

    // Log error (in a real app, this would use a proper logger)
    console.error('Error handled by ErrorManager:', errorInfo);

    return errorInfo;
  }

  /**
   * Update error statistics
   */
  updateStats(error) {
    this.errorStats.total++;

    if (AppError.isOperational(error)) {
      this.errorStats.operational++;
    } else {
      this.errorStats.programming++;
    }

    if (error instanceof AppError) {
      const statusCode = error.statusCode;
      const current = this.errorStats.byStatusCode.get(statusCode) || 0;
      this.errorStats.byStatusCode.set(statusCode, current + 1);
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      ...this.errorStats,
      byStatusCode: Object.fromEntries(this.errorStats.byStatusCode)
    };
  }

  /**
   * Clear error statistics
   */
  clearStats() {
    this.errorStats = {
      total: 0,
      operational: 0,
      programming: 0,
      byStatusCode: new Map()
    };
  }

  /**
   * Wrap a function with error handling
   */
  wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, { function: fn.name, args });
        throw error;
      }
    };
  }

  /**
   * Wrap a synchronous function with error handling
   */
  wrapSync(fn) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, { function: fn.name, args });
        throw error;
      }
    };
  }

  /**
   * Create a safe version of a function that won't throw
   */
  safe(fn, defaultValue = null) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, { function: fn.name, args, safe: true });
        return defaultValue;
      }
    };
  }

  /**
   * Assert condition and throw AppError if false
   */
  assert(condition, message, statusCode = 400) {
    if (!condition) {
      throw new AppError(message, statusCode);
    }
  }

  /**
   * Validate input and throw validation error if invalid
   */
  validate(value, validator, fieldName = 'field') {
    if (typeof validator === 'function') {
      if (!validator(value)) {
        throw AppError.validation(`Invalid value for ${fieldName}`, fieldName);
      }
    } else if (validator instanceof RegExp) {
      if (!validator.test(String(value))) {
        throw AppError.validation(`Invalid format for ${fieldName}`, fieldName);
      }
    }
  }

  /**
   * Remove all handlers
   */
  clear() {
    this.errorHandlers.clear();
    this.globalHandler = null;
  }
}

module.exports = ErrorManager;
