/**
 * Super minimal standalone test - does not depend on any other modules
 */

// Test group
describe('Standalone tests', () => {
  // Test case
  test('basic functionality works', () => {
    expect(1 + 1).toBe(2);
  });
  
  // Test case with async
  test('async functionality works', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
  
  // Test group
  describe('Nested tests', () => {
    // Test case
    test('nested test works', () => {
      expect(true).toBe(true);
    });
  });
});
