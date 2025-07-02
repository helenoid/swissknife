/**
 * Comprehensive unit tests for SwissKnife error handling system
 */


describe('SwissKnife Error Handling System', () => {
  let errorManager;
  
  beforeEach(() => {
    // Reset singleton
    ErrorManager.instance = null;
    errorManager = ErrorManager.getInstance();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('AppError class', () => {
    it('should create error with code and message', () => {
      // Arrange & Act
      const error = new AppError('TEST_ERROR', 'Test error message');
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
    });
    
    it('should support error categories', () => {
      // Arrange & Act
      const error = new AppError('AUTH_ERROR', 'Authentication error', {
        category: 'AUTH'
      });
      
      // Assert
      expect(error.category).toBe('AUTH');
    });
    
    it('should support additional context data', () => {
      // Arrange & Act
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
    
    it('should support error nesting via cause', () => {
      // Arrange
      const originalError = new Error('Original error');
      
      // Act
      const error = new AppError('WRAPPED_ERROR', 'Wrapped error message', {
        cause: originalError
      });
      
      // Assert
      expect(error.cause).toBe(originalError);
    });
    
    it('should support HTTP status codes', () => {
      // Arrange & Act
      const error = new AppError('NOT_FOUND', 'Resource not found', {
        statusCode: 404
      });
      
      // Assert
      expect(error.statusCode).toBe(404);
    });
    
    it('should support JSON serialization', () => {
      // Arrange
      const error = new AppError('SERIALIZABLE_ERROR', 'Can be serialized', {
        data: { key: 'value' },
        category: 'VALIDATION',
        statusCode: 400
      });
      
      // Act
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      // Assert
      expect(parsed.code).toBe('SERIALIZABLE_ERROR');
      expect(parsed.message).toBe('Can be serialized');
      expect(parsed.data?.key).toBe('value');
      expect(parsed.category).toBe('VALIDATION');
      expect(parsed.statusCode).toBe(400);
    });
    
    it('should preserve name and instanceof behavior', () => {
      // Arrange & Act
      const error = new AppError('TEST_ERROR', 'Test error');
      
      // Assert
      expect(error.name).toBe('AppError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
      
      // Try/catch should work properly
      let caught = false;
      try {
        throw error;
      } catch (e) {
        caught = e instanceof AppError;
      }
      expect(caught).toBe(true);
    });
  });
  
  describe('ErrorManager - Basic Functionality', () => {
    it('should maintain singleton pattern', () => {
      // Arrange & Act
      const instance1 = ErrorManager.getInstance();
      const instance2 = ErrorManager.getInstance();
      
      // Assert
      expect(instance1).toBe(instance2);
    });
    
    it('should allow resetting singleton (for testing)', () => {
      // Arrange
      const instance1 = ErrorManager.getInstance();
      
      // Act
      ErrorManager.instance = null;
      const instance2 = ErrorManager.getInstance();
      
      // Assert
      expect(instance1).not.toBe(instance2);
    });
    
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
    
    it('should handle standard Error objects gracefully', () => {
      // Arrange
      const standardError = new Error('Standard error');
      
      // Act & Assert - Should not throw
      expect(() => {
        errorManager.handleError(standardError);
      }).not.toThrow();
      
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should handle non-Error objects gracefully', () => {
      // Arrange
      const nonError = { message: 'Not a real error' };
      
      // Act & Assert - Should not throw
      expect(() => {
        errorManager.handleError(nonError);
      }).not.toThrow();
      
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('ErrorManager - Error Categorization', () => {
    it('should categorize errors by type', () => {
      // Arrange
      const validationError = new AppError('VALIDATION_FAILED', 'Validation failed');
      const authError = new AppError('AUTH_FAILED', 'Authentication failed');
      const networkError = new AppError('NETWORK_ERROR', 'Network error');
      const unknownError = new AppError('SOME_ERROR', 'Some other error');
      
      // Act
      const validationCategory = errorManager.categorizeError(validationError);
      const authCategory = errorManager.categorizeError(authError);
      const networkCategory = errorManager.categorizeError(networkError);
      const unknownCategory = errorManager.categorizeError(unknownError);
      
      // Assert
      expect(validationCategory).toBe('VALIDATION');
      expect(authCategory).toBe('AUTH');
      expect(networkCategory).toBe('NETWORK');
      expect(unknownCategory).toBe('UNKNOWN');
    });
    
    it('should provide error severity levels', () => {
      // Arrange
      const minorError = new AppError('MINOR_ERROR', 'Minor issue');
      const majorError = new AppError('MAJOR_ERROR', 'Major issue');
      const criticalError = new AppError('CRITICAL_ERROR', 'Critical issue');
      const unknownError = new AppError('UNKNOWN', 'Unknown severity');
      
      // Act
      const minorSeverity = errorManager.getErrorSeverity(minorError);
      const majorSeverity = errorManager.getErrorSeverity(majorError);
      const criticalSeverity = errorManager.getErrorSeverity(criticalError);
      const unknownSeverity = errorManager.getErrorSeverity(unknownError);
      
      // Assert
      expect(minorSeverity).toBe(1);
      expect(majorSeverity).toBe(2);
      expect(criticalSeverity).toBe(3);
      expect(unknownSeverity).toBe(0);
    });
  });
  
  describe('ErrorManager - Error Formatting and Logging', () => {
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
    
    it('should log errors with appropriate formatting', () => {
      // Arrange
      const error = new AppError('LOG_TEST', 'Error to be logged', {
        data: { context: 'test' }
      });
      
      // Act
      errorManager.logError(error);
      
      // Assert
      expect(console.error).toHaveBeenCalled();
      const callArg = console.error.mock.calls[0][0];
      expect(callArg).toContain('LOG_TEST');
      expect(callArg).toContain('Error to be logged');
      expect(callArg).toContain('context');
    });
  });
  
  describe('ErrorManager - Error Reporting', () => {
    it('should report errors to external services', async () => {
      // Arrange
      const error = new AppError('REPORT_ERROR', 'Error to report');
      
      // Act
      const result = await errorManager.reportError(error);
      
      // Assert
      expect(result).toBe(true);
      expect(errorManager.reporter).toHaveBeenCalledWith(error);
    });
    
    it('should support batch reporting of multiple errors', async () => {
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
  
  describe('ErrorManager - Recovery Mechanisms', () => {
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
    
    it('should rethrow error after max retries', async () => {
      // Arrange
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('Persistent failure');
      });
      
      // Act & Assert
      await expect(
        errorManager.retryOperation(operation, {
          maxRetries: 2,
          delay: 10
        })
      ).rejects.toThrow('Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
    
    it('should implement circuit breaker pattern for cascading failure prevention', async () => {
      // Arrange
      const circuitName = 'test-circuit';
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('Service unavailable');
      });
      
      // Act - trigger failures to open the circuit
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
      await expect(
        errorManager.executeWithCircuitBreaker(circuitName, async () => 'Should not reach here')
      ).rejects.toThrow('Circuit open');
      
      // Assert - should fail fast without calling the operation
      expect(operation).toHaveBeenCalledTimes(5);
    });
  });
});
