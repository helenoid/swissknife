// test/unit/workers/simple-worker-pool.test.js
/**
 * Simple Worker Pool Tests
 * This file tests a mocked version of the worker pool to validate our testing approach
 */

describe('Worker Pool', () => {
  // Mock worker pool implementation
  class MockWorkerThread extends require('events').EventEmitter {
    constructor(id) {
      super();
      this.id = id;
      this.status = 'idle';
    }
    
    execute(task) {
      this.status = 'busy';
      return Promise.resolve({ taskId: task.id, result: 'success' });
    }
    
    terminate() {
      this.status = 'terminated';
      return Promise.resolve();
    }
  }
  
  class MockWorkerPool {
    constructor(minWorkers = 2) {
      this.workers = [];
      this.idleWorkers = [];
      
      for (let i = 0; i < minWorkers; i++) {
        const worker = new MockWorkerThread(i);
        this.workers.push(worker);
        this.idleWorkers.push(worker);
      }
    }
    
    async submitTask(taskType, args = {}) {
      const worker = this.idleWorkers.shift();
      if (!worker) {
        throw new Error('No idle workers available');
      }
      
      const task = { id: `task-${Date.now()}`, type: taskType, args };
      
      try {
        const result = await worker.execute(task);
        this.idleWorkers.push(worker);
        return result;
      } catch (error) {
        this.idleWorkers.push(worker);
        throw error;
      }
    }
    
    terminate() {
      for (const worker of this.workers) {
        worker.terminate();
      }
      this.workers = [];
      this.idleWorkers = [];
    }
  }
  
  let workerPool;
  
  beforeEach(() => {
    workerPool = new MockWorkerPool(2);
  });
  
  afterEach(() => {
    if (workerPool) {
      workerPool.terminate();
    }
  });
  
  test('should initialize with correct number of workers', () => {
    expect(workerPool.workers.length).toBe(2);
    expect(workerPool.idleWorkers.length).toBe(2);
  });
  
  test('should execute tasks', async () => {
    const result = await workerPool.submitTask('testTask', { value: 123 });
    expect(result.result).toBe('success');
    // Worker should be back in idle pool
    expect(workerPool.idleWorkers.length).toBe(2);
  });
  
  test('should throw error when no workers available', async () => {
    // Make a task to remove one worker from idle pool
    const task1 = workerPool.submitTask('testTask');
    const task2 = workerPool.submitTask('testTask');
    
    // This should throw since all workers are busy
    await expect(async () => {
      await workerPool.submitTask('testTask');
    }).rejects.toThrow('No idle workers available');
    
    // Resolve pending tasks to avoid unhandled promise rejections
    await task1;
    await task2;
  });
  
  test('should terminate all workers', () => {
    workerPool.terminate();
    expect(workerPool.workers.length).toBe(0);
    expect(workerPool.idleWorkers.length).toBe(0);
  });
});
