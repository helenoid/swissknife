/**
 * Enhanced setup file for Jest tests
 * This file provides global setup needed for all tests
 * Fixes the issue with Chai and handles both ESM and CommonJS modules
 */

// Increase the timeout for async tests
jest.setTimeout(30000);

// Explicitly load chai and make it global
try {
  const chai = require('chai');
  global.chai = chai;
  global.expect = chai.expect;  // Override Jest's expect with chai expect if needed
  global.assert = chai.assert;
  global.should = chai.should();
} catch (e) {
  console.warn('Failed to load chai, continuing with Jest expect:', e);
}

// Mock missing globals that might be needed
global.jest = global.jest || {};

// Add missing jest function if not available
if (!global.jest.fn) {
  global.jest.fn = (implementation) => {
    const mockFn = function(...args) {
      mockFn.mock.calls.push(args);
      mockFn.mock.instances.push(this);
      
      if (typeof implementation === 'function') {
        return implementation.apply(this, args);
      }
      
      return undefined;
    };
    
    mockFn.mock = { calls: [], instances: [], results: [] };
    mockFn.mockClear = () => {
      mockFn.mock.calls = [];
      mockFn.mock.instances = [];
      mockFn.mock.results = [];
    };
    mockFn.mockReset = mockFn.mockClear;
    mockFn.mockImplementation = (newImplementation) => {
      implementation = newImplementation;
      return mockFn;
    };
    mockFn.mockResolvedValue = (value) => {
      return mockFn.mockImplementation(() => Promise.resolve(value));
    };
    mockFn.mockRejectedValue = (error) => {
      return mockFn.mockImplementation(() => Promise.reject(error));
    };
    
    return mockFn;
  };
}

// Add necessary global jest functions for spying
if (!global.jest.spyOn) {
  global.jest.spyOn = (object, methodName) => {
    const originalMethod = object[methodName];
    
    if (typeof originalMethod !== 'function') {
      throw new Error(`Cannot spy on non-function '${methodName}'`);
    }
    
    const jestMock = global.jest.fn((...args) => originalMethod.apply(object, args));
    
    Object.defineProperty(object, methodName, {
      configurable: true,
      writable: true,
      value: jestMock
    });
    
    jestMock.mockRestore = () => {
      Object.defineProperty(object, methodName, {
        configurable: true,
        writable: true,
        value: originalMethod
      });
    };
    
    return jestMock;
  };
}

// Ensure global.expect exists (might be provided by Jest or Chai)
if (!global.expect) {
  global.expect = require('expect');
}

// Additional helper for working with both ESM and CommonJS
global.dynamicImport = async (module) => {
  try {
    return await import(module);
  } catch (e) {
    return require(module);
  }
};

// Print setup completion for debugging
console.log('Jest setup complete');
