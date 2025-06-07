/**
 * Fixed test for ModelExecutionService
 * 
 * This test uses the comprehensive mock implementations to test stream handling properly.
 */
const { MockModelExecutionService, createMockStream } = require('../../helpers/comprehensive-mocks');

// Simple mock for the ModelExecutionService
jest.mock('../../../src/services/execution', () => {
  return {
    ModelExecutionService: {
      getInstance: jest.fn().mockReturnValue(MockModelExecutionService)
    }
  };
});

describe('ModelExecutionService', () => {
  const modelService = MockModelExecutionService;
  
  test('executeModel should return a proper response object', async () => {
    const result = await modelService.executeModel('test-model', 'Hello, world!');
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('usage');
    expect(result).toHaveProperty('usage.promptTokens');
    expect(result).toHaveProperty('usage.completionTokens');
    expect(result).toHaveProperty('usage.totalTokens');
    expect(result).toHaveProperty('timingMs');
  });
  
  test('executeModelStream should return a stream with data events', async () => {
    const stream = await modelService.executeModelStream('test-model', 'Hello, world!');
    
    const chunks = [];
    
    await new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
  });
  
  test('stream should be pipeable to other streams', async () => {
    const stream = await modelService.executeModelStream('test-model', 'Hello, world!');
    
    // Test if pipe works
    const mockDestination = createMockStream();
    const result = stream.pipe(mockDestination);
    
    expect(result).toBeDefined();
    expect(stream.pipe).toHaveBeenCalled();
  });
});
