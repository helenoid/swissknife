/**
 * Extremely simple test just to verify Jest is working properly
 */

test('Basic test functionality', () => {
  expect(1 + 1).toBe(2);
  expect(true).toBe(true);
  expect('test').toHaveLength(4);
});

describe('Basic group', () => {
  test('First test', () => {
    expect(2 * 2).toBe(4);
  });
  
  test('Second test', () => {
    expect('hello').toContain('ell');
  });
});
