/**
 * Mock generator for commonly used modules in tests
 */

// ModelExecutionService mock
function createModelExecutionServiceMock() {
  return {
    executeModel: jest.fn().mockResolvedValue({
      response: 'Mock response',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      timingMs: 100
    }),
    executeModelStream: jest.fn().mockImplementation(() => {
      const EventEmitter = require('events');
      const stream = new EventEmitter();
      
      setTimeout(() => {
        stream.emit('data', { text: 'Mock stream data' });
        stream.emit('end');
      }, 10);
      
      stream.pipe = () => stream;
      stream.removeListener = () => stream;
      stream.removeAllListeners = () => stream;
      
      return Promise.resolve(stream);
    }),
    getModelsByCapability: jest.fn().mockResolvedValue([
      { id: 'test-model', capabilities: { streaming: true }}
    ]),
    getDefaultModel: jest.fn().mockResolvedValue({ id: 'default-model' })
  };
}

// ModelRegistry mock
function createModelRegistryMock() {
  return {
    getModel: jest.fn().mockReturnValue({ 
      id: 'mock-model', 
      provider: 'mock-provider',
      capabilities: { streaming: true }
    }),
    getProvider: jest.fn().mockReturnValue({ 
      id: 'mock-provider', 
      name: 'Mock Provider',
      baseURL: 'https://api.example.com',
      envVar: 'MOCK_API_KEY'
    }),
    getAllModels: jest.fn().mockReturnValue([
      { id: 'model-1', provider: 'provider-1', capabilities: { streaming: true } },
      { id: 'model-2', provider: 'provider-2', capabilities: { streaming: false } }
    ])
  };
}

// ConfigurationManager mock
function createConfigurationManagerMock() {
  return {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      if (key === 'apiKeys.mock-provider') return ['mock-api-key-1'];
      return defaultValue;
    }),
    set: jest.fn().mockReturnValue(true),
    delete: jest.fn().mockReturnValue(true)
  };
}

// IntegrationRegistry mock
function createIntegrationRegistryMock() {
  return {
    getBridge: jest.fn().mockReturnValue({
      id: 'mock-bridge',
      name: 'Mock Bridge',
      call: jest.fn().mockResolvedValue({ result: 'Mock result' })
    }),
    callBridge: jest.fn().mockResolvedValue({ result: 'Mock result' })
  };
}

// Export all mock creators
module.exports = {
  createModelExecutionServiceMock,
  createModelRegistryMock,
  createConfigurationManagerMock,
  createIntegrationRegistryMock
};
