/**
 * Minimal test file to verify Jest is working correctly
 */

// Basic test case
test('addition works', () => {
  expect(1 + 1).toBe(2);
});

// Simple describe block
describe('Math operations', () => {
  it('multiplies correctly', () => {
    expect(2 * 3).toBe(6);
  });
  
  it('subtracts correctly', () => {
    expect(5 - 2).toBe(3);
  });
});

// Async test
test('promises work', async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});
