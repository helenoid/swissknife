/**
 * Mock worker implementations for tests
 * 
 * Provides mock worker pool and related functionality for testing
 */

import { EventEmitter } from 'events';

/**
 * Creates a mock worker pool for testing purposes
 * 
 * @param {number} workerCount Number of workers in the pool
 * @param {Object} options Pool configuration options
 * @returns {Object} Mock worker pool
 */
export function createMockWorkerPool(workerCount = 2, options = {}) {
  const workers = [];
  const tasks = new Map();
  const emitter = new EventEmitter();
  const taskHandlers = options.taskHandlers || {};
  
  // Create mock workers
  for (let i = 0; i < workerCount; i++) {
    workers.push({
      id: `worker-${i}`,
      status: 'idle',
      tasks: [],
      busy: false
    });
  }
  
  // Mock worker pool
  return {
    workers,
    taskHandlers,
    
    initialize: jest.fn().mockResolvedValue(true),
    
    shutdown: jest.fn().mockResolvedValue(true),
    
    getWorkerCount: jest.fn().mockReturnValue(workerCount),
    
    getIdleWorkerCount: jest.fn().mockImplementation(() => {
      return workers.filter(w => !w.busy).length;
    }),
    
    executeTask: jest.fn().mockImplementation((taskType, data) => {
      return new Promise((resolve, reject) => {
        // Find an idle worker
        const idleWorker = workers.find(w => !w.busy);
        
        if (idleWorker) {
          const taskId = `task-${Math.random().toString(36).substring(2, 12)}`;
          
          // Mark worker as busy
          idleWorker.busy = true;
          idleWorker.tasks.push(taskId);
          
          // Store task
          tasks.set(taskId, {
            id: taskId,
            type: taskType,
            data,
            workerId: idleWorker.id
          });
          
          // Process the task
          setTimeout(async () => {
            try {
              let result;
              
              // Use task handler if available, otherwise return success
              if (taskHandlers[taskType]) {
                result = await taskHandlers[taskType](data);
              } else {
                result = { 
                  success: true, 
                  message: `Task ${taskType} processed successfully`
                };
              }
              
              // Mark worker as idle again
              idleWorker.busy = false;
              idleWorker.tasks = idleWorker.tasks.filter(id => id !== taskId);
              
              // Remove task
              tasks.delete(taskId);
              
              // Emit task completion event
              emitter.emit('taskComplete', {
                taskId,
                result
              });
              
              resolve(result);
            } catch (error) {
              // Mark worker as idle again
              idleWorker.busy = false;
              idleWorker.tasks = idleWorker.tasks.filter(id => id !== taskId);
              
              // Remove task
              tasks.delete(taskId);
              
              // Emit task error event
              emitter.emit('taskError', {
                taskId,
                error
              });
              
              reject(error);
            }
          }, options.taskDelay || 50);
        } else {
          // No idle worker available
          reject(new Error('No idle worker available'));
        }
      });
    }),
    
    on: jest.fn().mockImplementation((event, listener) => {
      emitter.on(event, listener);
      return () => emitter.off(event, listener);
    }),
    
    // For testing
    _reset: () => {
      tasks.clear();
      workers.forEach(worker => {
        worker.busy = false;
        worker.tasks = [];
      });
    }
  };
}

/**
 * Creates a mock worker for testing
 * 
 * @param {string} id Worker ID
 * @param {Object} options Worker configuration
 * @returns {Object} Mock worker object
 */
export function createMockWorker(id = 'test-worker', options = {}) {
  const emitter = new EventEmitter();
  
  // Default task handler
  const defaultHandler = async (task) => {
    return { success: true, message: `Task ${task.type} processed`, result: {} };
  };
  
  // Worker object
  return {
    id,
    status: 'idle',
    
    initialize: jest.fn().mockResolvedValue(true),
    
    shutdown: jest.fn().mockResolvedValue(true),
    
    executeTask: jest.fn().mockImplementation((task) => {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const handler = options.taskHandlers?.[task.type] || defaultHandler;
            const result = await handler(task);
            
            emitter.emit('taskComplete', {
              taskId: task.id,
              result
            });
            
            resolve(result);
          } catch (error) {
            emitter.emit('taskError', {
              taskId: task.id,
              error
            });
            
            reject(error);
          }
        }, options.taskDelay || 50);
      });
    }),
    
    on: jest.fn().mockImplementation((event, listener) => {
      emitter.on(event, listener);
      return () => emitter.off(event, listener);
    })
  };
}