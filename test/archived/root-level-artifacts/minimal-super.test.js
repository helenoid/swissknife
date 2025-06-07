/**
 * Super minimal test file - should pass under all circumstances
 */

describe('Minimal Test Suite', () => {
  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should concatenate strings', () => {
    expect('hello' + 'world').toBe('helloworld');
  });
});
