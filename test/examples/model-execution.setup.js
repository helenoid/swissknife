/**
 * Jest setup specific for model-execution tests
 */

// Mock key modules needed for model execution tests
jest.mock('../../src/config/manager', () => ({
  ConfigurationManager: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'models.default') return 'test-model';
        if (key === 'storage.type') return 'mock';
        if (key === 'logging.level') return 'info';
        return defaultValue;
      }),
      set: jest.fn().mockImplementation((key, value) => Promise.resolve(true)),
      save: jest.fn().mockResolvedValue(true),
      getAll: jest.fn().mockReturnValue({
        models: { default: 'test-model' },
        storage: { type: 'mock' },
        logging: { level: 'info' }
      }),
      initialize: jest.fn().mockResolvedValue(true),
      initialized: true
    })
  }
}));

// Mock logging system
jest.mock('../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    })
  }
}));

// Mock model execution service
jest.mock('../../src/models/execution', () => ({
  ModelExecutionService: {
    getInstance: jest.fn().mockReturnValue({
      executeModel: jest.fn().mockImplementation(async (modelId, prompt, options) => {
        return {
          modelId,
          result: `Mock response for: ${prompt}`,
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        };
      }),
      listModels: jest.fn().mockReturnValue([
        { id: 'test-model-1', provider: 'test', capabilities: ['chat', 'completion'] },
        { id: 'test-model-2', provider: 'test', capabilities: ['chat', 'embedding'] }
      ])
    })
  }
}));

// Mock storage factory
jest.mock('../../src/storage/factory', () => ({
  StorageFactory: {
    createStorage: jest.fn().mockReturnValue({
      read: jest.fn().mockResolvedValue({ data: 'mock data' }),
      write: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      list: jest.fn().mockResolvedValue(['file1', 'file2']),
      _reset: jest.fn()
    })
  }
}));

// Increase the test timeout
jest.setTimeout(30000);
