/**
 * Application Error class for standardized error handling
 */
export class AppError extends Error {
  code: string;
  data?: any;
  category?: string;
  statusCode?: number;
  cause?: Error | unknown;

  constructor(code: string, message: string, options?: any) {
    super(message);
    this.code = code;
    this.data = options?.data;
    this.category = options?.category;
    this.statusCode = options?.statusCode;
    
    // Support error cause chaining
    if (options?.cause) {
      this.cause = options.cause;
    }
    
    // Ensure the error stack is properly maintained
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
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
    };
  }
}
