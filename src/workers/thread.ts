/**
 * Worker Thread
 * 
 * Provides a wrapper around Node.js worker_threads for task execution
 * in separate threads.
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as path from 'path';

export interface WorkerInitMessage {
  type: 'init';
  workerId: string;
  config: any;
}

export interface WorkerTaskMessage {
  type: 'task';
  taskId: string;
  taskType: string;
  data: any;
}

export interface WorkerResponseMessage {
  type: 'response';
  taskId: string;
  result: any;
  error?: string;
}

export interface WorkerStatusMessage {
  type: 'status';
  workerId: string;
  status: 'idle' | 'busy' | 'error';
  error?: string;
}

// Worker thread implementation
if (!isMainThread) {
  // This code runs in the worker thread
  
  // Worker state
  let workerId: string = '';
  let config: any = {};
  let taskHandlers: Map<string, (data: any) => Promise<any>> = new Map();
  
  // Register task handlers
  function registerTaskHandler(taskType: string, handler: (data: any) => Promise<any>): void {
    taskHandlers.set(taskType, handler);
  }
  
  // Listen for messages from the main thread
  parentPort?.on('message', async (message: WorkerInitMessage | WorkerTaskMessage) => {
    try {
      if (message.type === 'init') {
        // Initialize worker
        workerId = message.workerId;
        config = message.config;
        
        // Send status message
        parentPort?.postMessage({
          type: 'status',
          workerId,
          status: 'idle'
        } as WorkerStatusMessage);
      } else if (message.type === 'task') {
        // Execute task
        const { taskId, taskType, data } = message;
        
        // Send busy status
        parentPort?.postMessage({
          type: 'status',
          workerId,
          status: 'busy'
        } as WorkerStatusMessage);
        
        // Find task handler
        const handler = taskHandlers.get(taskType);
        if (!handler) {
          throw new Error(`No handler registered for task type: ${taskType}`);
        }
        
        // Execute handler
        const result = await handler(data);
        
        // Send response
        parentPort?.postMessage({
          type: 'response',
          taskId,
          result
        } as WorkerResponseMessage);
        
        // Send idle status
        parentPort?.postMessage({
          type: 'status',
          workerId,
          status: 'idle'
        } as WorkerStatusMessage);
      }
    } catch (error) {
      // Send error response
      if (message.type === 'task') {
        parentPort?.postMessage({
          type: 'response',
          taskId: message.taskId,
          result: null,
          error: error instanceof Error ? error.message : String(error)
        } as WorkerResponseMessage);
      }
      
      // Send error status
      parentPort?.postMessage({
        type: 'status',
        workerId: workerId || 'unknown',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      } as WorkerStatusMessage);
    }
  });
  
  // Register built-in task handlers
  registerTaskHandler('echo', async (data) => {
    // Simple echo handler for testing
    return data;
  });
}

/**
 * Create a worker thread
 */
export function createWorker(workerId: string, config: any = {}): Worker {
  // Create worker instance
  const worker = new Worker(path.resolve(__filename), {
    workerData: {
      workerId
    }
  });
  
  // Initialize worker
  worker.postMessage({
    type: 'init',
    workerId,
    config
  } as WorkerInitMessage);
  
  return worker;
}