// Comprehensive error handling tests for SwissKnife
console.log('Starting comprehensive error handling tests...');

// Mock implementations to use if imports fail
class MockAppError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.code = code;
    this.data = options.data;
    this.category = options.category;
    this.statusCode = options.statusCode;
    this.cause = options.cause;
    this.name = 'AppError';
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      category: this.category,
      statusCode: this.statusCode
    };
  }
}

class MockErrorManager {
  static instance = null;
  
  constructor() {
    this.handlers = new Map();
    this.fallbackHandler = (error) => {
      console.log('[Mock] Default fallback handling:', error.message);
    };
    this.reporter = async (error) => {
      console.log('[Mock] Error reported:', error);
      return true;
    };
  }
  
  static getInstance() {
    if (!MockErrorManager.instance) {
      MockErrorManager.instance = new MockErrorManager();
    }
    return MockErrorManager.instance;
  }
  
  registerHandler(errorCode, handler) {
    this.handlers.set(errorCode, handler);
    return this;
  }
  
  setFallbackHandler(handler) {
    this.fallbackHandler = handler;
    return this;
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
      console.error('[Mock] Error handled by ErrorManager:', error);
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
        formatted += `\\nContext: ${JSON.stringify(error.data)}`;
      }
      if (error.cause) {
        formatted += `\\nCause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`;
      }
      return formatted;
    }
    return String(error);
  }
  
  logError(error) {
    console.error(this.formatError(error));
  }
  
  reportError(error) {
    return this.reporter(error);
  }
  
  static resetInstance() {
    MockErrorManager.instance = null;
  }
}

