/**
 * TypeScript-specific Jest setup file
 * 
 * This file configures Jest to work properly with TypeScript and ESM modules
 * and ensures test compatibility between different module systems
 */

// First load our main TypeScript setup
require('./typescript-setup');

// Create a custom environment for TypeScript tests
console.log('Setting up TypeScript testing environment');

// Add support for ESM modules
const originalJestCreateTransformer = jest.createTransformer;
if (originalJestCreateTransformer) {
  jest.createTransformer = (config) => {
    // Ensure config properly handles ESM
    config = config || {};
    config.useESM = true;
    return originalJestCreateTransformer(config);
  };
}

// Handle chai expect style assertions for TypeScript tests
if (global.chai && global.chai.expect) {
  const chaiExpect = global.chai.expect;
  const originalExpect = global.expect;

  // Override expect to handle both chai and jest assertions
  global.expect = (actual) => {
    // First try Jest's expect
    const jestExpect = originalExpect(actual);
    
    // Add chai's to property support
    jestExpect.to = {
      equal: (expected) => jestExpect.toBe(expected),
      deep: {
        equal: (expected) => jestExpect.toEqual(expected),
        include: (expected) => jestExpect.toEqual(expect.objectContaining(expected))
      },
      be: {
        true: () => jestExpect.toBe(true),
        false: () => jestExpect.toBe(false),
        above: (expected) => jestExpect.toBeGreaterThan(expected),
        below: (expected) => jestExpect.toBeLessThan(expected),
        null: () => jestExpect.toBeNull(),
        undefined: () => jestExpect.toBeUndefined(),
      },
      include: (expected) => {
        if (typeof actual === 'string') {
          jestExpect.toContain(expected);
        } else {
          jestExpect.toEqual(expect.objectContaining(expected));
        }
      },
      match: (expected) => jestExpect.toMatch(expected),
      throw: () => jestExpect.toThrow(),
      not: {
        equal: (expected) => jestExpect.not.toBe(expected),
        include: (expected) => {
          if (typeof actual === 'string') {
            jestExpect.not.toContain(expected);
          } else {
            jestExpect.not.toEqual(expect.objectContaining(expected));
          }
        }
      }
    };
    
    return jestExpect;
  };

  // Copy all properties from original expect
  Object.keys(originalExpect).forEach(key => {
    global.expect[key] = originalExpect[key];
  });
}

// Setup for TypeScript tests using Jest's Node environment
console.log('TypeScript Jest setup complete');
