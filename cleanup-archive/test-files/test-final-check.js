/**
 * Basic Test for SwissKnife Environment
 * This test verifies that the Jest test environment is correctly set up
 */

// Basic assertions
test('Basic test - environment is working', () => {
  console.log('Running basic environment test');
  expect(true).toBe(true);
  expect(1 + 1).toBe(2);
});

// Check if globals are properly defined
test('Jest globals are defined', () => {
  expect(typeof global.expect).toBe('function');
  expect(typeof global.test).toBe('function');
  expect(typeof global.describe).toBe('function');
  expect(typeof global.jest).toBe('object');
});

// Check if module imports work
test('Module imports work', () => {
  // CommonJS require
  const path = require('path');
  expect(typeof path.join).toBe('function');
});

// Test Chai if available
test('Chai integration works if available', () => {
  if (global.chai) {
    expect(global.chaiExpect).toBeDefined();
    global.chaiExpect(true).to.be.true;
    global.assert.isTrue(true);
  } else {
    console.log('Chai not available, skipping Chai tests');
  }
  // Always pass this test even if Chai is not available
  expect(true).toBe(true);
});
