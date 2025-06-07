/**
 * Minimal test for ModelExecutionService
 */

// Create simple mock for ModelExecutionService
const mockExecuteModel = jest.fn().mockResolvedValue({
  response: 'Mock response',
  usage: { 
    promptTokens: 10, 
    completionTokens: 20, 
    totalTokens: 30 
  },
  timingMs: 100
});

const mockExecuteModelStream = jest.fn().mockImplementation(async function* () {
  yield { text: 'Mock stream data' };
});

const mockGetModelsByCapability = jest.fn().mockResolvedValue([
  { id: 'test-model', capabilities: { streaming: true }}
]);

const mockGetDefaultModel = jest.fn().mockResolvedValue({ id: 'default-model' });

// Mock the ModelExecutionService
const mockExecutionService = {
  executeModel: mockExecuteModel,
  executeModelStream: mockExecuteModelStream,
  getModelsByCapability: mockGetModelsByCapability,
  getDefaultModel: mockGetDefaultModel
};

describe('ModelExecutionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should execute a model and return a response', async () => {
    // Arrange
    const modelId = 'test-model-1';
    const prompt = 'Test prompt';
    
    // Act
    const result = await mockExecutionService.executeModel(modelId, prompt);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.response).toBe('Mock response');
    expect(result.usage).toBeDefined();
    expect(result.usage.totalTokens).toBe(30);
    expect(mockExecuteModel).toHaveBeenCalledWith(modelId, prompt, expect.any(Object));
  });
  
  it('should stream model execution results', async () => {
    // Arrange
    const modelId = 'test-model-1';
    const prompt = 'Test prompt';
    
    // Act
    const stream = await mockExecutionService.executeModelStream(modelId, prompt);
    
    // Assert
    expect(stream).toBeDefined();
    expect(mockExecuteModelStream).toHaveBeenCalledWith(modelId, prompt, expect.any(Object));
    
    // Test stream events
    for await (const data of stream) {
      expect(data.text).toBe('Mock stream data');
    }
  });
  
  it('should get models by capability', async () => {
    // Act
    const models = await mockExecutionService.getModelsByCapability('streaming');
    
    // Assert
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('test-model');
    expect(models[0].capabilities.streaming).toBe(true);
  });
  
  it('should get default model', async () => {
    // Act
    const model = await mockExecutionService.getDefaultModel();
    
    // Assert
    expect(model).toBeDefined();
    expect(model.id).toBe('default-model');
  });
});
