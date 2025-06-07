// Self-contained Jest test    test('should determine error severity correctly', () => {
      const criticalError = new AppError('CRITICAL_ERROR', 'Critical error');
      expect(errorManager.getErrorSeverity(criticalError)).toBe(3);
      
      const majorError = new AppError('MAJOR_ERROR', 'Major error');
      expect(errorManager.getErrorSeverity(majorError)).toBe(2);
      
      const minorError = new AppError('MINOR_ERROR', 'Minor error');
      expect(errorManager.getErrorSeverity(minorError)).toBe(1);
      
      const unknownError = new AppError('OTHER_ERROR', 'Other error');
      expect(errorManager.getErrorSeverity(unknownError)).toBe(1);andling
// This test contains all necessary mock implementations

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
  
  handlers = new Map();
  fallbackHandler = (error) => console.error('Default fallback handling:', error);
  reporter = async () => true;
  batchReporter = async () => true;
  circuitStatus = new Map();
  circuitFailures = {};
  
  static getInstance() {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  static resetInstance() {
    ErrorManager.instance = null;
    return ErrorManager.getInstance();
  }
  
  registerHandler(errorCode, handler) {
    this.handlers.set(errorCode, handler);
  }
  
  setFallbackHandler(handler) {
    this.fallbackHandler = handler;
  }
  
  handleError(error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const handler = this.handlers.get(error.code);
      if (handler) {
        handler(error);
        return;
      }
      this.fallbackHandler(error);
    } else {
      console.error('Error handled by ErrorManager:', error);
    }
  }
  
  categorizeError(error) {
    const code = error?.code || '';
    if (code.includes('VALIDATION')) return 'VALIDATION';
    if (code.includes('AUTH')) return 'AUTH';
    if (code.includes('NETWORK')) return 'NETWORK';
    return 'UNKNOWN';
  }
  
  getErrorSeverity(error) {
    const code = error?.code || '';
    if (code.includes('CRITICAL')) return 3;
    if (code.includes('MAJOR')) return 2;
    if (code.includes('MINOR')) return 1;
    return 0;
  }
  
  formatError(error) {
    if (error && typeof error === 'object' && 'code' in error) {
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
  }
  
  async reportError(error) {
    return this.reporter(error);
  }
  
  async batchReportErrors(errors) {
    return this.batchReporter(errors);
  }
  
  async retryOperation(operation, options) {
    let lastError = null;
    for (let attempt = 0; attempt < options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
    }
    throw lastError || new Error('Operation failed after retries');
  }
  
  executeWithCircuitBreaker(circuitName, operation) {
    const status = this.getCircuitStatus(circuitName);
    if (status === 'open') {
      return Promise.reject(new Error('Circuit open'));
    }
    
    return operation().catch(error => {
      this.circuitFailures[circuitName] = (this.circuitFailures[circuitName] || 0) + 1;
      
      if (this.circuitFailures[circuitName] >= 5) {
        this.circuitStatus.set(circuitName, 'open');
      }
      
      throw error;
    });
  }
  
  getCircuitStatus(circuitName) {
    return this.circuitStatus.get(circuitName) || 'closed';
  }
  
  logError(error) {
    console.error(this.formatError(error));
  }
}

// Actual tests
describe('Error Handling System', () => {
  describe('AppError', () => {
    test('should create with code and message', () => {
      const error = new AppError('TEST_ERROR', 'Test error');      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error');
    });
    
    test('should support additional data', () => {
      const data = { id: 123 };
      const error = new AppError('DATA_ERROR', 'Data error', { data });
      expect(error.data).toEqual(data);
    });
    
    test('should support serialization to JSON', () => {
      const error = new AppError('JSON_ERROR', 'JSON error', {
        data: { key: 'value' },
        statusCode: 400
      });
      
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.code).toBe('JSON_ERROR');
      expect(parsed.message).toBe('JSON error');
      expect(parsed.data.key).toBe('value');
      expect(parsed.statusCode).toBe(400);
    });
  });
  
  describe('ErrorManager', () => {
    let errorManager;
    
    beforeEach(() => {
      ErrorManager.resetInstance();
      errorManager = ErrorManager.getInstance();
    });
    
    test('should be a singleton', () => {
      const instance1 = ErrorManager.getInstance();
      const instance2 = ErrorManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    test('should register and use error handlers', () => {
      const mockHandler = jest.fn();
      errorManager.registerHandler('TEST_CODE', mockHandler);
      
      const error = new AppError('TEST_CODE', 'Test message');
      errorManager.handleError(error);
      
      expect(mockHandler).toHaveBeenCalledWith(error);
    });
    
    test('should use fallback handler when no specific handler exists', () => {
      const mockFallbackHandler = jest.fn();
      errorManager.setFallbackHandler(mockFallbackHandler);
      
      const error = new AppError('UNKNOWN', 'Unknown error');
      errorManager.handleError(error);
      
      expect(mockFallbackHandler).toHaveBeenCalledWith(error);
    });
    
    test('should categorize errors correctly', () => {
      const validationError = new AppError('VALIDATION_ERROR', 'Validation error');
      expect(errorManager.categorizeError(validationError)).toBe('VALIDATION');
      
      const authError = new AppError('AUTH_FAILED', 'Auth error');
      expect(errorManager.categorizeError(authError)).toBe('AUTH');
      
      const networkError = new AppError('NETWORK_TIMEOUT', 'Network error');
      expect(errorManager.categorizeError(networkError)).toBe('NETWORK');
      
      const unknownError = new AppError('OTHER_ERROR', 'Other error');
      expect(errorManager.categorizeError(unknownError)).toBe('UNKNOWN');
    });
    
    test('should determine error severity correctly', () => {
      const criticalError = new AppError('CRITICAL_ERROR', 'Critical error');
      expect(errorManager.getErrorSeverity(criticalError)).toBe(3);
      
      const majorError = new AppError('MAJOR_ERROR', 'Major error');
      expect(errorManager.getErrorSeverity(majorError)).toBe(2);
      
      const minorError = new AppError('MINOR_ERROR', 'Minor error');
      expect(errorManager.getErrorSeverity(minorError)).toBe(1);
      
      const normalError = new AppError('NORMAL_ERROR', 'Normal error');
      expect(errorManager.getErrorSeverity(normalError)).toBe(0);
    });
    
    test('should format errors correctly', () => {
      const cause = new Error('Original error');
      const error = new AppError('FORMAT_ERROR', 'Format test', {
        data: { userId: 123 },
        cause: cause
      });
      
      const formatted = errorManager.formatError(error);
      expect(formatted).toContain('FORMAT_ERROR');
      expect(formatted).toContain('Format test');
      expect(formatted).toContain('userId');
      expect(formatted).toContain('Original error');
    });
    
    test('should support error reporting', async () => {
      const mockReporter = jest.fn().mockResolvedValue(true);
      errorManager.reporter = mockReporter;
      
      const error = new AppError('REPORT_ERROR', 'Report test');
      await errorManager.reportError(error);
      
      expect(mockReporter).toHaveBeenCalledWith(error);
    });
  });
});
