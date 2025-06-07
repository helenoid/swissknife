/**
 * Global mocks for core services
 * 
 * This file provides factory functions to create mock services that can be used in tests.
 * These mocks can be imported and used by Jest's mock function instead of creating mocks
 * that reference out-of-scope variables directly.
 */

// Mock configuration manager factory
export function createMockConfigManager() {
  return {
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
  };
}

// Mock logger factory
export function createMockLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  };
}

// Mock model service factory
export function createMockModelService() {
  return {
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
  };
}

// Mock storage factory
export function createMockStorage() {
  return {
    read: jest.fn().mockResolvedValue({ data: 'mock data' }),
    write: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    list: jest.fn().mockResolvedValue(['file1', 'file2']),
    _reset: jest.fn()
  };
}
