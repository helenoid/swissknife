// Global Jest setup for the master test configuration

// Increase Jest timeout globally
jest.setTimeout(60000);

// Polyfill for TextEncoder/TextDecoder in environments where it's missing
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Custom matcher for checking objects with specific properties
expect.extend({
  toHaveProperties(received, properties) {
    const missing = properties.filter(prop => !(prop in received));
    
    if (missing.length === 0) {
      return {
        message: () => `expected ${this.utils.printReceived(received)} not to have properties ${this.utils.printExpected(properties)}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${this.utils.printReceived(received)} to have properties ${this.utils.printExpected(properties)}, missing: ${this.utils.printExpected(missing)}`,
        pass: false
      };
    }
  }
});

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (process.env.DEBUG === 'true') {
    originalConsoleError(...args);
  }
};

// Clean up after all tests
afterAll(() => {
  console.error = originalConsoleError;
});
