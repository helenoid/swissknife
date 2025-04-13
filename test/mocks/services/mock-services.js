/**
 * Mock services for tests
 * 
 * Provides mock implementations of core services for testing
 */

// Mock model execution service
export class MockModelExecutionService {
  constructor() {
    this.executeModel = jest.fn().mockImplementation(async (modelId, prompt, options = {}) => {
      return {
        modelId,
        result: `Mock response for: ${prompt}`,
        usage: {
          promptTokens: prompt.length,
          completionTokens: 20,
          totalTokens: prompt.length + 20
        }
      };
    });
    
    this.listModels = jest.fn().mockReturnValue([
      { id: 'test-model-1', provider: 'test-provider', capabilities: ['chat', 'completion'] },
      { id: 'test-model-2', provider: 'test-provider', capabilities: ['embedding'] }
    ]);
    
    this.getModel = jest.fn().mockImplementation((modelId) => {
      const models = this.listModels();
      return models.find(model => model.id === modelId) || null;
    });
    
    this.executeEmbedding = jest.fn().mockImplementation(async (modelId, input) => {
      return {
        modelId,
        embedding: new Array(1536).fill(0).map(() => Math.random() * 2 - 1),
        usage: {
          promptTokens: input.length,
          totalTokens: input.length
        }
      };
    });
  }
  
  // Static getInstance method to mimic singleton pattern
  static getInstance() {
    if (!MockModelExecutionService.instance) {
      MockModelExecutionService.instance = new MockModelExecutionService();
    }
    return MockModelExecutionService.instance;
  }
  
  // Reset the instance for testing
  static resetInstance() {
    MockModelExecutionService.instance = null;
  }
}

// Mock task execution service
export class MockTaskExecutionService {
  constructor() {
    this.taskResults = new Map();
    
    this.executeTask = jest.fn().mockImplementation(async (taskId, options = {}) => {
      // Return predefined result if available
      if (this.taskResults.has(taskId)) {
        return this.taskResults.get(taskId);
      }
      
      // Otherwise return a default success result
      return {
        taskId,
        status: 'completed',
        result: `Task ${taskId} executed successfully`,
        completedAt: Date.now()
      };
    });
    
    this.cancelTask = jest.fn().mockImplementation(async (taskId) => {
      return {
        taskId,
        status: 'cancelled',
        cancelledAt: Date.now()
      };
    });
    
    this.getTaskStatus = jest.fn().mockImplementation((taskId) => {
      if (this.taskResults.has(taskId)) {
        return this.taskResults.get(taskId).status;
      }
      return 'unknown';
    });
  }
  
  // Set a predefined result for a task
  setTaskResult(taskId, result) {
    this.taskResults.set(taskId, {
      taskId,
      ...result
    });
  }
  
  // Set a task to fail
  setTaskToFail(taskId, errorMessage = 'Task failed') {
    this.taskResults.set(taskId, {
      taskId,
      status: 'failed',
      error: errorMessage,
      failedAt: Date.now()
    });
  }
  
  // Static getInstance method to mimic singleton pattern
  static getInstance() {
    if (!MockTaskExecutionService.instance) {
      MockTaskExecutionService.instance = new MockTaskExecutionService();
    }
    return MockTaskExecutionService.instance;
  }
  
  // Reset the instance for testing
  static resetInstance() {
    MockTaskExecutionService.instance = null;
  }
}

// Mock storage service
export class MockStorageService {
  constructor() {
    this.content = new Map();
    this.nodes = new Map();
    
    this.storeContent = jest.fn().mockImplementation(async (content) => {
      const contentId = `content-${Math.random().toString(36).substring(2, 15)}`;
      this.content.set(contentId, content);
      return contentId;
    });
    
    this.getContent = jest.fn().mockImplementation(async (contentId) => {
      if (!this.content.has(contentId)) {
        throw new Error(`Content not found: ${contentId}`);
      }
      return this.content.get(contentId);
    });
    
    this.storeNode = jest.fn().mockImplementation(async (node) => {
      const nodeId = `node-${Math.random().toString(36).substring(2, 15)}`;
      this.nodes.set(nodeId, node);
      return nodeId;
    });
    
    this.getNode = jest.fn().mockImplementation(async (nodeId) => {
      if (!this.nodes.has(nodeId)) {
        throw new Error(`Node not found: ${nodeId}`);
      }
      return this.nodes.get(nodeId);
    });
  }
  
  // Clear all stored data
  clear() {
    this.content.clear();
    this.nodes.clear();
  }
  
  // Static getInstance method to mimic singleton pattern
  static getInstance() {
    if (!MockStorageService.instance) {
      MockStorageService.instance = new MockStorageService();
    }
    return MockStorageService.instance;
  }
  
  // Reset the instance for testing
  static resetInstance() {
    MockStorageService.instance = null;
  }
}

// Export a factory function to create all mock services
export function createMockServices() {
  return {
    modelExecutionService: MockModelExecutionService.getInstance(),
    taskExecutionService: MockTaskExecutionService.getInstance(),
    storageService: MockStorageService.getInstance()
  };
}

// Export a function to reset all mock services
export function resetMockServices() {
  MockModelExecutionService.resetInstance();
  MockTaskExecutionService.resetInstance();
  MockStorageService.resetInstance();
}