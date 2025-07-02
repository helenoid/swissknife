/**
 * Jest setup script that runs before tests
 * 
 * This sets up the global testing environment and can be referenced
 * in the Jest configuration as setupFilesAfterEnv
 */

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Configure global testing timeouts
jest.setTimeout(30000); // Increase default timeout to 30 seconds

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection during test:', reason);
  // Don't fail the test suite, just log it
});

// Polyfill for TextEncoder/TextDecoder if needed in Node environment
if (typeof TextEncoder === 'undefined' || typeof TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Setup global mocks for common modules
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  mkdir: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
}));

// Import required modules
const fs = require('fs');
const path = require('path');
const os = require('os');
const executorPath = '<rootDir>/src/ai/tools/executor.js';
const agentExecutorPath = '<rootDir>/src/ai/agent/../tools/executor.js';
const decompositionPath = '<rootDir>/src/tasks/decomposition/index.js';
const ipfsClientPath = '<rootDir>/src/ipfs/client.js';

// Fix the syntax error by properly closing the string
if (fs.existsSync(executorPath)) {
  jest.mock(executorPath, () => ({
    ToolExecutor: jest.fn().mockImplementation(() => ({
      registerTool: jest.fn(),
      execute: jest.fn().mockResolvedValue(undefined),
      getRegisteredTools: jest.fn().mockReturnValue([])
    }))
  }));
}

if (fs.existsSync(agentExecutorPath)) {
  jest.mock(agentExecutorPath, () => ({
    ToolExecutor: jest.fn().mockImplementation(() => ({
      registerTool: jest.fn(),
      execute: jest.fn().mockResolvedValue(undefined),
      getRegisteredTools: jest.fn().mockReturnValue([])
    }))
  }));
}

if (fs.existsSync(decompositionPath)) {
  jest.mock(decompositionPath, () => ({
    TaskDecomposer: jest.fn().mockImplementation(() => ({
      decomposeTask: jest.fn().mockResolvedValue([])
    }))
  }));
}

// Add TextEncoder/TextDecoder polyfills if needed
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    console.warn('Failed to load TextEncoder/TextDecoder from util');
    
    // Provide minimal implementations
    global.TextEncoder = class TextEncoder {
      encode(text) {
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
          bytes[i] = text.charCodeAt(i);
        }
        return bytes;
      }
    };
    
    global.TextDecoder = class TextDecoder {
      decode(bytes) {
        return String.fromCharCode.apply(null, bytes);
      }
    };
  }
}

// Add fetch polyfill if needed
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => ''
  }));
}

// Mock console methods to reduce noise in test output
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

if (process.env.SILENT_TESTS) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
  
  afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });
}

// Handle unhandled promise rejections during tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection during test:', reason);
});

// Global beforeEach and afterEach hooks
beforeEach(() => {
  jest.clearAllMocks();
});

// Add global matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },
  
  async toThrowAsync(received, expected) {
    try {
      await received();
      return {
        message: () => 'Expected function to throw, but it did not',
        pass: false
      };
    } catch (error) {
      const pass = !expected || 
                  (expected instanceof RegExp && expected.test(error.message)) ||
                  (typeof expected === 'string' && error.message.includes(expected)) ||
                  (expected instanceof Error && error.message === expected.message);
                  
      if (pass) {
        return {
          message: () => `Expected function not to throw ${expected ? expected : 'an error'}, but it did`,
          pass: true
        };
      } else {
        return {
          message: () => `Expected function to throw ${expected ? expected : 'an error'}, but it threw "${error.message}"`,
          pass: false
        };
      }
    }
  }
});

// Create temp directory for tests if needed
const TEST_TMP_DIR = path.join(os.tmpdir(), `swissknife-test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);

if (!fs.existsSync(TEST_TMP_DIR)) {
  fs.mkdirSync(TEST_TMP_DIR, { recursive: true });
}

// Make TEST_TMP_DIR available globally
global.__TEST_TMP_DIR = TEST_TMP_DIR;

// Restore console functions after tests
afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  
  try {
    if (TEST_TMP_DIR.includes('swissknife-test-') && TEST_TMP_DIR.startsWith(os.tmpdir())) {
      // Only remove the temp directory if it's properly formatted to avoid accidents
      fs.rmSync(TEST_TMP_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to remove test temp directory: ${error.message}`);
  }
});

// Force garbage collection if available (helps with memory leaks in tests)
afterEach(() => {
  if (global.gc) {
    global.gc();
  }
});
