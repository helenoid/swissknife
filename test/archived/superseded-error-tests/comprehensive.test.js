/**
 * Comprehensive unit tests for error handling system
 */


describe('Error Handling System', () => {
  let errorManager;
  
  beforeEach(() => {
    // Reset singleton
    ErrorManager.instance = null;
    errorManager = ErrorManager.getInstance();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });
  
  describe('AppError class', () => {
    it('should create error with code and message', () => {
      // Act
      const error = new AppError('TEST_ERROR', 'Test error message');
      
      // Assert
      expect(error).toBeInstanceOf(Error);
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
    
    it('should support error serialization', () => {
      // Act
      const error = new AppError('SERIALIZABLE_ERROR', 'Can be serialized', {
        data: { key: 'value' }
      });
      
      // Assert
      const serialized = JSON.stringify(error);
      expect(serialized).toBeDefined();
      
      const parsed = JSON.parse(serialized);
      expect(parsed.code).toBe('SERIALIZABLE_ERROR');
      expect(parsed.message).toBe('Can be serialized');
      expect(parsed.data?.key).toBe('value');
    });
  });
  
  describe('ErrorManager', () => {
    it('should register error handlers', () => {
      // Arrange
      const handler = jest.fn();
      
      // Act
      errorManager.registerHandler('TEST_ERROR', handler);
      
      // Assert
      const handlers = errorManager.handlers;
      expect(handlers.get('TEST_ERROR')).toBe(handler);
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
    
    it('should handle standard Error objects', () => {
      // Arrange
      const standardError = new Error('Standard error');
      
      // Act - Should not throw
      expect(() => {
        errorManager.handleError(standardError);
      }).not.toThrow();
      
      // Assert
      expect(console.error).toHaveBeenCalled();
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
  
  describe('Error reporting', () => {
    it('should support error reporting to external services', async () => {
      // Arrange
      const error = new AppError('REPORT_TEST', 'Error to report');
      
      // Act
      const result = await errorManager.reportError(error);
      
      // Assert
      expect(result).toBe(true);
      expect(errorManager.reporter).toHaveBeenCalledWith(error);
    });
    
    it('should batch error reports if supported', async () => {
      // Arrange
      const errors = [
        new AppError('ERROR1', 'First error'),
        new AppError('ERROR2', 'Second error')
      ];
      
      // Act
      const result = await errorManager.batchReportErrors(errors);
      
      // Assert
      expect(result).toBe(true);
      expect(errorManager.batchReporter).toHaveBeenCalledWith(errors);
    });
  });
  
  describe('Error recovery', () => {
    it('should support retry logic for recoverable errors', async () => {
      // Arrange
      let attempts = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });
      
      // Act
      const result = await errorManager.retryOperation(operation, {
        maxRetries: 3,
        delay: 10
      });
      
      // Assert
      expect(result).toBe('success');
      expect(attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    });
    
    it('should support circuit breaker pattern if implemented', async () => {
      // Arrange
      const circuitName = 'test-circuit';
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('Service unavailable');
      });
      
      // Act - multiple failed calls
      for (let i = 0; i < 6; i++) {
        try {
          await errorManager.executeWithCircuitBreaker(circuitName, operation);
        } catch (error) {
          // Expected to throw
        }
      }
      
      // Assert - circuit should be open after multiple failures
      expect(errorManager.getCircuitStatus(circuitName)).toBe('open');
      
      // Act - try another call with open circuit
      let circuitOpenError = false;
      try {
        await errorManager.executeWithCircuitBreaker(circuitName, async () => {
          return 'Should not reach here';
        });
      } catch (error) {
        circuitOpenError = error.message.includes('Circuit open');
      }
      
      // Assert - should fail fast with circuit open
      expect(circuitOpenError).toBe(true);
    });
  });
  
  describe('Error logging', () => {
    it('should log errors with appropriate level', () => {
      // Arrange
      const error = new AppError('LOG_TEST', 'Should be logged');
      
      // Act
      errorManager.logError(error);
      
      // Assert
      expect(console.error).toHaveBeenCalled();
    });
    
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
  });
});
