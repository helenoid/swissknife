# SwissKnife Error Handling Cheat Sheet

## Creating Errors

```javascript
// Basic error
throw new AppError('USER_NOT_FOUND', 'User not found in database');

// With additional data
throw new AppError('VALIDATION_ERROR', 'Invalid input data', {
  data: { field: 'email', value: 'invalid', reason: 'malformed email' },
  statusCode: 400
});

// With category
throw new AppError('API_TIMEOUT', 'External API request timed out', {
  category: 'NETWORK',
  statusCode: 504
});

// With error chaining (preserving original error)
try {
  await db.connect();
} catch (originalError) {
  throw new AppError('DB_CONNECTION_FAILED', 'Failed to connect to database', {
    cause: originalError,
    category: 'DATABASE',
    statusCode: 503
  });
}
```

## Error Manager Usage

```javascript
// Get singleton instance
const errorManager = ErrorManager.getInstance();

// Register specific error handlers
errorManager.registerHandler('AUTH_TOKEN_EXPIRED', (error) => {
  // Handle expired auth token
  refreshAuthToken();
  retryOperation();
});

// Set fallback handler
errorManager.setFallbackHandler((error) => {
  console.error('Unhandled error:', error);
  showGenericErrorMessage();
});

// Handle errors
try {
  await someOperation();
} catch (error) {
  errorManager.handleError(error);
}
```

## Error Categories

```javascript
// Pre-defined categories
const categories = {
  AUTH: 'Authentication/Authorization errors',
  VALIDATION: 'Input validation errors',
  NETWORK: 'Network-related errors',
  DATABASE: 'Database operation errors',
  BUSINESS: 'Business logic errors',
  SYSTEM: 'System/infrastructure errors',
  UNKNOWN: 'Uncategorized errors'
};

// Using categories
throw new AppError('DB_QUERY_FAILED', 'Failed to execute query', {
  category: 'DATABASE'
});

// Getting category
const category = errorManager.categorizeError(error);
switch (category) {
  case 'AUTH':
    redirectToLogin();
    break;
  case 'VALIDATION':
    highlightInvalidFields(error.data.fields);
    break;
  // ...other cases
}
```

## Error Serialization

```javascript
// Serializing error for logging or API response
const error = new AppError('PAYMENT_DECLINED', 'Payment was declined', {
  data: { 
    transactionId: 'tx_123456',
    reason: 'insufficient_funds'
  },
  statusCode: 402
});

// For API responses
return res.status(error.statusCode).json(error.toJSON());

// For logging
console.error('Error occurred:', JSON.stringify(error));
```

## Retry Operations

```javascript
// Basic retry
try {
  const result = await errorManager.retryOperation(
    fetchData, 
    { maxRetries: 3, delay: 1000 }
  );
  processResult(result);
} catch (error) {
  // Handle final failure after retries
}

// Advanced retry with exponential backoff
try {
  const result = await errorManager.retryOperation(
    fetchData,
    { 
      maxRetries: 5, 
      delay: 1000, 
      backoffFactor: 2,
      retryIf: (error) => error.code === 'NETWORK_TIMEOUT'
    }
  );
  processResult(result);
} catch (error) {
  // Handle final failure after retries
}
```

## Circuit Breaker

```javascript
// Basic circuit breaker
try {
  const result = await errorManager.executeWithCircuitBreaker(
    'paymentService',
    processPayment,
    { threshold: 5, timeout: 30000 }
  );
  
  confirmOrder(result);
} catch (error) {
  if (error.message === 'Circuit open') {
    useAlternativePaymentMethod();
  } else {
    errorManager.handleError(error);
  }
}
```

## Error Reporting

```javascript
// Report a single error
await errorManager.reportError(error);

// Report errors in batch
await errorManager.batchReportErrors([error1, error2, error3]);

// Report with additional context
await errorManager.reportError(error, { 
  userId: 'user_123',
  sessionId: 'sess_456',
  severity: 'critical'
});
```

## Testing for Specific Errors

```javascript
// In a try/catch block
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof AppError && error.code === 'ACCESS_DENIED') {
    // Handle specific error
  } else {
    // Handle other errors
  }
}

// Using error manager helpers
if (errorManager.isErrorOfType(error, 'VALIDATION')) {
  // Handle validation error
} else if (errorManager.isErrorOfCategory(error, 'NETWORK')) {
  // Handle network error
}
```

## TypeScript Types

```typescript
interface AppErrorOptions {
  data?: any;
  category?: string;
  statusCode?: number;
  cause?: Error | unknown;
}

class AppError extends Error {
  code: string;
  data?: any;
  category?: string;
  statusCode?: number;
  cause?: Error | unknown;
  
  constructor(code: string, message: string, options?: AppErrorOptions);
  toJSON(): Record<string, any>;
}

interface ErrorHandler {
  (error: AppError): void;
}

interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoffFactor?: number;
  retryIf?: (error: Error | AppError) => boolean;
}

interface CircuitBreakerOptions {
  threshold: number;
  timeout: number;
}

class ErrorManager {
  static getInstance(): ErrorManager;
  registerHandler(errorCode: string, handler: ErrorHandler): void;
  setFallbackHandler(handler: ErrorHandler): void;
  handleError(error: Error | AppError): void;
  categorizeError(error: Error | AppError): string;
  isErrorOfType(error: Error | AppError, code: string): boolean;
  isErrorOfCategory(error: Error | AppError, category: string): boolean;
  reportError(error: Error | AppError, context?: Record<string, any>): Promise<void>;
  batchReportErrors(errors: (Error | AppError)[], context?: Record<string, any>): Promise<void>;
  retryOperation<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T>;
  executeWithCircuitBreaker<T>(serviceId: string, operation: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T>;
}
```
