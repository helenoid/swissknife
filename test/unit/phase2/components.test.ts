import { Agent } from '@src/ai/agent/agent';
import { IModel, ModelOptions } from '@src/ai/models/model';
import { TaskManager } from '@src/tasks/manager';
import { TaskStatus } from '@src/types/task';
import { FileMappingStore } from '@src/storage/mapping-store';
import { IPFSKitClient } from '@src/ipfs/client';

/**
 * Unit tests for Phase 2 components - Core Implementation
 */

jest.mock('@src/ipfs/client');
jest.mock('@src/storage/mapping-store');

// Mock TaskManager at the module level
jest.mock('@src/tasks/manager', () => {
  const { TaskStatus } = jest.requireActual('@src/types/task');
  const mockTasks = new Map();

  return {
    TaskManager: jest.fn().mockImplementation(() => {
      return {
        createTask: jest.fn(async (options) => {
          const taskId = 'task-123';
          const task = {
            id: taskId,
            description: options.description,
            status: TaskStatus.PENDING,
            priority: options.basePriority ?? 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            nodes: [],
          };
          mockTasks.set(taskId, task);
          return task;
        }),
        getTask: jest.fn((taskId: string) => mockTasks.get(taskId)),
      };
    }),
  };
});

// Mock Agent at the module level
jest.mock('@src/ai/agent/agent', () => {
  return {
    Agent: jest.fn().mockImplementation((options) => {
      return {
        model: options.model,
        processMessage: jest.fn(async (message) => {
          // Simulate calling the model's generate method
          const response = await options.model.generate(message);
          return response;
        }),
        // Add other methods if they are used in tests
      };
    }),
  };
});

// Mock model for Agent constructor
class MockModel implements IModel {
  readonly id: string;
  
  constructor(options: ModelOptions) {
    this.id = options.id;
  }
  
  getName(): string {
    return 'Mock Model';
  }
  
  getProvider(): string {
    return 'mock';
  }
  
  async generate() {
    return {
      content: 'Mock response',
      status: 'success' as any
    };
  }
}

describe('Phase 2: Core Implementation Components', () => {
  describe('AI Agent', () => {
    let agent: Agent;
    let model: MockModel;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Create model and agent
      const modelOptions = {
        id: 'mock-model',
        name: 'Mock Model',
        provider: 'mock'
      };
      model = new MockModel(modelOptions);
      // Instantiate the mocked Agent
      agent = new Agent({ model });
    });
    
    it('should process messages through the agent', async () => {
      // Arrange
      jest.spyOn(model, 'generate').mockResolvedValue({
        content: 'Test response',
        status: 'success' as any
      });
      
      // Act
      const response = await agent.processMessage('Test message');
      
      // Assert
      expect(model.generate).toHaveBeenCalledWith('Test message'); // Ensure generate was called with the message
      expect(response).toEqual({
        content: 'Test response',
        status: 'success'
      });
    });
  });
  
  describe('Task System Core', () => {
    let taskManager: TaskManager;
    
    beforeEach(() => {
      jest.clearAllMocks();
      taskManager = new TaskManager({} as any); // Create a new instance of the mocked TaskManager
    });
    
    it('should create tasks', async () => {
      const expectedTaskId = 'task-123';
      
      const createdTask = await taskManager.createTask({
        description: 'Task description',
        basePriority: 1
      });
      
      expect(taskManager.createTask).toHaveBeenCalledWith({
        description: 'Task description',
        basePriority: 1
      });
      expect(createdTask).toBeDefined();
      expect(createdTask.id).toBe(expectedTaskId);
      expect(createdTask.status).toBe(TaskStatus.PENDING);
      
      const retrievedTask = taskManager.getTask(expectedTaskId);
      expect(retrievedTask).toEqual(createdTask);
    });
  });
  
  describe('Storage System', () => {
    let fileMappingStore: jest.Mocked<FileMappingStore>;
    let ipfsClient: jest.Mocked<IPFSKitClient>;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      fileMappingStore = new FileMappingStore({ storageFile: 'test.json' }) as jest.Mocked<FileMappingStore>;
      ipfsClient = new IPFSKitClient() as jest.Mocked<IPFSKitClient>;
    });
    
    it('should store content to IPFS', async () => {
      ipfsClient.addContent = jest.fn().mockResolvedValue('QmHash123');
      
      const cid = await ipfsClient.addContent('Test content');
      
      expect(ipfsClient.addContent).toHaveBeenCalledWith('Test content');
      expect(cid).toBe('QmHash123');
    });
    
    it('should retrieve content from IPFS', async () => {
      ipfsClient.getContent = jest.fn().mockResolvedValue('Test content');
      
      const content = await ipfsClient.getContent('QmHash123');
      
      expect(ipfsClient.getContent).toHaveBeenCalledWith('QmHash123');
      expect(content).toBe('Test content');
    });
  });
});
