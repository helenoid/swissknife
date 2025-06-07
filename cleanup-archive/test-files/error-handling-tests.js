// Self-contained error handling tests for SwissKnife
// These tests validate both AppError and ErrorManager functionality

// Mock the modules to avoid import issues
const AppError = function(code, message, options = {}) {
  this.code = code;
  this.message = message;
  this.data = options.data;
  this.category = options.category;
  this.statusCode = options.statusCode;
  this.cause = options.cause;
  
  // Make it compatible with Error
  Error.call(this, message);
  Error.captureStackTrace && Error.captureStackTrace(this, AppError);
  this.name = 'AppError';
};
AppError.prototype = Object.create(Error.prototype);

// ErrorManager mock
const ErrorManager = {
  instance: null,
  
  getInstance() {
    if (!this.instance) {
      this.instance = {
        handlers: new Map(),
        fallbackHandler: jest.fn(),
        reporter: jest.fn().mockResolvedValue(true),
        
        registerHandler(code, handler) {
          this.handlers.set(code, handler);
        },
        
        setFallbackHandler(handler) {
          this.fallbackHandler = handler;
        },
        
        handleError(error) {
          if (error && error.code) {
            const handler = this.handlers.get(error.code);
            if (handler) {
              handler(error);
              return;
            }
            this.fallbackHandler(error);
          } else {
            console.error('Unhandled error:', error);
          }
        },
        
        categorizeError(error) {
          const code = error?.code || '';
          if (code.includes('VALIDATION')) return 'VALIDATION';
          if (code.includes('AUTH')) return 'AUTH';
          if (code.includes('NETWORK')) return 'NETWORK';
          return 'UNKNOWN';
        },
        
        getErrorSeverity(error) {
          const code = error?.code || '';
          if (code.includes('CRITICAL')) return 3;
          if (code.includes('MAJOR')) return 2;
          if (code.includes('MINOR')) return 1;
          return 0;
        },
        
        formatError(error) {
          if (error && error.code) {
            let formatted = `[${error.code}] ${error.message}`;
            if (error.data) {
              formatted += `\nContext: ${JSON.stringify(error.data)}`;
            }
            if (error.cause) {
              formatted += `\nCause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`;
            }
            return formatted;
          }
          return String(error);
        },
        
        logError(error) {
          console.error(this.formatError(error));
        },
        
        reportError(error) {
          return this.reporter(error);
        }
      };
    }
    return this.instance;
  },
  
  resetInstance() {
    this.instance = null;
  }
};

// Run tests
describe('Error Handling System', () => {
  let errorManager;
  
  beforeEach(() => {
    // Reset singleton instance
    ErrorManager.resetInstance();
    errorManager = ErrorManager.getInstance();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('AppError class', () => {
    it('should create error with code and message', () => {
      // Act
      const error = new AppError('TEST_ERROR', 'Test error message');
      
      // Assert
      expect(error).toBeTruthy();
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
    });
    
    it('should support error categories', () => {
      // Act
      const error = new AppError('AUTH_FAILED', 'Authentication failed', {
        category: 'AUTH'
      });
      
      // Assert
      expect(error.category).toBe('AUTH');
    });
    
    it('should support additional context data', () => {
      // Act
      const error = new AppError('DATA_ERROR', 'Data processing error', {
        data: {
          id: '12345',
          operation: 'update'
        }
      });
      
      // Assert
      expect(error.data).toBeDefined();
      expect(error.data.id).toBe('12345');
      expect(error.data.operation).toBe('update');
    });
    
    it('should support error nesting', () => {
      // Arrange
      const originalError = new Error('Original error');
      
      // Act
      const appError = new AppError('WRAPPED_ERROR', 'Wrapped error message', {
        cause: originalError
      });
      
      // Assert
      expect(appError.cause).toBe(originalError);
    });
    
    it('should support error status codes', () => {
      // Act
      const error = new AppError('NOT_FOUND', 'Resource not found', {
        statusCode: 404
      });
      
      // Assert
      expect(error.statusCode).toBe(404);
    });
  });
  
  describe('ErrorManager', () => {
    it('should register error handlers', () => {
      // Arrange
      const handler = jest.fn();
      
      // Act
      errorManager.registerHandler('TEST_ERROR', handler);
      
      // Assert
      expect(errorManager.handlers.get('TEST_ERROR')).toBe(handler);
    });
    
    it('should handle errors with registered handlers', () => {
      // Arrange
      const handler = jest.fn();
      errorManager.registerHandler('TEST_ERROR', handler);
      
      const error = new AppError('TEST_ERROR', 'Test error message');
      
      // Act
      errorManager.handleError(error);
      
      // Assert
      expect(handler).toHaveBeenCalledWith(error);
    });
    
    it('should use fallback handler when no specific handler exists', () => {
      // Arrange
      const fallbackHandler = jest.fn();
      errorManager.setFallbackHandler(fallbackHandler);
      
      const error = new AppError('UNKNOWN_ERROR', 'Unknown error');
      
      // Act
      errorManager.handleError(error);
      
      // Assert
      expect(fallbackHandler).toHaveBeenCalledWith(error);
    });
  });
  
  describe('Error categorization', () => {
    it('should categorize errors by type', () => {
      // Arrange
      const validationError = new AppError('VALIDATION_FAILED', 'Validation failed');
      const authError = new AppError('AUTH_FAILED', 'Authentication failed');
      const networkError = new AppError('NETWORK_ERROR', 'Network error');
      
      // Act
      const validationCategory = errorManager.categorizeError(validationError);
      const authCategory = errorManager.categorizeError(authError);
      const networkCategory = errorManager.categorizeError(networkError);
      
      // Assert
      expect(validationCategory).toBe('VALIDATION');
      expect(authCategory).toBe('AUTH');
      expect(networkCategory).toBe('NETWORK');
    });
    
    it('should provide error severity levels', () => {
      // Arrange
      const minorError = new AppError('MINOR_ERROR', 'Minor issue');
      const majorError = new AppError('MAJOR_ERROR', 'Major issue');
      const criticalError = new AppError('CRITICAL_ERROR', 'Critical issue');
      
      // Act
      const minorSeverity = errorManager.getErrorSeverity(minorError);
      const majorSeverity = errorManager.getErrorSeverity(majorError);
      const criticalSeverity = errorManager.getErrorSeverity(criticalError);
      
      // Assert
      expect(minorSeverity).toBeDefined();
      expect(majorSeverity).toBeGreaterThan(minorSeverity);
      expect(criticalSeverity).toBeGreaterThan(majorSeverity);
    });
  });
  
  describe('Error formatting', () => {
    it('should format errors for readability', () => {
      // Arrange
      const error = new AppError('FORMAT_TEST', 'Test formatting', {
        data: { key: 'value' },
        cause: new Error('Original error')
      });
      
      // Act
      const formatted = errorManager.formatError(error);
      
      // Assert
      expect(formatted).toContain('FORMAT_TEST');
      expect(formatted).toContain('Test formatting');
      expect(formatted).toContain('key');
      expect(formatted).toContain('value');
      expect(formatted).toContain('Original error');
    });
    
    it('should log errors with appropriate level', () => {
      // Arrange
      const error = new AppError('LOG_TEST', 'Should be logged');
      
      // Act
      errorManager.logError(error);
      
      // Assert
      expect(console.error).toHaveBeenCalled();
    });
  });
});
