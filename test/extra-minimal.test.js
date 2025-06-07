// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
/**
 * Extra minimal test to verify Jest configuration
 * Using explicit imports to avoid conflicts
 */

const jestGlobals = require('@jest/globals');
const { describe, test, expect } = jestGlobals;

describe('Extra Minimal Test', () => {
  test('basic addition works', () => {
    expect(1 + 1).to.equal(2);
  });
  
  test('basic subtraction works', () => {
    expect(2 - 1).to.equal(1);
  });
});
