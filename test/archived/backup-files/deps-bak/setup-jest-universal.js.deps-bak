// setup-jest-universal.js
// Universal setup file for all SwissKnife tests

// Increase timeout for all tests
jest.setTimeout(60000);

// Global text encoder/decoder (needed for Node.js)
if (!global.TextEncoder) {
  global.TextEncoder = require('util').TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = require('util').TextDecoder;
}

// Environment variables for testing
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  TEST_PROVIDER_API_KEY: 'test-api-key',
  TEST_PROVIDER_1_API_KEY: 'test-api-key-1',
  TEST_PROVIDER_2_API_KEY: 'test-api-key-2',
  MCP_SERVER_PORT: '9000',
  MCP_SERVER_HOST: 'localhost',
  MCP_CLIENT_PORT: '9000',
  MCP_CLIENT_HOST: 'localhost'
};

// Mock fetch API if it doesn't exist
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue('')
  });
}

// Mock HTTP module for server tests
jest.mock('http', () => {
  const originalHttp = jest.requireActual('http');
  return {
    ...originalHttp,
    createServer: jest.fn().mockImplementation((handler) => ({
      listen: jest.fn().mockImplementation((port, host, callback) => {
        if (callback) callback();
        return this;
      }),
      on: jest.fn().mockImplementation(() => this),
      close: jest.fn().mockImplementation((callback) => {
        if (callback) callback();
        return this;
      })
    }))
  };
});

// Mock config module for all tests
jest.mock('@/utils/config', () => ({
  config: {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      const configs = {
        'ai.providers.test': { apiKey: 'test-api-key' },
        'mcp.server.port': 9000,
        'mcp.server.host': 'localhost',
        'mcp.client.port': 9000,
        'mcp.client.host': 'localhost',
        'api.timeout': 30000,
        'task.timeout': 60000
      };
      return configs[key] || defaultValue;
    }),
    set: jest.fn(),
    has: jest.fn().mockReturnValue(true)
  }
}), { virtual: true });

// Mock worker_threads for worker tests
jest.mock('worker_threads', () => {
  class MockWorker extends require('events').EventEmitter {
    constructor(scriptURL) {
      super();
      this.scriptURL = scriptURL;
      this.postMessage = jest.fn();
      this.terminate = jest.fn().mockImplementation(() => {
        this.emit('exit', 0);
        return Promise.resolve();
      });
    }
  }
  
  return {
    Worker: MockWorker,
    isMainThread: true,
    parentPort: {
      on: jest.fn(),
      once: jest.fn(),
      postMessage: jest.fn()
    },
    workerData: {}
  };
}, { virtual: true });

// Handle errors in async code
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection in test:', reason);
});

// Add test helpers
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced console for tests
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (process.env.DEBUG_TESTS) {
    originalConsoleLog.apply(console, ['[TEST]', ...args]);
  }
};

// Mock structuredClone if not available
if (!global.structuredClone) {
  global.structuredClone = obj => JSON.parse(JSON.stringify(obj))
};
