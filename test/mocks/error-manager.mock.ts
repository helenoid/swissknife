/**
 * Error Manager Mock for Testing
 * 
 * This provides a testing-friendly version of the ErrorManager
 */

// Types for the ErrorManager
export type ErrorHandler = (error: Error, context?: any) => boolean | Promise<boolean>;
export type ErrorReporter = (error: Error, context?: any) => boolean | Promise<boolean>;

// Create the Error Manager class with appropriate structure for testing
export class ErrorManager {
  private static instance: ErrorManager | null = null;
  private handlers: Map<string, ErrorHandler[]> = new Map();
  private fallbackHandler: ErrorHandler | null = null;
  
  private constructor() {
    this.setFallbackHandler((error) => {
      console.error('Error handled by ErrorManager:', error);
      return true;
    });
  }
  
  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  registerHandler(code: string, handler: ErrorHandler): void {
    if (!this.handlers.has(code)) {
      this.handlers.set(code, []);
    }
    this.handlers.get(code)!.push(handler);
  }
  
  setFallbackHandler(handler: ErrorHandler): void {
    this.fallbackHandler = handler;
  }
  
  async handleError(error: Error, context?: any): Promise<boolean> {
    // For testing purposes, we'll just call the fallback handler
    if (this.fallbackHandler) {
      return this.fallbackHandler(error, context);
    }
    return false;
  }
  
  // Reset instance for testing
  static resetInstance(): void {
    ErrorManager.instance = null;
  }
}

// Export for convenience in tests
export function getErrorManager(): ErrorManager {
  return ErrorManager.getInstance();
}
