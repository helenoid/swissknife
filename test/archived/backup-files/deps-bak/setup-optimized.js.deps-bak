// setup-optimized.js
jest.setTimeout(60000);  // Default longer timeout for all tests

// Handle missing globals that Jest expects in Node.js environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Helper functions available to all tests
global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitUntil = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  while (!condition() && Date.now() - startTime < timeout) {
    await global.wait(interval);
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

// Silence unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection in test:', reason);
});

// Additional Jest matchers for async testing
expect.extend({
  async toEventuallyEqual(received, expected, timeout = 5000) {
    const startTime = Date.now();
    let lastValue = received;
    let isEqual = false;
    
    try {
      while (!isEqual && Date.now() - startTime < timeout) {
        if (typeof received === 'function') {
          lastValue = await received();
        }
        isEqual = this.equals(lastValue, expected);
        if (!isEqual) {
          await global.wait(100);
        }
      }
      
      if (isEqual) {
        return {
          message: () => `expected ${this.utils.printReceived(lastValue)} not to eventually equal ${this.utils.printExpected(expected)}`,
          pass: true
        };
      } else {
        return {
          message: () => `expected ${this.utils.printReceived(lastValue)} to eventually equal ${this.utils.printExpected(expected)} within ${timeout}ms`,
          pass: false
        };
      }
    } catch (e) {
      return {
        message: () => `Error while checking value: ${e.message}`,
        pass: false
      };
    }
  }
});
