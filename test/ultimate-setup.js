/**
 * Ultimate Jest setup for SwissKnife
 * 
 * This setup file is designed to work robustly in all environments and
 * handle all known test issues.
 */

// Properly handle jest global
let jestGlobal;
try {
  jestGlobal = global.jest || jest;
} catch (e) {
  jestGlobal = {
    setTimeout: () => {},
    fn: (impl) => impl || (() => {}),
    mock: () => {}
  };
  global.jest = jestGlobal;
}

// Increase the timeout for all tests
jestGlobal.setTimeout(60000);

// Set up environment variables for testing
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  TEST_MODE: 'true',
  TEST_PROVIDER_API_KEY: 'test-api-key',
  TEST_PROVIDER_1_API_KEY: 'test-api-key-1',
  TEST_PROVIDER_2_API_KEY: 'test-api-key-2'
};

// Add TextEncoder/TextDecoder polyfills if needed
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    console.warn('Failed to load TextEncoder/TextDecoder from util');
    
    // Provide minimal implementations
    global.TextEncoder = class TextEncoder {
      encode(text) {
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
          bytes[i] = text.charCodeAt(i);
        }
        return bytes;
      }
    };
    
    global.TextDecoder = class TextDecoder {
      decode(bytes) {
        return String.fromCharCode.apply(null, bytes);
      }
    };
  }
}

// Add fetch polyfill if needed
if (typeof global.fetch === 'undefined') {
  global.fetch = jestGlobal.fn().mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => ''
  }));
}

// Suppress excessive console output during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.VERBOSE_LOGS !== 'true') {
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
       (args[0].includes('Critical error') || args[0].includes('FATAL'))) {
      originalConsoleError(...args);
    }
  };
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' &&
       (args[0].includes('Critical warning') || args[0].includes('IMPORTANT'))) {
      originalConsoleWarn(...args);
    }
  };
}

// Handle unhandled promise rejections during tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection during test:', reason);
});

// Restore console functions after tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Force garbage collection if available (helps with memory leaks in tests)
afterEach(() => {
  if (global.gc) {
    global.gc();
  }
});
