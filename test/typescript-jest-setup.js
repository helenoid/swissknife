/**
 * TypeScript-Specific Jest Setup
 * Provides enhanced setup for TypeScript tests with proper Sinon integration
 * and Chai-to-Jest assertion translation
 */

// Set test timeout
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

// Basic environment setup
process.env.NODE_ENV = 'test';

// Add the chai stub for Chai compatibility
const chaiStub = require('./mocks/stubs/chai-jest-stub');
global.chai = chaiStub;

// Add Sinon support
let sinon;
try {
  sinon = require('sinon');
  global.sinon = sinon;
  console.log('✓ Sinon set up globally successfully');
  
  // Add Chai-like assertions for Sinon spies with Jest compatibility
  const originalExpect = global.expect;
  
  // Enhance expect to handle both Jest and Chai-style assertions seamlessly
  global.expect = (actual) => {
    const jestExpect = originalExpect(actual);
    
    // Handle Sinon spies with special care
    if (actual && typeof actual === 'function' && actual.calledWith !== undefined) {
      return {
        ...jestExpect,
        to: {
          equal: (expected) => jestExpect.toBe(expected),
          have: {
            been: {
              called: () => {
                expect(actual.called).toBe(true);
                return true;
              },
              calledOnce: () => {
                expect(actual.calledOnce).toBe(true);
                return true;
              },
              calledWith: (...args) => {
                expect(actual.calledWith(...args)).toBe(true);
                return true;
              }
            }
          }
        }
      };
    }
    
    return jestExpect;
  };
  
  // Copy all properties from original expect
  Object.assign(global.expect, originalExpect);
  
} catch (error) {
  console.error('✗ Failed to set up sinon:', error.message);
}

// Simple console setup to reduce noise
if (typeof beforeEach !== 'undefined') {
  beforeEach(() => {
    if (typeof jest !== 'undefined') {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'debug').mockImplementation(() => {});
    }
  });
}

if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    if (typeof jest !== 'undefined') {
      jest.clearAllMocks();
    }
  });
}
