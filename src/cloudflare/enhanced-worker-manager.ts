// Enhanced Worker Manager with CloudFlare Integration
// Phase 5: Hybrid P2P + Cloud Computing Infrastructure

import { EventEmitter } from 'events';
import { CloudFlareIntegration, CloudFlareTask, CloudFlareConfig } from './cloudflare-integration.js';

export enum WorkerType {
  COMPUTE = 'compute',
  AUDIO = 'audio',
  AI_INFERENCE = 'ai-inference',
  FILE_PROCESSING = 'file-processing',
  GPU_COMPUTE = 'gpu-compute'
}

export interface TaskOptions {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  preferredExecution?: 'local' | 'p2p' | 'cloudflare' | 'auto';
  fallbackEnabled?: boolean;
}

export interface WorkerTask {
  id: string;
  type: WorkerType;
  data: any;
  options: TaskOptions;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  assignedTo?: 'local' | 'p2p' | 'cloudflare';
  assignedPeer?: string;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface WorkerStats {
  localWorkers: {
    active: number;
    idle: number;
    total: number;
    tasksCompleted: number;
    avgExecutionTime: number;
  };
  p2pWorkers: {
    connectedPeers: number;
    availableWorkers: number;
    tasksDistributed: number;
    avgLatency: number;
  };
  cloudflareWorkers: {
    deployedWorkers: number;
    activeTasks: number;
    totalExecutions: number;
    avgExecutionTime: number;
    cacheHitRate: number;
  };
  system: {
    cpuCores: number;
    memoryGB: number;
    gpuAvailable: boolean;
    networkLatency: number;
  };
}

export interface WorkerCapability {
  type: WorkerType;
  available: boolean;
  performance: number; // 1-100 scale
  currentLoad: number; // 0-100 percentage
  location: 'local' | 'p2p' | 'cloudflare';
}

/**
 * Enhanced Worker Manager with CloudFlare Integration
 * Provides intelligent task distribution across local, P2P, and CloudFlare workers
 */
export class EnhancedWorkerManager extends EventEmitter {
  private localWorkers: Map<string, Worker> = new Map();
  private remoteWorkers: Map<string, any> = new Map(); // P2P workers
  private cloudflareIntegration: CloudFlareIntegration | null = null;
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private completedTasks: WorkerTask[] = [];
  private stats: Partial<WorkerStats> = {};
  private capabilities: WorkerCapability[] = [];
  private isInitialized = false;

