// Enhanced AI Service with Hugging Face Integration
// Extends the existing AI service to support Hugging Face models and inference

import { AIService } from '../ai/service.js';
import { HuggingFaceIntegration, HFModel, HFInferenceTask } from './huggingface-integration.js';
import { HuggingFaceCloudFlareWorkers } from './huggingface-cloudflare-workers.js';
import { CloudFlareIntegration } from '../cloudflare/cloudflare-integration.js';
import { EventEmitter } from 'events';

/**
 * Enhanced AI Service Configuration with Hugging Face support
 */
export interface EnhancedAIServiceConfig {
  huggingfaceApiKey?: string;
  enableHuggingFace?: boolean;
  enableCloudFlareWorkers?: boolean;
  cloudflareConfig?: any;
  preferredInferenceMethod?: 'huggingface-api' | 'local-transformers' | 'cloudflare-workers' | 'auto';
  fallbackChain?: ('huggingface-api' | 'local-transformers' | 'cloudflare-workers')[];
}

/**
 * AI Model with Hugging Face support
 */
export interface EnhancedAIModel {
  id: string;
  name: string;
  provider: 'openai' | 'huggingface' | 'local';
  type: string;
  capabilities: string[];
  performance?: {
    speed: 'fast' | 'medium' | 'slow';
    quality: 'high' | 'medium' | 'low';
    cost: 'free' | 'low' | 'medium' | 'high';
  };
  metadata?: any;
}

/**
 * Enhanced inference task with multiple execution options
 */
export interface EnhancedInferenceTask {
  id: string;
  model: string;
  task: string;
  inputs: any;
  parameters?: any;
  preferredMethod?: 'huggingface-api' | 'local-transformers' | 'cloudflare-workers';
  fallbackMethods?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxRetries?: number;
  timeout?: number;
}

/**
 * Enhanced AI Service with comprehensive Hugging Face integration
 */
export class EnhancedAIService extends EventEmitter {
  private static instance: EnhancedAIService;
  private baseAIService: AIService;
  private huggingfaceIntegration: HuggingFaceIntegration;
  private cloudflareIntegration: CloudFlareIntegration;
  private hfCloudFlareWorkers: HuggingFaceCloudFlareWorkers;
  private config: EnhancedAIServiceConfig;
  private isInitialized = false;
  
  // Model registry with multiple providers
  private modelRegistry: Map<string, EnhancedAIModel> = new Map();
  private activeInferenceTasks: Map<string, EnhancedInferenceTask> = new Map();
  
  // Performance tracking
  private performanceStats = {
    totalInferences: 0,
    successfulInferences: 0,
    failedInferences: 0,
    avgExecutionTime: 0,
    methodStats: {
      'huggingface-api': { count: 0, avgTime: 0, errors: 0 },
      'local-transformers': { count: 0, avgTime: 0, errors: 0 },
      'cloudflare-workers': { count: 0, avgTime: 0, errors: 0 }
    }
  };