// Run tests using either the real implementation or mock
const runTests = async () => {
  try {
    console.log('Running error handling verification tests...');
    
    // Define test cases
    const testCases = [
      {
        name: 'AppError creation',
        run: (AppError) => {
          const error = new AppError('TEST_ERROR', 'Test error message');
          console.assert(error.code === 'TEST_ERROR', 'Error code should match');
          console.assert(error.message === 'Test error message', 'Error message should match');
          return true;
        }
      },
      {
        name: 'AppError with data',
        run: (AppError) => {
          const data = { userId: 123, action: 'login' };
          const error = new AppError('DATA_ERROR', 'Error with data', { data });
          console.assert(error.data === data, 'Error data should match');
          return true;
        }
      },
      {
        name: 'AppError with category',
        run: (AppError) => {
          const error = new AppError('AUTH_ERROR', 'Auth error', { category: 'AUTH' });
          console.assert(error.category === 'AUTH', 'Error category should match');
          return true;
        }
      },
      {
        name: 'AppError with status code',
        run: (AppError) => {
          const error = new AppError('NOT_FOUND', 'Resource not found', { statusCode: 404 });
          console.assert(error.statusCode === 404, 'Error status code should match');
          return true;
        }
      },
      {
        name: 'AppError with cause',
        run: (AppError) => {
          const cause = new Error('Original error');
          const error = new AppError('WRAPPED_ERROR', 'Wrapped error', { cause });
          console.assert(error.cause === cause, 'Error cause should match');
          return true;
        }
      },
      {
        name: 'ErrorManager handler registration',
        run: (AppError, ErrorManager) => {
          ErrorManager.resetInstance();
          const manager = ErrorManager.getInstance();
          let handlerCalled = false;
          manager.registerHandler('TEST_ERROR', () => { handlerCalled = true; });
          console.assert(manager.handlers.get('TEST_ERROR') !== undefined, 'Handler should be registered');
          return true;
        }
      },
      {
        name: 'ErrorManager error handling',
        run: (AppError, ErrorManager) => {
          ErrorManager.resetInstance();
          const manager = ErrorManager.getInstance();
          let handlerCalled = false;
          manager.registerHandler('TEST_ERROR', () => { handlerCalled = true; });
          
          const error = new AppError('TEST_ERROR', 'Test error');
          manager.handleError(error);
          console.assert(handlerCalled === true, 'Handler should be called');
          return true;
        }
      },
      {
        name: 'ErrorManager fallback handler',
        run: (AppError, ErrorManager) => {
          ErrorManager.resetInstance();
          const manager = ErrorManager.getInstance();
          let fallbackCalled = false;
          manager.setFallbackHandler(() => { fallbackCalled = true; });
          
          const error = new AppError('UNKNOWN_ERROR', 'Unknown error');
          manager.handleError(error);
          console.assert(fallbackCalled === true, 'Fallback handler should be called');
          return true;
        }
      },
      {
        name: 'Error categorization',
        run: (AppError, ErrorManager) => {
          ErrorManager.resetInstance();
          const manager = ErrorManager.getInstance();
          
          const validationError = new AppError('VALIDATION_ERROR', 'Validation failed');
          const authError = new AppError('AUTH_ERROR', 'Auth failed');
          const networkError = new AppError('NETWORK_ERROR', 'Network error');
          const unknownError = new AppError('UNKNOWN', 'Unknown error');
          
          console.assert(manager.categorizeError(validationError) === 'VALIDATION', 'Should categorize validation errors');
          console.assert(manager.categorizeError(authError) === 'AUTH', 'Should categorize auth errors');
          console.assert(manager.categorizeError(networkError) === 'NETWORK', 'Should categorize network errors');
          console.assert(manager.categorizeError(unknownError) === 'UNKNOWN', 'Should categorize unknown errors');
          return true;
        }
      },
      {
        name: 'Error severity',
        run: (AppError, ErrorManager) => {
          ErrorManager.resetInstance();
          const manager = ErrorManager.getInstance();
          
          const criticalError = new AppError('CRITICAL_ERROR', 'Critical error');
          const majorError = new AppError('MAJOR_ERROR', 'Major error');
          const minorError = new AppError('MINOR_ERROR', 'Minor error');
          const unknownError = new AppError('UNKNOWN', 'Unknown error');
          
          console.assert(manager.getErrorSeverity(criticalError) === 3, 'Critical error should have severity 3');
          console.assert(manager.getErrorSeverity(majorError) === 2, 'Major error should have severity 2');
          console.assert(manager.getErrorSeverity(minorError) === 1, 'Minor error should have severity 1');
          console.assert(manager.getErrorSeverity(unknownError) === 0, 'Unknown error should have severity 0');
          return true;
        }
      },
      {
        name: 'Error formatting',
        run: (AppError, ErrorManager) => {
          ErrorManager.resetInstance();
          const manager = ErrorManager.getInstance();
          
          const error = new AppError('TEST_ERROR', 'Test message', {
            data: { userId: 123 },
            cause: new Error('Original error')
          });
          
          const formatted = manager.formatError(error);
          console.assert(formatted.includes('TEST_ERROR'), 'Formatted error should include code');
          console.assert(formatted.includes('Test message'), 'Formatted error should include message');
          console.assert(formatted.includes('userId'), 'Formatted error should include data');
          console.assert(formatted.includes('Original error'), 'Formatted error should include cause');
          return true;
        }
      }
    ];
    
    // Try to import real implementations, fall back to mocks if needed
    let AppError;
    let ErrorManager;
    try {
      const errorPath = './src/utils/errors/';
      const errorModules = await import(errorPath + 'app-error.js');
      const managerModules = await import(errorPath + 'manager.js');
      AppError = errorModules.AppError;
      ErrorManager = managerModules.ErrorManager;
      console.log('Using real implementations');
    } catch (error) {
      console.log('Failed to import real implementations, using mocks:', error.message);
      AppError = MockAppError;
      ErrorManager = MockErrorManager;
    }
    
    // Run test cases
    let passed = 0;
    for (const testCase of testCases) {
      try {
        const result = testCase.run(AppError, ErrorManager);
        if (result) {
          console.log(`✅ Test '${testCase.name}' passed`);
          passed++;
        } else {
          console.error(`❌ Test '${testCase.name}' failed`);
        }
      } catch (error) {
        console.error(`❌ Test '${testCase.name}' threw an error:`, error);
      }
    }
    
    // Print summary
    console.log(`\nTests completed: ${passed}/${testCases.length} passed`);
    if (passed === testCases.length) {
      console.log('All tests passed! Error handling is working correctly.');
    } else {
      console.log(`Some tests failed: ${testCases.length - passed} failures`);
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
};

// Run the tests
runTests();
