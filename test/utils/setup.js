/**
 * Common test setup utilities
 * 
 * Provides standardized test environment setup functions
 */

// Use CommonJS imports for better compatibility with Jest
const mockStorage = require('./mockStorage');

/**
 * Create a test environment with mock objects for testing
 * 
 * @param {Object} options Custom options for test environment
 * @returns {Object} Test environment with mocked dependencies
 */
function createTestEnvironment(options = {}) {
  // Create mock services and dependencies
  const environment = {
    // Mock storage system
    storage: mockStorage.createMockStorage(options.storage),
    
    // Mock configuration manager
    configManager: {
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
    },
    
    // Mock logging system
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    },
    
    // Mock model execution service
    modelService: {
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
    },
    
    // Mock tools
    tools: {
      get: jest.fn().mockImplementation(name => {
        const tools = {
          'file-read': {
            name: 'file-read',
            execute: jest.fn().mockResolvedValue({ content: 'mock file content' })
          },
          'file-write': {
            name: 'file-write',
            execute: jest.fn().mockResolvedValue({ success: true })
          },
          'shell': {
            name: 'shell',
            execute: jest.fn().mockResolvedValue({ output: 'mock command output', exitCode: 0 })
          }
        };
        return tools[name];
      }),
      list: jest.fn().mockReturnValue([
        { name: 'file-read', description: 'Read file content' },
        { name: 'file-write', description: 'Write content to file' },
        { name: 'shell', description: 'Execute shell commands' }
      ])
    },
    
    // Mock task manager
    taskManager: {
      createTask: jest.fn().mockImplementation(task => ({ 
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        ...task 
      })),
      getTask: jest.fn(),
      listTasks: jest.fn().mockReturnValue([]),
      executeTask: jest.fn().mockResolvedValue({ status: 'completed', result: 'mock result' }),
      updateTaskStatus: jest.fn()
    }
  };
  
  return environment;
}

/**
 * Setup global mocks for common dependencies
 * 
 * @param {Object} environment Test environment context
 * @returns {Function} Function to reset mocks when done
 */
function setupGlobalMocks(environment) {
  const configManager = environment.configManager;
  const logger = environment.logger;
  const modelService = environment.modelService;
  const storage = environment.storage;

  // Create mock references that Jest allows
  const mockConfigManager = configManager;
  const mockLogger = logger;
  const mockModelService = modelService;
  const mockStorage = storage;

  // Define module mocks
  jest.mock('../../src/config/manager', () => ({
    ConfigurationManager: {
      getInstance: jest.fn().mockReturnValue(mockConfigManager)
    }
  }), { virtual: true });

  jest.mock('../../src/utils/logging/manager', () => ({
    LogManager: {
      getInstance: jest.fn().mockReturnValue(mockLogger)
    }
  }), { virtual: true });

  jest.mock('../../src/models/execution', () => ({
    ModelExecutionService: {
      getInstance: jest.fn().mockReturnValue(mockModelService)
    }
  }), { virtual: true });

  jest.mock('../../src/storage/factory', () => ({
    StorageFactory: {
      createStorage: jest.fn().mockReturnValue(mockStorage)
    }
  }), { virtual: true });

  // Return function to reset mocks
  return function resetMocks() {
    jest.resetAllMocks();
    if (storage && typeof storage._reset === 'function') {
      storage._reset();
    }
  };
}

export { setupGlobalMocks };

// Export functions as CommonJS
module.exports = {
  createTestEnvironment,
  setupGlobalMocks,
  createMockStorage: mockStorage.createMockStorage
};