  constructor(private cloudflareConfig?: CloudFlareConfig) {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize the enhanced worker manager
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Enhanced Worker Manager...');

    try {
      // Initialize local workers
      await this.initializeLocalWorkers();
      
      // Initialize CloudFlare integration if configured
      if (this.cloudflareConfig) {
        this.cloudflareIntegration = new CloudFlareIntegration(this.cloudflareConfig);
        await this.cloudflareIntegration.initialize();
        this.setupCloudflareEventHandlers();
      }
      
      // Detect system capabilities
      await this.detectSystemCapabilities();
      
      // Setup performance monitoring
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ Enhanced Worker Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Enhanced Worker Manager initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Submit a task for execution with intelligent routing
   */
  async submitTask(type: WorkerType, data: any, options: TaskOptions = {}): Promise<any> {
    const task: WorkerTask = {
      id: this.generateTaskId(),
      type,
      data,
      options: {
        priority: 'medium',
        timeout: 30000,
        retries: 2,
        preferredExecution: 'auto',
        fallbackEnabled: true,
        ...options
      },
      status: 'pending',
      createdAt: Date.now()
    };

    console.log(`📝 Submitting task ${task.id} (${type})`);
    
    this.taskQueue.push(task);
    this.emit('taskSubmitted', task);
    
    try {
      const result = await this.executeTask(task);
      this.handleTaskCompletion(task, result);
      return result;
      
    } catch (error) {
      this.handleTaskError(task, error);
      throw error;
    }
  }

  /**
   * Execute task with intelligent routing
   */
  private async executeTask(task: WorkerTask): Promise<any> {
    task.status = 'assigned';
    task.startedAt = Date.now();
    this.activeTasks.set(task.id, task);
    
    // Determine optimal execution location
    const executionLocation = await this.determineOptimalExecution(task);
    task.assignedTo = executionLocation;
    
    console.log(`⚡ Executing task ${task.id} on ${executionLocation}`);
    
    try {
      switch (executionLocation) {
        case 'local':
          return await this.executeLocalTask(task);
        case 'p2p':
          return await this.executeP2PTask(task);
        case 'cloudflare':
          return await this.executeCloudflareTask(task);
        default:
          throw new Error(`Unknown execution location: ${executionLocation}`);
      }
    } catch (error) {
      // Attempt fallback if enabled
      if (task.options.fallbackEnabled) {
        return await this.attemptFallback(task, error);
      }
      throw error;
    }
  }

  /**
   * Determine optimal execution location based on task and system state
   */
  private async determineOptimalExecution(task: WorkerTask): Promise<'local' | 'p2p' | 'cloudflare'> {
    // Honor explicit preference
    if (task.options.preferredExecution !== 'auto') {
      return task.options.preferredExecution as 'local' | 'p2p' | 'cloudflare';
    }

    const scores = {
      local: await this.scoreLocalExecution(task),
      p2p: await this.scoreP2PExecution(task),
      cloudflare: await this.scoreCloudflareExecution(task)
    };

    // Select highest scoring option
    const bestOption = Object.entries(scores).reduce((best, [location, score]) => 
      score > best.score ? { location, score } : best
    , { location: 'local', score: scores.local });

    console.log(`🎯 Task ${task.id} execution scores:`, scores, `-> ${bestOption.location}`);
    return bestOption.location as 'local' | 'p2p' | 'cloudflare';
  }

  /**
   * Execute task locally
   */
  private async executeLocalTask(task: WorkerTask): Promise<any> {
    const workerKey = `${task.type}-${Date.now()}`;
    
    // Create or get existing worker
    let worker = this.localWorkers.get(task.type);
    if (!worker) {
      worker = await this.createLocalWorker(task.type);
      this.localWorkers.set(workerKey, worker);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out`));
      }, task.options.timeout);

      worker!.postMessage({ taskId: task.id, type: task.type, data: task.data });
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data.taskId === task.id) {
          clearTimeout(timeout);
          worker!.removeEventListener('message', messageHandler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      worker!.addEventListener('message', messageHandler);
    });
  }

  /**
   * Execute task on P2P network
   */
  private async executeP2PTask(task: WorkerTask): Promise<any> {
    // This would integrate with the existing P2P system
    console.log(`🌐 Executing task ${task.id} on P2P network`);
    
    // Simulate P2P execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      result: `P2P execution result for ${task.type}`,
      executionTime: 1500,
      location: 'p2p-peer'
    };
  }

  /**
   * Execute task on CloudFlare
   */
  private async executeCloudflareTask(task: WorkerTask): Promise<any> {
    if (!this.cloudflareIntegration) {
      throw new Error('CloudFlare integration not available');
    }

    const cloudflareTask: CloudFlareTask = {
      id: task.id,
      type: task.type as any,
      payload: task.data,
      priority: task.options.priority!,
      timeout: task.options.timeout,
      retries: task.options.retries,
      fallbackToPeer: task.options.fallbackEnabled
    };

    return await this.cloudflareIntegration.executeServerTask(cloudflareTask);
  }

  /**
   * Attempt fallback execution
   */
  private async attemptFallback(task: WorkerTask, originalError: any): Promise<any> {
    console.log(`🔄 Attempting fallback for task ${task.id}, original error:`, originalError);
    
    const fallbackOrder = this.getFallbackOrder(task.assignedTo!);
    
    for (const fallbackLocation of fallbackOrder) {
      try {
        console.log(`🔄 Trying fallback: ${fallbackLocation}`);
        task.assignedTo = fallbackLocation;
        
        switch (fallbackLocation) {
          case 'local':
            return await this.executeLocalTask(task);
          case 'p2p':
            return await this.executeP2PTask(task);
          case 'cloudflare':
            return await this.executeCloudflareTask(task);
        }
      } catch (fallbackError) {
        console.log(`❌ Fallback ${fallbackLocation} failed:`, fallbackError);
      }
    }
    
    throw new Error(`All execution methods failed for task ${task.id}`);
  }

  /**
   * Get fallback execution order
   */
  private getFallbackOrder(failedLocation: string): ('local' | 'p2p' | 'cloudflare')[] {
    const allLocations: ('local' | 'p2p' | 'cloudflare')[] = ['local', 'p2p', 'cloudflare'];
    return allLocations.filter(location => location !== failedLocation);
  }

  /**
   * Handle task completion
   */
  private handleTaskCompletion(task: WorkerTask, result: any): void {
    task.status = 'completed';
    task.result = result;
    task.completedAt = Date.now();
    
    this.activeTasks.delete(task.id);
    this.completedTasks.push(task);
    
    // Keep only last 100 completed tasks
    if (this.completedTasks.length > 100) {
      this.completedTasks.shift();
    }
    
    this.emit('taskCompleted', { task, result });
    console.log(`✅ Task ${task.id} completed successfully`);
  }

  /**
   * Handle task error
   */
  private handleTaskError(task: WorkerTask, error: any): void {
    task.status = 'failed';
    task.error = error.message;
    task.completedAt = Date.now();
    
    this.activeTasks.delete(task.id);
    this.completedTasks.push(task);
    
    this.emit('taskFailed', { task, error });
    console.error(`❌ Task ${task.id} failed:`, error);
  }

  /**
   * Get comprehensive worker statistics
   */
  getStats(): WorkerStats {
    const now = Date.now();
    const recentTasks = this.completedTasks.filter(task => 
      now - task.completedAt! < 300000 // Last 5 minutes
    );

    return {
      localWorkers: {
        active: this.activeTasks.size,
        idle: this.localWorkers.size - this.activeTasks.size,
        total: this.localWorkers.size,
        tasksCompleted: recentTasks.filter(t => t.assignedTo === 'local').length,
        avgExecutionTime: this.calculateAverageExecutionTime(recentTasks, 'local')
      },
      p2pWorkers: {
        connectedPeers: this.remoteWorkers.size,
        availableWorkers: Array.from(this.remoteWorkers.values()).length,
        tasksDistributed: recentTasks.filter(t => t.assignedTo === 'p2p').length,
        avgLatency: 150 // Would be measured in real implementation
      },
      cloudflareWorkers: {
        deployedWorkers: this.cloudflareIntegration?.getStats().deployedWorkers || 0,
        activeTasks: this.cloudflareIntegration?.getStats().activeTasks || 0,
        totalExecutions: recentTasks.filter(t => t.assignedTo === 'cloudflare').length,
        avgExecutionTime: this.calculateAverageExecutionTime(recentTasks, 'cloudflare'),
        cacheHitRate: 0.85 // Would be measured in real implementation
      },
      system: {
        cpuCores: navigator.hardwareConcurrency || 4,
        memoryGB: (navigator as any).deviceMemory || 8,
        gpuAvailable: !!navigator.gpu,
        networkLatency: 50 // Would be measured in real implementation
      }
    };
  }

  /**
   * Get current worker capabilities
   */
  getCapabilities(): WorkerCapability[] {
    return this.capabilities;
  }

  /**
   * Shutdown worker manager
   */
  async shutdown(): Promise<void> {
    console.log('🔧 Shutting down Enhanced Worker Manager...');
    
    // Cancel all active tasks
    for (const [taskId, task] of this.activeTasks) {
      this.emit('taskCancelled', { taskId, task });
    }
    this.activeTasks.clear();
    
    // Terminate local workers
    for (const [workerId, worker] of this.localWorkers) {
      worker.terminate();
    }
    this.localWorkers.clear();
    
    // Shutdown CloudFlare integration
    if (this.cloudflareIntegration) {
      await this.cloudflareIntegration.shutdown();
    }
    
    this.isInitialized = false;
    this.emit('shutdown');
    console.log('✅ Enhanced Worker Manager shutdown complete');
  }

  // Private methods

  private async initializeLocalWorkers(): Promise<void> {
    console.log('🔧 Initializing local workers...');
    // Local workers will be created on-demand
  }

  private async createLocalWorker(type: WorkerType): Promise<Worker> {
    const workerScript = this.getWorkerScript(type);
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl);
  }

  private getWorkerScript(type: WorkerType): string {
    // Return appropriate worker script based on type
    switch (type) {
      case WorkerType.COMPUTE:
        return this.getComputeWorkerScript();
      case WorkerType.AUDIO:
        return this.getAudioWorkerScript();
      case WorkerType.AI_INFERENCE:
        return this.getAIWorkerScript();
      case WorkerType.FILE_PROCESSING:
        return this.getFileProcessingWorkerScript();
      case WorkerType.GPU_COMPUTE:
        return this.getGPUWorkerScript();
      default:
        return this.getDefaultWorkerScript();
    }
  }

  private getComputeWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        try {
          // Simulate compute-intensive task
          const start = Date.now();
          let result = 0;
          for (let i = 0; i < data.iterations || 1000000; i++) {
            result += Math.sqrt(i);
          }
          const executionTime = Date.now() - start;
          
          self.postMessage({
            taskId,
            result: { value: result, executionTime, location: 'local-compute' }
          });
        } catch (error) {
          self.postMessage({ taskId, error: error.message });
        }
      };
    `;
  }

  private getAudioWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        try {
          // Simulate audio processing
          const start = Date.now();
          const audioData = data.audioBuffer || new Float32Array(1024);
          
          // Apply simple audio effect (e.g., reverb simulation)
          for (let i = 0; i < audioData.length; i++) {
            audioData[i] *= 0.8 + Math.sin(i * 0.01) * 0.2;
          }
          
          const executionTime = Date.now() - start;
          
          self.postMessage({
            taskId,
            result: { processedAudio: audioData, executionTime, location: 'local-audio' }
          });
        } catch (error) {
          self.postMessage({ taskId, error: error.message });
        }
      };
    `;
  }

  private getAIWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        try {
          // Simulate AI inference
          const start = Date.now();
          const inputData = data.input || 'sample input';
          
          // Mock AI processing
          const prediction = 'AI processed: ' + inputData;
          const confidence = 0.85 + Math.random() * 0.15;
          
          const executionTime = Date.now() - start + 1000; // Simulate processing time
          
          self.postMessage({
            taskId,
            result: { prediction, confidence, executionTime, location: 'local-ai' }
          });
        } catch (error) {
          self.postMessage({ taskId, error: error.message });
        }
      };
    `;
  }

  private getFileProcessingWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        try {
          // Simulate file processing
          const start = Date.now();
          const fileData = data.file || 'sample file content';
          
          // Mock file analysis
          const wordCount = fileData.toString().split(' ').length;
          const characterCount = fileData.toString().length;
          const processed = true;
          
          const executionTime = Date.now() - start;
          
          self.postMessage({
            taskId,
            result: { wordCount, characterCount, processed, executionTime, location: 'local-file' }
          });
        } catch (error) {
          self.postMessage({ taskId, error: error.message });
        }
      };
    `;
  }

  private getGPUWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        try {
          // Simulate GPU computation
          const start = Date.now();
          const matrixSize = data.matrixSize || 100;
          
          // Mock GPU matrix operations
          let result = 0;
          for (let i = 0; i < matrixSize * matrixSize; i++) {
            result += Math.pow(i, 2);
          }
          
          const executionTime = Date.now() - start;
          
          self.postMessage({
            taskId,
            result: { matrixResult: result, executionTime, location: 'local-gpu' }
          });
        } catch (error) {
          self.postMessage({ taskId, error: error.message });
        }
      };
    `;
  }

