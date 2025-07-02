/**
 * Error Manager Mock for Testing (CommonJS Version)
 * 
 * This provides a testing-friendly version of the ErrorManager
 */

// Create the Error Manager class with appropriate structure for testing
class ErrorManager {
  static instance = null;
  
  constructor() {
    this.handlers = new Map();
    this.fallbackHandler = (error) => {
      console.error('Error handled by ErrorManager:', error);
      return true;
    };
  }
  
  static getInstance() {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  static resetInstance() {
    ErrorManager.instance = null;
  }
  
  setFallbackHandler(handler) {
    this.fallbackHandler = handler;
    return this;
  }
  
  getFallbackHandler() {
    return this.fallbackHandler;
  }
  
  registerHandler(errorType, handler) {
    if (!this.handlers.has(errorType)) {
      this.handlers.set(errorType, []);
    }
    this.handlers.get(errorType).push(handler);
    return this;
  }
  
  async handleError(error, context = {}) {
    const errorType = error.constructor.name;
    
    // Try specific handlers first
    if (this.handlers.has(errorType)) {
      const handlers = this.handlers.get(errorType);
      
      for (const handler of handlers) {
        try {
          const result = await handler(error, context);
          if (result === true) {
            return true;
          }
        } catch (handlerError) {
          console.error('Error in error handler:', handlerError);
        }
      }
    }
    
    // Fall back to the default handler
    if (this.fallbackHandler) {
      return this.fallbackHandler(error, context);
    }
    
    // If no handler or fallback succeeded, rethrow the error
    throw error;
  }
}

module.exports = {
  ErrorManager
};
