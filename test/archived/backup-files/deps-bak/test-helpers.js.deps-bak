/**
 * Common test helpers and utilities
 */

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {Object} options - Options
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.interval - Check interval in milliseconds
 * @returns {Promise<boolean>} - True if condition was met, false if timed out
 */
async function waitForCondition(condition, { timeout = 5000, interval = 100 } = {}) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await Promise.resolve(condition())) {
      return true;
    }
    await wait(interval);
  }
  
  return false;
}

/**
 * Generate a unique ID for test entities
 * @param {string} prefix - ID prefix
 * @returns {string} - Unique ID
 */
function generateTestId(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a mock function that resolves with the given value after a delay
 * @param {any} resolveValue - Value to resolve with
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Mock function
 */
function createDelayedMock(resolveValue, delay = 10) {
  return jest.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(resolveValue), delay))
  );
}

/**
 * Create a mock function that rejects with the given error after a delay
 * @param {Error|string} error - Error to reject with
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Mock function
 */
function createErrorMock(error, delay = 10) {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  return jest.fn().mockImplementation(() => 
    new Promise((_, reject) => setTimeout(() => reject(errorObj), delay))
  );
}

/**
 * Capture console output for testing
 * @returns {Object} - Object with start and stop methods
 */
function captureConsoleOutput() {
  const output = {
    log: [],
    error: [],
    warn: [],
    info: []
  };
  
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  function start() {
    // Clear previous output
    output.log = [];
    output.error = [];
    output.warn = [];
    output.info = [];
    
    // Override console methods
    console.log = (...args) => {
      output.log.push(args.map(String).join(' '));
    };
    
    console.error = (...args) => {
      output.error.push(args.map(String).join(' '));
    };
    
    console.warn = (...args) => {
      output.warn.push(args.map(String).join(' '));
    };
    
    console.info = (...args) => {
      output.info.push(args.map(String).join(' '));
    };
    
    return output;
  }
  
  function stop() {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    return output;
  }
  
  return { start, stop, output };
}

/**
 * Create a temporary test file
 * @param {string} content - File content
 * @param {string} extension - File extension
 * @returns {Promise<string>} - Path to the created file
 */
async function createTempFile(content, extension = '.json') {
  const fs = require('fs').promises;
  const os = require('os');
  const path = require('path');
  
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `swissknife-test-${Date.now()}${extension}`);
  
  await fs.writeFile(filePath, content);
  
  return filePath;
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  const fs = require('fs').promises;
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a mocked event emitter
 * @returns {Object} - Mocked event emitter
 */
function createMockEventEmitter() {
  const listeners = {};
  
  return {
    on: jest.fn((event, listener) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
    }),
    
    off: jest.fn((event, listener) => {
      if (!listeners[event]) return;
      
      const index = listeners[event].indexOf(listener);
      if (index !== -1) {
        listeners[event].splice(index, 1);
      }
    }),
    
    emit: jest.fn((event, ...args) => {
      if (!listeners[event]) return false;
      
      for (const listener of listeners[event]) {
        listener(...args);
      }
      
      return true;
    }),
    
    // Helper method to get all listeners for testing
    getListeners: (event) => {
      return listeners[event] || [];
    },
    
    // Helper method to clear all listeners for testing
    clearListeners: () => {
      for (const event in listeners) {
        listeners[event] = [];
      }
    }
  };
}

module.exports = {
  wait,
  waitForCondition,
  generateTestId,
  createDelayedMock,
  createErrorMock,
  captureConsoleOutput,
  createTempFile,
  deleteFile,
  deepClone,
  createMockEventEmitter
};