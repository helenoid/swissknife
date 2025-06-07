/**
 * Simple test for ErrorManager handler registration
 */

import { ErrorManager } from '@src/utils/errors/manager';

describe('ErrorManager Simple Test', () => {
  let errorManager: ErrorManager;
  
  beforeEach(() => {
    // Reset singleton
    (ErrorManager as any).instance = null;
    errorManager = ErrorManager.getInstance();
  });
  
  it('should register a handler correctly', () => {
    // Arrange
    const handler = jest.fn().mockReturnValue(true);
    
    // Act
    errorManager.registerHandler('TEST_ERROR', handler);
    
    // Assert
    console.log('ErrorManager instance:', errorManager);
    const handlers = (errorManager as any).handlers;
    console.log('Handlers map type:', typeof handlers);
    console.log('Handlers map:', handlers);
    console.log('TEST_ERROR handlers:', handlers.get('TEST_ERROR'));
    console.log('Is handlers.get result an array?', Array.isArray(handlers.get('TEST_ERROR')));
    
    const testHandlers = handlers.get('TEST_ERROR');
    expect(testHandlers).toBeDefined();
    
    // Check if it's an array (TypeScript implementation) or single function (JavaScript implementation)
    if (Array.isArray(testHandlers)) {
      expect(testHandlers).toContain(handler);
    } else {
      expect(testHandlers).toBe(handler);
    }
  });
});
