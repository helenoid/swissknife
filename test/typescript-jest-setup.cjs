/**
 * TypeScript-Specific Jest Setup
 * Provides enhanced setup for TypeScript tests with proper Sinon integration
 */

// Base setup from unified Jest setup
require('./jest-unified-setup.cjs');

// Add Sinon support
let sinon;
try {
  sinon = require('sinon');
  global.sinon = sinon;
  
  // Make Jest's expect work with Sinon spies
  if (expect && expect.extend) {
    expect.extend({
      toHaveBeenCalledWith: function(received, ...args) {
        const pass = received && received.calledWith && received.calledWith(...args);
        return {
          pass,
          message: () => 
            pass 
              ? `Expected spy not to have been called with ${JSON.stringify(args)}`
              : `Expected spy to have been called with ${JSON.stringify(args)}`
        };
      },
      toHaveBeenCalled: function(received) {
        const pass = received && received.called;
        return {
          pass,
          message: () => 
            pass 
              ? `Expected spy not to have been called`
              : `Expected spy to have been called`
        };
      },
      toHaveBeenCalledTimes: function(received, times) {
        const pass = received && received.callCount === times;
        return {
          pass,
          message: () => 
            pass 
              ? `Expected spy not to have been called ${times} times`
              : `Expected spy to have been called ${times} times, but was called ${received.callCount} times`
        };
      }
    });
  }
  
  // Helper to restore all spies after each test
  afterEach(() => {
    if (sinon && sinon.restore) {
      sinon.restore();
    }
  });
  
} catch (e) {
  console.warn('Sinon not available, skipping setup', e);
}

// Make sure TypeScript path mapping works
try {
  // Map @ paths to src/
  const moduleNameMapper = {
    '^@/(.*)$': '<rootDir>/src/$1',
  };
  
  if (typeof jest !== 'undefined') {
    jest.mock('@/config/manager', () => require('../test/mocks/config-manager.mock'), { virtual: true });
  }
} catch (e) {
  console.warn('Error setting up TypeScript path mapping:', e);
}

console.log('TypeScript test setup completed');
