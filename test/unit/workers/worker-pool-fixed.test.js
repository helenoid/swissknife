// test/unit/workers/worker-pool-fixed.test.js
const { WorkerPool } = require('../../../src/workers/worker-pool');
const { WorkerThread, WorkerStatus } = require('../../../src/workers/worker-thread');
const { EventEmitter } = require('events');

// Mock global timers
const mockSetInterval = jest.fn().mockReturnValue('mock-interval-id');
const mockClearInterval = jest.fn();

global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

// Mock the WorkerThread implementation
jest.mock('../../../src/workers/worker-thread', () => {
  const originalModule = jest.requireActual('events');
  
  class MockWorkerThread extends originalModule.EventEmitter {
    constructor(options) {
      super();
      this.id = options.id;
      this.workerId = options.id; // Add workerId property
      this.name = options.name || `worker-${options.id}`;
      this.status = 'idle';
      this.lastActiveTime = new Date();
      this.currentTask = null;
    }
    
    execute(task) {
      this.status = 'busy';
      this.currentTask = task;
      return Promise.resolve();
    }
    
    terminate() {
      this.status = 'terminated';
      this.emit('terminated', { workerId: this.workerId });
      return Promise.resolve();
    }
    
    getStatus() {
      return this.status;
    }
  }
  
  return {
    WorkerThread: jest.fn().mockImplementation((options) => new MockWorkerThread(options)),
    WorkerStatus: {
      IDLE: 'idle',
      BUSY: 'busy',
      ERROR: 'error',
      TERMINATED: 'terminated'
    }
  };
});

describe('WorkerPool', () => {
  let workerPool;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton for testing
    if (WorkerPool.instance) {
      delete WorkerPool.instance;
    }
  });
  
  afterEach(() => {
    if (workerPool && workerPool.running) {
      workerPool.stop();
    }
  });
  
  test('should create singleton instance with default options', () => {
    workerPool = WorkerPool.getInstance();
    const instance2 = WorkerPool.getInstance();
    
    expect(workerPool).toBe(instance2);
    expect(workerPool.minWorkers).toBe(1);
    expect(workerPool.maxWorkers).toBe(5);
  });
  
  test('should create singleton instance with custom options', () => {
    workerPool = WorkerPool.getInstance({
      minWorkers: 2,
      maxWorkers: 10,
      taskTimeout: 5000
    });
    
    expect(workerPool.minWorkers).toBe(2);
    expect(workerPool.maxWorkers).toBe(10);
    expect(workerPool.taskTimeout).toBe(5000);
  });
  
  test('should start and create minimum number of workers', () => {
    workerPool = WorkerPool.getInstance({
      minWorkers: 3
    });
    
    const startEmitSpy = jest.spyOn(workerPool, 'emit');
    workerPool.start();
    
    expect(WorkerThread).toHaveBeenCalledTimes(3);
    expect(workerPool.running).toBe(true);
    expect(startEmitSpy).toHaveBeenCalledWith('started');
    
    // Check that the processing interval was set
    expect(mockSetInterval).toHaveBeenCalled();
  });
  
  test('should stop and terminate all workers', () => {
    workerPool = WorkerPool.getInstance({
      minWorkers: 2
    });
    workerPool.start();
    
    const stopEmitSpy = jest.spyOn(workerPool, 'emit');
    workerPool.stop();
    
    expect(workerPool.running).toBe(false);
    expect(stopEmitSpy).toHaveBeenCalledWith('stopped');
    expect(mockClearInterval).toHaveBeenCalled();
    
    // Workers map should be cleared
    expect(workerPool.getWorkers().size).toBe(0);
  });
  
  test('should register and submit task handlers', () => {
    workerPool = WorkerPool.getInstance();
    
    // Register a task handler
    const mockHandler = jest.fn().mockResolvedValue('test result');
    workerPool.registerTaskHandler('testTask', mockHandler);
    
    expect(workerPool.taskHandlers.testTask).toBe(mockHandler);
  });
  
  test('should throw error when submitting unknown task type', async () => {
    workerPool = WorkerPool.getInstance();
    workerPool.start();
    
    await expect(workerPool.submitTask('unknownTask')).rejects.toThrow(/Task type not supported/);
  });
});
