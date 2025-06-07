/**
 * Test utilities for SwissKnife (CJS compatible version)
 */

// Export both CommonJS and ES module compatible utilities
const testUtils = {
  /**
   * Mock environment variables and restore them after tests
   * @param {Object} envVars - Key-value pairs of environment variables to set
   * @returns {Function} Function to restore original environment variables
   */
  mockEnv: function(envVars) {
    const originalEnv = { ...process.env };
    
    // Set mock environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
    
    // Return function to restore original environment
    return () => {
      Object.keys(envVars).forEach(key => {
        if (originalEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = originalEnv[key];
        }
      });
    };
  },

  /**
   * Creates a mock readable stream that emits the given data
   * @param {Array<string|Object>} data - Data to emit
   * @returns {EventEmitter} A mock readable stream
   */
  createMockReadableStream: function(data = []) {
    const { EventEmitter } = require('events');
    const stream = new EventEmitter();
    
    // Add stream-like methods
    stream.pipe = jest.fn().mockReturnValue(stream);
    stream.on = stream.addListener;
    stream.once = (event, handler) => {
      const wrappedHandler = (...args) => {
        stream.removeListener(event, wrappedHandler);
        handler(...args);
      };
      stream.addListener(event, wrappedHandler);
      return stream;
    };
    stream.removeListener = jest.fn().mockReturnValue(stream);
    stream.removeAllListeners = jest.fn().mockReturnValue(stream);
    
    // Schedule data emissions
    process.nextTick(() => {
      data.forEach((item, index) => {
        setTimeout(() => {
          stream.emit('data', item);
          if (index === data.length - 1) {
            stream.emit('end');
          }
        }, index * 10);
      });
    });
    
    return stream;
  },

  /**
   * Wait for a specified number of milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>} Promise that resolves after waiting
   */
  wait: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wait until a condition is met or timeout
   * @param {Function} conditionFn - Function that returns a boolean or Promise<boolean>
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @param {number} interval - Check interval in milliseconds
   * @returns {Promise<boolean>} Promise that resolves to true when condition is met
   */
  waitUntil: async function(conditionFn, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await conditionFn()) {
        return true;
      }
      await testUtils.wait(interval);
    }
    return false;
  },

  /**
   * Mock modules for testing
   * @param {object} modules - Map of module paths to mock implementations
   * @returns {Function} Function to restore original modules
   */
  mockModules: function(modules) {
    const originals = {};
    
    Object.entries(modules).forEach(([path, mock]) => {
      originals[path] = jest.requireActual(path);
      jest.mock(path, () => mock, { virtual: true });
    });
    
    // Return function to restore original modules
    return () => {
      Object.keys(modules).forEach(path => {
        jest.resetModules();
        jest.unmock(path);
      });
    };
  }
};

// Support both CommonJS and ES Modules
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
