/**
 * This is a simplified test version that doesn't rely on the setup.js file
 * which is causing Jest mock issues with out-of-scope variables.
 */

// Required test modules
const { MockModelExecutionService } = require('../../mocks/services/mock-services');

// Test mock setup 
beforeEach(() => {
  // Mock configuration manager
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
});

// Sample Models and Responses
const sampleModels = [
  { id: 'model-1', name: 'Test Model 1', provider: 'test-provider', capabilities: ['chat', 'completion'] },
  { id: 'model-2', name: 'Test Model 2', provider: 'test-provider', capabilities: ['embedding'] }
];

const sampleProviders = [
  { id: 'test-provider', name: 'Test Provider', models: ['model-1', 'model-2'] }
];

const sampleResponses = {
  'model-1': 'This is a mock response from Model 1',
  'model-2': 'This is a mock response from Model 2'
};

// Helper functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const captureConsoleOutput = () => {
  const originalConsole = { 
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  const output = {
    logs: [],
    errors: [],
    warnings: [],
    infos: []
  };
  
  console.log = (...args) => { output.logs.push(args.join(' ')); };
  console.error = (...args) => { output.errors.push(args.join(' ')); };
  console.warn = (...args) => { output.warnings.push(args.join(' ')); };
  console.info = (...args) => { output.infos.push(args.join(' ')); };
  
  return {
    output,
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    }
  };
};

module.exports = {
  sampleModels,
  sampleProviders,
  sampleResponses,
  MockModelExecutionService,
  wait,
  captureConsoleOutput
};
