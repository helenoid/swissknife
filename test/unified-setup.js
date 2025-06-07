/**
 * Unified Jest setup for SwissKnife tests
 * This provides comprehensive mocking for all test types
 */

// Setup Chai stub for assertions
const chai = require('./mocks/stubs/chai-enhanced.js');

// Save original Jest expect
const originalExpect = global.expect;

// Setup global expect to handle both Jest and Chai styles
global.expect = function(value) {
  // If expect is called with a function and it's a Chai-style assertion
  if (arguments.length === 1 && typeof originalExpect === 'function') {
    // Return both Chai and Jest assertion styles
    const jestAssertions = originalExpect(value);
    const chaiAssertions = chai.expect(value);
    
    // Combine them
    return {
      ...jestAssertions,
      to: chaiAssertions.to,
      toThrow: jestAssertions.toThrow
    };
  }
  return originalExpect.apply(this, arguments);
};

// Also set global chai
global.chai = chai;

// Increase timeout for all tests (using global if available)
if (typeof jest !== 'undefined') {
  jest.setTimeout(60000);
}

// Add global polyfills if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Handle structuredClone if not available
if (!globalThis.structuredClone) {
  globalThis.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// Common test environment variables
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

// Suppress excessive console output during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.VERBOSE_LOGS !== 'true') {
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Critical error')) {
      originalConsoleError(...args);
    }
  };
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Critical warning')) {
      originalConsoleWarn(...args);
    }
  };
}

// Restore original console methods after all tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock HTTP module for server tests
if (typeof jest !== 'undefined') {
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

  // Mock worker_threads for worker tests
  jest.mock('worker_threads', () => {
    const EventEmitter = require('events');
    
    class MockWorker extends EventEmitter {
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
        return configs[key] !== undefined ? configs[key] : defaultValue;
      }),
      set: jest.fn(),
      has: jest.fn().mockReturnValue(true)
    }
  }), { virtual: true });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  if (process.env.DEBUG_TESTS === 'true') {
    originalConsoleWarn('Unhandled Rejection in test:', reason);
  }
});

// Test utility functions
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.mockResponse = (status = 200, data = {}) => ({ 
  status, 
  json: () => Promise.resolve(data) 
});
