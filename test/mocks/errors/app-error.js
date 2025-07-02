// Mock implementation of AppError for tests

/**
 * Application Error class for standardized error handling
 */
export class AppError extends Error {
  code;
  data;
  category;
  statusCode;
  cause;
  
  constructor(code, message, options = {}) {
    super(message);
    this.code = code;
    this.data = options.data;
    this.category = options.category;
    this.statusCode = options.statusCode;
    
    // Ensure the error stack is properly maintained
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Support error cause chaining from ES2022
    if (options.cause) {
      this.cause = options.cause;
    }
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
  
  // Allow serializing the error
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      category: this.category,
      statusCode: this.statusCode,
      stack: this.stack,
      cause: this.cause ? (this.cause instanceof Error ? this.cause.message : String(this.cause)) : undefined
    };
  }
}
