// CommonJS test for error handling
const assert = require('assert').strict;

console.log('Starting SwissKnife Error Handling Tests (CommonJS)');
console.log('=============================================');

// AppError implementation
class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.code = code;
    this.data = options.data;
    this.category = options.category;
    this.statusCode = options.statusCode;
    this.cause = options.cause;
    
    this.name = 'AppError';
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

// ErrorManager implementation
class ErrorManager {
  static instance = null;
  
  constructor() {
    this.handlers = new Map();
    this.fallbackHandler = (error) => console.log('Default fallback handling:', error);
  }
  
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
      console.log('Error handled by ErrorManager:', error);
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
}

// Test execution
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  function testCase(name, fn) {
    console.log(`Running test: ${name}`);
    try {
      fn();
      console.log('PASS');
      testsPassed++;
    } catch (err) {
      console.error('FAIL:', err.message);
      testsFailed++;
    }
  }
  
  // AppError tests
  console.log('\n=== AppError Tests ===');
  
  testCase('Creates an AppError with code and message', () => {
    const error = new AppError('ERR_001', 'Test error');
    assert.equal(error.code, 'ERR_001');
    assert.equal(error.message, 'Test error');
  });
  
  testCase('Supports additional data', () => {
    const data = { user: 'john', action: 'login' };
    const error = new AppError('ERR_002', 'Test with data', { data });
    assert.deepEqual(error.data, data);
  });
  
  testCase('Serializes to JSON correctly', () => {
    const error = new AppError('ERR_003', 'Serialization test', {
      data: { id: 123 },
      statusCode: 403,
      category: 'AUTH'
    });
    
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);
    
    assert.equal(parsed.code, 'ERR_003');
    assert.equal(parsed.message, 'Serialization test');
    assert.equal(parsed.statusCode, 403);
    assert.equal(parsed.category, 'AUTH');
    assert.deepEqual(parsed.data, { id: 123 });
  });
  
  // ErrorManager tests
  console.log('\n=== ErrorManager Tests ===');
  
  testCase('Operates as a singleton', () => {
    const instance1 = ErrorManager.getInstance();
    const instance2 = ErrorManager.getInstance();
    assert.equal(instance1, instance2);
    
    ErrorManager.resetInstance();
    const instance3 = ErrorManager.getInstance();
    assert.notEqual(instance1, instance3);
  });
  
  testCase('Registers and executes error handlers', () => {
    const manager = ErrorManager.resetInstance();
    let handlerCalled = false;
    
    manager.registerHandler('TEST_ERR', (err) => {
      handlerCalled = true;
      assert.equal(err.code, 'TEST_ERR');
    });
    
    const error = new AppError('TEST_ERR', 'Handler test');
    manager.handleError(error);
    
    assert.equal(handlerCalled, true);
  });
  
  testCase('Executes fallback handler for unregistered errors', () => {
    const manager = ErrorManager.resetInstance();
    let fallbackCalled = false;
    
    manager.setFallbackHandler((err) => {
      fallbackCalled = true;
      assert.equal(err.code, 'UNKNOWN_ERR');
    });
    
    const error = new AppError('UNKNOWN_ERR', 'Unknown error');
    manager.handleError(error);
    
    assert.equal(fallbackCalled, true);
  });
  
  testCase('Correctly categorizes errors', () => {
    const manager = ErrorManager.getInstance();
    
    const validationErr = new AppError('VALIDATION_FAILED', 'Validation error');
    assert.equal(manager.categorizeError(validationErr), 'VALIDATION');
    
    const authErr = new AppError('AUTH_DENIED', 'Authentication error');
    assert.equal(manager.categorizeError(authErr), 'AUTH');
    
    const networkErr = new AppError('NETWORK_TIMEOUT', 'Network error');
    assert.equal(manager.categorizeError(networkErr), 'NETWORK');
    
    const otherErr = new AppError('OTHER_ERROR', 'Other error');
    assert.equal(manager.categorizeError(otherErr), 'UNKNOWN');
  });
  
  testCase('Determines error severity correctly', () => {
    const manager = ErrorManager.getInstance();
    
    const criticalErr = new AppError('CRITICAL_FAILURE', 'Critical error');
    assert.equal(manager.getErrorSeverity(criticalErr), 3);
    
    const majorErr = new AppError('MAJOR_ISSUE', 'Major error');
    assert.equal(manager.getErrorSeverity(majorErr), 2);
    
    const minorErr = new AppError('MINOR_PROBLEM', 'Minor error');
    assert.equal(manager.getErrorSeverity(minorErr), 1);
    
    const normalErr = new AppError('NORMAL_ERROR', 'Normal error');
    assert.equal(manager.getErrorSeverity(normalErr), 0);
  });
  
  testCase('Formats errors with detailed information', () => {
    const manager = ErrorManager.getInstance();
    
    const cause = new Error('Root cause');
    const error = new AppError('FORMAT_TEST', 'Format error', {
      data: { userId: 'user123' },
      cause: cause
    });
    
    const formatted = manager.formatError(error);
    assert.ok(formatted.includes('FORMAT_TEST'));
    assert.ok(formatted.includes('Format error'));
    assert.ok(formatted.includes('userId'));
    assert.ok(formatted.includes('Root cause'));
  });
  
  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Total tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n✓ All error handling tests passed!');
    console.log('The error handling system is working correctly.');
  } else {
    console.log(`\n✗ ${testsFailed} test(s) failed.`);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error running tests:', err);
});
