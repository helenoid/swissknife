/**
 * Basic test verification to ensure Jest is properly working
 */

describe('Jest Environment Verification', () => {
  test('basic test functionality works', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('async functionality works', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
  
  test('mock functions work', () => {
    const mockFn = jest.fn().mockReturnValue(42);
    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalled();
  });
  
  // Test environment variables
  test('environment variables are accessible', () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set a test environment variable
    process.env.TEST_VARIABLE = 'test-value';
    
    expect(process.env.TEST_VARIABLE).toBe('test-value');
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  // Test the mock implementations we've created
  test('mock implementations can be imported', () => {
    try {
      // Try to import mock implementations using CommonJS require
      const { ModelExecutionService } = require('../../dist/models/execution.js');
      const { ModelRegistry } = require('../../dist/models/registry.js');
      const { ConfigurationManager } = require('../../dist/config/manager.js');
      const { IntegrationRegistry } = require('../../dist/integration/registry.js');
      
      expect(ModelExecutionService).toBeDefined();
      expect(ModelRegistry).toBeDefined();
      expect(ConfigurationManager).toBeDefined();
      expect(IntegrationRegistry).toBeDefined();
    } catch (error) {
      console.error('Error importing mock implementations:', error);
      throw error;
    }
  });
});
