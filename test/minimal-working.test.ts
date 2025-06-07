// Make this a module
export {};

describe('Minimal Test Suite', () => {
  it('should pass a basic assertion', () => {
    expect(true).toBe(true);
  });

  it('should handle numbers', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle strings', () => {
    expect('hello').toContain('ell');
  });
});
