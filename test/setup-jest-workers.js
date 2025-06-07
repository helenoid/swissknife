// setup-jest-workers.js
// Setup file specifically for worker tests

// Global Jest timeouts
jest.setTimeout(60000);

// Mock worker_threads module globally
jest.mock('worker_threads', () => {
  // Create a mock Worker implementation
  const MockWorker = class extends require('events').EventEmitter {
    constructor(scriptURL) {
      super();
      this.scriptURL = scriptURL;
      this.postMessage = jest.fn();
      this.terminate = jest.fn().mockImplementation(() => {
        this.emit('exit', 0);
        return Promise.resolve();
      });
      
      // Make this available in a timeout so tests can access it
      setTimeout(() => {
        global.__MOCK_WORKERS = global.__MOCK_WORKERS || {};
        global.__MOCK_WORKERS[scriptURL] = this;
      }, 0);
    }
  };
  
  return {
    Worker: MockWorker,
    isMainThread: true,
    parentPort: {
      on: jest.fn(),
      once: jest.fn(),
      postMessage: jest.fn()
    },
    workerData: {}
  };
});

// Additional test utilities for workers
global.triggerWorkerMessage = (worker, message) => {
  if (worker && typeof worker.emit === 'function') {
    worker.emit('message', message);
  }
};

global.triggerWorkerError = (worker, error) => {
  if (worker && typeof worker.emit === 'function') {
    worker.emit('error', error);
  }
};

// Chai for assertions
global.expect = require('chai').expect;

// Sinon for mocks and stubs
global.sinon = require('sinon');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection during worker test:', promise, 'reason:', reason);
});

// Provide test helpers
Object.defineProperty(global, 'getMockWorker', {
  value: () => {
    // Return a mock worker constructor
    return require('../test/mocks/workers/worker').MockWorker;
  },
  configurable: true
});

// Handle console output during tests
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (process.env.DEBUG_TESTS) {
    originalConsoleLog.apply(console, ['[WORKER-TEST]', ...args]);
  }
};
