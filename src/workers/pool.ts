/**
 * Worker Pool - Manages a pool of worker threads for distributed task execution
 */

import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import * as path from 'path';
import { ConfigurationManager } from '../config/manager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Worker message types
 */
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

/**
 * Worker info structure
 */
export interface WorkerInfo {
  id: string;
  worker: Worker;
  status: 'idle' | 'busy' | 'error';
  lastTask?: string;
  error?: string;
  createdAt: number;
  taskCount: number;
}

/**
 * Worker pool options
 */
export interface WorkerPoolOptions {
  size?: number;
  maxConcurrent?: number;
  taskTimeout?: number;
  workerScript?: string;
}

/**
 * Worker Pool class
 * 
 * Manages a pool of worker threads for distributed task execution
 */
export class WorkerPool extends EventEmitter {
  private static instance: WorkerPool;
  private workers: Map<string, WorkerInfo> = new Map();
  private taskQueue: Map<string, {
    taskType: string;
    data: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    submittedAt: number;
  }> = new Map();
  private size: number;
  private maxConcurrent: number;
  private taskTimeout: number;
  private workerScript: string;
  private workerCount = 0;
  private timeoutChecker: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  
  private constructor(options: WorkerPoolOptions = {}) {
    super();
    
    const configManager = ConfigurationManager.getInstance();
    
    this.size = options.size || configManager.get('worker.poolSize', 4);
    this.maxConcurrent = options.maxConcurrent || configManager.get('worker.maxConcurrent', 10);
    this.taskTimeout = options.taskTimeout || configManager.get('worker.taskTimeout', 60000);
    this.workerScript = options.workerScript || path.resolve(__dirname, 'worker.js');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(options: WorkerPoolOptions = {}): WorkerPool {
    if (!WorkerPool.instance) {
      WorkerPool.instance = new WorkerPool(options);
    }
    return WorkerPool.instance;
  }
  
  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Create initial worker pool
    for (let i = 0; i < this.size; i++) {
      await this.createWorker();
    }
    
    // Start timeout checker
    this.timeoutChecker = setInterval(() => this.checkTimeouts(), 1000);
    
    this.initialized = true;
  }
  
  /**
   * Shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    // Stop timeout checker
    if (this.timeoutChecker) {
      clearInterval(this.timeoutChecker);
      this.timeoutChecker = null;
    }
    
    // Terminate all workers
    const terminationPromises = [];
    for (const workerInfo of this.workers.values()) {
      terminationPromises.push(new Promise<void>((resolve) => {
        workerInfo.worker.once('exit', () => resolve());
        workerInfo.worker.terminate();
      }));
    }
    
    await Promise.all(terminationPromises);
    
    // Clear maps
    this.workers.clear();
    this.taskQueue.clear();
    
    this.initialized = false;
  }
  
  /**
   * Create a new worker
   */
  private async createWorker(): Promise<string> {
    const workerId = `worker-${this.workerCount++}-${uuidv4().slice(0, 8)}`;
    
    try {
      // Create worker from worker script
      const worker = new Worker(this.workerScript, {
        workerData: { workerId }
      });
      
      // Set up worker info
      const workerInfo: WorkerInfo = {
        id: workerId,
        worker,
        status: 'idle',
        createdAt: Date.now(),
        taskCount: 0
      };
      
      this.workers.set(workerId, workerInfo);
      
      // Set up message handler
      worker.on('message', (message: WorkerResponseMessage | WorkerStatusMessage) => {
        if (message.type === 'response') {
          this.handleWorkerResponse(message as WorkerResponseMessage);
        } else if (message.type === 'status') {
          this.handleWorkerStatus(message as WorkerStatusMessage);
        }
      });
      
      // Set up error handler
      worker.on('error', (error) => {
        const workerInfo = this.workers.get(workerId);
        if (workerInfo) {
          workerInfo.status = 'error';
          workerInfo.error = error.message || String(error);
        }
        
        this.emit('worker:error', { workerId, error });
        
        // Replace the worker
        this.replaceWorker(workerId);
      });
      
      // Set up exit handler
      worker.on('exit', (code) => {
        this.emit('worker:exit', { workerId, code });
        
        // Replace the worker if it exited unexpectedly
        if (code !== 0) {
          this.replaceWorker(workerId);
        }
      });
      
      // Initialize worker
      worker.postMessage({
        type: 'init',
        workerId,
        config: {}
      } as WorkerInitMessage);
      
      this.emit('worker:created', { workerId });
      
      return workerId;
    } catch (error) {
      this.emit('worker:creation:error', { error });
      throw error;
    }
  }
  
