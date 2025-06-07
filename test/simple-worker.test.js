/**
 * Simple Worker System Test
 * 
 * A simplified standalone worker system implementation for testing
 * without external dependencies.
 */

// Simple Worker class
class Worker {
  constructor(options = {}) {
    this.id = options.id || `worker-${Math.random().toString(36).substring(2, 9)}`;
    this.name = options.name || this.id;
    this.state = 'idle';
    this.currentTask = null;
    this.processorFn = options.processor || (task => task.data);
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.processedCount = 0;
    this.errorCount = 0;
  }
  
  async process(task) {
    if (this.state === 'busy') {
      throw new Error('Worker is busy');
    }
    
    this.state = 'busy';
    this.currentTask = task;
    
    try {
      const result = await Promise.resolve(this.processorFn(task));
      this.processedCount++;
      this.state = 'idle';
      this.currentTask = null;
      this.onComplete(result, task);
      return result;
    } catch (error) {
      this.errorCount++;
      this.state = 'error';
      this.onError(error, task);
      throw error;
    }
  }
  
  isBusy() {
    return this.state === 'busy';
  }
  
  reset() {
    this.state = 'idle';
    this.currentTask = null;
    return this;
  }
  
  getStats() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      processedCount: this.processedCount,
      errorCount: this.errorCount
    };
  }
}

// Simple WorkerPool for managing multiple workers
class WorkerPool {
  constructor(options = {}) {
    this.capacity = options.capacity || 3;
    this.workers = [];
    this.taskQueue = [];
    this.processingCount = 0;
    this.completedCount = 0;
    this.errorCount = 0;
    
    // Create initial workers
    for (let i = 0; i < this.capacity; i++) {
      this.createWorker();
    }
  }
  
  createWorker(options = {}) {
    const workerOptions = {
      ...options,
      onComplete: (result, task) => {
        this.processingCount--;
        this.completedCount++;
        if (options.onComplete) options.onComplete(result, task);
        this.processNextTask();
      },
      onError: (error, task) => {
        this.processingCount--;
        this.errorCount++;
        if (options.onError) options.onError(error, task);
        this.processNextTask();
      }
    };
    
    const worker = new Worker(workerOptions);
    this.workers.push(worker);
    return worker;
  }
  
  addTask(task) {
    this.taskQueue.push(task);
    this.processNextTask();
    return task;
  }
  
  processNextTask() {
    if (this.taskQueue.length === 0) return false;
    
    const availableWorker = this.workers.find(worker => !worker.isBusy());
    if (!availableWorker) return false;
    
    const task = this.taskQueue.shift();
    this.processingCount++;
    
    // Process the task asynchronously
    availableWorker.process(task).catch(() => {
      // Error already handled by worker
    });
    
    return true;
  }
  
  isBusy() {
    return this.processingCount > 0;
  }
  
  getStats() {
    return {
      capacity: this.capacity,
      activeWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.isBusy()).length,
      pendingTasks: this.taskQueue.length,
      processingCount: this.processingCount,
      completedCount: this.completedCount,
      errorCount: this.errorCount,
      workers: this.workers.map(worker => worker.getStats())
    };
  }
}

// Simple Task class
class Task {
  constructor(data, options = {}) {
    this.id = options.id || `task-${Math.random().toString(36).substring(2, 9)}`;
    this.data = data;
    this.priority = options.priority || 0;
    this.retries = 0;
    this.maxRetries = options.maxRetries || 0;
    this.createdAt = Date.now();
  }
}

