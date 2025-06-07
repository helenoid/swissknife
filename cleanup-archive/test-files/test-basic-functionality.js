test('basic functionality test', () => {
  expect(1 + 1).toBe(2);
  expect(true).toBe(true);
  expect('hello').toBe('hello');
});

test('async test', async () => {
  const result = await Promise.resolve('async test');
  expect(result).toBe('async test');
});

describe('test group', () => {
  it('should work with describe/it syntax', () => {
    expect(typeof expect).toBe('function');
  });
});