  /**
   * Replace a worker that has failed or exited
   */
  private async replaceWorker(workerId: string): Promise<void> {
    // Remove the old worker
    this.workers.delete(workerId);
    
    // Create a new worker
    try {
      await this.createWorker();
    } catch (error) {
      console.error('Failed to replace worker:', error);
    }
    
    // Process queue to handle any pending tasks
    this.processQueue();
  }
  
  /**
   * Handle worker status message
   */
  private handleWorkerStatus(message: WorkerStatusMessage): void {
    const workerInfo = this.workers.get(message.workerId);
    if (!workerInfo) {
      return;
    }
    
    const previousStatus = workerInfo.status;
    workerInfo.status = message.status;
    
    if (message.error) {
      workerInfo.error = message.error;
    }
    
    this.emit('worker:status', { 
      workerId: message.workerId, 
      status: message.status,
      previousStatus,
      error: message.error
    });
    
    // If worker is now idle, process queue
    if (message.status === 'idle' && previousStatus !== 'idle') {
      this.processQueue();
    }
  }
  
  /**
   * Handle worker response message
   */
  private handleWorkerResponse(message: WorkerResponseMessage): void {
    const { taskId, result, error } = message;
    
    // Find the task in the queue
    const taskInfo = this.taskQueue.get(taskId);
    if (!taskInfo) {
      return;
    }
    
    // Remove task from queue
    this.taskQueue.delete(taskId);
    
    // Resolve or reject the promise
    if (error) {
      taskInfo.reject(new Error(error));
    } else {
      taskInfo.resolve(result);
    }
    
    // Process queue for next tasks
    this.processQueue();
  }
  
  /**
   * Execute a task on a worker
   */
  async executeTask<T>(taskType: string, data: any): Promise<T> {
    if (!this.initialized) {
      throw new Error('Worker pool not initialized');
    }
    
    const taskId = `task-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    return new Promise<T>((resolve, reject) => {
      // Add task to queue
      this.taskQueue.set(taskId, {
        taskType,
        data,
        resolve,
        reject,
        submittedAt: Date.now()
      });
      
      // Process queue
      this.processQueue();
    });
  }
  
  /**
   * Process the task queue
   */
  private processQueue(): void {
    // Find idle workers
    const idleWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');
    
    if (idleWorkers.length === 0) {
      return;
    }
    
    // Get pending tasks
    const pendingTasks = Array.from(this.taskQueue.entries())
      .filter(([_, task]) => !task.worker);
    
    if (pendingTasks.length === 0) {
      return;
    }
    
    // Assign tasks to workers
    for (const [taskId, taskInfo] of pendingTasks) {
      if (idleWorkers.length === 0) {
        break; // No more idle workers
      }
      
      const workerInfo = idleWorkers.shift()!;
      
      // Mark worker as busy
      workerInfo.status = 'busy';
      workerInfo.lastTask = taskId;
      workerInfo.taskCount++;
      
      // Send task to worker
      workerInfo.worker.postMessage({
        type: 'task',
        taskId,
        taskType: taskInfo.taskType,
        data: taskInfo.data
      } as WorkerTaskMessage);
      
      this.emit('task:assigned', { 
        taskId, 
        workerId: workerInfo.id,
        taskType: taskInfo.taskType
      });
    }
  }
  
  /**
   * Check for task timeouts
   */
  private checkTimeouts(): void {
    const now = Date.now();
    
    // Check for timed out tasks
    for (const [taskId, taskInfo] of this.taskQueue.entries()) {
      if (now - taskInfo.submittedAt > this.taskTimeout) {
        // Task has timed out
        this.taskQueue.delete(taskId);
        
        taskInfo.reject(new Error(`Task timed out after ${this.taskTimeout}ms`));
        
        this.emit('task:timeout', { taskId, taskType: taskInfo.taskType });
      }
    }
  }
  
  /**
   * Get worker stats
   */
  getStats(): {
    totalWorkers: number;
    idleWorkers: number;
    busyWorkers: number;
    errorWorkers: number;
    pendingTasks: number;
    totalTasksProcessed: number;
  } {
    const idleWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle').length;
    
    const busyWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'busy').length;
    
    const errorWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'error').length;
    
    const totalTasksProcessed = Array.from(this.workers.values())
      .reduce((sum, worker) => sum + worker.taskCount, 0);
    
    return {
      totalWorkers: this.workers.size,
      idleWorkers,
      busyWorkers,
      errorWorkers,
      pendingTasks: this.taskQueue.size,
      totalTasksProcessed
    };
  }
}