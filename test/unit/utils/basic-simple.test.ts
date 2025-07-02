/**
 * Very simple test for basic functionality
 */

describe('Basic Functionality', () => {
  test('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
    expect(5 * 3).toBe(15);
    expect(10 / 2).toBe(5);
  });

  test('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.length).toBe(4);
    expect('TEST'.toLowerCase()).toBe('test');
  });

  test('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
  });

  test('should handle object operations', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
    expect(Object.keys(obj)).toEqual(['name', 'value']);
  });
});
