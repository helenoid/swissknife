/**
 * Basic working test to verify Jest is functioning
 */

describe('Basic Jest Functionality', () => {
  test('Jest is working', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('Async operations work', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
  
  test('Mocks work', () => {
    const mockFn = jest.fn(() => 'mocked');
    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
});
