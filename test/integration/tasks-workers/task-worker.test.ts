/**
 * Integration tests for Tasks and Workers integration
 */

// Mock the worker pool directly within the mock instead of using a helper function
jest.mock('../../../src/workers/pool', () => {
  // Create a mock worker pool implementation
  const mockWorkerPool = {
    initialize: jest.fn().mockResolvedValue(true),
    getAllWorkers: jest.fn().mockReturnValue([
      { id: 'worker-1', status: 'idle', setStatus: jest.fn(), messageHistory: [] },
      { id: 'worker-2', status: 'idle', setStatus: jest.fn(), messageHistory: [] }
    ]),
    executeTask: jest.fn().mockImplementation(async (taskType, data) => {
      if (taskType === 'error-task') {
        throw new Error('Simulated task error');
      }
      return {
        success: true,
        input: data,
        result: `Processed ${data.input || 'unknown input'}`
      };
    }),
    taskQueue: {
      clear: jest.fn()
    }
  };
  
  return {
    getWorkerPool: jest.fn().mockReturnValue(mockWorkerPool),
    WorkerPool: {
      getInstance: jest.fn().mockReturnValue(mockWorkerPool)
    }
  };
});

// Import after mocks
import { TaskManager } from '../../../src/tasks/manager';
import { TaskRegistry } from '../../../src/tasks/registry';
import { getWorkerPool } from '../../../src/workers/pool';

// Create simple task fixtures
const generateTaskFixtures = () => ({
  taskDefinitions: [
    {
      type: 'test-task',
      schema: {
        required: ['input']
      }
    },
    {
      type: 'error-task',
      schema: {}
    }
  ]
});

