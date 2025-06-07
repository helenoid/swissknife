/**
 * Simple Task Manager Test
 * 
 * A minimal, reliable test suite for task management functionality.
 */

// Task states
const TaskState = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Helper for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple Task class
class Task {
  constructor(id, handler) {
    this.id = id;
    this.handler = handler;
    this.state = TaskState.PENDING;
    this.result = null;
    this.error = null;
  }
  
  async execute() {
    this.state = TaskState.RUNNING;
    
    try {
      this.result = await this.handler();
      this.state = TaskState.COMPLETED;
      return this.result;
    } catch (error) {
      this.error = error;
      this.state = TaskState.FAILED;
      throw error;
    }
  }
}

// Simple TaskManager
class TaskManager {
  constructor(maxConcurrent = 2) {
    this.tasks = new Map();
    this.maxConcurrent = maxConcurrent;
  }
  
  createTask(id, handler) {
    const task = new Task(id, handler);
    this.tasks.set(id, task);
    return task;
  }
  
  getTask(id) {
    return this.tasks.get(id);
  }
  
  async executeTask(id) {
    const task = this.getTask(id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task.execute();
  }
  
  async executeTasks(taskIds) {
    // Execute tasks in batches respecting maxConcurrent
    const results = [];
    
    // Process in batches
    for (let i = 0; i < taskIds.length; i += this.maxConcurrent) {
      const batch = taskIds.slice(i, i + this.maxConcurrent);
      const promises = batch.map(id => {
        return this.executeTask(id).catch(err => ({ error: err }));
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// Tests
describe('Simple TaskManager', () => {
  let taskManager;
  
  beforeEach(() => {
    taskManager = new TaskManager(2); // Max 2 concurrent tasks
  });
  
  test('creates and executes tasks', async () => {
    // Create tasks
    const task1 = taskManager.createTask('task1', async () => 'result1');
    const task2 = taskManager.createTask('task2', async () => 'result2');
    
    // Execute first task
    const result1 = await taskManager.executeTask('task1');
    expect(result1).toBe('result1');
    expect(task1.state).toBe(TaskState.COMPLETED);
    
    // Execute second task
    const result2 = await taskManager.executeTask('task2');
    expect(result2).toBe('result2');
    expect(task2.state).toBe(TaskState.COMPLETED);
  });
  
  test('handles task failure', async () => {
    // Create a task that will fail
    const task = taskManager.createTask('failing-task', async () => {
      throw new Error('Task failed');
    });
    
    // Execute task and expect it to fail
    await expect(taskManager.executeTask('failing-task')).rejects.toThrow('Task failed');
    expect(task.state).toBe(TaskState.FAILED);
    expect(task.error).toBeTruthy();
  });
  
  test('executes tasks concurrently respecting limits', async () => {
    let runningCount = 0;
    let maxRunning = 0;
    
    // Create 5 tasks
    const taskIds = [];
    
    for (let i = 0; i < 5; i++) {
      const id = `task${i}`;
      taskManager.createTask(id, async () => {
        runningCount++;
        maxRunning = Math.max(maxRunning, runningCount);
        await wait(50); // Run for a bit
        runningCount--;
        return id;
      });
      taskIds.push(id);
    }
    
    // Execute all tasks
    await taskManager.executeTasks(taskIds);
    
    // Should never exceed maxConcurrent
    expect(maxRunning).toBeLessThanOrEqual(2);
  });
});
