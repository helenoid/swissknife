/**
 * Self-contained error handling tests with complete mock implementations
 */

// Mock implementations
class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.code = code;
    this.data = options.data;
    this.category = options.category;
    this.statusCode = options.statusCode;
    this.cause = options.cause;
    
    // Set name for better error messages
    this.name = 'AppError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }
  
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

class ErrorManager {
  static instance = null;
  
  constructor() {
    this.handlers = new Map();
    this.fallbackHandler = null;
    this.reporter = null;
  }
  
  static getInstance() {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  registerHandler(errorCode, handler) {
    if (!this.handlers.has(errorCode)) {
      this.handlers.set(errorCode, []);
    }
    this.handlers.get(errorCode).push(handler);
  }
  
  setFallbackHandler(handler) {
    this.fallbackHandler = handler;
  }
  
  setReporter(reporter) {
    this.reporter = reporter;
  }
  
  async handleError(error) {
    let handled = false;
    
    if (error instanceof AppError) {
      const handlers = this.handlers.get(error.code);
      if (handlers && handlers.length > 0) {
        for (const handler of handlers) {
          const result = await Promise.resolve(handler(error));
          if (result) {
            handled = true;
            break;
          }
        }
      }
    }
    
    if (!handled && this.fallbackHandler) {
      handled = await Promise.resolve(this.fallbackHandler(error));
    }
    
    return handled;
  }
  
  getErrorSeverity(error) {
    if (!error || !error.code) return 1;
    
    const severityMap = {
      'CRITICAL_ERROR': 3,
      'MAJOR_ERROR': 2,
      'MINOR_ERROR': 1,
      'AUTH_FAILED': 2,
      'VALIDATION_ERROR': 1,
      'NETWORK_ERROR': 2
    };
    
    return severityMap[error.code] || 1;
  }
  
  categorizeError(error) {
    if (!error || !error.code) return 'UNKNOWN';
    
    const categoryMap = {
      'AUTH_FAILED': 'AUTHENTICATION',
      'VALIDATION_ERROR': 'VALIDATION',
      'NETWORK_ERROR': 'NETWORK',
      'FILE_NOT_FOUND': 'FILESYSTEM',
      'DATABASE_ERROR': 'DATABASE'
    };
    
    return categoryMap[error.code] || 'UNKNOWN';
  }
}

describe('Self-contained Error Handling Tests', () => {
  let errorManager;
  
  beforeEach(() => {
    // Reset singleton
    ErrorManager.instance = null;
    errorManager = ErrorManager.getInstance();
  });
  
  describe('AppError', () => {
    test('should create error with code and message', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('AppError');
    });
    
    test('should support additional options', () => {
      const error = new AppError('TEST_ERROR', 'Test message', {
        category: 'TEST',
        statusCode: 400,
        data: { key: 'value' }
      });
      
      expect(error.category).toBe('TEST');
      expect(error.statusCode).toBe(400);
      expect(error.data).toEqual({ key: 'value' });
    });
    
    test('should serialize to JSON', () => {
      const error = new AppError('TEST_ERROR', 'Test message', {
        data: { test: true }
      });
      
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);
      
      expect(parsed.code).toBe('TEST_ERROR');
      expect(parsed.message).toBe('Test message');
      expect(parsed.data).toEqual({ test: true });
    });
  });
  
