/**
 * 🛠️ SwissKnife Worker Manager - Phase 4: Enhanced Worker Infrastructure
 * 
 * Comprehensive worker pool management system supporting:
 * - Compute workers for heavy computations and AI inference
 * - Audio workers for real-time music processing and collaboration
 * - Background workers for file indexing and peer discovery
 * - GPU acceleration via WebGPU workers
 * - Distributed worker coordination across P2P networks
 */

import { EventEmitter } from 'events';

export enum WorkerType {
  COMPUTE = 'compute',
  AUDIO = 'audio',
  AI_INFERENCE = 'ai-inference',
  FILE_PROCESSING = 'file-processing',
  CRYPTO = 'crypto',
  BACKGROUND_INDEXING = 'background-indexing',
  PEER_DISCOVERY = 'peer-discovery',
  IPFS_PINNING = 'ipfs-pinning',
  GPU_COMPUTE = 'gpu-compute'
}

export interface WorkerTask {
  id: string;
  type: WorkerType;
  priority: number;
  data: any;
  createdAt: Date;
  timeout: number;
  peerId?: string; // For distributed tasks
  requiresGPU?: boolean;
  memoryRequirement?: number; // MB
}

export interface WorkerCapability {
  type: WorkerType;
  maxConcurrency: number;
  hasGPU: boolean;
  availableMemory: number; // MB
  performanceScore: number; // 0-100
}

export interface WorkerStats {
  id: string;
  type: WorkerType;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  tasksCompleted: number;
  tasksInProgress: number;
  averageTaskTime: number; // ms
  memoryUsage: number; // MB
  cpuUsage: number; // %
  lastActivity: Date;
}

export interface DistributedWorkerInfo {
  peerId: string;
  capabilities: WorkerCapability[];
  currentLoad: number; // 0-1
  latency: number; // ms
  reliability: number; // 0-1
}

/**
 * Enhanced Worker Manager for distributed collaborative computing
 */
