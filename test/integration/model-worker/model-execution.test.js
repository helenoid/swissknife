/**
 * Integration test for Model and Worker integration using mocks
 */
const { MockModel, MockProvider } = require('../../mocks/models/mock-models');
const { MockWorkerPool } = require('../../mocks/workers/mock-workers');
const { MockTaskManager } = require('../../mocks/tasks/mock-tasks');
const { MockServiceRegistry } = require('../../mocks/services/mock-services');

// This test demonstrates how to test the interaction between the model system,
// worker system, and task system components

describe('Model-Worker Integration', () => {
  let mockModel;
  let mockProvider;
  let mockWorkerPool;
  let mockTaskManager;
  let serviceRegistry;
  let modelExecutionService; // The service we're actually testing
  
  beforeEach(async () => {
    // Create mocks
    mockModel = new MockModel({
      id: 'test-model',
      name: 'Test Model',
      provider: 'test-provider'
    });
    
    mockProvider = new MockProvider({
      id: 'test-provider',
      models: [mockModel]
    });
    
    mockWorkerPool = new MockWorkerPool({ size: 2 });
    await mockWorkerPool.initialize();
    
    mockTaskManager = new MockTaskManager();
    
    // Create service registry
    serviceRegistry = new MockServiceRegistry();
    serviceRegistry.registerService('workerPool', mockWorkerPool);
    serviceRegistry.registerService('taskManager', mockTaskManager);
    
    // Create the service we're testing
    // Note: This is a simplified version of what would be in your actual code
    modelExecutionService = {
      executeModel: async (modelId, prompt, options = {}) => {
        // Create a task for model execution
        const taskId = await mockTaskManager.createTask('model-execution', {
          modelId,
          prompt,
          options
        });
        
        // Execute the task through the worker pool
        return mockWorkerPool.executeTask('model-execution', {
          modelId,
          prompt,
          options
        });
      }
    };
    
    // Register our service
    serviceRegistry.registerService('modelExecution', modelExecutionService);
    
    // Register a task handler in the worker pool (simulated)
    // In a real implementation, you would register this in the worker thread
    mockWorkerPool.taskHandler = async (taskType, data) => {
      if (taskType === 'model-execution') {
        const { modelId, prompt, options } = data;
        
        // Use the mock model to generate a response
        const result = await mockModel.generate(prompt, options);
        return {
          modelId,
          result
        };
      }
      return null;
    };
  });
  
  afterEach(async () => {
    // Clean up
    await mockWorkerPool.shutdown();
  });
  
  test('should execute model through worker pool', async () => {
    // Spy on the model's generate method
    const generateSpy = jest.spyOn(mockModel, 'generate');
    
    // Execute model through our service
    const result = await modelExecutionService.executeModel(
      'test-model',
      'This is a test prompt',
      { temperature: 0.7 }
    );
    
    // Verify worker pool executed the task
    expect(mockWorkerPool.executeCalls).toHaveLength(1);
    expect(mockWorkerPool.executeCalls[0].taskType).toBe('model-execution');
    expect(mockWorkerPool.executeCalls[0].data.modelId).toBe('test-model');
    expect(mockWorkerPool.executeCalls[0].data.prompt).toBe('This is a test prompt');
    
    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.modelId).toBe('test-model');
    expect(result.result).toBeDefined();
  });
  
  test('should handle parallel model executions', async () => {
    // Execute multiple models in parallel
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        modelExecutionService.executeModel(
          'test-model',
          `Test prompt ${i}`,
          { temperature: 0.7 }
        )
      );
    }
    
    // Wait for all to complete
    const results = await Promise.all(promises);
    
    // Verify all executions succeeded
    expect(results).toHaveLength(5);
    results.forEach((result, i) => {
      expect(result.modelId).toBe('test-model');
      expect(result.result).toBeDefined();
    });
    
    // Verify worker pool was used for all executions
    expect(mockWorkerPool.executeCalls).toHaveLength(5);
  });
});