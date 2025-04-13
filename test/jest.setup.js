/**
 * Jest setup script that runs before tests
 * 
 * This sets up the global testing environment and can be referenced
 * in the Jest configuration as setupFilesAfterEnv
 */

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Configure global testing timeouts
jest.setTimeout(15000);

// Setup global mocks for common modules

// Mock fs promises for tests that need file operations
jest.mock('fs/promises', () => ({
  ...jest.requireActual('fs/promises'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  mkdir: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
}));

// Mock console methods to reduce noise in test output
// Comment these out when debugging tests
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
  
  // Restore original console methods after all tests
  afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });
}

// Global beforeEach and afterEach hooks
beforeEach(() => {
  // Clear all mocks before each test
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
  
  // Helper to check if an async function throws
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

// Add mocks for timers in Node environment
// This helps with tests that involve setTimeout, etc.
if (typeof window === 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0);
  };
  
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// Create temp directory for tests if needed
const fs = require('fs');
const path = require('path');
const os = require('os');

const TEST_TMP_DIR = path.join(os.tmpdir(), `swissknife-test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEST_TMP_DIR)) {
  fs.mkdirSync(TEST_TMP_DIR, { recursive: true });
}

// Make TEST_TMP_DIR available globally
global.__TEST_TMP_DIR = TEST_TMP_DIR;

// Clean up temp directory after all tests
afterAll(() => {
  // Only remove the temp directory if it's properly formatted to avoid accidents
  if (TEST_TMP_DIR.includes('swissknife-test-') && TEST_TMP_DIR.startsWith(os.tmpdir())) {
    try {
      // Uncomment to clean up temp directory when tests are stable
      // fs.rmSync(TEST_TMP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to remove test temp directory: ${error.message}`);
    }
  }
});