export class WorkerManager extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private workerStats: Map<string, WorkerStats> = new Map();
  private taskQueue: WorkerTask[] = [];
  private capabilities: WorkerCapability[] = [];
  private remoteWorkers: Map<string, DistributedWorkerInfo> = new Map();
  private isRunning: boolean = false;
  private maxWorkers: number = 8;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private p2pManager?: any, // CollaborativeP2PManager from Phase 2
    private ipfsNode?: any    // IPFS node from Phase 3
  ) {
    super();
    this.detectCapabilities();
  }

  /**
   * Initialize the worker manager and start processing
   */
  async initialize(): Promise<void> {
    console.log('🛠️ Initializing WorkerManager with enhanced capabilities...');
    
    this.isRunning = true;
    
    // Create initial worker pool
    await this.createInitialWorkers();
    
    // Start task processing
    this.startProcessing();
    
    // Set up P2P worker coordination if available
    if (this.p2pManager) {
      await this.setupDistributedWorkers();
    }
    
    console.log(`✅ WorkerManager initialized with ${this.workers.size} local workers`);
    this.emit('initialized', { localWorkers: this.workers.size });
  }

  /**
   * Detect system capabilities for optimal worker allocation
   */
  private async detectCapabilities(): Promise<void> {
    // Detect available cores
    const cores = navigator.hardwareConcurrency || 4;
    
    // Detect GPU capabilities
    const hasWebGPU = 'gpu' in navigator;
    const hasWebGL2 = !!document.createElement('canvas').getContext('webgl2');
    
    // Detect memory (estimate)
    const memory = (navigator as any).deviceMemory || 4; // GB
    
    // Audio capabilities
    const hasAudioWorklet = 'audioWorklet' in AudioContext.prototype;
    const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;

    this.capabilities = [
      {
        type: WorkerType.COMPUTE,
        maxConcurrency: Math.max(2, cores - 2),
        hasGPU: hasWebGPU,
        availableMemory: memory * 1024 * 0.3, // 30% of total memory
        performanceScore: cores * 10
      },
      {
        type: WorkerType.AUDIO,
        maxConcurrency: hasAudioWorklet ? 4 : 2,
        hasGPU: false,
        availableMemory: memory * 1024 * 0.1, // 10% for audio
        performanceScore: hasWebAudio ? 80 : 20
      },
      {
        type: WorkerType.AI_INFERENCE,
        maxConcurrency: hasWebGPU ? 2 : 1,
        hasGPU: hasWebGPU,
        availableMemory: memory * 1024 * 0.4, // 40% for AI
        performanceScore: hasWebGPU ? 90 : 50
      },
      {
        type: WorkerType.FILE_PROCESSING,
        maxConcurrency: 3,
        hasGPU: false,
        availableMemory: memory * 1024 * 0.2,
        performanceScore: 70
      }
    ];

    console.log('🔍 Detected system capabilities:', this.capabilities);
  }

  /**
   * Create initial worker pool based on capabilities
   */
  private async createInitialWorkers(): Promise<void> {
    for (const capability of this.capabilities) {
      const workerCount = Math.min(capability.maxConcurrency, this.maxWorkers);
      
      for (let i = 0; i < workerCount; i++) {
        await this.createWorker(capability.type);
      }
    }
  }

  /**
   * Create a worker of specified type
   */
  private async createWorker(type: WorkerType): Promise<string> {
    const workerId = `worker-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let workerScript: string;
    
    switch (type) {
      case WorkerType.AUDIO:
        workerScript = '/workers/audio-worker.js';
        break;
      case WorkerType.AI_INFERENCE:
        workerScript = '/workers/ai-worker.js';
        break;
      case WorkerType.GPU_COMPUTE:
        workerScript = '/workers/gpu-worker.js';
        break;
      case WorkerType.FILE_PROCESSING:
        workerScript = '/workers/file-worker.js';
        break;
      default:
        workerScript = '/workers/compute-worker.js';
    }

    try {
      const worker = new Worker(workerScript, { 
        type: 'module',
        name: workerId 
      });

      // Set up worker communication
      worker.onmessage = (event) => this.handleWorkerMessage(workerId, event);
      worker.onerror = (error) => this.handleWorkerError(workerId, error);

      // Initialize worker
      worker.postMessage({
        type: 'init',
        workerId,
        workerType: type,
        capabilities: this.getCapabilityForType(type)
      });

      this.workers.set(workerId, worker);
      this.workerStats.set(workerId, {
        id: workerId,
        type,
        status: 'idle',
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageTaskTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        lastActivity: new Date()
      });

      console.log(`✅ Created ${type} worker: ${workerId}`);
      this.emit('workerCreated', { workerId, type });
      
      return workerId;
    } catch (error) {
      console.error(`❌ Failed to create ${type} worker:`, error);
      throw error;
    }
  }

  /**
   * Submit a task to the worker pool
   */
  async submitTask(
    type: WorkerType,
    data: any,
    options: {
      priority?: number;
      timeout?: number;
      requiresGPU?: boolean;
      memoryRequirement?: number;
      distributed?: boolean;
    } = {}
  ): Promise<any> {
    const task: WorkerTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority: options.priority || 0,
      data,
      createdAt: new Date(),
      timeout: options.timeout || 30000,
      requiresGPU: options.requiresGPU || false,
      memoryRequirement: options.memoryRequirement || 0
    };

    // Add to queue
    this.taskQueue.push(task);
    this.sortTaskQueue();

    console.log(`📝 Task queued: ${task.id} (${type})`);
    this.emit('taskQueued', { task });

    // Try distributed execution if enabled and appropriate
    if (options.distributed && this.p2pManager && this.remoteWorkers.size > 0) {
      try {
        const result = await this.tryDistributedExecution(task);
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn('⚠️ Distributed execution failed, falling back to local:', error);
      }
    }

    // Return promise that resolves when task completes
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
      }, task.timeout);

      const cleanup = () => clearTimeout(timeout);

      this.once(`task-completed-${task.id}`, (result) => {
        cleanup();
        resolve(result);
      });

      this.once(`task-failed-${task.id}`, (error) => {
        cleanup();
        reject(error);
      });
    });
  }

  /**
   * Try executing task on remote peers
   */
  private async tryDistributedExecution(task: WorkerTask): Promise<any> {
    const suitablePeers = Array.from(this.remoteWorkers.values())
      .filter(peer => 
        peer.capabilities.some(cap => cap.type === task.type) &&
        peer.currentLoad < 0.8 &&
        (!task.requiresGPU || peer.capabilities.some(cap => cap.hasGPU))
      )
      .sort((a, b) => (a.latency * a.currentLoad) - (b.latency * b.currentLoad));

    if (suitablePeers.length === 0) {
      throw new Error('No suitable remote workers available');
    }

    const selectedPeer = suitablePeers[0];
    
    console.log(`🌐 Distributing task ${task.id} to peer ${selectedPeer.peerId}`);

    // Send task to remote peer via P2P
    const result = await this.p2pManager.sendTaskToPeer(selectedPeer.peerId, {
      taskId: task.id,
      type: task.type,
      data: task.data,
      timeout: task.timeout
    });

    return result;
  }

  /**
   * Start processing task queue
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100);
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Find idle workers
    const idleWorkers = Array.from(this.workerStats.entries())
      .filter(([_, stats]) => stats.status === 'idle')
      .map(([workerId, stats]) => ({ workerId, stats }));

    if (idleWorkers.length === 0) return;

    // Assign tasks to workers
    for (const { workerId, stats } of idleWorkers) {
      if (this.taskQueue.length === 0) break;

      // Find suitable task for this worker
      const taskIndex = this.taskQueue.findIndex(task => 
        task.type === stats.type &&
        (!task.requiresGPU || this.getCapabilityForType(task.type)?.hasGPU) &&
        (!task.memoryRequirement || task.memoryRequirement <= this.getCapabilityForType(task.type)?.availableMemory!)
      );

      if (taskIndex === -1) continue;

      const task = this.taskQueue.splice(taskIndex, 1)[0];
      this.assignTaskToWorker(workerId, task);
    }
  }

  /**
   * Assign task to specific worker
   */
  private assignTaskToWorker(workerId: string, task: WorkerTask): void {
    const worker = this.workers.get(workerId);
    const stats = this.workerStats.get(workerId);

    if (!worker || !stats) {
      console.error(`❌ Worker ${workerId} not found`);
      return;
    }

    // Update stats
    stats.status = 'busy';
    stats.tasksInProgress++;
    stats.lastActivity = new Date();

    // Send task to worker
    worker.postMessage({
      type: 'task',
      taskId: task.id,
      taskType: task.type,
      data: task.data
    });

    console.log(`🚀 Task ${task.id} assigned to worker ${workerId}`);
    this.emit('taskAssigned', { taskId: task.id, workerId });
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(workerId: string, event: MessageEvent): void {
    const { type, taskId, result, error, stats } = event.data;
    const workerStats = this.workerStats.get(workerId);

    if (!workerStats) return;

    switch (type) {
      case 'task-completed':
        workerStats.status = 'idle';
        workerStats.tasksInProgress--;
        workerStats.tasksCompleted++;
        workerStats.lastActivity = new Date();

        if (error) {
          console.error(`❌ Task ${taskId} failed:`, error);
          this.emit(`task-failed-${taskId}`, new Error(error));
        } else {
          console.log(`✅ Task ${taskId} completed by worker ${workerId}`);
          this.emit(`task-completed-${taskId}`, result);
        }
        break;

      case 'stats-update':
        if (stats) {
          Object.assign(workerStats, stats);
        }
        break;

      case 'error':
        workerStats.status = 'error';
        console.error(`❌ Worker ${workerId} error:`, error);
        this.emit('workerError', { workerId, error });
        break;
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`❌ Worker ${workerId} crashed:`, error);
    
    const stats = this.workerStats.get(workerId);
    if (stats) {
      stats.status = 'error';
    }

    this.emit('workerError', { workerId, error });

    // Restart worker if needed
    setTimeout(() => {
      this.restartWorker(workerId);
    }, 1000);
  }

  /**
   * Restart a failed worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    const stats = this.workerStats.get(workerId);
    if (!stats) return;

    console.log(`🔄 Restarting worker ${workerId}`);

    // Terminate old worker
    const oldWorker = this.workers.get(workerId);
    if (oldWorker) {
      oldWorker.terminate();
      this.workers.delete(workerId);
    }

    // Create new worker
    try {
      await this.createWorker(stats.type);
      console.log(`✅ Worker ${workerId} restarted successfully`);
    } catch (error) {
      console.error(`❌ Failed to restart worker ${workerId}:`, error);
    }
  }

  /**
   * Setup distributed workers coordination
   */
  private async setupDistributedWorkers(): Promise<void> {
    if (!this.p2pManager) return;

    console.log('🌐 Setting up distributed worker coordination...');

    // Listen for peer worker capabilities
    this.p2pManager.on('peer-capabilities', (data: any) => {
      const { peerId, capabilities, currentLoad, latency, reliability } = data;
      
      this.remoteWorkers.set(peerId, {
        peerId,
        capabilities,
        currentLoad: currentLoad || 0,
        latency: latency || 0,
        reliability: reliability || 1
      });

      console.log(`📡 Registered remote worker capabilities for peer ${peerId}`);
    });

    // Share our capabilities with peers
    this.p2pManager.broadcastCapabilities({
      capabilities: this.capabilities,
      currentLoad: this.getCurrentLoad(),
      latency: 0,
      reliability: 1
    });

    // Handle incoming distributed tasks
    this.p2pManager.on('distributed-task', async (data: any) => {
      try {
        const result = await this.handleDistributedTask(data);
        this.p2pManager.sendTaskResult(data.senderId, data.taskId, result);
      } catch (error) {
        this.p2pManager.sendTaskError(data.senderId, data.taskId, error.message);
      }
    });
  }

  /**
   * Handle incoming distributed task from peer
   */
  private async handleDistributedTask(data: any): Promise<any> {
    const { taskId, type, data: taskData, timeout } = data;

    console.log(`📨 Received distributed task ${taskId} of type ${type}`);

    return this.submitTask(type, taskData, {
      timeout,
      priority: 5 // Lower priority for remote tasks
    });
  }

  /**
   * Get current system load
   */
  private getCurrentLoad(): number {
    const busyWorkers = Array.from(this.workerStats.values())
      .filter(stats => stats.status === 'busy').length;
    
    return this.workers.size > 0 ? busyWorkers / this.workers.size : 0;
  }

  /**
   * Sort task queue by priority and age
   */
  private sortTaskQueue(): void {
    this.taskQueue.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Older tasks first
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Get capability for worker type
   */
  private getCapabilityForType(type: WorkerType): WorkerCapability | undefined {
    return this.capabilities.find(cap => cap.type === type);
  }

  /**
   * Get comprehensive stats
   */
  getStats(): any {
    return {
      isRunning: this.isRunning,
      totalWorkers: this.workers.size,
      localWorkers: this.workers.size,
      remoteWorkers: this.remoteWorkers.size,
      queueLength: this.taskQueue.length,
      currentLoad: this.getCurrentLoad(),
      capabilities: this.capabilities,
      workerStats: Array.from(this.workerStats.values()),
      remoteWorkerInfo: Array.from(this.remoteWorkers.values())
    };
  }

  /**
   * Shutdown the worker manager
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down WorkerManager...');
    
    this.isRunning = false;

    // Stop processing
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }

    this.workers.clear();
    this.workerStats.clear();
    this.taskQueue = [];

    console.log('✅ WorkerManager shutdown complete');
    this.emit('shutdown');
  }
}