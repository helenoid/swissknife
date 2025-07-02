// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Simple test to verify Jest environment
 */

test('Jest environment verification', () => {
  console.log('Jest is working');
  expect(1 + 1).toBe(2);
  expect(true).toBe(true);
});

test('Node modules work', () => {
  const path = require('path');
  expect(typeof path.join).toBe('function');
});

test('Global variables exist', () => {
  expect(typeof global).toBe('object');
  expect(typeof global.expect).toBe('function');
  expect(typeof global.jest).toBe('object');
});

console.log('Basic environment test file loaded');
