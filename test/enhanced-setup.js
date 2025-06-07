/**
 * Enhanced Jest setup file
 * 
 * This file configures the test environment and provides
 * helpers for making tests more robust.
 */

// Increase timeout for async tests
jest.setTimeout(30000);

// Define global variables that might be missing
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock fetch if needed
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
  });
}

// Add crypto if not available
if (!global.crypto) {
  const crypto = require('crypto');
  
  // Use node's crypto module to polyfill Web Crypto API
  global.crypto = {
    getRandomValues: (buffer) => {
      const randomBytes = crypto.randomBytes(buffer.length);
      buffer.set(randomBytes);
      return buffer;
    },
    subtle: {
      // Add Web Crypto API methods as needed
    }
  };
}

// Custom error catcher to help diagnose test failures
global.__TEST_ERRORS__ = [];

const originalConsoleError = console.error;
console.error = function(...args) {
  global.__TEST_ERRORS__.push({
    type: 'console.error',
    timestamp: new Date(),
    args
  });
  originalConsoleError.apply(this, args);
};

// Enhanced expect matchers
if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
  expect.extend({
  /**
   * Custom matcher to check if value is a Buffer
   * @param {any} received The value to check
   * @returns {Object} Matcher result
   */
  toBeBuffer(received) {
    const pass = Buffer.isBuffer(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a Buffer`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a Buffer`,
        pass: false,
      };
    }
  },
  
  /**
   * Checks if an async function rejects with a specific error pattern
   * @param {Function} received Function that should reject
   * @param {RegExp|string} expected Expected error message pattern
   * @returns {Object} Matcher result
   */
  async toRejectWithError(received, expected) {
    let error;
    let pass = false;
    
    try {
      await received();
      pass = false;
    } catch (e) {
      error = e;
      if (expected instanceof RegExp) {
        pass = expected.test(e.message);
      } else if (typeof expected === 'string') {
        pass = e.message.includes(expected);
      } else {
        pass = false;
      }
    }
    
    if (pass) {
      return {
        message: () => `expected function not to reject with error matching ${expected}`,
        pass: true,
      };
    } else {
      const errorMessage = error ? `with error: ${error.message}` : 'without any error';
      return {
        message: () => `expected function to reject with error matching ${expected}, but it ${error ? 'rejected ' + errorMessage : 'resolved'}`,
        pass: false,
      };
    }
  },
  });
}

// Add diagnostics for each test
const originalIt = global.it;
global.it = function(name, fn, timeout) {
  if (typeof fn === 'function') {
    const wrappedFn = async function() {
      try {
        return await fn.apply(this, arguments);
      } catch (error) {
        console.error(`Error in test "${name}":`, error);
        throw error;
      }
    };
    return originalIt.call(this, name, wrappedFn, timeout);
  }
  return originalIt.apply(this, arguments);
};

// Diagnostic helper functions
global.diagnostics = {
  logObject: (obj, label = 'Object') => {
    console.log(`=== ${label} ===`);
    try {
      console.log(JSON.stringify(obj, null, 2));
    } catch (e) {
      console.log('Failed to stringify object:', e.message);
      console.log(obj);
    }
    console.log(`=== End ${label} ===`);
  },
  
  getTestErrors: () => global.__TEST_ERRORS__,
  
  clearTestErrors: () => {
    global.__TEST_ERRORS__ = [];
  }
};
