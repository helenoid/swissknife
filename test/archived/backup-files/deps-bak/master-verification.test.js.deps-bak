/**
 * Verification test to ensure test configuration is working properly
 */

// Import helpers
const { mockEnv, wait } = require('./helpers/testUtils');
const { createMockGooseBridge } = require('./helpers/mockBridge');
const { generateModelFixtures, generatePromptFixtures } = require('./helpers/fixtures');

describe('Verification Tests', () => {
  test('Basic functionality', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('Async functionality', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
  
  test('Mock utilities work properly', () => {
    // Test environment mocking
    const restore = mockEnv({ 'TEST_VAR': 'test_value' });
    expect(process.env.TEST_VAR).toBe('test_value');
    restore();
    expect(process.env.TEST_VAR).toBeUndefined();
    
    // Test bridge mocking
    const bridge = createMockGooseBridge();
    expect(bridge.id).toBe('goose');
    expect(typeof bridge.call).toBe('function');
  });
  
  test('Fixtures are available', () => {
    const models = generateModelFixtures();
    expect(models.providers.length).toBeGreaterThan(0);
    
    const prompts = generatePromptFixtures();
    expect(prompts.simple).toBeDefined();
  });
});

// Test mock modules
describe('Mock Modules', () => {
  beforeAll(() => {
    // Import mock modules from dist directory
    jest.resetModules();
  });
  
  test('ModelExecutionService mock works', async () => {
    const { ModelExecutionService } = require('../dist/models/execution');
    const service = ModelExecutionService.getInstance();
    
    const result = await service.executeModel('test-model', 'test prompt');
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('usage');
  });
  
  test('ModelRegistry mock works', () => {
    const { ModelRegistry } = require('../dist/models/registry');
    const registry = ModelRegistry.getInstance();
    
    const model = registry.getModel('test-model-1');
    expect(model).toHaveProperty('id', 'test-model-1');
    expect(model).toHaveProperty('provider', 'test-provider-1');
  });
  
  test('ConfigurationManager mock works', () => {
    const { ConfigurationManager } = require('../dist/config/manager');
    const config = ConfigurationManager.getInstance();
    
    expect(config.get('apiKeys.test-provider-1')).toEqual(['test-key-1']);
    
    config.set('test.key', 'test-value');
    expect(config.get('test.key')).toBe('test-value');
    
    config.delete('test.key');
    expect(config.get('test.key', 'default')).toBe('default');
  });
  
  test('IntegrationRegistry mock works', async () => {
    const { IntegrationRegistry } = require('../dist/integration/registry');
    const registry = IntegrationRegistry.getInstance();
    
    const bridge = registry.getBridge('test-bridge');
    expect(bridge).toHaveProperty('id', 'test-bridge');
    expect(bridge).toHaveProperty('call');
    
    const result = await registry.callBridge('test-bridge', 'test-method', { param: 'value' });
    expect(result).toHaveProperty('result');
  });
  
  test('MCP server mock works', () => {
    const { startServer, createMCPServer } = require('../dist/entrypoints/mcp');
    
    const server = startServer({ port: 3000 });
    expect(server).toHaveProperty('close');
    
    const mcpServer = createMCPServer({ port: 3001 });
    expect(mcpServer).toHaveProperty('start');
    expect(mcpServer).toHaveProperty('close');
  });
});
