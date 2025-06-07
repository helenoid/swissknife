/**
 * Simplified Jest setup for ESM compatibility
 * 
 * This file avoids using require() and instead uses proper ESM imports
 * where needed, falling back to globals when required.
 */

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Configure global testing timeouts
jest.setTimeout(30000); // Increase default timeout to 30 seconds

// Setup global mocks that don't rely on require()
// Instead of mocking modules with jest.mock, we just define the behavior 
// we want for these specific methods

// Global method mocking for fs/promises
global.__mocks = {
  fs: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('mock file content'),
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
  }
};

// Conditionally silence console output
if (process.env.SILENT_TESTS) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
}
