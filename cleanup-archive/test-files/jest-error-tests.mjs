// Simple test runner for error handling tests
import { AppError } from './test/mocks/errors/app-error.js';
import { ErrorManager } from './test/mocks/errors/manager.js';

console.log('Running Error Handling System Tests...');

// Test AppError functionality
testAppError();
// Test ErrorManager functionality
testErrorManager();

function testAppError() {
  console.log('\n=== AppError Tests ===');
  
  try {
    // Test error creation
    const error = new AppError('TEST_ERROR', 'Test error message');
    assert(error instanceof Error, 'Error should be an instance of Error');
    assert(error.code === 'TEST_ERROR', 'Error code should match');
    assert(error.message === 'Test error message', 'Error message should match');
    console.log('✅ Basic error creation: Passed');
    
    // Test with context data
    const contextData = { id: '12345', operation: 'update' };
    const dataError = new AppError('DATA_ERROR', 'Data error', { data: contextData });
    assert(dataError.data === contextData, 'Error data should match');
    console.log('✅ Error with context data: Passed');
    
    // Test error nesting
    const originalError = new Error('Original error');
    const wrappedError = new AppError('WRAPPED_ERROR', 'Wrapped error', { cause: originalError });
    assert(wrappedError.cause === originalError, 'Error cause should match');
    console.log('✅ Error nesting: Passed');
    
    // Test error serialization
    const serializableError = new AppError('SERIALIZABLE_ERROR', 'Serializable error', { 
      data: { key: 'value' },
      category: 'TEST'
    });
    const serialized = JSON.stringify(serializableError);
    const parsed = JSON.parse(serialized);
    assert(parsed.code === 'SERIALIZABLE_ERROR', 'Serialized code should match');
    assert(parsed.data.key === 'value', 'Serialized data should match');
    console.log('✅ Error serialization: Passed');
  } catch (err) {
    console.error('❌ AppError test failed:', err);
  }
}

function testErrorManager() {
  console.log('\n=== ErrorManager Tests ===');
  
  try {
    // Reset singleton for testing
    ErrorManager.resetInstance();
    const errorManager = ErrorManager.getInstance();
    
    // Test singleton pattern
    const instance1 = ErrorManager.getInstance();
    const instance2 = ErrorManager.getInstance();
    assert(instance1 === instance2, 'Instances should be the same (singleton)');
    console.log('✅ Singleton pattern: Passed');
    
    // Test handler registration
    const handlerCalled = { value: false };
    const testHandler = () => { handlerCalled.value = true; };
    errorManager.registerHandler('TEST_ERROR', testHandler);
    const handlers = errorManager.handlers;
    assert(handlers.get('TEST_ERROR').includes(testHandler), 'Handler should be registered');
    console.log('✅ Handler registration: Passed');
    
    // Test error handling
    const error = new AppError('TEST_ERROR', 'Test error');
    errorManager.handleError(error);
    assert(handlerCalled.value === true, 'Handler should be called');
    console.log('✅ Error handling: Passed');
    
    // Test fallback handler
    const fallbackCalled = { value: false };
    errorManager.setFallbackHandler(() => { fallbackCalled.value = true; });
    const unknownError = new AppError('UNKNOWN', 'Unknown error');
    errorManager.handleError(unknownError);
    assert(fallbackCalled.value === true, 'Fallback handler should be called');
    console.log('✅ Fallback handler: Passed');
    
    // Test error categorization
    const validationError = new AppError('VALIDATION_ERROR', 'Invalid data');
    const authError = new AppError('AUTH_FAILED', 'Authentication failed');
    assert(errorManager.categorizeError(validationError) === 'VALIDATION', 'Should categorize validation errors');
    assert(errorManager.categorizeError(authError) === 'AUTH', 'Should categorize auth errors');
    console.log('✅ Error categorization: Passed');
    
    // Test error formatting
    const formatError = new AppError('FORMAT_TEST', 'Format test', { data: { key: 'value' } });
    const formatted = errorManager.formatError(formatError);
    assert(formatted.includes('[FORMAT_TEST]'), 'Formatted error should include code');
    assert(formatted.includes('key'), 'Formatted error should include data');
    console.log('✅ Error formatting: Passed');
    
    // Test error reporting
    let reporterCalled = false;
    errorManager.reporter = async () => { reporterCalled = true; return true; };
    errorManager.reportError(error).then(() => {
      assert(reporterCalled === true, 'Reporter should be called');
      console.log('✅ Error reporting: Passed');
    });
    
    // Test circuit breaker
    const circuitName = 'test-circuit';
    let tripCircuit = async () => {
      for (let i = 0; i < 5; i++) {
        try {
          await errorManager.executeWithCircuitBreaker(circuitName, () => Promise.reject(new Error('Failed')));
        } catch (err) {
          // Expected
        }
      }
      
      assert(errorManager.getCircuitStatus(circuitName) === 'open', 'Circuit should be open after failures');
      console.log('✅ Circuit breaker: Passed');
    };
    
    tripCircuit();
    
  } catch (err) {
    console.error('❌ ErrorManager test failed:', err);
  }
}

// Helper function for assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}
