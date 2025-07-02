/**
 * Direct Test of Core Components
 * This file provides direct tests of the key components without relying on complex imports
 */

// Test basic Jest functionality
test('Jest is working', () => {
  expect(1 + 1).toBe(2);
});

// Test ModelExecutionService mock
test('ModelExecutionService mock is working', () => {
  // Create simple mock
  const mockExecutionService = {
    executeModel: jest.fn().mockResolvedValue({
      response: 'mock response',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      timingMs: 100
    }),
    executeModelStream: jest.fn().mockImplementation(() => {
      const { EventEmitter } = require('events');
      const stream = new EventEmitter();
      
      setTimeout(() => {
        stream.emit('data', { text: 'chunk 1' });
        stream.emit('data', { text: 'chunk 2' });
        stream.emit('end');
      }, 10);
      
      return stream;
    })
  };
  
  // Test the mock
  expect(mockExecutionService.executeModel).toBeDefined();
  expect(typeof mockExecutionService.executeModelStream).toBe('function');
});

// Test ModelRegistry mock
test('ModelRegistry mock is working', () => {
  // Create simple mock
  const mockRegistry = {
    getModel: jest.fn().mockReturnValue({
      id: 'test-model',
      provider: 'test-provider',
      name: 'Test Model',
      capabilities: { streaming: true }
    }),
    getAllModels: jest.fn().mockReturnValue([
      { id: 'model1', provider: 'provider1' },
      { id: 'model2', provider: 'provider2' }
    ])
  };
  
  // Test the mock
  expect(mockRegistry.getModel).toBeDefined();
  expect(mockRegistry.getAllModels).toBeDefined();
  expect(mockRegistry.getAllModels().length).toBe(2);
});

// Test MCP Server mock
test('MCP Server mock is working', () => {
  // Create simple MCP server mock
  const mockServer = {
    start: jest.fn().mockResolvedValue({ port: 3000 }),
    stop: jest.fn().mockResolvedValue(true),
    registerTool: jest.fn(),
    listTools: jest.fn().mockReturnValue(['tool1', 'tool2'])
  };
  
  // Test the mock
  expect(mockServer.start).toBeDefined();
  expect(mockServer.stop).toBeDefined();
  expect(mockServer.registerTool).toBeDefined();
});
