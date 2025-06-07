// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
// Chai assertions are provided by unified-setup.js
/**
 * Fresh minimal test that should definitely work
 */

// Import Jest's globals
const { expect, test, describe } = require('@jest/globals');

// Basic tests
test('basic addition', () => {
  expect(1 + 1).to.equal(2);
});

test('basic string comparison', () => {
  expect('hello').to.equal('hello');
});

// Group of tests
describe('Math operations', () => {
  test('multiplication works', () => {
    expect(2 * 3).to.equal(6);
  });
  
  test('subtraction works', () => {
    expect(5 - 2).to.equal(3); 
  });
});
