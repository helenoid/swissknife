// Basic pure JavaScript test - no TypeScript, no external dependencies
describe('Fresh Test', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('should handle strings', () => {
    expect('hello').toBe('hello');
  });
});
