/**
 * CommonJS Format Jest test file
 */

const { test, expect } = require('@jest/globals');

test('Basic test in CommonJS format', () => {
  expect(1 + 1).toBe(2);
});
