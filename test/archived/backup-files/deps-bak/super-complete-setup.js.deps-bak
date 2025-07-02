/**
 * Super-complete Jest setup file that handles both ESM and CommonJS
 * This file ensures all necessary test helpers and matchers are available
 */

// Determine if we're in a CommonJS or ESM environment
const isCommonJS = typeof module !== 'undefined' && module.exports;

// Add all the expect matchers that might be missing
function enhanceExpect() {
  if (typeof expect !== 'undefined') {
    // Add arrayContaining if missing
    if (!expect.arrayContaining) {
      expect.arrayContaining = (array) => ({
        asymmetricMatch: (actual) => 
          Array.isArray(actual) && 
          array.every(item => actual.some(actualItem => 
            JSON.stringify(actualItem) === JSON.stringify(item))),
        toString: () => `ArrayContaining(${array})`
      });
    }
    
    // Add objectContaining if missing
    if (!expect.objectContaining) {
      expect.objectContaining = (object) => ({
        asymmetricMatch: (actual) => {
          if (typeof actual !== 'object' || actual === null) return false;
          return Object.entries(object).every(([key, value]) => 
            key in actual && JSON.stringify(actual[key]) === JSON.stringify(value));
        },
        toString: () => `ObjectContaining(${JSON.stringify(object)})`
      });
    }
    
    // Add stringMatching if missing
    if (!expect.stringMatching) {
      expect.stringMatching = (pattern) => ({
        asymmetricMatch: (actual) => {
          if (typeof actual !== 'string') return false;
          if (pattern instanceof RegExp) return pattern.test(actual);
          return actual.includes(String(pattern));
        },
        toString: () => `StringMatching(${pattern})`
      });
    }
    
    // Add any if missing
    if (!expect.any) {
      expect.any = (constructor) => ({
        asymmetricMatch: (actual) => 
          actual != null && (actual.constructor === constructor || actual instanceof constructor),
        toString: () => `Any(${constructor.name || 'unknown'})`
      });
    }
    
    // Add extend method if missing
    if (!expect.extend) {
      expect.extend = (matchers) => {
        Object.assign(expect, Object.entries(matchers).reduce((acc, [name, matcher]) => {
          acc[name] = (...args) => {
            return {
              toBe: (actual) => {
                const result = matcher(actual, ...args);
                if (!result.pass) throw new Error(result.message());
                return true;
              }
            };
          };
          return acc;
        }, {}));
      };
    }
  }
}

// Add all Jest globals that might be missing
function addMissingJestGlobals() {
  if (typeof global !== 'undefined') {
    if (!global.it) global.it = global.test || ((name, fn) => fn());
    if (!global.describe) global.describe = (name, fn) => fn();
    if (!global.beforeEach) global.beforeEach = (fn) => fn();
    if (!global.afterEach) global.afterEach = (fn) => fn();
    if (!global.beforeAll) global.beforeAll = (fn) => fn();
    if (!global.afterAll) global.afterAll = (fn) => fn();
    
    // Add skip, todo and only variants
    if (global.it && !global.it.skip) global.it.skip = (name, fn) => console.log(`Skipped test: ${name}`);
    if (global.it && !global.it.todo) global.it.todo = (name) => console.log(`Todo test: ${name}`);
    if (global.it && !global.it.only) global.it.only = global.it;
    if (global.describe && !global.describe.skip) global.describe.skip = (name, fn) => console.log(`Skipped suite: ${name}`);
    if (global.describe && !global.describe.only) global.describe.only = global.describe;
  }
}

// Setup mock functions if jest.fn is missing
function addMockFunctions() {
  if (typeof jest === 'undefined' || !jest.fn) {
    global.jest = global.jest || {};
    global.jest.fn = function mockFn(implementation) {
      const mockFunction = implementation || (() => {});
      mockFunction.mock = { calls: [], instances: [], results: [] };
      mockFunction.mockReturnValue = function(value) {
        mockFunction.mockImplementation(() => value);
        return mockFunction;
      };
      mockFunction.mockImplementation = function(newImplementation) {
        const oldImplementation = implementation;
        implementation = newImplementation;
        return mockFunction;
      };
      mockFunction.mockReset = function() {
        mockFunction.mock.calls = [];
        mockFunction.mock.instances = [];
        mockFunction.mock.results = [];
        implementation = () => {};
      };
      return mockFunction;
    };
    
    // Add other mock utilities
    if (!global.jest.spyOn) {
      global.jest.spyOn = function(object, methodName) {
        const originalMethod = object[methodName];
        const mockFn = jest.fn((...args) => originalMethod.apply(object, args));
        object[methodName] = mockFn;
        mockFn.mockRestore = () => {
          object[methodName] = originalMethod;
        };
        return mockFn;
      };
    }
    
    // Add mock clear utilities
    if (!global.jest.clearAllMocks) {
      global.jest.clearAllMocks = function() {
        const globalObj = typeof window !== 'undefined' ? window : global;
        Object.keys(globalObj).forEach(key => {
          const prop = globalObj[key];
          if (prop && prop.mock && typeof prop.mockClear === 'function') {
            prop.mockClear();
          }
        });
      };
    }
    
    // Add missing mock assertions
    if (typeof expect !== 'undefined') {
      if (!expect.toHaveBeenCalled) {
        expect.extend({
          toHaveBeenCalled(received) {
            const pass = received.mock && received.mock.calls.length > 0;
            return {
              pass,
              message: () => pass
                ? `Expected mock function not to have been called, but it was called ${received.mock.calls.length} times`
                : `Expected mock function to have been called, but it was not called`
            };
          }
        });
      }
      
      if (!expect.toHaveBeenCalledWith) {
        expect.extend({
          toHaveBeenCalledWith(received, ...expected) {
            let pass = false;
            
            if (received.mock && received.mock.calls.length > 0) {
              pass = received.mock.calls.some(call => {
                if (call.length !== expected.length) return false;
                return call.every((arg, i) => JSON.stringify(arg) === JSON.stringify(expected[i]));
              });
            }
            
            return {
              pass,
              message: () => pass
                ? `Expected mock function not to have been called with ${JSON.stringify(expected)}`
                : `Expected mock function to have been called with ${JSON.stringify(expected)}, but it was called with ${
                  received.mock && received.mock.calls.length > 0 
                    ? JSON.stringify(received.mock.calls) 
                    : 'no arguments'
                }`
            };
          }
        });
      }
    }
  }
}

// Run all the enhancements
enhanceExpect();
addMissingJestGlobals();
addMockFunctions();

// Export helper functions for both CommonJS and ESM
const setupHelpers = {
  enhanceExpect,
  addMissingJestGlobals,
  addMockFunctions
};

// Handle exports for CommonJS
if (isCommonJS) {
  module.exports = setupHelpers;
} 
// Handle exports for ESM environments only - don't do both exports in the same file
else if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = setupHelpers;
  exports.enhanceExpect = enhanceExpect;
  exports.addMissingJestGlobals = addMissingJestGlobals;
  exports.addMockFunctions = addMockFunctions;
}
