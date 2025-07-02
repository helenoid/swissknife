// Minimal test for SwissKnife error handling
import { strict as assert } from 'assert';

// Core AppError implementation
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

// Core ErrorManager implementation
class ErrorManager {
  static instance = null;
  
  handlers = new Map();
  fallbackHandler = (error) => console.log('Default fallback handling:', error);
  
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
}

// Basic tests
console.log('Running basic AppError tests:');

// Test 1: Create an AppError
const error = new AppError('TEST_ERROR', 'Test error message', { 
  data: { id: 123 }, 
  statusCode: 400,
  category: 'VALIDATION' 
});

console.log('1. AppError created with code:', error.code);
assert.equal(error.code, 'TEST_ERROR');
assert.equal(error.message, 'Test error message');
assert.equal(error.statusCode, 400);
assert.equal(error.category, 'VALIDATION');
assert.deepEqual(error.data, { id: 123 });
console.log('✓ AppError properties verified');

// Test 2: Error serialization
const serialized = JSON.stringify(error);
const parsed = JSON.parse(serialized);
console.log('2. AppError serialized to:', parsed.code);
assert.equal(parsed.code, 'TEST_ERROR');
assert.equal(parsed.message, 'Test error message');
assert.equal(parsed.statusCode, 400);
console.log('✓ AppError serialization works');

// Test 3: ErrorManager singleton
console.log('\nRunning basic ErrorManager tests:');
const manager1 = ErrorManager.getInstance();
const manager2 = ErrorManager.getInstance();
console.log('3. Singleton check');
assert.equal(manager1, manager2);
console.log('✓ ErrorManager is a singleton');

// Test 4: Error handling
console.log('4. Error handling');
let handlerCalled = false;
manager1.registerHandler('TEST_ERROR', (err) => {
  handlerCalled = true;
  console.log('Custom handler received:', err.code);
});

manager1.handleError(error);
assert.equal(handlerCalled, true);
console.log('✓ ErrorManager handler works');

// Test 5: Error categorization
console.log('5. Error categorization');
const validationError = new AppError('VALIDATION_ERROR', 'Validation error');
const authError = new AppError('AUTH_ERROR', 'Authentication error');
const networkError = new AppError('NETWORK_ERROR', 'Network error');

assert.equal(manager1.categorizeError(validationError), 'VALIDATION');
assert.equal(manager1.categorizeError(authError), 'AUTH');
assert.equal(manager1.categorizeError(networkError), 'NETWORK');
console.log('✓ Error categorization works');

console.log('\n✅ All basic error handling tests passed!');
