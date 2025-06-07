// Mock execution service test
const { EventEmitter } = require('events');

describe('ModelExecutionService', () => {
  const mockService = {
    executeModel: jest.fn().mockImplementation(async (modelId, prompt) => ({
      response: `Mock response for "${prompt}" using model ${modelId}`,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      timingMs: 100
    })),
    
    executeModelStream: jest.fn().mockImplementation(async () => {
      const stream = new EventEmitter();
      
      process.nextTick(() => {
        stream.emit('data', { text: 'chunk1' });
        stream.emit('data', { text: 'chunk2' });
        stream.emit('end');
      });
      
      stream.pipe = jest.fn().mockReturnValue(stream);
      stream.on = function(event, handler) {
        this.addListener(event, handler);
        return this;
      };
      
      return stream;
    })
  };
  
  test('executeModel returns response', async () => {
    const result = await mockService.executeModel('test-model', 'test prompt');
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('usage');
    expect(result).toHaveProperty('timingMs');
  });
  
  test('executeModelStream emits events', async () => {
    const stream = await mockService.executeModelStream();
    const chunks = [];
    
    await new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toHaveProperty('text', 'chunk1');
    expect(chunks[1]).toHaveProperty('text', 'chunk2');
  });
});
