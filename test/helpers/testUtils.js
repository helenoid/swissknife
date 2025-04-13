/**
 * Test utilities and helpers
 * 
 * Common utilities for writing and running tests
 */

/**
 * Creates a deferred promise that can be resolved or rejected externally
 * 
 * @returns {Object} Object with promise, resolve and reject properties
 */
export function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Waits for a specific condition to be true
 * 
 * @param {Function} conditionFn Function that returns boolean
 * @param {Object} options Options for waiting
 * @param {number} options.timeout Maximum time to wait in ms
 * @param {number} options.interval Check interval in ms
 * @returns {Promise<boolean>} Resolves to true when condition is met
 */
export async function waitForCondition(conditionFn, options = {}) {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within timeout of ${timeout}ms`);
}

/**
 * Captures console output during function execution
 * 
 * @param {Function} fn Function to execute while capturing console output
 * @returns {Promise<Object>} Object with logs and return value from function
 */
export async function captureConsoleOutput(fn) {
  const logs = {
    log: [],
    info: [],
    warn: [],
    error: [],
    debug: []
  };
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  
  // Replace with mocks that capture output
  console.log = jest.fn((...args) => logs.log.push(args.join(' ')));
  console.info = jest.fn((...args) => logs.info.push(args.join(' ')));
  console.warn = jest.fn((...args) => logs.warn.push(args.join(' ')));
  console.error = jest.fn((...args) => logs.error.push(args.join(' ')));
  console.debug = jest.fn((...args) => logs.debug.push(args.join(' ')));
  
  try {
    // Execute function
    const result = await fn();
    return { logs, result };
  } finally {
    // Restore original console
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }
}

/**
 * Simple wait utility that resolves after specified time
 * 
 * @param {number} ms Time to wait in milliseconds
 * @returns {Promise<void>} Promise that resolves after the specified time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}