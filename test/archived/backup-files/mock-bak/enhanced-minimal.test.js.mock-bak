/**
 * Enhanced minimal test for SwissKnife
 * 
 * This test validates more aspects of the testing environment.
 */

// Test with explicit globals import
const { describe, it, test, expect } = require('@jest/globals');

// Mock a basic dependency to ensure mocking works
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'mocked content'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true)
}));

// Basic validation test group
describe('Enhanced Test Environment', () => {
  test('Jest globals are correctly imported', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });
  
  test('Mock implementations work', () => {
    const fs = require('fs');
    const content = fs.readFileSync('anything.txt');
    
    expect(content).toBe('mocked content');
    expect(fs.readFileSync).toHaveBeenCalled();
  });
  
  test('Async tests are supported', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
  
  test('Advanced matchers work', () => {
    // Object matching
    const received = { name: 'test', value: 42 };
    expect(received).toEqual({ name: 'test', value: 42 });
    
    // String matching
    expect('hello test').toMatch(/test/);
    
    // Array containing
    expect([1, 2, 3]).toContain(2);
  });
  
  // Demonstrate beforeEach/afterEach hooks
  let counter = 0;
  
  beforeEach(() => {
    counter = 15;
  });
  
  afterEach(() => {
    counter = 0;
  });
  
  test('beforeEach hook works', () => {
    expect(counter).toBe(15);
    counter = 30;
    expect(counter).toBe(30);
  });
  
  test('afterEach hook reset counter', () => {
    expect(counter).toBe(15); // Should be reset and then set to 15 again
  });
  
  // Add a test for proper module resolution
  test('Node module resolution works', () => {
    const path = require('path');
    expect(typeof path.join).toBe('function');
    
    const joinResult = path.join('a', 'b', 'c');
    expect(typeof joinResult).toBe('string');
  });
});
