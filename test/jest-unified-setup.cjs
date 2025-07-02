/**
 * Unified Jest setup file for SwissKnife
 * This provides basic setup without complex Chai integration
 */

// Set test timeout
jest.setTimeout(30000);

// Basic environment setup
process.env.NODE_ENV = 'test';

// Simple console mocking to reduce test output noise
const originalConsole = console;
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  console.log = originalConsole.log;
  console.debug = originalConsole.debug; 
  console.info = originalConsole.info;
  jest.clearAllMocks();
});

// Basic polyfills if needed
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

console.log('Jest unified setup completed');
