/**
 * Diagnostic test for SwissKnife
 * This test checks if the test environment is correctly set up
 */

describe('Test Environment', () => {
  test('Basic test functionality', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('Jest mocks work', () => {
    const mockFn = jest.fn(() => 42);
    mockFn();
    expect(mockFn).toHaveBeenCalled();
  });
  
  test('Can access environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
  
  test('Can import and use mock helper', async () => {
    const mocks = require('../test/helpers/unified-mocks');
    expect(mocks.createMockStream).toBeDefined();
    expect(mocks.MockModelExecutionService).toBeDefined();
    expect(mocks.MockMCPServer).toBeDefined();
  });
  
  test('Can create and use mock streams', async () => {
    const { createMockStream } = require('../test/helpers/unified-mocks');
    const stream = createMockStream([{ text: 'test' }]);
    
    let data = null;
    await new Promise(resolve => {
      stream.on('data', chunk => { data = chunk; });
      stream.on('end', resolve);
    });
    
    expect(data).toEqual({ text: 'test' });
  });
  
  test('TextEncoder is available', () => {
    expect(global.TextEncoder).toBeDefined();
    const encoder = new TextEncoder();
    const encoded = encoder.encode('test');
    expect(encoded).toBeInstanceOf(Uint8Array);
  });
});
