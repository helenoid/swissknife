/**
 * Simplified test for ModelExecutionService to verify key functionality
 */

// Import test helpers
const { mockEnv } = require('../helpers/testUtils');
const { generateModelFixtures, generatePromptFixtures } = require('../helpers/fixtures');
const { createMockGooseBridge } = require('../helpers/mockBridge');

// Import mock modules
const { ModelExecutionService } = require('../../dist/models/execution');
const { ModelRegistry } = require('../../dist/models/registry');
const { ConfigurationManager } = require('../../dist/config/manager');
const { IntegrationRegistry } = require('../../dist/integration/registry');

describe('ModelExecutionService Integration Tests', () => {
  let executionService;
  let modelRegistry;
  let configManager;
  let integrationRegistry;
  let restoreEnv;
  
  beforeAll(() => {
    // Set up environment variables
    restoreEnv = mockEnv({
      'TEST_PROVIDER_1_API_KEY': 'env-test-key-1',
      'TEST_PROVIDER_2_API_KEY': 'env-test-key-2',
      'MOCK_PROVIDER_API_KEY': 'mock-api-key'
    });
    
    // Initialize services
    modelRegistry = ModelRegistry.getInstance();
    configManager = ConfigurationManager.getInstance();
    integrationRegistry = IntegrationRegistry.getInstance();
    executionService = ModelExecutionService.getInstance();
  });
  
  afterAll(() => {
    // Restore environment
    restoreEnv();
    
    // Reset singletons
    ModelRegistry.resetInstance();
    ConfigurationManager.resetInstance();
    IntegrationRegistry.resetInstance();
    ModelExecutionService.resetInstance();
  });
  
  test('should execute a model successfully', async () => {
    // Arrange
    const modelId = 'test-model-1';
    const prompt = 'Test prompt';
    
    // Act
    const result = await executionService.executeModel(modelId, prompt);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.response).toContain('Mock response');
    expect(result.usage).toBeDefined();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });
  
  test('should stream model execution results', async () => {
    // Arrange
    const modelId = 'test-model-1';
    const prompt = 'Test prompt for streaming';
    
    // Act
    const stream = await executionService.executeModelStream(modelId, prompt);
    
    // Assert
    expect(stream).toBeDefined();
    
    // Test stream events
    return new Promise((resolve) => {
      let receivedData = '';
      
      stream.on('data', (chunk) => {
        receivedData += chunk.text || '';
      });
      
      stream.on('end', () => {
        expect(receivedData).toContain('Mock');
        resolve();
      });
    });
  });
  
  test('should get models by capability', async () => {
    // Act
    const streamingModels = await executionService.getModelsByCapability('streaming');
    
    // Assert
    expect(streamingModels).toBeDefined();
    expect(streamingModels.length).toBeGreaterThan(0);
    expect(streamingModels[0].capabilities.streaming).toBe(true);
  });
  
  test('should get the default model', async () => {
    // Act
    const defaultModel = await executionService.getDefaultModel();
    
    // Assert
    expect(defaultModel).toBeDefined();
    expect(defaultModel.id).toBe('default-model');
  });
});