  describe('ErrorManager', () => {
    test('should determine error severity correctly', () => {
      const criticalError = new AppError('CRITICAL_ERROR', 'Critical error');
      expect(errorManager.getErrorSeverity(criticalError)).toBe(3);
      
      const majorError = new AppError('MAJOR_ERROR', 'Major error');
      expect(errorManager.getErrorSeverity(majorError)).toBe(2);
      
      const minorError = new AppError('MINOR_ERROR', 'Minor error');
      expect(errorManager.getErrorSeverity(minorError)).toBe(1);
      
      const unknownError = new AppError('OTHER_ERROR', 'Other error');
      expect(errorManager.getErrorSeverity(unknownError)).toBe(1);
    });
    
    test('should categorize errors correctly', () => {
      const authError = new AppError('AUTH_FAILED', 'Auth failed');
      expect(errorManager.categorizeError(authError)).toBe('AUTHENTICATION');
      
      const validationError = new AppError('VALIDATION_ERROR', 'Invalid data');
      expect(errorManager.categorizeError(validationError)).toBe('VALIDATION');
      
      const networkError = new AppError('NETWORK_ERROR', 'Network failed');
      expect(errorManager.categorizeError(networkError)).toBe('NETWORK');
      
      const unknownError = new AppError('UNKNOWN_CODE', 'Unknown');
      expect(errorManager.categorizeError(unknownError)).toBe('UNKNOWN');
    });
    
    test('should handle undefined errors gracefully', () => {
      expect(errorManager.getErrorSeverity(null)).toBe(1);
      expect(errorManager.getErrorSeverity(undefined)).toBe(1);
      expect(errorManager.categorizeError(null)).toBe('UNKNOWN');
      expect(errorManager.categorizeError(undefined)).toBe('UNKNOWN');
    });
    
    test('should register and use error handlers', async () => {
      const handler = jest.fn().mockReturnValue(true);
      errorManager.registerHandler('TEST_ERROR', handler);
      
      const error = new AppError('TEST_ERROR', 'Test error');
      const handled = await errorManager.handleError(error);
      
      expect(handled).toBe(true);
      expect(handler).toHaveBeenCalledWith(error);
    });
    
    test('should use fallback handler when no specific handler exists', async () => {
      const fallbackHandler = jest.fn().mockReturnValue(true);
      errorManager.setFallbackHandler(fallbackHandler);
      
      const error = new AppError('UNKNOWN_ERROR', 'Unknown error');
      const handled = await errorManager.handleError(error);
      
      expect(handled).toBe(true);
      expect(fallbackHandler).toHaveBeenCalledWith(error);
    });
    
    test('should handle standard Error objects', async () => {
      const fallbackHandler = jest.fn().mockReturnValue(true);
      errorManager.setFallbackHandler(fallbackHandler);
      
      const error = new Error('Standard error');
      const handled = await errorManager.handleError(error);
      
      expect(handled).toBe(true);
      expect(fallbackHandler).toHaveBeenCalledWith(error);
    });
    
    test('should return false when no handlers handle the error', async () => {
      const handler = jest.fn().mockReturnValue(false);
      errorManager.registerHandler('TEST_ERROR', handler);
      
      const error = new AppError('TEST_ERROR', 'Test error');
      const handled = await errorManager.handleError(error);
      
      expect(handled).toBe(false);
      expect(handler).toHaveBeenCalledWith(error);
    });
    
    test('should support multiple handlers for same error code', async () => {
      const handler1 = jest.fn().mockReturnValue(false);
      const handler2 = jest.fn().mockReturnValue(true);
      
      errorManager.registerHandler('TEST_ERROR', handler1);
      errorManager.registerHandler('TEST_ERROR', handler2);
      
      const error = new AppError('TEST_ERROR', 'Test error');
      const handled = await errorManager.handleError(error);
      
      expect(handled).toBe(true);
      expect(handler1).toHaveBeenCalledWith(error);
      expect(handler2).toHaveBeenCalledWith(error);
    });
    
    test('should support async handlers', async () => {
      const asyncHandler = jest.fn().mockResolvedValue(true);
      errorManager.registerHandler('ASYNC_ERROR', asyncHandler);
      
      const error = new AppError('ASYNC_ERROR', 'Async error');
      const handled = await errorManager.handleError(error);
      
      expect(handled).toBe(true);
      expect(asyncHandler).toHaveBeenCalledWith(error);
    });
  });
});
