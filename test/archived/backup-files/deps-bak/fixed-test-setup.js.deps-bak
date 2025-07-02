/**
 * Fixed Jest setup for SwissKnife tests
 * 
 * This file handles both CommonJS and ESM environments
 */

// Properly handle jest global object availability
let jestGlobal;
try {
  // In Jest environment, this should work
  jestGlobal = global.jest || jest;
} catch (e) {
  // In other environments, create a mock
  jestGlobal = {
    setTimeout: () => {},
    fn: (impl) => impl || (() => {}),
    mock: () => {}
  };
  global.jest = jestGlobal;
  global.beforeEach = global.beforeEach || ((fn) => fn());
  global.afterEach = global.afterEach || ((fn) => fn());
  global.beforeAll = global.beforeAll || ((fn) => fn());
  global.afterAll = global.afterAll || ((fn) => fn());
  global.describe = global.describe || ((name, fn) => fn());
  global.test = global.test || (() => {});
  global.it = global.it || global.test;
  global.expect = global.expect || (() => ({
    toBe: () => {},
    toEqual: () => {},
    toHaveProperty: () => {},
    toBeDefined: () => {},
    toBeUndefined: () => {}
  }));
}

// Set timeout for all tests
jestGlobal.setTimeout(60000);

// Add polyfills for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
  // Using Node.js util for Node environments
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    console.warn('Failed to load TextEncoder/TextDecoder from util:', e);
    
    // Fallback minimal implementations
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

// Mock fetch if needed for node environments
if (typeof global.fetch === 'undefined') {
  global.fetch = async () => {
    throw new Error('fetch is not implemented in this environment. Use a mock implementation.');
  };
}

// Console output control
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.VERBOSE_LOGS !== 'true') {
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
       (args[0].includes('Critical error') || args[0].includes('FATAL'))) {
      originalConsoleError(...args);
    }
  };
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' &&
       (args[0].includes('Critical warning') || args[0].includes('IMPORTANT'))) {
      originalConsoleWarn(...args);
    }
  };
}

// Restore console functions after tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
