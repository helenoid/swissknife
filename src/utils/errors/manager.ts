import { AppError } from './app-error';

export type ErrorHandler = (error: Error | AppError, context?: any) => boolean | Promise<boolean>;
export type ErrorReporter = (error: Error | AppError, context?: any) => boolean | Promise<boolean>;

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export class ErrorManager {
  private static instance: ErrorManager;
  private handlers: Map<string, ErrorHandler[]> = new Map();
  private fallbackHandler: ErrorHandler | null = null;
  private reporter: ErrorReporter | null = null;
  private batchedErrors: Array<{ error: Error | AppError, context?: any }> = [];
  private batchReportTimer: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Register default fallback handler
    this.setFallbackHandler((error) => {
      console.error('Unhandled error:', error);
      return false; // Indicate error was not fully handled
    });
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    ErrorManager.instance = undefined as any;
  }
  
  /**
   * Register a handler for a specific error code
   */
  registerHandler(errorCode: string, handler: ErrorHandler): void {
    if (!this.handlers.has(errorCode)) {
      this.handlers.set(errorCode, []);
    }
    this.handlers.get(errorCode)!.push(handler);
  }
  
  /**
   * Set the fallback handler for unmatched errors
   */
  setFallbackHandler(handler: ErrorHandler): void {
    this.fallbackHandler = handler;
  }
  
  /**
   * Set an error reporter function
   */
  setReporter(reporter: ErrorReporter): void {
    this.reporter = reporter;
  }
  
  /**
   * Handle an error
   */
  async handleError(error: Error | AppError, context?: any): Promise<boolean> {
    let handled = false;
    
    if (error instanceof AppError) {
      // Try to find specific handlers for this error code
      const handlers = this.handlers.get(error.code);
      if (handlers && handlers.length > 0) {
        // Execute all handlers in order
        for (const handler of handlers) {
          const result = await Promise.resolve(handler(error, context));
          if (result) {
            handled = true;
            break;
          }
        }
      }
    }
    
    // If no specific handler was successful, use fallback
    if (!handled && this.fallbackHandler) {
      handled = await Promise.resolve(this.fallbackHandler(error, context));
    }
    
    // Report error if we have a reporter
    if (this.reporter) {
      await this.reportError(error, context);
    }
    
    return handled;
  }
  
  /**
   * Report an error to the configured reporter
   */
  async reportError(error: Error | AppError, context?: any): Promise<boolean> {
    if (!this.reporter) return false;
    
    try {
      return await Promise.resolve(this.reporter(error, context));
    } catch (reporterError) {
      console.error('Error in error reporter:', reporterError);
      return false;
    }
  }
  
  /**
   * Add an error to the batch reporting queue
   */
  queueErrorReport(error: Error | AppError, context?: any): void {
    this.batchedErrors.push({ error, context });
    
    // Setup batch reporting if not already running
    if (!this.batchReportTimer && this.reporter) {
      this.batchReportTimer = setTimeout(() => this.flushErrorReports(), 1000);
    }
  }
  
  /**
   * Send all batched error reports
   */
  async flushErrorReports(): Promise<void> {
    if (this.batchReportTimer) {
      clearTimeout(this.batchReportTimer);
      this.batchReportTimer = null;
    }
    
    if (!this.reporter || this.batchedErrors.length === 0) return;
    
    const errors = [...this.batchedErrors];
    this.batchedErrors = [];
    
    try {
      for (const { error, context } of errors) {
        await this.reportError(error, context);
      }
    } catch (e) {
      console.error('Error flushing error reports:', e);
    }
  }
  
  /**
   * Execute a function with retry logic for recoverable errors
   */
  async withRetry<T>(
    fn: () => Promise<T>, 
    options: RetryOptions
  ): Promise<T> {
    const { maxAttempts, delayMs, backoffFactor = 2, shouldRetry } = options;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (attempt >= maxAttempts || (shouldRetry && !shouldRetry(lastError, attempt))) {
          throw lastError;
        }
        
        // Wait before next attempt, with exponential backoff if specified
        const delay = delayMs * Math.pow(backoffFactor, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never happen because of the check above,
    // but TypeScript needs a return statement
    throw lastError || new Error('Unknown error in retry logic');
  }
  
  /**
   * Create an AppError from a standard Error
   */
  createAppError(error: Error, code: string, options?: any): AppError {
    return new AppError(code, error.message, {
      ...options,
      cause: error
    });
  }
  
  /**
   * Categorize an error by type and return its category
   */
  /**
   * Categorize an error by type and return its category
   */
  categorizeError(error: Error | AppError): string {
    if (error instanceof AppError && error.category) {
      return error.category;
    }

    const code = error instanceof AppError ? error.code : '';

    if (code.startsWith('VALIDATION')) return 'VALIDATION';
    if (code.startsWith('AUTH')) return 'AUTH';
    if (code.startsWith('NETWORK')) return 'NETWORK';
    // Add more specific mappings if needed based on common error code patterns
    // For now, keep the broad categories from the test
    if (code.includes('CRITICAL')) return 'CRITICAL';
    if (code.includes('MAJOR')) return 'MAJOR';
    if (code.includes('MINOR')) return 'MINOR';


    if (error instanceof TypeError) return 'TYPE_ERROR';
    if (error instanceof SyntaxError) return 'SYNTAX_ERROR';
    if (error instanceof ReferenceError) return 'REFERENCE_ERROR';

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get severity level for an error
   */
  getErrorSeverity(error: Error | AppError): number {
    if (error instanceof AppError) {
      const code = error.code || '';
      if (code.includes('CRITICAL')) return 3;
      if (code.includes('MAJOR')) return 2;
      if (code.includes('MINOR')) return 1;

      // Fallback to status code based severity if no keyword in code
      const statusCode = error.statusCode || 500;
      if (statusCode >= 500) return 3; // Critical
      if (statusCode >= 400) return 2; // Major
      if (statusCode >= 300) return 1; // Minor
      return 0; // Info
    }

    // Default to critical for standard Errors or errors without codes/status codes
    return 3;
  }
}