  private constructor() {
    super();
    this.baseAIService = AIService.getInstance();
    this.config = {};
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Initialize the enhanced AI service
   */
  async initialize(config: EnhancedAIServiceConfig): Promise<void> {
    this.config = {
      enableHuggingFace: true,
      enableCloudFlareWorkers: false,
      preferredInferenceMethod: 'auto',
      fallbackChain: ['huggingface-api', 'local-transformers'],
      ...config
    };

    console.log('🤖 Initializing Enhanced AI Service with Hugging Face integration...');

    try {
      // Initialize base AI service
      await this.baseAIService.initialize();

      // Initialize Hugging Face integration
      if (this.config.enableHuggingFace) {
        this.huggingfaceIntegration = new HuggingFaceIntegration({
          apiToken: this.config.huggingfaceApiKey,
          enableInference: true,
          enableDatasets: true,
          enableSpaces: true
        });
        await this.huggingfaceIntegration.initialize();
      }

      // Initialize CloudFlare integration
      if (this.config.enableCloudFlareWorkers && this.config.cloudflareConfig) {
        this.cloudflareIntegration = new CloudFlareIntegration(this.config.cloudflareConfig);
        await this.cloudflareIntegration.initialize();

        // Initialize Hugging Face CloudFlare workers
        this.hfCloudFlareWorkers = new HuggingFaceCloudFlareWorkers(
          this.cloudflareIntegration,
          this.huggingfaceIntegration,
          {
            huggingfaceApiKey: this.config.huggingfaceApiKey || '',
            cloudflareConfig: this.config.cloudflareConfig,
            enabledWorkers: {
              textGeneration: true,
              textClassification: true,
              imageClassification: true,
              speechRecognition: true,
              translation: true,
              summarization: true
            },
            workerSettings: {
              timeout: 30000,
              memory: 256,
              cpu: 1
            }
          }
        );

        await this.hfCloudFlareWorkers.deployAllWorkers();
      }

      // Load available models
      await this.loadAvailableModels();

      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ Enhanced AI Service initialized successfully');

    } catch (error) {
      console.error('❌ Enhanced AI Service initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get available models from all providers
   */
  async getAvailableModels(filter?: {
    provider?: 'openai' | 'huggingface' | 'local';
    task?: string;
    capability?: string;
  }): Promise<EnhancedAIModel[]> {
    let models = Array.from(this.modelRegistry.values());

    if (filter) {
      if (filter.provider) {
        models = models.filter(model => model.provider === filter.provider);
      }
      if (filter.task) {
        models = models.filter(model => model.type === filter.task);
      }
      if (filter.capability) {
        models = models.filter(model => model.capabilities.includes(filter.capability));
      }
    }

    return models;
  }

  /**
   * Search Hugging Face models
   */
  async searchHuggingFaceModels(query: string, options?: any): Promise<HFModel[]> {
    if (!this.huggingfaceIntegration) {
      throw new Error('Hugging Face integration not initialized');
    }

    return await this.huggingfaceIntegration.searchModels(query, options);
  }

  /**
   * Run inference with automatic method selection and fallback
   */
  async runInference(task: EnhancedInferenceTask): Promise<any> {
    const taskId = task.id || `inference-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    task.id = taskId;

    this.activeInferenceTasks.set(taskId, task);
    this.emit('inferenceStarted', task);

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Determine execution methods
    const methods = this.determineExecutionMethods(task);

    console.log(`🚀 Running inference task ${taskId} with methods: ${methods.join(' -> ')}`);

    for (const method of methods) {
      try {
        const result = await this.executeWithMethod(task, method);
        const executionTime = Date.now() - startTime;

        // Update performance stats
        this.updatePerformanceStats(method, executionTime, true);
        this.performanceStats.totalInferences++;
        this.performanceStats.successfulInferences++;

        this.activeInferenceTasks.delete(taskId);
        this.emit('inferenceCompleted', { task, result, method, executionTime });

        return {
          success: true,
          result,
          executionMethod: method,
          executionTime,
          taskId
        };

      } catch (error) {
        console.warn(`⚠️ Inference failed with method ${method}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        this.updatePerformanceStats(method, Date.now() - startTime, false);
        
        // Continue to next method in fallback chain
        continue;
      }
    }

    // All methods failed
    const executionTime = Date.now() - startTime;
    this.performanceStats.totalInferences++;
    this.performanceStats.failedInferences++;

    this.activeInferenceTasks.delete(taskId);
    this.emit('inferenceFailed', { task, error: lastError, executionTime });

    throw new Error(`All inference methods failed. Last error: ${lastError?.message}`);
  }

  /**
   * Run inference specifically on Hugging Face API
   */
  async runHuggingFaceInference(model: string, task: string, inputs: any, parameters?: any): Promise<any> {
    if (!this.huggingfaceIntegration) {
      throw new Error('Hugging Face integration not initialized');
    }

    const hfTask: Omit<HFInferenceTask, 'id' | 'status' | 'execution_environment'> = {
      model,
      task,
      inputs,
      parameters
    };

    return await this.huggingfaceIntegration.runInference(hfTask);
  }

  /**
   * Run inference on CloudFlare Workers
   */
  async runCloudFlareWorkerInference(model: string, task: string, inputs: any, parameters?: any): Promise<any> {
    if (!this.hfCloudFlareWorkers) {
      throw new Error('CloudFlare Workers integration not initialized');
    }

    const targetWorker = this.mapTaskToWorker(task);
    
    const cfTask = {
      id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai-inference' as const,
      payload: { model, task, inputs, parameters },
      priority: 'medium' as const,
      hfModel: model,
      hfTask: task,
      hfInputs: inputs,
      hfParameters: parameters,
      targetWorker
    };

    return await this.hfCloudFlareWorkers.executeHFTask(cfTask);
  }

  /**
   * Get model recommendations based on task and requirements
   */
  async getModelRecommendations(task: string, requirements?: {
    speed?: 'fast' | 'medium' | 'slow';
    quality?: 'high' | 'medium' | 'low';
    cost?: 'free' | 'low' | 'medium' | 'high';
  }): Promise<EnhancedAIModel[]> {
    const taskModels = await this.getAvailableModels({ task });
    
    if (!requirements) {
      return taskModels.slice(0, 5); // Return top 5 models
    }

    // Score models based on requirements
    return taskModels
      .map(model => ({
        model,
        score: this.calculateModelScore(model, requirements)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.model);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    return {
      ...this.performanceStats,
      successRate: this.performanceStats.totalInferences > 0 
        ? this.performanceStats.successfulInferences / this.performanceStats.totalInferences 
        : 0,
      avgExecutionTime: this.calculateAverageExecutionTime()
    };
  }

  /**
   * Get Hugging Face integration stats
   */
  getHuggingFaceStats(): any {
    return this.huggingfaceIntegration?.getStats() || null;
  }

  /**
   * Get CloudFlare integration stats
   */
  getCloudFlareStats(): any {
    return this.cloudflareIntegration?.getStats() || null;
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (this.huggingfaceIntegration) {
      this.huggingfaceIntegration.clearCache();
    }
    
    if (this.baseAIService) {
      this.baseAIService.clearCache();
    }

    this.emit('cachesCleared');
    console.log('🗑️ All AI service caches cleared');
  }

  // Private methods

  private async loadAvailableModels(): Promise<void> {
    console.log('📚 Loading available AI models...');

    // Load Hugging Face models
    if (this.huggingfaceIntegration) {
      const hfModels = this.huggingfaceIntegration.getCachedModels();
      
      hfModels.forEach(hfModel => {
        const enhancedModel: EnhancedAIModel = {
          id: hfModel.id,
          name: hfModel.name,
          provider: 'huggingface',
          type: hfModel.task,
          capabilities: hfModel.tags,
          performance: this.estimateModelPerformance(hfModel),
          metadata: {
            downloads: hfModel.downloads,
            likes: hfModel.likes,
            author: hfModel.author,
            created_at: hfModel.created_at,
            tags: hfModel.tags
          }
        };
        
        this.modelRegistry.set(hfModel.id, enhancedModel);
      });
    }

    // Add some default local models
    this.addDefaultLocalModels();

    console.log(`✅ Loaded ${this.modelRegistry.size} AI models`);
  }

  private addDefaultLocalModels(): void {
    const localModels: EnhancedAIModel[] = [
      {
        id: 'local-text-generation',
        name: 'Local Text Generation',
        provider: 'local',
        type: 'text-generation',
        capabilities: ['chat', 'completion'],
        performance: { speed: 'fast', quality: 'medium', cost: 'free' }
      },
      {
        id: 'local-text-classification',
        name: 'Local Text Classification',
        provider: 'local',
        type: 'text-classification',
        capabilities: ['sentiment', 'classification'],
        performance: { speed: 'fast', quality: 'medium', cost: 'free' }
      }
    ];

    localModels.forEach(model => {
      this.modelRegistry.set(model.id, model);
    });
  }

  private determineExecutionMethods(task: EnhancedInferenceTask): string[] {
    if (task.preferredMethod) {
      const methods = [task.preferredMethod];
      if (task.fallbackMethods) {
        methods.push(...task.fallbackMethods);
      } else if (this.config.fallbackChain) {
        methods.push(...this.config.fallbackChain.filter(m => m !== task.preferredMethod));
      }
      return methods;
    }

    if (this.config.preferredInferenceMethod === 'auto') {
      return this.selectOptimalMethods(task);
    }

    return this.config.fallbackChain || ['huggingface-api'];
  }

  private selectOptimalMethods(task: EnhancedInferenceTask): string[] {
    // Simple heuristic for method selection
    const methods: string[] = [];

    if (task.priority === 'critical' || task.priority === 'high') {
      // For high priority tasks, prefer faster methods
      if (this.hfCloudFlareWorkers) {
        methods.push('cloudflare-workers');
      }
      methods.push('huggingface-api');
    } else {
      // For lower priority tasks, prefer cost-effective methods
      methods.push('huggingface-api');
      if (this.hfCloudFlareWorkers) {
        methods.push('cloudflare-workers');
      }
      methods.push('local-transformers');
    }

    return methods;
  }

  private async executeWithMethod(task: EnhancedInferenceTask, method: string): Promise<any> {
    switch (method) {
      case 'huggingface-api':
        return await this.runHuggingFaceInference(task.model, task.task, task.inputs, task.parameters);
      
      case 'cloudflare-workers':
        return await this.runCloudFlareWorkerInference(task.model, task.task, task.inputs, task.parameters);
      
      case 'local-transformers':
        return await this.runLocalTransformers(task);
      
      default:
        throw new Error(`Unknown inference method: ${method}`);
    }
  }

  private async runLocalTransformers(task: EnhancedInferenceTask): Promise<any> {
    // Placeholder for local transformers.js implementation
    console.log('🔄 Running local transformers inference...');
    
    // Simulate local processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      result: `Local inference result for task ${task.task}`,
      model: task.model,
      method: 'local-transformers'
    };
  }

  private mapTaskToWorker(task: string): 'text-generation' | 'classification' | 'image-processing' | 'audio-processing' {
    if (task.includes('generation') || task.includes('chat') || task.includes('completion')) {
      return 'text-generation';
    }
    if (task.includes('classification') || task.includes('sentiment')) {
      return 'classification';
    }
    if (task.includes('image') || task.includes('vision')) {
      return 'image-processing';
    }
    if (task.includes('speech') || task.includes('audio')) {
      return 'audio-processing';
    }
    return 'text-generation'; // Default
  }

  private estimateModelPerformance(hfModel: any): { speed: 'fast' | 'medium' | 'slow'; quality: 'high' | 'medium' | 'low'; cost: 'free' | 'low' | 'medium' | 'high' } {
    // Simple heuristics based on model size and popularity
    const downloads = hfModel.downloads || 0;
    const likes = hfModel.likes || 0;
    
    const speed = downloads > 100000 ? 'fast' : downloads > 10000 ? 'medium' : 'slow';
    const quality = likes > 1000 ? 'high' : likes > 100 ? 'medium' : 'low';
    const cost = 'free'; // Hugging Face models are generally free
    
    return { speed, quality, cost };
  }

  private calculateModelScore(model: EnhancedAIModel, requirements: any): number {
    let score = 0;
    
    if (model.performance) {
      if (requirements.speed && model.performance.speed === requirements.speed) score += 3;
      if (requirements.quality && model.performance.quality === requirements.quality) score += 3;
      if (requirements.cost && model.performance.cost === requirements.cost) score += 2;
    }
    
    // Bonus for popularity (downloads/likes)
    if (model.metadata?.downloads > 100000) score += 2;
    if (model.metadata?.likes > 1000) score += 1;
    
    return score;
  }

  private updatePerformanceStats(method: string, executionTime: number, success: boolean): void {
    const methodStats = this.performanceStats.methodStats[method as keyof typeof this.performanceStats.methodStats];
    if (methodStats) {
      methodStats.count++;
      methodStats.avgTime = (methodStats.avgTime * (methodStats.count - 1) + executionTime) / methodStats.count;
      if (!success) {
        methodStats.errors++;
      }
    }
  }

  private calculateAverageExecutionTime(): number {
    const methods = Object.values(this.performanceStats.methodStats);
    const totalTime = methods.reduce((sum, method) => sum + (method.avgTime * method.count), 0);
    const totalCount = methods.reduce((sum, method) => sum + method.count, 0);
    
    return totalCount > 0 ? totalTime / totalCount : 0;
  }
}