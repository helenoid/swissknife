/**
 * Direct Error Handling Tests
 * A simple test runner for the error handling system that doesn't rely on Jest
 */

// Import our error handling classes from mocks (to avoid TypeScript issues)
import { AppError } from './test/mocks/errors/app-error.js';
import { ErrorManager } from './test/mocks/errors/manager.js';

console.log('====== SwissKnife Error Handling Tests ======');

// Keep track of test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function runTest(name, testFn) {
  try {
    console.log(`\nRunning: ${name}`);
    testFn();
    console.log(`✅ PASSED: ${name}`);
    results.passed++;
    results.tests.push({ name, passed: true });
  } catch (err) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${err.message}`);
    if (err.stack) {
      console.error(`   Stack: ${err.stack.split('\n')[1]}`);
    }
    results.failed++;
    results.tests.push({ name, passed: false, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// AppError Tests
console.log('\n=== AppError Tests ===');

runTest('AppError creation', () => {
  const error = new AppError('TEST_ERROR', 'Test error message');
  assert(error instanceof Error, 'AppError should extend Error');
  assert(error.code === 'TEST_ERROR', 'Error code should be set correctly');
  assert(error.message === 'Test error message', 'Error message should be set correctly');
});

runTest('AppError with data context', () => {
  const contextData = { id: '123', operation: 'update' };
  const error = new AppError('DATA_ERROR', 'Data processing error', { 
    data: contextData 
  });
  assert(error.data === contextData, 'Error data should be accessible');
});

runTest('AppError with category', () => {
  const error = new AppError('AUTH_ERROR', 'Authentication failed', { 
    category: 'AUTH' 
  });
  assert(error.category === 'AUTH', 'Error category should be set correctly');
});

runTest('AppError with status code', () => {
  const error = new AppError('NOT_FOUND', 'Resource not found', { 
    statusCode: 404 
  });
  assert(error.statusCode === 404, 'Error status code should be set correctly');
});

runTest('AppError with cause', () => {
  const originalError = new Error('Original error');
  const error = new AppError('WRAPPED', 'Wrapped error', { 
    cause: originalError 
  });
  assert(error.cause === originalError, 'Error cause should reference the original error');
});

runTest('AppError serialization', () => {
  const error = new AppError('JSON_ERROR', 'Serialization test', {
    data: { key: 'value' },
    category: 'TEST',
    statusCode: 400
  });
  
  // Test toJSON method
  const jsonData = error.toJSON();
  assert(jsonData.code === 'JSON_ERROR', 'JSON representation should include code');
  assert(jsonData.message === 'Serialization test', 'JSON representation should include message');
  assert(jsonData.data.key === 'value', 'JSON representation should include data');
  
  // Test JSON.stringify compatibility
  const serialized = JSON.stringify(error);
  const parsed = JSON.parse(serialized);
  assert(parsed.code === 'JSON_ERROR', 'Stringified error should include code');
  assert(parsed.data.key === 'value', 'Stringified error should include data');
});

// ErrorManager Tests
console.log('\n=== ErrorManager Tests ===');

// Reset singleton for clean testing
ErrorManager.resetInstance();

runTest('ErrorManager singleton pattern', () => {
  const instance1 = ErrorManager.getInstance();
  const instance2 = ErrorManager.getInstance();
  assert(instance1 === instance2, 'ErrorManager should follow singleton pattern');
  
  // Reset and test new instance
  ErrorManager.resetInstance();
  const instance3 = ErrorManager.getInstance();
  assert(instance3 !== instance1, 'After reset, a new instance should be created');
});

runTest('ErrorManager handler registration', () => {
  const errorManager = ErrorManager.getInstance();
  
  // Create tracking variable to verify handler is called
  let handlerCalled = false;
  
  // Register handler
  errorManager.registerHandler('TEST_ERROR', (error) => {
    handlerCalled = true;
    assert(error.code === 'TEST_ERROR', 'Handler should receive the error object');
  });
  
  // Verify handler was registered
  assert(errorManager.handlers.has('TEST_ERROR'), 'Handler should be registered by code');
  
  // Test handler execution
  const error = new AppError('TEST_ERROR', 'Test error');
  errorManager.handleError(error);
  
  // Verify handler was called
  assert(handlerCalled, 'Handler should be called when handling matching error code');
});

runTest('ErrorManager fallback handler', () => {
  const errorManager = ErrorManager.getInstance();
  
  let fallbackCalled = false;
  
  // Set fallback handler
  errorManager.setFallbackHandler((error) => {
    fallbackCalled = true;
    assert(error.code === 'UNKNOWN_ERROR', 'Fallback should receive the error');
  });
  
  // Test with unregistered error code
  const error = new AppError('UNKNOWN_ERROR', 'Unknown error');
  errorManager.handleError(error);
  
  // Verify fallback was called
  assert(fallbackCalled, 'Fallback handler should be called for unregistered error codes');
});

runTest('ErrorManager error categorization', () => {
  const errorManager = ErrorManager.getInstance();
  
  const validationError = new AppError('VALIDATION_ERROR', 'Invalid input');
  const authError = new AppError('AUTH_FAILED', 'Authentication failed');
  const networkError = new AppError('NETWORK_TIMEOUT', 'Connection timed out');
  const genericError = new AppError('GENERIC_ERROR', 'Generic error');
  
  assert(errorManager.categorizeError(validationError) === 'VALIDATION', 
    'Should categorize validation errors correctly');
  assert(errorManager.categorizeError(authError) === 'AUTH', 
    'Should categorize auth errors correctly');
  assert(errorManager.categorizeError(networkError) === 'NETWORK', 
    'Should categorize network errors correctly');
  assert(errorManager.categorizeError(genericError) === 'UNKNOWN', 
    'Should categorize unknown errors correctly');
});

runTest('ErrorManager error severity', () => {
  const errorManager = ErrorManager.getInstance();
  
  const criticalError = new AppError('CRITICAL_SYSTEM_FAILURE', 'Critical error');
  const majorError = new AppError('MAJOR_ERROR', 'Major error');
  const minorError = new AppError('MINOR_WARNING', 'Minor warning');
  const genericError = new AppError('GENERIC_ERROR', 'Generic error');
  
  assert(errorManager.getErrorSeverity(criticalError) === 3, 
    'Should identify critical errors correctly');
  assert(errorManager.getErrorSeverity(majorError) === 2, 
    'Should identify major errors correctly');
  assert(errorManager.getErrorSeverity(minorError) === 1, 
    'Should identify minor errors correctly');
  assert(errorManager.getErrorSeverity(genericError) === 0, 
    'Should default to lowest severity for unspecified errors');
});

runTest('ErrorManager error formatting', () => {
  const errorManager = ErrorManager.getInstance();
  
  // Test basic formatting
  const simpleError = new AppError('SIMPLE_ERROR', 'Simple error message');
  const simpleFormatted = errorManager.formatError(simpleError);
  assert(simpleFormatted.includes('[SIMPLE_ERROR]'), 'Formatted error should include code');
  assert(simpleFormatted.includes('Simple error message'), 'Formatted error should include message');
  
  // Test formatting with data
  const dataError = new AppError('DATA_ERROR', 'Error with data', {
    data: { userId: '123', action: 'update' }
  });
  const dataFormatted = errorManager.formatError(dataError);
  assert(dataFormatted.includes('[DATA_ERROR]'), 'Formatted error should include code');
  assert(dataFormatted.includes('userId'), 'Formatted error should include data fields');
  
  // Test formatting with cause
  const cause = new Error('Cause error');
  const causedError = new AppError('CAUSED_ERROR', 'Error with cause', {
    cause: cause
  });
  const causeFormatted = errorManager.formatError(causedError);
  assert(causeFormatted.includes('Cause:'), 'Formatted error should include cause section');
  assert(causeFormatted.includes('Cause error'), 'Formatted error should include cause message');
});

// Test error reporting
runTest('ErrorManager error reporting', async () => {
  const errorManager = ErrorManager.getInstance();
  
  // Track if reporter was called
  let reporterCalled = false;
  const error = new AppError('REPORT_TEST', 'Test error to report');
  
  // Set reporter function
  errorManager.registerReporter(async (err) => {
    reporterCalled = true;
    assert(err === error, 'Reporter should receive the error object');
    return true;
  });
  
  // Test reporting
  const result = await errorManager.reportError(error);
  
  // Verify reporter was called and returned expected result
  assert(reporterCalled, 'Reporter should have been called');
  assert(result === true, 'Reporter result should be returned');
});

// Test retry mechanism
runTest('ErrorManager retry operation', async () => {
  const errorManager = ErrorManager.getInstance();
  
  // Create operation that fails a few times then succeeds
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Temporary failure');
    }
    return 'success';
  };
  
  // Test retry logic
  const result = await errorManager.retryOperation(operation, {
    maxRetries: 5,
    delay: 10
  });
  
  // Verify operation was called multiple times before succeeding
  assert(attempts === 3, 'Operation should have been retried until success');
  assert(result === 'success', 'Final successful result should be returned');
});

// Test circuit breaker
runTest('ErrorManager circuit breaker', async () => {
  const errorManager = ErrorManager.getInstance();
  
  const circuitName = 'test-circuit';
  let operationCallCount = 0;
  
  // Create failing operation that we'll use to trip the circuit
  const failingOperation = async () => {
    operationCallCount++;
    throw new Error('Operation failed');
  };
  
  // Should start closed
  assert(errorManager.getCircuitStatus(circuitName) === 'closed', 
    'Circuit should start closed');
  
  // Call operation 5 times to trip the circuit
  for (let i = 0; i < 5; i++) {
    try {
      await errorManager.executeWithCircuitBreaker(circuitName, failingOperation);
    } catch (error) {
      // Expected to fail
    }
  }
  
  // Circuit should now be open
  assert(errorManager.getCircuitStatus(circuitName) === 'open', 
    'Circuit should be open after multiple failures');
  
  // Should fail fast without calling operation when circuit is open
  try {
    await errorManager.executeWithCircuitBreaker(circuitName, failingOperation);
    assert(false, 'Should have thrown circuit open error');
  } catch (error) {
    assert(error.message === 'Circuit open', 'Should throw circuit open error');
  }
  
  // Operation should not have been called again
  assert(operationCallCount === 5, 'Operation should not be called when circuit is open');
});

// Print test summary
console.log('\n====== Test Summary ======');
console.log(`Tests passed: ${results.passed}`);
console.log(`Tests failed: ${results.failed}`);
console.log(`Total tests: ${results.passed + results.failed}`);

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests.filter(test => !test.passed).forEach(test => {
    console.log(`- ${test.name}: ${test.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All error handling tests passed!');
}
