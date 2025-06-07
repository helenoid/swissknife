/**
 * Unified Jest setup with complete mocking and utilities
 * 
 * This is a comprehensive setup file that addresses all the common issues:
 * - Provides expect.extend with all needed matchers
 * - Adds missing Jest globals like it.skip
 * - Fixes module resolution issues
 * - Adds test utilities for mocking, waiting, etc.
 */

// Ensure we have jest and expect globals properly defined
if (typeof global.jest === 'undefined') {
  global.jest = require('jest-mock');
}

// Add expected Jest test globals
global.describe = global.describe || ((name, fn) => fn());
global.it = global.it || ((name, fn) => fn());
global.test = global.test || global.it;
global.beforeAll = global.beforeAll || ((fn) => fn());
global.afterAll = global.afterAll || ((fn) => fn());
global.beforeEach = global.beforeEach || ((fn) => fn());
global.afterEach = global.afterEach || ((fn) => fn());

// Add missing Jest methods
if (global.it && !global.it.skip) {
  global.it.skip = (name) => {
    console.log(`Skipping test: ${name}`);
  };
}

if (global.test && !global.test.skip) {
  global.test.skip = global.it.skip;
}

// Create proper expect if needed
if (typeof global.expect === 'undefined') {
  const expectLib = require('expect');
  global.expect = expectLib;
  
  // Make sure arrayContaining and other matchers exist
  if (!global.expect.arrayContaining) {
    global.expect.arrayContaining = (array) => ({
      asymmetricMatch: (actual) => {
        return Array.isArray(actual) && 
          array.every(item => actual.some(actualItem => 
            JSON.stringify(actualItem) === JSON.stringify(item)));
      },
      toString: () => `ArrayContaining(${array})`
    });
  }

  if (!global.expect.any) {
    global.expect.any = (constructor) => ({
      asymmetricMatch: (actual) => {
        return actual != null && (actual.constructor === constructor || actual instanceof constructor);
      },
      toString: () => `Any(${constructor.name || 'unknown'})`
    });
  }
}

// Add common test utilities
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitUntil = async function(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await waitFor(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Mock environment and console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  info: console.info
};

// Silence console in tests unless DEBUG is set
if (process.env.DEBUG !== 'true') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
  console.info = jest.fn();
}

// Add needed polyfills
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Extend expect with custom matchers
if (typeof expect.extend === 'function') {
  expect.extend({
    // Check if a value is within a range
    toBeWithinRange(received, floor, ceiling) {
      const pass = received >= floor && received <= ceiling;
      if (pass) {
        return {
          message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },
    
    // Check if a function was called before another
    toHaveBeenCalledBefore(received, other) {
      const receivedMock = received.mock;
      const otherMock = other.mock;
      
      if (!receivedMock || !otherMock) {
        return {
          message: () => 'Both arguments must be mocked functions',
          pass: false
        };
      }
      
      if (receivedMock.calls.length === 0) {
        return {
          message: () => 'Expected mock function to have been called',
          pass: false
        };
      }
      
      if (otherMock.calls.length === 0) {
        return {
          message: () => 'Other mock function was not called',
          pass: false
        };
      }
      
      const pass = Math.min(...receivedMock.invocationCallOrder) < Math.min(...otherMock.invocationCallOrder);
      
      return {
        message: () => pass
          ? `expected ${received.getMockName()} not to have been called before ${other.getMockName()}`
          : `expected ${received.getMockName()} to have been called before ${other.getMockName()}`,
        pass
      };
    },
    
    // Check if a value is a buffer
    toBeBuffer(received) {
      const pass = Buffer.isBuffer(received);
      return {
        message: () => pass
          ? `expected ${received} not to be a Buffer`
          : `expected ${received} to be a Buffer`,
        pass
      };
    },
    
    // Test for object properties
    toHaveProperties(received, properties) {
      const missing = properties.filter(prop => !(prop in received));
      const pass = missing.length === 0;
      
      return {
        message: () => pass
          ? `expected ${JSON.stringify(received)} not to have properties ${JSON.stringify(properties)}`
          : `expected ${JSON.stringify(received)} to have properties ${JSON.stringify(properties)}, missing: ${JSON.stringify(missing)}`,
        pass
      };
    },
    
    // Test for async rejection
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
    }
  });
}

// Add diagnostic helpers
global.diagnostics = {
  logObject: (obj, label = 'Object') => {
    originalConsole.log(`=== ${label} ===`);
    try {
      originalConsole.log(JSON.stringify(obj, null, 2));
    } catch (e) {
      originalConsole.log('Failed to stringify object:', e.message);
      originalConsole.log(obj);
    }
    originalConsole.log(`=== End ${label} ===`);
  }
};

// Clean up after all tests
afterAll(() => {
  // Restore console
  Object.keys(originalConsole).forEach(key => {
    console[key] = originalConsole[key];
  });
});

// Log that the setup was loaded
if (process.env.DEBUG === 'true') {
  originalConsole.log('Unified Jest setup loaded successfully');
}

module.exports = {
  waitFor,
  waitUntil,
  originalConsole
};
