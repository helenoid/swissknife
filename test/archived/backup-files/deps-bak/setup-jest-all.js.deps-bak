// Basic Jest setup
jest.setTimeout(30000);

// Install global expect and jest objects correctly
if (!global.expect) {
  try {
    const jestGlobals = require('@jest/globals');
    global.expect = jestGlobals.expect;
    global.jest = jestGlobals.jest;
    global.describe = jestGlobals.describe;
    global.test = jestGlobals.test;
    global.beforeEach = jestGlobals.beforeEach;
    global.afterEach = jestGlobals.afterEach;
    global.beforeAll = jestGlobals.beforeAll;
    global.afterAll = jestGlobals.afterAll;
  } catch (e) {
    console.error('Failed to load @jest/globals:', e.message);
  }
}

// Add chai for compatibility with existing tests
try {
  const chai = require('chai');
  global.chai = chai;
  // Don't override Jest expect
  global.chaiExpect = chai.expect;
  global.assert = chai.assert;
  global.should = chai.should();
} catch (e) {
  console.warn('Failed to load chai, continuing with Jest expect:', e.message);
}

// Log setup completion
console.log('Jest test environment setup complete');