// Tests
describe('Simple Worker System', () => {
  // Worker Tests
  describe('Worker', () => {
    let worker;
    
    beforeEach(() => {
      worker = new Worker({
        id: 'test-worker',
        name: 'Test Worker'
      });
    });
    
    test('worker can be instantiated', () => {
      expect(worker).toBeDefined();
      expect(worker.id).toBe('test-worker');
      expect(worker.name).toBe('Test Worker');
      expect(worker.state).toBe('idle');
    });
    
    test('worker can process tasks', async () => {
      const task = new Task({ value: 42 });
      const result = await worker.process(task);
      
      expect(result).toEqual({ value: 42 });
      expect(worker.state).toBe('idle');
      expect(worker.processedCount).toBe(1);
    });
    
    test('worker handles errors properly', async () => {
      const errorHandler = jest.fn();
      worker.onError = errorHandler;
      worker.processorFn = () => { throw new Error('Test error'); };
      
      const task = new Task({ value: 'error' });
      
      await expect(worker.process(task)).rejects.toThrow('Test error');
      expect(worker.state).toBe('error');
      expect(worker.errorCount).toBe(1);
      expect(errorHandler).toHaveBeenCalled();
    });
    
    test('worker cannot process multiple tasks simultaneously', async () => {
      const task1 = new Task({ value: 1 });
      
      // Start processing task1
      const promise = worker.process(task1);
      
      // Try to process another task while busy
      const task2 = new Task({ value: 2 });
      await expect(worker.process(task2)).rejects.toThrow('Worker is busy');
      
      // Complete the first task
      await promise;
      expect(worker.state).toBe('idle');
    });
  });
  
  // WorkerPool Tests
  describe('WorkerPool', () => {
    let pool;
    
    beforeEach(() => {
      pool = new WorkerPool({
        capacity: 2
      });
    });
    
    test('pool can be instantiated with workers', () => {
      expect(pool).toBeDefined();
      expect(pool.workers.length).toBe(2);
      expect(pool.capacity).toBe(2);
    });
    
    test('pool can process tasks', async () => {
      const results = [];
      
      // Add completion handler for testing
      pool.workers.forEach(worker => {
        worker.onComplete = (result) => {
          results.push(result);
        };
      });
      
      // Add tasks
      const task1 = new Task({ value: 1 });
      const task2 = new Task({ value: 2 });
      const task3 = new Task({ value: 3 });
      
      pool.addTask(task1);
      pool.addTask(task2);
      pool.addTask(task3);
      
      // Wait for processing to complete
      await new Promise((resolve, reject) => {
        let timeout;
        const checkInterval = setInterval(() => {
          if (results.length === 3) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }
        }, 50);
        
        // Add timeout to prevent hanging
        timeout = setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Test timeout waiting for tasks to complete'));
        }, 5000);
      });
      
      expect(results).toHaveLength(3);
      expect(results).toContainEqual({ value: 1 });
      expect(results).toContainEqual({ value: 2 });
      expect(results).toContainEqual({ value: 3 });
      expect(pool.completedCount).toBe(3);
    });
    
    test('pool handles errors in tasks', async () => {
      const errors = [];
      
      // Set up error handlers
      pool.workers.forEach(worker => {
        worker.processorFn = (task) => {
          if (task.data.shouldFail) {
            throw new Error(`Task ${task.id} failed`);
          }
          return task.data;
        };
        
        worker.onError = (error) => {
          errors.push(error.message);
        };
      });
      
      // Add tasks - one will fail
      const task1 = new Task({ value: 1 });
      const task2 = new Task({ shouldFail: true });
      
      pool.addTask(task1);
      pool.addTask(task2);
      
      // Wait for processing to complete
      await new Promise((resolve, reject) => {
        let timeout;
        const checkInterval = setInterval(() => {
          if (pool.completedCount + pool.errorCount === 2) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }
        }, 50);
        
        // Add timeout to prevent hanging
        timeout = setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Test timeout waiting for tasks to complete'));
        }, 5000);
      });
      
      expect(pool.completedCount).toBe(1);
      expect(pool.errorCount).toBe(1);
      expect(errors.length).toBe(1);
      expect(errors[0]).toMatch(/Task .* failed/);
    });
    
    test('pool provides accurate statistics', async () => {
      // Add some tasks
      const task1 = new Task({ value: 1 });
      const task2 = new Task({ value: 2 });
      
      pool.addTask(task1);
      pool.addTask(task2);
      
      // Initially the tasks should be processing
      const initialStats = pool.getStats();
      expect(initialStats.pendingTasks).toBe(0); // Both immediately assigned to workers
      expect(initialStats.busyWorkers).toBe(2);
      
      // Wait for tasks to complete
      await new Promise((resolve, reject) => {
        let timeout;
        const checkInterval = setInterval(() => {
          if (pool.completedCount === 2) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }
        }, 50);
        
        // Add timeout to prevent hanging
        timeout = setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Test timeout waiting for tasks to complete'));
        }, 5000);
      });
      
      // After completion
      const finalStats = pool.getStats();
      expect(finalStats.completedCount).toBe(2);
      expect(finalStats.busyWorkers).toBe(0);
      expect(finalStats.pendingTasks).toBe(0);
    });
  });
});
