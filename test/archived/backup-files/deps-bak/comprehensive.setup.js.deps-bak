/**
 * Comprehensive Jest setup for SwissKnife tests
 * This provides proper setup for both ESM and CommonJS modules,
 * integrates Chai assertions with Jest, and sets up common mocks.
 */

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Configure global testing timeouts
jest.setTimeout(30000);

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  mkdir: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true }),
  rm: jest.fn().mockResolvedValue(undefined)
}));

// Import chai adapter
const chaiAdapter = require('./test/mocks/stubs/chai-enhanced.js');

// Make Chai's expect globally available
global.expect = chaiAdapter.expect;

// Mock console methods to prevent cluttering test output
// but still track calls for assertions
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

// Restore console methods after each test
afterEach(() => {
  jest.restoreAllMocks();
});
