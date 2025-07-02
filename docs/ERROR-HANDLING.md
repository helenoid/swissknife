# SwissKnife Error Handling System Guide

## Overview

The SwissKnife error handling system provides a robust framework for managing errors throughout the application. It is built on two primary components:

1. **AppError** - A custom error class that extends the native JavaScript Error
2. **ErrorManager** - A singleton service that centralizes error handling logic

## AppError Class

The `AppError` class represents application-specific errors with additional context.

### Usage

```javascript
// Basic usage
const error = new AppError('AUTH_FAILED', 'Authentication failed');

// With additional context
const error = new AppError('VALIDATION_ERROR', 'Invalid input', { 
  data: { field: 'email', value: 'invalid' },
  category: 'VALIDATION',
  statusCode: 400
});

// With error chaining
try {
  // Some operation
} catch (originalError) {
  throw new AppError('OPERATION_FAILED', 'Failed to complete operation', { 
    cause: originalError
  });
}
```

### Properties

- **code**: String identifier for the error type
- **message**: Human-readable error description
- **data**: Optional object with additional context
- **category**: Optional classification (e.g., 'AUTH', 'VALIDATION', 'NETWORK')
- **statusCode**: Optional HTTP status code for API responses
- **cause**: Optional reference to the original error (error chaining)

## ErrorManager

The `ErrorManager` is a singleton service for centralized error handling.

### Basic Usage

```javascript
const errorManager = ErrorManager.getInstance();

// Register handlers for specific error codes
errorManager.registerHandler('AUTH_FAILED', (error) => {
  logoutUser();
  showLoginPrompt('Your session expired. Please log in again.');
});

// Set a fallback handler for unhandled errors
errorManager.setFallbackHandler((error) => {
  console.error('Unhandled error:', error);
  showErrorNotification('An unexpected error occurred');
});

// Handle an error
try {
  // Some operation
} catch (error) {
  errorManager.handleError(error);
}
```

### Advanced Features

#### Error Categorization

```javascript
const error = new AppError('VALIDATION_FAILED', 'Validation failed');
const category = errorManager.categorizeError(error); // Returns 'VALIDATION'
```

#### Error Severity

```javascript
const error = new AppError('CRITICAL_FAILURE', 'Critical system failure');
const severity = errorManager.getErrorSeverity(error); // Returns 3 (highest)
```

#### Formatted Error Messages

```javascript
const error = new AppError('DB_ERROR', 'Database failure', {
  data: { operation: 'update', table: 'users' },
  cause: new Error('Connection timeout')
});

const formatted = errorManager.formatError(error);
// Returns: "[DB_ERROR] Database failure
// Context: {"operation":"update","table":"users"}
// Cause: Connection timeout"
```

#### Error Reporting

```javascript
// Report a single error
await errorManager.reportError(error);

// Report multiple errors in batch
await errorManager.batchReportErrors([error1, error2, error3]);
```

#### Retry Logic

```javascript
try {
  const result = await errorManager.retryOperation(
    async () => await fetchDataFromApi(),
    { maxRetries: 3, delay: 1000 }
  );
  
  processResult(result);
} catch (error) {
  // Handle final failure after retries
  errorManager.handleError(error);
}
```

#### Circuit Breaker Pattern

```javascript
try {
  const result = await errorManager.executeWithCircuitBreaker(
    'paymentService',
    async () => await processPayment(order)
  );
  
  confirmOrder(result);
} catch (error) {
  if (error.message === 'Circuit open') {
    // Service is unavailable, switch to fallback
    queueOrderForLater(order);
  } else {
    errorManager.handleError(error);
  }
}
```

## Testing

The error handling system is comprehensively tested. To run tests:

```bash
# Run all error handling tests
./test-error-handling.sh

# Run specific test suites
npx jest --config=jest-error-typescript.config.cjs test/unit/utils/errors/error-handling.test.ts
npx jest --config=jest-error-typescript.config.cjs test/unit/utils/errors/complete-error-handling.test.js
node error-tests-complete.mjs
```

## Best Practices

1. **Use AppError for all application errors**
   ```javascript
   throw new AppError('SPECIFIC_ERROR_CODE', 'Clear error message');
   ```

2. **Provide meaningful error codes**
   - Use consistent naming pattern (e.g., AREA_ACTION_PROBLEM)
   - Include severity in the code for critical errors (e.g., CRITICAL_DB_FAILURE)

3. **Include relevant context data**
   ```javascript
   throw new AppError('VALIDATION_ERROR', 'Validation failed', {
     data: { invalidFields: ['email', 'password'] }
   });
   ```

4. **Chain errors to preserve root cause**
   ```javascript
   try {
     await saveData();
   } catch (dbError) {
     throw new AppError('SAVE_FAILED', 'Could not save changes', {
       cause: dbError
     });
   }
   ```

5. **Register specific handlers for common errors**
   ```javascript
   errorManager.registerHandler('AUTH_EXPIRED', (error) => {
     // Specific handling for auth expiration
   });
   ```

6. **Use retry logic for transient failures**
   ```javascript
   const data = await errorManager.retryOperation(
     fetchData,
     { maxRetries: 3, delay: 500 }
   );
   ```

7. **Use circuit breakers for dependent services**
   ```javascript
   const result = await errorManager.executeWithCircuitBreaker(
     'externalApi',
     callExternalApi
   );
   ```
