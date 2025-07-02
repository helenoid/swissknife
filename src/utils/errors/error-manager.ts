// Advanced error manager implementation for the SwissKnife project
export class ErrorManager {
  private static instance: ErrorManager | null = null;
  private handlers: Map<string, (error: Error) => void>;
  private fallbackHandler: (error: Error) => void;
  private reporter: (error: Error) => Promise<boolean>;
  private batchReporter: (errors: Error[]) => Promise<boolean>;
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
    this.batchReporter = async (errors: Error[]) => {
      console.error('Batch errors reported:', errors);
      return true;
    };
  }

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  public static resetInstance(): void {
    ErrorManager.instance = null;
  }

  public registerHandler(errorCode: string, handler: (error: Error) => void): void {
    this.handlers.set(errorCode, handler);
  }

  public setFallbackHandler(handler: (error: Error) => void): void {
    this.fallbackHandler = handler;
  }

  public registerReporter(reporter: (error: Error) => Promise<boolean>): void {
    this.reporter = reporter;
  }

  public handleError(error: Error): boolean {
    // Check if error has code property (AppError interface)
    if (error && typeof error === 'object' && 'code' in error) {
      const appError = error as Error & { code: string };
      const handler = this.handlers.get(appError.code);
      if (handler) {
        handler(error);
        return true; // Handled by specific handler
      }
      this.fallbackHandler(error);
      return true; // Handled by fallback
    } else {
      this.fallbackHandler(error); // Call fallback for standard Error objects
      return true; // Handled by fallback
    }
  }

  public async reportError(error: Error): Promise<boolean> {
    return this.reporter(error);
  }

  public async batchReportErrors(errors: Error[]): Promise<boolean> {
    return this.batchReporter(errors);
  }

  public categorizeError(error: Error & { code?: string }): string {
    const code = error.code || '';
    if (code.includes('VALIDATION')) return 'VALIDATION';
    if (code.includes('AUTH')) return 'AUTH';
    if (code.includes('NETWORK')) return 'NETWORK';
    return 'UNKNOWN';
  }

  public getErrorSeverity(error: Error & { code?: string }): number {
    const code = error.code || '';
    if (code.includes('CRITICAL')) return 3;
    if (code.includes('MAJOR')) return 2;
    if (code.includes('MINOR')) return 1;
    return 0;
  }

  public formatError(error: Error): string {
    // Check if error has AppError properties
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
