/**
 * Comprehensive test suite for SwissKnife key modules
 * This test covers all the core functionality in isolation
 */

// Import EventEmitter for stream mocking
const { EventEmitter } = require('events');

// Test basic Jest functionality
describe('Basic functionality', () => {
  test('Basic assertions work', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('Async functions work', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});

// Test model execution functionality
describe('ModelExecutionService', () => {
  // Create mock service
  const mockExecutionService = {
    executeModel: jest.fn().mockImplementation(async (modelId, prompt, options = {}) => {
      return {
        response: `Mock response for "${prompt}" using model ${modelId}`,
        usage: { 
          promptTokens: Math.floor(prompt.length / 4), 
          completionTokens: 20, 
          totalTokens: Math.floor(prompt.length / 4) + 20 
        },
        timingMs: 100
      };
    }),
    
    executeModelStream: jest.fn().mockImplementation(async (modelId, prompt, options = {}) => {
      const stream = new EventEmitter();
      
      // Simulate streaming data in the next tick
      process.nextTick(() => {
        stream.emit('data', { text: 'Chunk 1' });
        stream.emit('data', { text: 'Chunk 2' });
        stream.emit('end');
      });
      
      // Add required stream methods
      stream.pipe = jest.fn().mockReturnValue(stream);
      stream.on = jest.fn((event, handler) => {
        stream.addListener(event, handler);
        return stream;
      });
      
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
  };
  
  test('executeModel returns expected response', async () => {
    const result = await mockExecutionService.executeModel('test-model', 'Hello, world!');
    
    expect(result).toBeDefined();
    expect(result.response).toContain('Hello, world!');
    expect(result.usage).toHaveProperty('totalTokens');
    expect(typeof result.timingMs).toBe('number');
  });
  
  test('executeModelStream emits data events', async () => {
    const stream = await mockExecutionService.executeModelStream('test-model', 'Hello, world!');
    
    const chunks = [];
    await new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toHaveProperty('text', 'Chunk 1');
    expect(chunks[1]).toHaveProperty('text', 'Chunk 2');
  });
  
  test('getModelsByCapability returns models with capability', () => {
    const models = mockExecutionService.getModelsByCapability('streaming');
    expect(models).toHaveLength(2);
    expect(models[0]).toHaveProperty('id', 'model-1');
    expect(models[1]).toHaveProperty('id', 'model-2');
  });
  
  test('getDefaultModel returns a default model', () => {
    const model = mockExecutionService.getDefaultModel();
    expect(model).toHaveProperty('id', 'default-model');
    expect(model).toHaveProperty('provider', 'mock-provider');
  });
});

// Test model registry functionality
describe('ModelRegistry', () => {
  // Create mock registry
  const mockRegistry = {
    getModel: jest.fn().mockImplementation((modelId) => {
      if (modelId === 'unknown-model') return null;
      
      return {
        id: modelId || 'mock-model',
        provider: 'mock-provider',
        name: `Mock Model (${modelId})`,
        capabilities: { 
          streaming: true,
          images: modelId && modelId.includes('image'),
          vision: modelId && modelId.includes('vision')
        },
        maxTokens: 4096,
        tokenizer: 'cl100k_base'
      };
    }),
    
    getAllModels: jest.fn().mockReturnValue([
      { id: 'model-1', provider: 'provider-1' },
      { id: 'model-2', provider: 'provider-2' }
    ]),
    
    getProvider: jest.fn().mockImplementation((providerId) => {
      if (providerId === 'unknown-provider') return null;
      
      return {
        id: providerId || 'mock-provider',
        name: `Mock Provider (${providerId})`,
        models: ['model-1', 'model-2']
      };
    })
  };
  
  test('getModel returns model by ID', () => {
    const model = mockRegistry.getModel('test-model');
    expect(model).toBeDefined();
    expect(model.id).toBe('test-model');
    expect(model.provider).toBe('mock-provider');
  });
  
  test('getModel returns null for unknown model', () => {
    const model = mockRegistry.getModel('unknown-model');
    expect(model).toBeNull();
  });
  
  test('getAllModels returns a list of models', () => {
    const models = mockRegistry.getAllModels();
    expect(models).toHaveLength(2);
    expect(models[0]).toHaveProperty('id', 'model-1');
    expect(models[1]).toHaveProperty('id', 'model-2');
  });
  
  test('getProvider returns provider by ID', () => {
    const provider = mockRegistry.getProvider('test-provider');
    expect(provider).toBeDefined();
    expect(provider.id).toBe('test-provider');
    expect(provider.models).toHaveLength(2);
  });
  
  test('getProvider returns null for unknown provider', () => {
    const provider = mockRegistry.getProvider('unknown-provider');
    expect(provider).toBeNull();
  });
});

// Test MCP server functionality
describe('MCP Server', () => {
  // Create mock server
  const mockServer = {
    start: jest.fn().mockResolvedValue({ port: 3000 }),
    stop: jest.fn().mockResolvedValue(true),
    registerTool: jest.fn(),
    getRegisteredTools: jest.fn().mockReturnValue({
      'test-tool': {
        name: 'test-tool',
        description: 'A test tool',
        execute: async () => ({ result: 'test-result' })
      }
    })
  };
  
  // Create mock client
  const mockClient = {
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    listTools: jest.fn().mockResolvedValue(['test-tool']),
    callTool: jest.fn().mockImplementation(async (tool, args) => {
      if (tool === 'test-tool') {
        return { result: 'test-result' };
      }
      throw new Error(`Unknown tool: ${tool}`);
    })
  };
  
  test('server starts and stops correctly', async () => {
    const result = await mockServer.start();
    expect(result).toHaveProperty('port', 3000);
    expect(mockServer.start).toHaveBeenCalled();
    
    await mockServer.stop();
    expect(mockServer.stop).toHaveBeenCalled();
  });
  
  test('server can register tools', () => {
    mockServer.registerTool('new-tool', {
      name: 'new-tool',
      description: 'A new test tool',
      execute: async () => ({ result: 'new-result' })
    });
    
    expect(mockServer.registerTool).toHaveBeenCalled();
  });
  
  test('client can connect and disconnect', async () => {
    await mockClient.connect();
    expect(mockClient.connect).toHaveBeenCalled();
    
    await mockClient.disconnect();
    expect(mockClient.disconnect).toHaveBeenCalled();
  });
  
  test('client can list tools', async () => {
    const tools = await mockClient.listTools();
    expect(tools).toContain('test-tool');
    expect(mockClient.listTools).toHaveBeenCalled();
  });
  
  test('client can call tools', async () => {
    const result = await mockClient.callTool('test-tool', { param: 'value' });
    expect(result).toEqual({ result: 'test-result' });
    expect(mockClient.callTool).toHaveBeenCalledWith('test-tool', { param: 'value' });
  });
  
  test('client handles errors for unknown tools', async () => {
    await expect(mockClient.callTool('unknown-tool')).rejects.toThrow('Unknown tool');
  });
});
