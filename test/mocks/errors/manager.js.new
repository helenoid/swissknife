// Mock implementation of ErrorManager for tests

import { AppError } from './app-error.js';

/**
 * Mock ErrorManager singleton for testing
 */
export class ErrorManager {
  static instance = null;
  
  handlers = new Map();
  fallbackHandler = function(error) {
    console.error('Default fallback handler:', error);
    return true;
  };
  reporter = async function(error) {
    console.error('Error reported:', error);
    return true;
  };
  batchedErrors = [];
  batchReportTimer = null;
  
  static getInstance() {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  static resetInstance() {
    ErrorManager.instance = null;
  }
  
  registerHandler(errorCode, handler) {
    if (!this.handlers.has(errorCode)) {
      this.handlers.set(errorCode, []);
    }
    this.handlers.get(errorCode).push(handler);
  }
  
  setFallbackHandler(handler) {
    this.fallbackHandler = handler;
  }
  
  setReporter(reporter) {
    this.reporter = reporter;
  }
  
  async handleError(error, context) {
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
  
  async reportError(error, context) {
    if (!this.reporter) return false;
    
    try {
      return await Promise.resolve(this.reporter(error, context));
    } catch (reporterError) {
      console.error('Error in error reporter:', reporterError);
      return false;
    }
  }
  
  queueErrorReport(error, context) {
    this.batchedErrors.push({ error, context });
    
    // Setup batch reporting if not already running
    if (!this.batchReportTimer && this.reporter) {
      this.batchReportTimer = setTimeout(() => this.flushErrorReports(), 1000);
    }
  }
  
  async flushErrorReports() {
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
  
  categorizeError(error) {
    if (error instanceof AppError && error.category) {
      return error.category;
    }
    
    if (error instanceof TypeError) return 'TYPE_ERROR';
    if (error instanceof SyntaxError) return 'SYNTAX_ERROR';
    if (error instanceof ReferenceError) return 'REFERENCE_ERROR';
    
    return 'UNKNOWN_ERROR';
  }
  
  getErrorSeverity(error) {
    if (error instanceof AppError) {
      const statusCode = error.statusCode || 500;
      
      if (statusCode >= 500) return 'critical';
      if (statusCode >= 400) return 'warning';
      return 'info';
    }
    
    return 'critical';
  }
  
  async withRetry(fn, options) {
    const { maxAttempts, delayMs, backoffFactor = 2, shouldRetry } = options;
    let lastError = null;
    
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
    
    throw lastError || new Error('Unknown error in retry logic');
  }
  
  createAppError(error, code, options) {
    return new AppError(code, error.message, {
      ...options,
      cause: error
    });
  }
}
