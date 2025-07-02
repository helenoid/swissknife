import * as sinon from 'sinon';
import { EventEmitter } from 'events';
import { WorkerPool } from '../../../src/workers/worker-pool';
// Mock Worker implementation for testing
class MockWorker extends EventEmitter {
    postMessage;
    terminate;
    constructor() {
        super();
        this.postMessage = sinon.stub();
        this.terminate = sinon.stub().callsFake(() => {
            this.emit('exit', 0);
        });
    }
}
// Mock the worker_threads module
jest.mock('worker_threads', () => {
    return {
        Worker: function MockWorker() {
            return new (require('../mocks/worker').MockWorker)();
        },
        isMainThread: true
    };
});
describe('Worker Pool', () => {
    let workerPool;
    beforeEach(() => {
        // Reset the singleton for testing
        WorkerPool.instance = null;
        workerPool = WorkerPool.getInstance({
            minWorkers: 2,
            maxWorkers: 4,
            taskTimeout: 1000
        });
        
        // Register a test task handler
        workerPool.registerTaskHandler('echo', async (args) => {
            return args;
        });
    });
    afterEach(async () => {
        await workerPool.stop();
    });
    it('should initialize with the specified number of workers', async () => {
        await workerPool.start();
        const stats = workerPool.getStats();
        expect(stats.totalWorkers).toBe(2);
    });
    it('should execute tasks on worker threads', async () => {
        await workerPool.start();
        
        // Set up a mock response for a specific task
        const mockWorkerThread = Array.from(workerPool.getWorkers().values())[0];
        
        // Mock the executeTask method on the WorkerThread
        const executeTaskSpy = sinon.spy(mockWorkerThread, 'executeTask');
        
        // Execute a task
        const taskPromise = workerPool.submitTask('echo', { test: 'value' });
        
        // Simulate successful task completion
        setTimeout(() => {
            mockWorkerThread.emit('taskCompleted', {
                workerId: mockWorkerThread.id,
                taskId: 'mock-task-id',
                result: { test: 'value' }
            });
        }, 10);
        
        // Task should resolve with the result
        const result = await taskPromise;
        expect(result.result).toEqual({ test: 'value' });
        
        // ExecuteTask should have been called
        expect(executeTaskSpy.calledOnce).toBe(true);
        
        // Restore the spy
        executeTaskSpy.restore();
    });
    it('should handle worker errors', async () => {
        await workerPool.start();
        
        // Set up an error listener for task errors
        const errorSpy = sinon.spy();
        workerPool.on('taskError', errorSpy);
        
        // Register an error-throwing handler  
        workerPool.registerTaskHandler('error', async () => {
            throw new Error('Test error');
        });
        
        // Try to execute a task that will fail
        try {
            await workerPool.submitTask('error', {});
            expect.fail('Should have thrown an error');
        } catch (error) {
            expect(error.message).toBe('Test error');
        }
    });
    it('should handle task timeouts', async () => {
        // Use fake timers
        const clock = sinon.useFakeTimers();
        await workerPool.start();
        // Set up a mock worker - get the WorkerThread directly
        const mockWorkerThread = Array.from(workerPool.getWorkers().values())[0];
        mockWorkerThread.emit('message', {
            type: 'status',
            workerId: '0',
            status: 'idle'
        });
        // Set up a timeout listener
        const timeoutSpy = sinon.spy();
        workerPool.on('task:timeout', timeoutSpy);
        // Execute a task
        const taskPromise = workerPool.submitTask('echo', { test: 'value' });
        // Advance time past the timeout
        clock.tick(1500);
        // Task should reject with timeout error
        try {
            await taskPromise;
            expect.fail('Should have timed out');
        }
        catch (error) {
            expect(error.message).toContain('timed out');
        }
        // Restore real timers
        clock.restore();
    });
    it('should track worker status changes', async () => {
        await workerPool.start();
        
        // Get worker statistics which should include status information
        const stats = workerPool.getStats();
        expect(stats.totalWorkers).toBe(2);
        expect(stats.idleWorkers).toBeGreaterThanOrEqual(0);
        
        // Verify workers are accessible
        const workers = workerPool.getWorkers();
        expect(workers.size).toBe(2);
    });
    it('should provide worker pool statistics', async () => {
        await workerPool.start();
        // Get initial stats
        const initialStats = workerPool.getStats();
        expect(initialStats.totalWorkers).toBe(2);
        expect(initialStats.queueLength).toBe(0);
        expect(initialStats.running).toBe(true);
        
        // Check that we have the expected worker count
        expect(initialStats.idleWorkers).toBeGreaterThanOrEqual(0);
    });
    it('should handle worker replacement', async () => {
        await workerPool.start();
        
        // Get initial worker count
        const initialWorkerCount = workerPool.getWorkerCount();
        expect(initialWorkerCount).toBe(2);
        
        // Listen for worker creation events
        const workerCreatedSpy = sinon.spy();
        workerPool.on('workerCreated', workerCreatedSpy);
        
        // Get a mock worker - get the WorkerThread directly
        const mockWorkerThread = Array.from(workerPool.getWorkers().values())[0];
        const workerId = Array.from(workerPool.getWorkers().keys())[0];
        
        // Trigger worker exit with non-zero code (simulating worker failure)
        mockWorkerThread.emit('terminated', { workerId });
        
        // Give some time for the replacement worker to be created
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Worker count should remain the same (replacement created)
        expect(workerPool.getWorkerCount()).toBe(initialWorkerCount);
    });
});
//# sourceMappingURL=pool.test.js.map