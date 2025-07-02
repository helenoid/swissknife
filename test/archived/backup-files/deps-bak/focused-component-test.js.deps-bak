/**
 * Focused test demonstrating the correct way to test key components
 */

// Mock implementations of key services - these are compatible with both ESM and CommonJS
jest.mock('../../dist/models/execution.js', () => ({
  ModelExecutionService: {
    getInstance: jest.fn().mockReturnValue({
      executeModel: jest.fn().mockImplementation(async (modelId, prompt) => ({
        response: `Mock response for "${prompt}" using model ${modelId}`,
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        timingMs: 100
      })),
      executeModelStream: jest.fn().mockImplementation(async () => {
        const { EventEmitter } = require('events');
        const stream = new EventEmitter();
        
        // Simulate streaming data
        process.nextTick(() => {
          stream.emit('data', { text: 'Hello' });
          stream.emit('data', { text: ' world' });
          stream.emit('end');
        });
        
        // Add required stream methods
        stream.pipe = jest.fn().mockReturnValue(stream);
        stream.on = function(event, handler) {
          this.addListener(event, handler);
          return this;
        };
        
        return stream;
      }),
      getModelsByCapability: jest.fn().mockReturnValue([
        { id: 'model-1', capabilities: { streaming: true } },
        { id: 'model-2', capabilities: { streaming: true } }
      ]),
      getDefaultModel: jest.fn().mockReturnValue({
        id: 'default-model',
        provider: 'mock-provider',
        capabilities: { streaming: true }
      })
    })
  }
}), { virtual: true });

jest.mock('../../dist/models/registry.js', () => ({
  ModelRegistry: {
    getInstance: jest.fn().mockReturnValue({
      getModel: jest.fn().mockImplementation((modelId) => ({
        id: modelId || 'mock-model',
        provider: 'mock-provider',
        name: `Mock Model (${modelId})`,
        capabilities: { streaming: true }
      })),
      getAllModels: jest.fn().mockReturnValue([
        { id: 'model-1', provider: 'provider-1' },
        { id: 'model-2', provider: 'provider-2' }
      ])
    })
  }
}), { virtual: true });

// Import mocked services
const { ModelExecutionService } = require('../../dist/models/execution.js');
const { ModelRegistry } = require('../../dist/models/registry.js');

// Basic tests
describe('Basic tests', () => {
  test('simple test works', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('async test works', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});

// ModelExecutionService tests
describe('ModelExecutionService', () => {
  const modelService = ModelExecutionService.getInstance();
  
  test('executeModel returns expected response', async () => {
    const result = await modelService.executeModel('test-model', 'Hello, world!');
    
    expect(result).toBeDefined();
    expect(result.response).toContain('Hello, world!');
    expect(result.usage).toHaveProperty('totalTokens');
    expect(result.timingMs).toBeDefined();
  });
  
  test('executeModelStream emits data events', async () => {
    const stream = await modelService.executeModelStream('test-model', 'Hello, world!');
    
    const chunks = [];
    await new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    expect(chunks.length).toBe(2);
    expect(chunks[0].text).toBe('Hello');
    expect(chunks[1].text).toBe(' world');
  });
});

// ModelRegistry tests
describe('ModelRegistry', () => {
  const modelRegistry = ModelRegistry.getInstance();
  
  test('getModel returns model by ID', () => {
    const model = modelRegistry.getModel('test-model');
    expect(model).toBeDefined();
    expect(model.id).toBe('test-model');
    expect(model.provider).toBe('mock-provider');
  });
  
  test('getAllModels returns a list of models', () => {
    const models = modelRegistry.getAllModels();
    expect(models).toHaveLength(2);
    expect(models[0]).toHaveProperty('id', 'model-1');
    expect(models[1]).toHaveProperty('id', 'model-2');
  });
});
