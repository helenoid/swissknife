// Setup file for Jest to fix common issues
// Increase timeout for async tests
jest.setTimeout(30000);

// Create a safe mock for environment variables
process.env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'test'
};

// Mock missing globals
global.jest = global.jest || {};

// Add missing jest functions if not available
if (!global.jest.fn) {
  global.jest.fn = (implementation) => {
    const mockFn = (...args) => {
      mockFn.mock.calls.push(args);
      mockFn.mock.instances.push(this);
      
      if (typeof implementation === 'function') {
        return implementation(...args);
      }
      return undefined;
    };
    
    mockFn.mock = {
      calls: [],
      instances: [],
      invocationCallOrder: [],
      results: []
    };
    
    mockFn.mockReturnThis = () => {
      return mockFn.mockImplementation(() => mockFn);
    };
    
    mockFn.mockReturnValue = (value) => {
      return mockFn.mockImplementation(() => value);
    };
    
    mockFn.mockImplementation = (newImplementation) => {
      implementation = newImplementation;
      return mockFn;
    };
    
    mockFn.mockReturnValueOnce = (value) => {
      const stackImplementation = (...args) => {
        if (mockFn.mock._results.length > 0) {
          return mockFn.mock._results.shift();
        }
        if (implementation) {
          return implementation(...args);
        }
        return undefined;
      };
      
      mockFn.mock._results = mockFn.mock._results || [];
      mockFn.mock._results.push(value);
      
      return mockFn.mockImplementation(stackImplementation);
    };
    
    mockFn.mockResolvedValue = (value) => {
      return mockFn.mockImplementation(() => Promise.resolve(value));
    };
    
    mockFn.mockResolvedValueOnce = (value) => {
      return mockFn.mockReturnValueOnce(Promise.resolve(value));
    };
    
    mockFn.mockRejectedValue = (error) => {
      return mockFn.mockImplementation(() => Promise.reject(error));
    };
    
    mockFn.mockRejectedValueOnce = (error) => {
      return mockFn.mockReturnValueOnce(Promise.reject(error));
    };
    
    mockFn.mockReset = () => {
      mockFn.mock.calls = [];
      mockFn.mock.instances = [];
      mockFn.mock._results = [];
      implementation = undefined;
      return mockFn;
    };
    
    mockFn.mockClear = () => {
      mockFn.mock.calls = [];
      mockFn.mock.instances = [];
      return mockFn;
    };
    
    return mockFn;
  };
}

// Provide mock implementations for common jest utility functions
if (!global.jest.spyOn) {
  global.jest.spyOn = (object, method) => {
    const original = object[method];
    const mock = global.jest.fn((...args) => original.apply(object, args));
    object[method] = mock;
    
    mock.mockRestore = () => {
      object[method] = original;
    };
    
    return mock;
  };
}

if (!global.jest.clearAllMocks) {
  global.jest.clearAllMocks = () => {
    // Placeholder for clearing all mocks
  };
}

// Handle ESM / CommonJS interoperability issues
if (typeof jest !== 'undefined' && typeof jest.requireActual !== 'function') {
  jest.requireActual = (moduleName) => {
    return require(moduleName);
  };
}

// Add a fix for the execution-service.test.ts and other TypeScript files with syntax errors
global.__TEST_MODE__ = true;
