/**
 * Verification test to ensure the test environment is properly set up
 */

// Import mock modules to verify they work
const { ModelExecutionService } = require('../../dist/models/execution');
const { ModelRegistry } = require('../../dist/models/registry');
const { ConfigurationManager } = require('../../dist/config/manager');
const { IntegrationRegistry } = require('../../dist/integration/registry');

describe('Verification Tests', () => {
  test('Basic JavaScript functionality', () => {
    expect(1 + 1).toBe(2);
    expect('test'.length).toBe(4);
    expect([1, 2, 3].map(n => n * 2)).toEqual([2, 4, 6]);
  });
  
  test('Async functionality', async () => {
    const result = await Promise.resolve('test result');
    expect(result).toBe('test result');
    
    // Test setTimeout works
    const slowResult = await new Promise(resolve => {
      setTimeout(() => resolve('slow result'), 100);
    });
    expect(slowResult).toBe('slow result');
  });
  
  test('Mock services are available', () => {
    // Test ModelExecutionService
    const executionService = ModelExecutionService.getInstance();
    expect(typeof executionService.executeModel).toBe('function');
    expect(typeof executionService.executeModelStream).toBe('function');
    
    // Test ModelRegistry
    const registry = ModelRegistry.getInstance();
    expect(typeof registry.getModel).toBe('function');
    expect(typeof registry.getProvider).toBe('function');
    
    // Test ConfigurationManager
    const config = ConfigurationManager.getInstance();
    expect(typeof config.get).toBe('function');
    expect(typeof config.set).toBe('function');
    
    // Test IntegrationRegistry
    const integrationRegistry = IntegrationRegistry.getInstance();
    expect(typeof integrationRegistry.getBridge).toBe('function');
    expect(typeof integrationRegistry.callBridge).toBe('function');
  });
  
  test('ExecutionService functionality', async () => {
    const executionService = ModelExecutionService.getInstance();
    
    // Test executeModel
    const result = await executionService.executeModel('test-model', 'test prompt');
    expect(result).toBeDefined();
    expect(result.response).toContain('Mock response');
    expect(result.usage).toBeDefined();
    
    // Test executeModelStream
    const stream = await executionService.executeModelStream('test-model', 'test prompt');
    expect(stream).toBeDefined();
    expect(typeof stream.on).toBe('function');
  });
});
