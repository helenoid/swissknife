/**
 * TypeScript-Specific Jest Setup (ESM Version)
 * Provides enhanced setup for TypeScript tests with proper Sinon integration
 * and Chai-to-Jest assertion translation
 */

// Set test timeout
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

// Basic environment setup
process.env.NODE_ENV = 'test';

// Import the chai stub for Chai compatibility (using dynamic import for ESM)
import('./mocks/stubs/chai-jest-stub.mjs').then(chaiStubModule => {
  global.chai = chaiStubModule.default;
  console.log('✓ Chai stub set up globally successfully');
}).catch(err => {
  console.error('Failed to load chai stub:', err);
});

// Add Sinon support using dynamic import
import('sinon').then(sinonModule => {
  const sinon = sinonModule.default;
  global.sinon = sinon;
  console.log('✓ Sinon set up globally successfully');
  
  // Add Chai-like assertions for Sinon spies with Jest compatibility
  const originalExpect = global.expect;
  
  // Enhance expect to handle both Jest and Chai-style assertions seamlessly
  global.expect = (actual) => {
    const jestExpect = originalExpect(actual);
    
    // Add Sinon-specific assertions
    if (actual && typeof actual === 'object' && typeof actual.calledWith === 'function') {
      return {
        ...jestExpect,
        // Add Sinon.js specific assertion helpers
        to: {
          be: {
            calledWith: (...args) => expect(actual.calledWith(...args)).toBe(true),
            calledOnce: () => expect(actual.calledOnce).toBe(true),
            calledTwice: () => expect(actual.calledTwice).toBe(true),
            called: () => expect(actual.called).toBe(true),
            notCalled: () => expect(actual.notCalled).toBe(true)
          },
          have: {
            been: {
              calledWith: (...args) => expect(actual.calledWith(...args)).toBe(true),
              calledOnce: () => expect(actual.calledOnce).toBe(true),
              calledTwice: () => expect(actual.calledTwice).toBe(true),
              called: () => expect(actual.called).toBe(true),
              notCalled: () => expect(actual.notCalled).toBe(true)
            }
          }
        }
      };
    }
    
    return jestExpect;
  };
}).catch(err => {
  console.error('Failed to load Sinon:', err);
});

// Additional TypeScript-specific setup
console.log('TypeScript test setup complete');

// Mock common browser globals
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Add fetch mock
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Map(),
    status: 200,
    statusText: 'OK',
  })
);

// Export a setup completion notification
export const setupComplete = true;