// Simple helper functions
const createTempTestDir = async () => '/tmp/test-dir-' + Date.now();
const removeTempTestDir = async (dir: string) => { /* no-op for test */ };
const waitFor = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Tasks and Workers Integration', () => {
  let taskManager: any;
  let taskRegistry: any;
  let workerPool: any;
  let tempDir: string;
  
  const fixtures = generateTaskFixtures();
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await createTempTestDir();
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await removeTempTestDir(tempDir);
  });
  
  beforeEach(async () => {
    // Reset singletons
    (TaskManager as any).instance = null;
    (TaskRegistry as any).instance = null;
    
    // Get instances
    taskManager = TaskManager.getInstance();
    taskRegistry = TaskRegistry.getInstance();
    workerPool = getWorkerPool();
    
    // Initialize worker pool
    await workerPool.initialize();
    
    // Register task definitions
    fixtures.taskDefinitions.forEach(definition => {
      taskRegistry.registerTaskDefinition(definition);
    });
    
    // Clear any previous tasks in the worker pool
    workerPool.taskQueue.clear();
    for (const worker of workerPool.getAllWorkers()) {
      worker.messageHistory = [];
    }
  });
  
  afterEach(async () => {
    // Clear mocks
    jest.clearAllMocks();
  });
  
  describe('Task execution with workers', () => {
    it('should execute a task via worker pool', async () => {
      // Arrange
      const taskId = await taskManager.createTask('test-task', { input: 'test input' });
      
      // Act
      const result = await taskManager.executeTask(taskId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.result).toBe('Processed test input');
      
      // Verify task is marked as completed
      const task = taskManager.getTask(taskId);
      expect(task.status).toBe('completed');
      expect(task.result).toEqual(result);
      expect(task.completedAt).toBeDefined();
    });
    
    it('should handle and record task errors', async () => {
      // Arrange
      const taskId = await taskManager.createTask('error-task', { input: 'will error' });
      
      // Act & Assert
      await expect(taskManager.executeTask(taskId)).rejects.toThrow('Simulated task error');
      
      // Verify task is marked as failed
      const task = taskManager.getTask(taskId);
      expect(task.status).toBe('failed');
      expect(task.error).toContain('Simulated task error');
    });
    
    it('should execute multiple tasks concurrently', async () => {
      // Arrange - Create multiple tasks
      const taskIds = [];
      const numTasks = 5;
      for (let i = 0; i < numTasks; i++) {
        const taskId = await taskManager.createTask('test-task', { input: `input-${i}` });
        taskIds.push(taskId);
      }
      
      // Act - Execute all tasks concurrently
      const results = await Promise.all(
        taskIds.map(taskId => taskManager.executeTask(taskId))
      );
      
      // Assert - All tasks completed successfully
      expect(results.length).toBe(numTasks);
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.result).toBe(`Processed input-${i}`);
      });
      
      // Verify all tasks are marked as completed
      for (const taskId of taskIds) {
        const task = taskManager.getTask(taskId);
        expect(task.status).toBe('completed');
      }
    });
    
    it('should handle mix of successful and failed tasks', async () => {
      // Arrange - Create mix of tasks
      const successTaskId1 = await taskManager.createTask('test-task', { input: 'success-1' });
      const errorTaskId = await taskManager.createTask('error-task', { input: 'will-fail' });
      const successTaskId2 = await taskManager.createTask('test-task', { input: 'success-2' });
      
      // Act - Execute all tasks with Promise.allSettled
      const results = await Promise.allSettled([
        taskManager.executeTask(successTaskId1),
        taskManager.executeTask(errorTaskId),
        taskManager.executeTask(successTaskId2)
      ]);
      
      // Assert - Check results
      expect(results.length).toBe(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
      
      // Check task statuses
      expect(taskManager.getTask(successTaskId1).status).toBe('completed');
      expect(taskManager.getTask(errorTaskId).status).toBe('failed');
      expect(taskManager.getTask(successTaskId2).status).toBe('completed');
    });
  });
  
  describe('Task priority handling', () => {
    it('should process high priority tasks before lower priority', async () => {
      // Arrange
      // Create tasks with different priorities
      const lowPriorityTaskId = await taskManager.createTask(
        'test-task', 
        { input: 'low-priority' }, 
        { priority: 'low' }
      );
      
      const mediumPriorityTaskId = await taskManager.createTask(
        'test-task', 
        { input: 'medium-priority' }, 
        { priority: 'medium' }
      );
      
      const highPriorityTaskId = await taskManager.createTask(
        'test-task', 
        { input: 'high-priority' }, 
        { priority: 'high' }
      );
      
      // Configure worker pool to process tasks one at a time
      // by setting all but one worker to busy
      const workers = workerPool.getAllWorkers();
      for (let i = 1; i < workers.length; i++) {
        workers[i].setStatus('busy');
      }
      
      const executionOrder: string[] = [];
      
      // Spy on executeTask to track execution order
      const originalExecuteTask = taskManager.executeTask.bind(taskManager);
      jest.spyOn(taskManager, 'executeTask').mockImplementation(async (taskId) => {
        executionOrder.push(taskId);
        return originalExecuteTask(taskId);
      });
      
      // Act - Execute tasks in reverse priority order
      const promise1 = taskManager.executeTask(lowPriorityTaskId);
      const promise2 = taskManager.executeTask(mediumPriorityTaskId);
      const promise3 = taskManager.executeTask(highPriorityTaskId);
      
      // Wait for all tasks to complete
      await Promise.all([promise1, promise2, promise3]);
      
      // Assert - High priority should be processed first
      expect(executionOrder[0]).toBe(highPriorityTaskId);
      
      // Reset mock
      jest.spyOn(taskManager, 'executeTask').mockRestore();
    });
  });
  
  describe('Task events', () => {
    it('should emit events during task lifecycle', async () => {
      // Arrange
      const events: any[] = [];
      
      // Listen for task events
      taskManager.on('taskCreated', (event) => events.push({ type: 'created', ...event }));
      taskManager.on('taskStarted', (event) => events.push({ type: 'started', ...event }));
      taskManager.on('taskCompleted', (event) => events.push({ type: 'completed', ...event }));
      
      // Act
      const taskId = await taskManager.createTask('test-task', { input: 'event-test' });
      await taskManager.executeTask(taskId);
      
      // Assert
      expect(events.length).toBe(3);
      
      // Check created event
      const createdEvent = events.find(e => e.type === 'created');
      expect(createdEvent).toBeDefined();
      expect(createdEvent.taskId).toBe(taskId);
      
      // Check started event
      const startedEvent = events.find(e => e.type === 'started');
      expect(startedEvent).toBeDefined();
      expect(startedEvent.taskId).toBe(taskId);
      
      // Check completed event
      const completedEvent = events.find(e => e.type === 'completed');
      expect(completedEvent).toBeDefined();
      expect(completedEvent.taskId).toBe(taskId);
      expect(completedEvent.result).toBeDefined();
    });
  });
  
  describe('Task cancellation', () => {
    it('should cancel a pending task', async () => {
      // Arrange
      const taskId = await taskManager.createTask('test-task', { input: 'to-be-cancelled' });
      
      // Act
      const result = await taskManager.cancelTask(taskId);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify task is marked as canceled
      const task = taskManager.getTask(taskId);
      expect(task.status).toBe('canceled');
    });
    
    it('should emit taskCanceled event', async () => {
      // Arrange
      const taskId = await taskManager.createTask('test-task', { input: 'cancel-event-test' });
      
      // Listen for task events
      const cancelHandler = jest.fn();
      taskManager.on('taskCanceled', cancelHandler);
      
      // Act
      await taskManager.cancelTask(taskId);
      
      // Assert
      expect(cancelHandler).toHaveBeenCalledWith(expect.objectContaining({ taskId }));
    });
  });
  
  describe('Task registry integration', () => {
    it('should validate task data against schema', async () => {
      // Arrange
      // Mock validation method
      taskRegistry.validateTaskData = jest.fn().mockImplementation((type, data) => {
        const definition = taskRegistry.getTaskDefinition(type);
        if (!definition || !definition.schema) return { valid: true };
        
        // Simple validation - check required fields
        const requiredProps = definition.schema.required || [];
        const valid = requiredProps.every(prop => data[prop] !== undefined);
        
        return { 
          valid, 
          errors: valid ? [] : ['Missing required fields'] 
        };
      });
      
      // Create task with valid data
      const validTaskId = await taskManager.createTask('test-task', { input: 'valid-data' });
      
      // Act & Assert for invalid data
      await expect(async () => {
        // This should fail validation since 'input' is required
        await taskManager.createTask('test-task', { something: 'invalid-data' });
      }).rejects.toThrow();
      
      // Execute valid task
      const result = await taskManager.executeTask(validTaskId);
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
});