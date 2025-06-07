/**
 * Universal test utilities that work in both ESM and CommonJS
 */

// Mock environment variables
function mockEnv(envVars = {}) {
  const originalEnv = {...process.env};
  
  // Save original env values
  const originals = {};
  Object.keys(envVars).forEach(key => {
    originals[key] = process.env[key];
    process.env[key] = envVars[key];
  });
  
  // Return restore function
  return function restoreEnv() {
    Object.keys(envVars).forEach(key => {
      if (originals[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originals[key];
      }
    });
  };
}

// Create mock readable stream
function createMockReadableStream(chunks = []) {
  const EventEmitter = require('events');
  const stream = new EventEmitter();
  
  stream.read = jest.fn(() => chunks.shift() || null);
  stream.pipe = jest.fn().mockReturnValue(stream);
  stream.setEncoding = jest.fn().mockReturnValue(stream);
  stream.destroy = jest.fn();
  
  return stream;
}

// Wait for a specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait until condition is true or timeout
async function waitUntil(condition, options = {}) {
  const { timeout = 5000, interval = 100 } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await wait(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

// Mock required modules
function mockModules(moduleMocks = {}) {
  const originalModules = {};
  
  Object.keys(moduleMocks).forEach(modulePath => {
    try {
      jest.doMock(modulePath, () => moduleMocks[modulePath]);
      originalModules[modulePath] = require(modulePath);
    } catch (err) {
      console.warn(`Could not mock module: ${modulePath}`, err);
    }
  });
  
  return function restoreModules() {
    Object.keys(moduleMocks).forEach(modulePath => {
      jest.resetModules();
      jest.dontMock(modulePath);
    });
  };
}

// Create unified testing utilities
const testUtils = {
  mockEnv,
  createMockReadableStream,
  wait,
  waitUntil,
  mockModules
};

// Support both CommonJS and ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testUtils;
}

export default testUtils;
export const { 
  mockEnv, 
  createMockReadableStream, 
  wait, 
  waitUntil, 
  mockModules 
} = testUtils;
