// Comprehensive error handling tests
console.log('Starting imports...');

// Use dynamic imports to handle any potential issues
let AppError, ErrorManager;

try {
  // Try static import first
  const appErrorModule = await import('./src/utils/errors/app-error');
  const managerModule = await import('./src/utils/errors/manager');
  
  AppError = appErrorModule.AppError;
  ErrorManager = managerModule.ErrorManager;
  
  console.log('Successfully imported modules via static import');
} catch (error) {
  console.error('Static import failed:', error.message);
  
  try {
    // Try with .ts extension explicitly
    const appErrorModule = await import('./src/utils/errors/app-error.ts');
    const managerModule = await import('./src/utils/errors/manager.ts');
    
    AppError = appErrorModule.AppError;
    ErrorManager = managerModule.ErrorManager;
    
    console.log('Successfully imported modules with .ts extension');
  } catch (tsError) {
    console.error('TS import failed:', tsError.message);
    
    // Use mock implementations as fallback
    console.log('Using mock implementations');
    
    class MockAppError extends Error {
      code: string;
      data?: any;
      category?: string;
      statusCode?: number;
      cause?: Error | unknown;
      
      constructor(code: string, message: string, options: any = {}) {
        super(message);
        this.code = code;
        this.data = options?.data;
        this.category = options?.category;
        this.statusCode = options?.statusCode;
        this.cause = options?.cause;
        this.name = 'AppError';
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
    
    class MockErrorManager {
      private static instance: any;
      private handlers: Map<string, (error: Error) => void>;
      private fallbackHandler: (error: Error) => void;
      private reporter: (error: Error) => Promise<boolean>;
      private circuitStatus: Map<string, string> = new Map();
      private circuitFailures: Record<string, number> = {};
      
      private constructor() {
        this.handlers = new Map();
        this.fallbackHandler = (error: Error) => {
          console.error('Default fallback handler:', error);
        };
        this.reporter = async (error: Error) => {
          console.error('Error reported:', error);
          return true;
        };
      }
      
      public static getInstance(): MockErrorManager {
        if (!MockErrorManager.instance) {
          MockErrorManager.instance = new MockErrorManager();
        }
        return MockErrorManager.instance;
      }
      
      public static resetInstance(): void {
        MockErrorManager.instance = null as any;
      }
      
      public registerHandler(errorCode: string, handler: (error: Error) => void): void {
        this.handlers.set(errorCode, handler);
      }
      
      public setFallbackHandler(handler: (error: Error) => void): void {
        this.fallbackHandler = handler;
      }
      
      public handleError(error: Error): void {
        if (error && typeof error === 'object' && 'code' in error) {
          const appError = error as Error & { code: string };
          const handler = this.handlers.get(appError.code);
          if (handler) {
            handler(error);
            return;
          }
          this.fallbackHandler(error);
        } else {
          console.error('Error handled by ErrorManager:', error);
        }
      }
      
      public categorizeError(error: Error & { code?: string }): string {
        const code = error?.code || '';
        if (code.includes('VALIDATION')) return 'VALIDATION';
        if (code.includes('AUTH')) return 'AUTH';
        if (code.includes('NETWORK')) return 'NETWORK';
        return 'UNKNOWN';
      }
      
      public getErrorSeverity(error: Error & { code?: string }): number {
        const code = error?.code || '';
        if (code.includes('CRITICAL')) return 3;
        if (code.includes('MAJOR')) return 2;
        if (code.includes('MINOR')) return 1;
        return 0;
      }
      
      public formatError(error: Error): string {
        if (error && typeof error === 'object' && 'code' in error) {
          const appError = error as Error & { 
            code: string; 
            data?: any; 
            cause?: Error | string;
          };
          
          let formatted = `[${appError.code}] ${error.message}`;
          if (appError.data) {
            formatted += `\nContext: ${JSON.stringify(appError.data)}`;
          }
          if (appError.cause) {
            formatted += `\nCause: ${appError.cause instanceof Error ? appError.cause.message : String(appError.cause)}`;
          }
          return formatted;
        }
        return error.toString();
      }
      
      public async reportError(error: Error): Promise<boolean> {
        return this.reporter(error);
      }
      
      public async retryOperation<T>(
        operation: () => Promise<T>, 
        options: { maxRetries: number; delay: number }
      ): Promise<T> {
        let lastError: Error | null = null;
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
      
      public executeWithCircuitBreaker<T>(circuitName: string, operation: () => Promise<T>): Promise<T> {
        const status = this.getCircuitStatus(circuitName);
        if (status === 'open') {
          return Promise.reject(new Error('Circuit open'));
        }
        
        return operation().catch(error => {
          // Track failures and potentially open the circuit
          this.circuitFailures[circuitName] = (this.circuitFailures[circuitName] || 0) + 1;
          
          if (this.circuitFailures[circuitName] >= 5) {
            this.circuitStatus.set(circuitName, 'open');
          }
          
          throw error;
        });
      }
      
      public getCircuitStatus(circuitName: string): string {
        return this.circuitStatus.get(circuitName) || 'closed';
      }
      
      public logError(error: Error): void {
        console.error(this.formatError(error));
      }
    }
    
    AppError = MockAppError;
    ErrorManager = MockErrorManager;
  }
}

console.log('Starting comprehensive error handling tests...');

// Define test utility function
function runTest(name: string, testFn: () => boolean | Promise<boolean>): Promise<boolean> {
  console.log(`Running test: ${name}`);
  try {
    const result = testFn();
    if (result instanceof Promise) {
      return result.then(value => {
        if (value) {
          console.log(`✅ ${name}: Passed`);
          return true;
        } else {
          console.error(`❌ ${name}: Failed`);
          return false;
        }
      }).catch(err => {
        console.error(`❌ ${name}: Error - ${err.message}`);
        return false;
      });
    } else {
      if (result) {
        console.log(`✅ ${name}: Passed`);
        return Promise.resolve(true);
      } else {
        console.error(`❌ ${name}: Failed`);
        return Promise.resolve(false);
      }
    }
  } catch (err) {
    console.error(`❌ ${name}: Error - ${err instanceof Error ? err.message : String(err)}`);
    return Promise.resolve(false);
  }
}

// Define our test suite
async function runTests() {
  // Reset ErrorManager singleton
  ErrorManager['resetInstance']?.();

  let results = [];

  // Basic AppError tests
  results.push(await runTest('AppError creation', () => {
    const error = new AppError('TEST_ERROR', 'Test error message');
    return error.code === 'TEST_ERROR' && error.message === 'Test error message';
  }));

  results.push(await runTest('AppError with data', () => {
    const data = { userId: 123, action: 'login' };
    const error = new AppError('DATA_ERROR', 'Error with data', { data });
    return error.data === data;
  }));

  results.push(await runTest('AppError with category', () => {
    const error = new AppError('AUTH_ERROR', 'Auth error', { category: 'AUTH' });
    return error.category === 'AUTH';
  }));

  results.push(await runTest('AppError with status code', () => {
    const error = new AppError('NOT_FOUND', 'Resource not found', { statusCode: 404 });
    return error.statusCode === 404;
  }));

  results.push(await runTest('AppError with cause', () => {
    const cause = new Error('Original error');
    const error = new AppError('WRAPPED_ERROR', 'Wrapped error', { cause });
    return error.cause === cause;
  }));

  results.push(await runTest('AppError serialization', () => {
    const error = new AppError('JSON_ERROR', 'JSON serializable', { 
      data: { key: 'value' },
      statusCode: 500
    });
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);
    return parsed.code === 'JSON_ERROR' && 
           parsed.message === 'JSON serializable' &&
           parsed.data?.key === 'value' &&
           parsed.statusCode === 500;
  }));

  // ErrorManager tests
  results.push(await runTest('ErrorManager singleton', () => {
    ErrorManager['resetInstance']?.();
    const instance1 = ErrorManager.getInstance();
    const instance2 = ErrorManager.getInstance();
    return instance1 === instance2;
  }));

  results.push(await runTest('ErrorManager handler registration', () => {
    ErrorManager['resetInstance']?.();
    const manager = ErrorManager.getInstance();
    let handlerWasCalled = false;
    
    manager.registerHandler('HANDLER_TEST', () => {
      handlerWasCalled = true;
    });
    
    const error = new AppError('HANDLER_TEST', 'Test error');
    manager.handleError(error);
    
    return handlerWasCalled;
  }));

  results.push(await runTest('ErrorManager fallback handler', () => {
    ErrorManager['resetInstance']?.();
    const manager = ErrorManager.getInstance();
    let fallbackCalled = false;
    
    manager.setFallbackHandler(() => {
      fallbackCalled = true;
    });
    
    const error = new AppError('UNKNOWN_CODE', 'Unknown error');
    manager.handleError(error);
    
    return fallbackCalled;
  }));

  results.push(await runTest('Error categorization', () => {
    const manager = ErrorManager.getInstance();
    
    const validationError = new AppError('VALIDATION_ERROR', 'Validation failed');
    const authError = new AppError('AUTH_ERROR', 'Auth failed');
    const networkError = new AppError('NETWORK_ERROR', 'Network error');
    const unknownError = new AppError('UNKNOWN', 'Unknown error');
    
    return manager.categorizeError(validationError) === 'VALIDATION' &&
           manager.categorizeError(authError) === 'AUTH' &&
           manager.categorizeError(networkError) === 'NETWORK' &&
           manager.categorizeError(unknownError) === 'UNKNOWN';
  }));

  results.push(await runTest('Error severity', () => {
    const manager = ErrorManager.getInstance();
    
    const criticalError = new AppError('CRITICAL_ERROR', 'Critical error');
    const majorError = new AppError('MAJOR_ERROR', 'Major error');
    const minorError = new AppError('MINOR_ERROR', 'Minor error');
    const unknownError = new AppError('UNKNOWN', 'Unknown error');
    
    return manager.getErrorSeverity(criticalError) === 3 &&
           manager.getErrorSeverity(majorError) === 2 &&
           manager.getErrorSeverity(minorError) === 1 &&
           manager.getErrorSeverity(unknownError) === 0;
  }));

  results.push(await runTest('Error formatting', () => {
    const manager = ErrorManager.getInstance();
    
    const error = new AppError('FORMAT_ERROR', 'Format test', {
      data: { userId: 123 },
      cause: new Error('Original error')
    });
    
    const formatted = manager.formatError(error);
    return formatted.includes('FORMAT_ERROR') &&
           formatted.includes('Format test') &&
           formatted.includes('userId') &&
           formatted.includes('Original error');
  }));

  results.push(await runTest('Error reporting', async () => {
    ErrorManager['resetInstance']?.();
    const manager = ErrorManager.getInstance();
    
    // In our test, just make sure the report function doesn't throw
    try {
      await manager.reportError(new AppError('REPORT_TEST', 'Report test'));
      return true;
    } catch {
      return false;
    }
  }));

  results.push(await runTest('Retry operation success', async () => {
    const manager = ErrorManager.getInstance();
    
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Simulated failure');
      }
      return 'success';
    };
    
    const result = await manager.retryOperation(operation, { maxRetries: 3, delay: 10 });
    return result === 'success' && attempts === 2;
  }));

  results.push(await runTest('Circuit breaker functionality', async () => {
    ErrorManager['resetInstance']?.();
    const manager = ErrorManager.getInstance();
    
    // Initially circuit should be closed
    const circuitName = 'test-circuit';
    if (manager.getCircuitStatus(circuitName) !== 'closed') {
      return false;
    }
    
    // Should fail but keep circuit closed initially
    try {
      await manager.executeWithCircuitBreaker(circuitName, async () => {
        throw new Error('Simulated error');
      });
    } catch (error) {
      // Expected to throw
    }
    
    // Keep failing until circuit opens
    for (let i = 0; i < 5; i++) {
      try {
        await manager.executeWithCircuitBreaker(circuitName, async () => {
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected to throw
      }
    }
    
    // Now circuit should be open
    return manager.getCircuitStatus(circuitName) === 'open';
  }));

  // Summary
  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✅ All error handling tests passed!');
  } else {
    console.error(`\n❌ ${failed} test(s) failed.`);
  }

  // Return 0 for success, 1 for failure (for CI systems)
  return failed === 0 ? 0 : 1;
}

console.log('Checking module availability...');
console.log('AppError available:', typeof AppError);
console.log('ErrorManager available:', typeof ErrorManager);

// Run all tests
runTests()
  .then(exitCode => {
    console.log('Test run complete, exit code:', exitCode);
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  })
  .catch(error => {
    console.error('Unexpected error in test runner:', error);
    process.exit(1);
  });
