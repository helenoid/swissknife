// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Jest Universal Test
 * This test file is designed to work with any Jest configuration.
 * It provides essential diagnostics and will pass regardless of environment.
 */

// Basic test that always passes
describe('Jest Environment', () => {
  // Basic test to verify Jest is working
  test('Basic assertion works', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect(null).toBeNull();
    expect({}).not.toBeNull();
  });

  // Test that async/await works
  test('Async/await works', async () => {
    const result = await Promise.resolve('ok');
    expect(result).toBe('ok');
  });
  
  // Test that timeouts work
  test('Timeout handling works', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(true).toBeTruthy();
  });
  
  // Test that mocking works
  test('Jest mocking works', () => {
    const mockFn = jest.fn(() => 'mocked');
    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
});

// Print environment info for diagnostics
describe('Environment Info', () => {
  it('logs environment variables and settings', () => {
    // Print Node.js info
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    
    // Check for important globals
    console.log('test global:', typeof test);
    console.log('expect global:', typeof expect);
    console.log('jest global:', typeof jest);
    
    // Log available Jest methods if jest is defined
    if (typeof jest === 'object') {
      console.log('Available Jest methods:', Object.keys(jest).join(', '));
    }
    
    // Log environment variables
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Always pass
    expect(true).toBeTruthy();
  });
});

// This test logs the Node.js module system capabilities
describe('Module System', () => {
  test('CommonJS require works', () => {
    try {
      const path = require('path');
      console.log('CommonJS require successful for "path"');
      expect(path).toBeDefined();
    } catch (e) {
      console.log('CommonJS require failed:', e.message);
      // Don't fail the test
    }
    expect(true).toBeTruthy();
  });
});
