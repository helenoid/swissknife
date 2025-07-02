/**
 * Simple Jest setup file
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createMock: (returnValue) => jest.fn(() => returnValue),
  createAsyncMock: (returnValue) => jest.fn(async () => returnValue),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('Simple Jest setup loaded successfully');
