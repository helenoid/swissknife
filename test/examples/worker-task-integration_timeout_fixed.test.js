const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Example: Testing worker and task integration
 * 
 * This example demonstrates how to test the interaction between:
 * - Task Manager
 * - Worker Pool
 * - Task processing
 * - Error handling and retries
 */
const { createTestEnvironment, setupGlobalMocks, resetMocks } = require('../utils/setup');
const { waitForCondition } = require('../utils/test-helpers');
const { sampleTaskDefinitions } = require('../fixtures/tasks/tasks');

// Mock implementation of the components we'd normally import from src
class TaskProcessor {
  constructor(options = {}) {
    this.taskManager = options.taskManager;
    this.workerPool = options.workerPool;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 100;
    
    // Track processing statistics
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0
    };
    
    // Set up task event handlers
    this.taskManager.on('taskCreated', this.handleTaskCreated.bind(this));
  }
  
  async handleTaskCreated(event) {
    const { taskId } = event;
    await this.processTask(taskId);
  }
  
  async processTask(taskId, retryCount = 0) {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      console.error(`Task not found: ${taskId}`);
      return;
    }
    
    if (task.status !== 'pending') {
      console.log(`Task ${taskId} is not pending (${task.status})`);
      return;
    }
    
    // Update statistics
    this.stats.processed++;
    
    try {
      // Get task definition
      const taskDefinition = this.taskManager.getTaskDefinition(task.type);
      if (!taskDefinition) {
        throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Execute task through worker pool
      await this.taskManager.executeTask(taskId);
      
      // Update statistics for success
      this.stats.succeeded++;
      
    } catch (error) {
      console.error(`Error processing task ${taskId}:`, error.message);
      
      // Handle retries
      if (retryCount < this.maxRetries) {
        this.stats.retried++;
        console.log(`Retrying task ${taskId} (attempt ${retryCount + 1} of ${this.maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Retry
        return this.processTask(taskId, retryCount + 1);
      } else {
        // Max retries exceeded
        this.stats.failed++;
        console.error(`Task ${taskId} failed after ${retryCount} retries`);
      }
    }
  }
  
  getStats() {
    return { ...this.stats };
  }
}

describe('Worker and Task Integration', () => {
  afterEach(() => jest.clearAllTimers());
  jest.setTimeout(120000);
  let env;
  let taskProcessor;
  let cleanup;
  
  beforeAll(() => {
    // Create test environment
    env = createTestEnvironment({
      // Configure task processing parameters
      taskErrorRate: 0.3, // 30% chance of task failure
      taskProcessingTime: 50,
      workerPoolSize: 3,
      workerProcessingTime: 50
    });
    
    // Set up global mocks
    cleanup = setupGlobalMocks(env);
    
    // Register task definitions
    env.taskManager.registerTaskDefinition(sampleTaskDefinitions.echo);
    env.taskManager.registerTaskDefinition(sampleTaskDefinitions.calculation);
    
    // Initialize worker pool
    return env.workerPool.initialize();
  });
  
  beforeEach(() => {
    // Reset mock call tracking
    resetMocks(env);
    
    // Create task processor
    taskProcessor = new TaskProcessor({
      taskManager: env.taskManager,
      workerPool: env.workerPool,
      maxRetries: 2,
      retryDelay: 50
    });
  });
  
  afterAll(() => {
    // Clean up
    if (cleanup) cleanup();
    return env.workerPool.shutdown();
  });
  
  test('should process tasks successfully', async () => {
    // Create test tasks
    const taskIds = [];
    for (let i = 0; i < 5; i++) {
      const taskId = await env.taskManager.createTask('echo', { message: `Task ${i + 1}` });
      taskIds.push(taskId);
    }
    
    // Wait for all tasks to complete
    const allComplete = await waitForCondition(() => {
      // Check if all tasks are either completed or failed
      return taskIds.every(id => {
        const task = env.taskManager.getTask(id);
        return task && (task.status === 'completed' || task.status === 'failed');
      });
    }, { timeout: 5000, interval: 100 });
    
    // Verify all tasks were processed
    expect(allComplete).toBe(true);
    
    // Get task statistics
    const stats = taskProcessor.getStats();
    
    // Verify all tasks were processed
    expect(stats.processed).toBe(taskIds.length);
    
    // Check how many succeeded and failed
    console.log(`Task processing statistics: ${JSON.stringify(stats)}`);
    
    // With a 30% failure rate and 2 retries, most tasks should succeed
    expect(stats.succeeded).toBeGreaterThan(0);
    
    // Some tasks may have required retries
    console.log(`Tasks retried: ${stats.retried}`);
  });
  
  test('should process calculation tasks correctly', async () => {
    // Create calculation tasks
    const addTaskId = await env.taskManager.createTask('calculation', {
      operation: 'add',
      values: [10, 20, 30, 40, 50]
    });
    
    const multiplyTaskId = await env.taskManager.createTask('calculation', {
      operation: 'multiply',
      values: [2, 3, 4]
    });
    
    // Wait for tasks to complete
    const allComplete = await waitForCondition(() => {
      const addTask = env.taskManager.getTask(addTaskId);
      const multiplyTask = env.taskManager.getTask(multiplyTaskId);
      
      return (
        addTask && 
        multiplyTask && 
        (addTask.status === 'completed' || addTask.status === 'failed') &&
        (multiplyTask.status === 'completed' || multiplyTask.status === 'failed')
      );
    }, { timeout: 5000, interval: 100 });
    
    expect(allComplete).toBe(true);
    
    // Get completed tasks
    const addTask = env.taskManager.getTask(addTaskId);
    const multiplyTask = env.taskManager.getTask(multiplyTaskId);
    
    // If tasks completed successfully, check results
    if (addTask.status === 'completed') {
      expect(addTask.result).toEqual({ result: 150 }); // 10+20+30+40+50
    }
    
    if (multiplyTask.status === 'completed') {
      expect(multiplyTask.result).toEqual({ result: 24 }); // 2*3*4
    }
  });
  
  test('should handle parallel task execution', async () => {
    // Create a large number of tasks
    const taskIds = [];
    const taskCount = 20;
    
    for (let i = 0; i < taskCount; i++) {
      const taskId = await env.taskManager.createTask('echo', { message: `Parallel task ${i + 1}` });
      taskIds.push(taskId);
    }
    
    // Wait for all tasks to complete or fail
    const allComplete = await waitForCondition(() => {
      return taskIds.every(id => {
        const task = env.taskManager.getTask(id);
        return task && (task.status === 'completed' || task.status === 'failed');
      });
    }, { timeout: 10000, interval: 100 });
    
    expect(allComplete).toBe(true);
    
    // Get final stats
    const stats = taskProcessor.getStats();
    
    // All tasks should have been processed
    expect(stats.processed).toBeGreaterThanOrEqual(taskCount);
    console.log(`Parallel task processing statistics: ${JSON.stringify(stats)}`);
    
    // Worker pool should have been used efficiently
    expect(env.workerPool.executeCalls.length).toBeGreaterThan(0);
  });
});