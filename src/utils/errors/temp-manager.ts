// Error manager implementation
export class ErrorManager {
  private static instance: ErrorManager;

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  private constructor() {}

  public handleError(error: Error): void {
    console.error('Error occurred:', error.message);
  }
}
