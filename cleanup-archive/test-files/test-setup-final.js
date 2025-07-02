/**
 * Final test setup file for SwissKnife project tests
 * This properly configures both Jest and Chai to work together
 */

// First, explicitly import and set up Jest globals
try {
  const jestGlobals = require('@jest/globals');
  
  // Set up Jest globals if they don't already exist
  if (!global.expect) global.expect = jestGlobals.expect;
  if (!global.test) global.test = jestGlobals.test;
  if (!global.it) global.it = jestGlobals.it;
  if (!global.describe) global.describe = jestGlobals.describe;
  if (!global.beforeEach) global.beforeEach = jestGlobals.beforeEach;
  if (!global.afterEach) global.afterEach = jestGlobals.afterEach;
  if (!global.beforeAll) global.beforeAll = jestGlobals.beforeAll;
  if (!global.afterAll) global.afterAll = jestGlobals.afterAll;
  if (!global.jest) global.jest = jestGlobals.jest;
  
  console.log('✅ Jest globals successfully set up');
} catch (e) {
  console.error('❌ Failed to set up Jest globals:', e.message);
}

// Set up Chai for compatibility
try {
  const chai = require('chai');
  global.chai = chai;
  
  // Don't override Jest's expect, instead provide as chaiExpect
  global.chaiExpect = chai.expect; 
  global.assert = chai.assert;
  global.should = chai.should();
  
  console.log('✅ Chai successfully set up');
} catch (e) {
  console.warn('⚠️ Failed to set up Chai (non-critical):', e.message);
}

// Set up mocks for ESM compatibility issues
if (!global.jest.mock) {
  global.jest.mock = (moduleName, factory) => {
    try {
      console.log(`Setting up mock for ${moduleName}`);
      // This is just a placeholder, actual mocking is handled by Jest
    } catch (e) {
      console.error(`Failed to mock ${moduleName}:`, e);
    }
  };
}

// Set default timeout for all tests
jest.setTimeout(30000);

// Helper for handling ESM vs CommonJS module imports
global.dynamicImport = async (modulePath) => {
  try {
    return await import(modulePath);
  } catch (e) {
    return require(modulePath);
  }
};

console.log('SwissKnife Test Environment Setup Complete');