  private getDefaultWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        try {
          const start = Date.now();
          const result = 'Default worker processed: ' + JSON.stringify(data);
          const executionTime = Date.now() - start;
          
          self.postMessage({
            taskId,
            result: { result, executionTime, location: 'local-default' }
          });
        } catch (error) {
          self.postMessage({ taskId, error: error.message });
        }
      };
    `;
  }

  private async detectSystemCapabilities(): Promise<void> {
    this.capabilities = [
      {
        type: WorkerType.COMPUTE,
        available: true,
        performance: navigator.hardwareConcurrency * 20,
        currentLoad: 0,
        location: 'local'
      },
      {
        type: WorkerType.AUDIO,
        available: true,
        performance: 80,
        currentLoad: 0,
        location: 'local'
      },
      {
        type: WorkerType.AI_INFERENCE,
        available: true,
        performance: navigator.gpu ? 90 : 60,
        currentLoad: 0,
        location: 'local'
      },
      {
        type: WorkerType.FILE_PROCESSING,
        available: true,
        performance: 85,
        currentLoad: 0,
        location: 'local'
      },
      {
        type: WorkerType.GPU_COMPUTE,
        available: !!navigator.gpu,
        performance: navigator.gpu ? 95 : 0,
        currentLoad: 0,
        location: 'local'
      }
    ];

    // Add CloudFlare capabilities if available
    if (this.cloudflareIntegration) {
      const cfStats = this.cloudflareIntegration.getStats();
      if (cfStats.workersEnabled) {
        this.capabilities.push(...[
          {
            type: WorkerType.COMPUTE,
            available: true,
            performance: 95,
            currentLoad: 0,
            location: 'cloudflare' as const
          },
          {
            type: WorkerType.AI_INFERENCE,
            available: true,
            performance: 98,
            currentLoad: 0,
            location: 'cloudflare' as const
          }
        ]);
      }
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      // Update capability load metrics
      this.updateCapabilityMetrics();
      this.emit('statsUpdated', this.getStats());
    }, 5000);
  }

  private updateCapabilityMetrics(): void {
    const activeLocalTasks = Array.from(this.activeTasks.values())
      .filter(task => task.assignedTo === 'local').length;
    
    this.capabilities.forEach(capability => {
      if (capability.location === 'local') {
        capability.currentLoad = Math.min(100, (activeLocalTasks / this.localWorkers.size) * 100);
      }
    });
  }

  private async scoreLocalExecution(task: WorkerTask): Promise<number> {
    const capability = this.capabilities.find(cap => 
      cap.type === task.type && cap.location === 'local'
    );
    
    if (!capability || !capability.available) return 0;
    
    const loadPenalty = capability.currentLoad / 100;
    const performanceScore = capability.performance / 100;
    
    return Math.max(0, performanceScore - loadPenalty) * 100;
  }

  private async scoreP2PExecution(task: WorkerTask): Promise<number> {
    // Check if P2P workers are available
    const p2pWorkers = this.remoteWorkers.size;
    if (p2pWorkers === 0) return 0;
    
    // Score based on network conditions and peer availability
    const networkScore = 0.7; // Would be measured in real implementation
    const availabilityScore = Math.min(1, p2pWorkers / 3);
    
    return networkScore * availabilityScore * 80;
  }

  private async scoreCloudflareExecution(task: WorkerTask): Promise<number> {
    if (!this.cloudflareIntegration) return 0;
    
    const cfStats = this.cloudflareIntegration.getStats();
    if (!cfStats.workersEnabled) return 0;
    
    // High score for AI inference and compute tasks
    const taskTypeScore = task.type === WorkerType.AI_INFERENCE ? 0.9 : 0.8;
    const availabilityScore = cfStats.activeTasks < 10 ? 1 : 0.7;
    
    return taskTypeScore * availabilityScore * 95;
  }

  private calculateAverageExecutionTime(tasks: WorkerTask[], location: string): number {
    const locationTasks = tasks.filter(task => 
      task.assignedTo === location && task.completedAt && task.startedAt
    );
    
    if (locationTasks.length === 0) return 0;
    
    const totalTime = locationTasks.reduce((sum, task) => 
      sum + (task.completedAt! - task.startedAt!), 0
    );
    
    return Math.round(totalTime / locationTasks.length);
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('🔧 Enhanced Worker Manager Error:', error);
    });
  }

  private setupCloudflareEventHandlers(): void {
    if (!this.cloudflareIntegration) return;
    
    this.cloudflareIntegration.on('taskCompleted', (event) => {
      console.log('🌩️ CloudFlare task completed:', event);
    });
    
    this.cloudflareIntegration.on('taskFailed', (event) => {
      console.log('🌩️ CloudFlare task failed:', event);
    });
    
    this.cloudflareIntegration.on('cached', (event) => {
      console.log('🌩️ Result cached:', event);
    });
  }
}