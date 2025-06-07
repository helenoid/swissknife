/**
 * Fixed Error Handling Tests
 * This version uses proper error handling patterns
 */

// Import the required classes
import { ErrorManager } from '@src/utils/errors/manager.js';
import { AppError } from '@src/utils/errors/app-error.js';

describe('Error Handling System - Fixed Tests', () => {
  let errorManager;
  let mockConsoleError;
  
  beforeEach(() => {
    // Reset singleton instance before each test
    if (typeof ErrorManager.resetInstance === 'function') {
      ErrorManager.resetInstance();
    }
    errorManager = ErrorManager.getInstance();
    
    // Mock console.error to avoid test logs pollution
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original console.error
    if (mockConsoleError && typeof mockConsoleError.mockRestore === 'function') {
      mockConsoleError.mockRestore();
    }
  });

  describe('AppError', () => {
    it('should create error with code and message', () => {
      // Act
      const error = new AppError('TEST_ERROR', 'Test error message');
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('AppError');
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
      const contextData = { id: '12345', operation: 'update' };
      const error = new AppError('DATA_ERROR', 'Data processing error', {
        data: contextData
      });
      
      // Assert
      expect(error.data).toBeDefined();
      expect(error.data).toBe(contextData);
    });
    
    it('should support error status codes', () => {
      // Act
      const error = new AppError('NOT_FOUND', 'Resource not found', {
        statusCode: 404
      });
      
      // Assert
      expect(error.statusCode).toBe(404);
    });

    it('should support error chaining with cause', () => {
      // Arrange
      const originalError = new Error('Original error');
      
      // Act
      const appError = new AppError('WRAPPED_ERROR', 'Wrapped error message', {
        cause: originalError
      });
      
      // Assert
      expect(appError.cause).toBe(originalError);
    });
    
    it('should be properly serializable to JSON', () => {
      // Act
      const error = new AppError('JSON_ERROR', 'JSON serialization test', {
        data: { key: 'value' },
        statusCode: 400,
        category: 'VALIDATION'
      });
      
      // Assert
      const serialized = error.toJSON();
      expect(serialized.code).toBe('JSON_ERROR');
      expect(serialized.message).toBe('JSON serialization test');
      expect(serialized.data.key).toBe('value');
      expect(serialized.statusCode).toBe(400);
      expect(serialized.category).toBe('VALIDATION');
    });
  });
  
  describe('ErrorManager', () => {
    it('should be implemented as a singleton', () => {
      // Act
      const instance1 = ErrorManager.getInstance();
      const instance2 = ErrorManager.getInstance();
      
      // Assert
      expect(instance1).toBe(instance2);
      
      // After reset, should be a new instance
      ErrorManager.resetInstance();
      const instance3 = ErrorManager.getInstance();
      expect(instance3).not.toBe(instance1);
    });
    
    it('should register and retrieve error handlers', () => {
      // Arrange
      const handler = jest.fn();
      
      // Act
      errorManager.registerHandler('TEST_ERROR', handler);
      
      // Assert
      expect(errorManager.handlers.get('TEST_ERROR')).toBe(handler);
    });
    
    it('should invoke appropriate handler when handling errors', () => {
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
    
    it('should categorize errors by their code', () => {
      // Arrange
      const validationError = new AppError('VALIDATION_ERROR', 'Invalid data');
      const authError = new AppError('AUTH_FAILED', 'Authentication failed');
      const networkError = new AppError('NETWORK_TIMEOUT', 'Connection timed out');
      const unknownError = new AppError('UNKNOWN', 'Some error');
      
      // Act & Assert
      expect(errorManager.categorizeError(validationError)).toBe('VALIDATION');
      expect(errorManager.categorizeError(authError)).toBe('AUTH');
      expect(errorManager.categorizeError(networkError)).toBe('NETWORK');
      expect(errorManager.categorizeError(unknownError)).toBe('UNKNOWN');
    });
    
    it('should determine error severity based on code', () => {
      // Arrange
      const criticalError = new AppError('CRITICAL_ERROR', 'Critical system error');
      const majorError = new AppError('MAJOR_ERROR', 'Major error');
      const minorError = new AppError('MINOR_ERROR', 'Minor error');
      const regularError = new AppError('REGULAR_ERROR', 'Regular error');
      
      // Act & Assert
      expect(errorManager.getErrorSeverity(criticalError)).toBe(3);
      expect(errorManager.getErrorSeverity(majorError)).toBe(2);
      expect(errorManager.getErrorSeverity(minorError)).toBe(1);
      expect(errorManager.getErrorSeverity(regularError)).toBe(0);
    });
    
    it('should format errors for human readability', () => {
      // Arrange
      const error = new AppError('FORMAT_TEST', 'Formatting test', {
        data: { key: 'value' }
      });
      
      // Act
      const formatted = errorManager.formatError(error);
      
      // Assert
      expect(formatted).toContain('[FORMAT_TEST]');
      expect(formatted).toContain('Formatting test');
      expect(formatted).toContain('Context:');
      expect(formatted).toContain('"key":"value"');
    });
    
    it('should format errors with cause information', () => {
      // Arrange
      const originalError = new Error('Original error');
      const error = new AppError('CAUSED_ERROR', 'Error with cause', {
        cause: originalError
      });
      
      // Act
      const formatted = errorManager.formatError(error);
      
      // Assert
      expect(formatted).toContain('[CAUSED_ERROR]');
      expect(formatted).toContain('Error with cause');
      expect(formatted).toContain('Cause: Original error');
    });
    
    it('should report errors to registered reporters', async () => {
      // Arrange
      const error = new AppError('REPORT_TEST', 'Report test');
      const reporter = jest.fn().mockResolvedValue(true);
      errorManager.reporter = reporter;
      
      // Act
      const result = await errorManager.reportError(error);
      
      // Assert
      expect(reporter).toHaveBeenCalledWith(error);
      expect(result).toBe(true);
    });
    
    it('should support batch reporting of multiple errors', async () => {
      // Arrange
      const errors = [
        new AppError('ERROR_1', 'First error'),
        new AppError('ERROR_2', 'Second error')
      ];
      const batchReporter = jest.fn().mockResolvedValue(true);
      errorManager.batchReporter = batchReporter;
      
      // Act
      const result = await errorManager.batchReportErrors(errors);
      
      // Assert
      expect(batchReporter).toHaveBeenCalledWith(errors);
      expect(result).toBe(true);
    });
    
    it('should support retry operations with exponential backoff', async () => {
      // Arrange
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        if (attempts++ < 2) {
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
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });
    
    it('should implement circuit breaker pattern for failing operations', async () => {
      // Arrange
      const circuitName = 'test-circuit';
      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Act - Call failing operation multiple times to trip circuit
      for (let i = 0; i < 5; i++) {
        try {
          await errorManager.executeWithCircuitBreaker(circuitName, failingOperation);
        } catch (err) {
          // Expected to fail
        }
      }
      
      // Assert - Circuit should be open after 5 failures
      expect(errorManager.getCircuitStatus(circuitName)).toBe('open');
      
      // When circuit is open, should fail fast without calling operation
      await expect(
        errorManager.executeWithCircuitBreaker(circuitName, failingOperation)
      ).rejects.toThrow('Circuit open');
      
      // The operation should have been called only during the initial failures
      expect(failingOperation).toHaveBeenCalledTimes(5);
    });
  });
});
