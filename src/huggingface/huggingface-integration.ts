// Advanced Hugging Face Integration for SwissKnife Collaborative Virtual Desktop
// Comprehensive Storage and Compute Integration

import { EventEmitter } from 'events';

/**
 * Hugging Face Integration Configuration
 */
export interface HuggingFaceConfig {
  apiToken?: string;
  apiUrl?: string;
  enableInference?: boolean;
  enableDatasets?: boolean;
  enableSpaces?: boolean;
  enableModelUpload?: boolean;
  defaultModel?: string;
  cacheTTL?: number;
}

/**
 * Hugging Face Model Interface
 */
export interface HFModel {
  id: string;
  name: string;
  author: string;
  task: string;
  pipeline_tag: string;
  tags: string[];
  downloads: number;
  likes: number;
  library_name?: string;
  created_at: string;
  last_modified: string;
  private: boolean;
  gated: boolean;
  disabled: boolean;
  inference?: string;
  cardData?: any;
}

/**
 * Hugging Face Dataset Interface
 */
export interface HFDataset {
  id: string;
  name: string;
  author: string;
  description?: string;
  tags: string[];
  downloads: number;
  likes: number;
  created_at: string;
  last_modified: string;
  private: boolean;
  gated: boolean;
  disabled: boolean;
  size_categories?: string[];
  task_categories?: string[];
  language?: string[];
}

/**
 * Hugging Face Space Interface
 */
export interface HFSpace {
  id: string;
  name: string;
  author: string;
  title: string;
  sdk: string;
  tags: string[];
  likes: number;
  created_at: string;
  last_modified: string;
  private: boolean;
  disabled: boolean;
  runtime?: {
    stage: string;
    hardware?: string;
    secrets?: string[];
  };
}

/**
 * Inference Task Interface
 */
export interface HFInferenceTask {
  id: string;
  model: string;
  task: string;
  inputs: any;
  parameters?: any;
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  execution_time?: number;
  execution_environment: 'huggingface-api' | 'local-transformers' | 'cloudflare-worker';
}

/**
 * Dataset Download Task Interface
 */
export interface HFDatasetTask {
  id: string;
  dataset: string;
  config?: string;
  split?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  size?: number;
  downloaded?: number;
  error?: string;
}

/**
 * Model Deployment Configuration
 */
export interface HFModelDeployment {
  id: string;
  model: string;
  target: 'cloudflare-worker' | 'p2p-peer' | 'huggingface-space';
  config: any;
  status: 'pending' | 'deploying' | 'active' | 'failed';
  endpoint?: string;
  error?: string;
}

/**
 * Main Hugging Face Integration Class
 * Provides comprehensive model hub, inference, and dataset management
 */
export class HuggingFaceIntegration extends EventEmitter {
  private config: HuggingFaceConfig;
  private models: Map<string, HFModel> = new Map();
  private datasets: Map<string, HFDataset> = new Map();
  private spaces: Map<string, HFSpace> = new Map();
  private inferenceTasks: Map<string, HFInferenceTask> = new Map();
  private datasetTasks: Map<string, HFDatasetTask> = new Map();
  private deployments: Map<string, HFModelDeployment> = new Map();
  private modelCache: Map<string, any> = new Map();
  private isInitialized = false;

  // Statistics tracking
  private stats = {
    totalInferences: 0,
    totalDownloads: 0,
    totalDeployments: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    errors: 0
  };

  constructor(config: HuggingFaceConfig) {
    super();
    this.config = {
      apiUrl: 'https://huggingface.co',
      enableInference: true,
      enableDatasets: true,
      enableSpaces: true,
      enableModelUpload: false,
      defaultModel: 'microsoft/DialoGPT-medium',
      cacheTTL: 3600000, // 1 hour
      ...config
    };
    this.setupErrorHandling();
  }

  /**
   * Initialize Hugging Face integration
   */
  async initialize(): Promise<void> {
    console.log('🤗 Initializing Hugging Face Integration...');
    
    try {
      // Validate API token if provided
      if (this.config.apiToken) {
        await this.validateApiToken();
      }
      
      // Initialize enabled services
      if (this.config.enableInference) {
        await this.initializeInferenceAPI();
      }
      
      if (this.config.enableDatasets) {
        await this.initializeDatasetAPI();
      }
      
      if (this.config.enableSpaces) {
        await this.initializeSpacesAPI();
      }
      
      // Load popular models and datasets
      await this.loadPopularModels();
      await this.loadPopularDatasets();
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ Hugging Face Integration initialized successfully');
      
    } catch (error) {
      console.error('❌ Hugging Face Integration initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Search models on Hugging Face Hub
   */
  async searchModels(query: string, options: {
    task?: string;
    author?: string;
    library?: string;
    language?: string;
    sort?: 'downloads' | 'likes' | 'updated';
    limit?: number;
  } = {}): Promise<HFModel[]> {
    try {
      console.log(`🔍 Searching models: ${query}`);
      this.stats.apiCalls++;
      
      // In a real implementation, this would call the Hugging Face API
      const searchResults = await this.simulateModelSearch(query, options);
      
      // Cache the results
      searchResults.forEach(model => {
        this.models.set(model.id, model);
      });
      
      this.emit('modelsSearched', { query, count: searchResults.length });
      return searchResults;
      
    } catch (error) {
      console.error(`❌ Failed to search models for query "${query}":`, error);
      this.stats.errors++;
      this.emit('searchError', { query, error });
      throw error;
    }
  }

  /**
   * Get model details from Hugging Face Hub
   */
  async getModel(modelId: string): Promise<HFModel> {
    try {
      // Check cache first
      const cached = this.models.get(modelId);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      
      console.log(`📥 Fetching model details: ${modelId}`);
      this.stats.apiCalls++;
      this.stats.cacheMisses++;
      
      // In a real implementation, this would call the Hugging Face API
      const model = await this.simulateModelFetch(modelId);
      
      // Cache the model
      this.models.set(modelId, model);
      
      this.emit('modelFetched', { modelId });
      return model;
      
    } catch (error) {
      console.error(`❌ Failed to fetch model ${modelId}:`, error);
      this.stats.errors++;
      this.emit('modelFetchError', { modelId, error });
      throw error;
    }
  }

  /**
   * Run inference on a Hugging Face model
   */
  async runInference(taskConfig: Omit<HFInferenceTask, 'id' | 'status' | 'execution_environment'>): Promise<any> {
    if (!this.config.enableInference) {
      throw new Error('Hugging Face Inference not enabled');
    }

    const taskId = `hf-inference-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: HFInferenceTask = {
      id: taskId,
      ...taskConfig,
      status: 'pending',
      execution_environment: 'huggingface-api'
    };

    try {
      console.log(`🚀 Running inference task ${taskId} on model ${task.model}`);
      
      this.inferenceTasks.set(taskId, task);
      task.status = 'running';
      this.emit('inferenceStarted', task);
      
      // Check cache for similar requests
      const cacheKey = this.createInferenceCacheKey(task);
      const cached = this.modelCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        this.stats.cacheHits++;
        task.status = 'completed';
        task.result = cached.result;
        task.execution_time = 0;
        
        this.emit('inferenceCompleted', task);
        this.inferenceTasks.delete(taskId);
        return task.result;
      }
      
      this.stats.cacheMisses++;
      
      // Simulate inference with realistic processing time
      const result = await this.simulateInference(task);
      
      task.status = 'completed';
      task.result = result;
      this.stats.totalInferences++;
      
      // Cache the result
      this.modelCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      this.emit('inferenceCompleted', task);
      this.inferenceTasks.delete(taskId);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Inference task ${taskId} failed:`, error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      this.stats.errors++;
      
      this.emit('inferenceFailed', task);
      this.inferenceTasks.delete(taskId);
      throw error;
    }
  }

  /**
   * Search datasets on Hugging Face Hub
   */
  async searchDatasets(query: string, options: {
    task?: string;
    size?: string;
    language?: string;
    sort?: 'downloads' | 'likes' | 'updated';
    limit?: number;
  } = {}): Promise<HFDataset[]> {
    try {
      console.log(`🔍 Searching datasets: ${query}`);
      this.stats.apiCalls++;
      
      // In a real implementation, this would call the Hugging Face API
      const searchResults = await this.simulateDatasetSearch(query, options);
      
      // Cache the results
      searchResults.forEach(dataset => {
        this.datasets.set(dataset.id, dataset);
      });
      
      this.emit('datasetsSearched', { query, count: searchResults.length });
      return searchResults;
      
    } catch (error) {
      console.error(`❌ Failed to search datasets for query "${query}":`, error);
      this.stats.errors++;
      this.emit('datasetSearchError', { query, error });
      throw error;
    }
  }

  /**
   * Download dataset from Hugging Face Hub
   */
  async downloadDataset(datasetId: string, config?: string, split?: string): Promise<string> {
    if (!this.config.enableDatasets) {
      throw new Error('Hugging Face Datasets not enabled');
    }

    const taskId = `hf-dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: HFDatasetTask = {
      id: taskId,
      dataset: datasetId,
      config,
      split,
      status: 'pending',
      progress: 0
    };

    try {
      console.log(`📥 Downloading dataset ${datasetId}`);
      
      this.datasetTasks.set(taskId, task);
      task.status = 'downloading';
      this.emit('datasetDownloadStarted', task);
      
      // Simulate dataset download with progress updates
      const downloadPath = await this.simulateDatasetDownload(task);
      
      task.status = 'completed';
      task.progress = 100;
      this.stats.totalDownloads++;
      
      this.emit('datasetDownloadCompleted', task);
      this.datasetTasks.delete(taskId);
      
      return downloadPath;
      
    } catch (error) {
      console.error(`❌ Dataset download ${taskId} failed:`, error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      this.stats.errors++;
      
      this.emit('datasetDownloadFailed', task);
      this.datasetTasks.delete(taskId);
      throw error;
    }
  }

  /**
   * Deploy model to specified target environment
   */
  async deployModel(modelId: string, target: 'cloudflare-worker' | 'p2p-peer' | 'huggingface-space', config: any = {}): Promise<HFModelDeployment> {
    const deploymentId = `hf-deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const deployment: HFModelDeployment = {
      id: deploymentId,
      model: modelId,
      target,
      config,
      status: 'pending'
    };

    try {
      console.log(`🚀 Deploying model ${modelId} to ${target}`);
      
      this.deployments.set(deploymentId, deployment);
      deployment.status = 'deploying';
      this.emit('deploymentStarted', deployment);
      
      // Simulate deployment process
      const endpoint = await this.simulateModelDeployment(deployment);
      
      deployment.status = 'active';
      deployment.endpoint = endpoint;
      this.stats.totalDeployments++;
      
      this.emit('deploymentCompleted', deployment);
      
      return deployment;
      
    } catch (error) {
      console.error(`❌ Model deployment ${deploymentId} failed:`, error);
      deployment.status = 'failed';
      deployment.error = error instanceof Error ? error.message : String(error);
      this.stats.errors++;
      
      this.emit('deploymentFailed', deployment);
      throw error;
    }
  }

  /**
   * Get Hugging Face integration statistics
   */
  getStats(): HuggingFaceStats {
    return {
      initialized: this.isInitialized,
      inferenceEnabled: this.config.enableInference || false,
      datasetsEnabled: this.config.enableDatasets || false,
      spacesEnabled: this.config.enableSpaces || false,
      cachedModels: this.models.size,
      cachedDatasets: this.datasets.size,
      activeInferenceTasks: this.inferenceTasks.size,
      activeDatasetTasks: this.datasetTasks.size,
      activeDeployments: Array.from(this.deployments.values()).filter(d => d.status === 'active').length,
      ...this.stats,
      cacheHitRate: this.stats.apiCalls > 0 ? this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) : 0
    };
  }

  /**
   * Get all cached models
   */
  getCachedModels(): HFModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get all cached datasets
   */
  getCachedDatasets(): HFDataset[] {
    return Array.from(this.datasets.values());
  }

  /**
   * Get active inference tasks
   */
  getActiveInferenceTasks(): HFInferenceTask[] {
    return Array.from(this.inferenceTasks.values());
  }

  /**
   * Get active dataset tasks
   */
  getActiveDatasetTasks(): HFDatasetTask[] {
    return Array.from(this.datasetTasks.values());
  }

  /**
   * Get active deployments
   */
  getActiveDeployments(): HFModelDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.modelCache.clear();
    this.models.clear();
    this.datasets.clear();
    console.log('🗑️ Hugging Face cache cleared');
    this.emit('cacheCleared');
  }

  /**
   * Shutdown Hugging Face integration
   */
  async shutdown(): Promise<void> {
    console.log('🤗 Shutting down Hugging Face Integration...');
    
    // Cancel all active tasks
    for (const [taskId] of this.inferenceTasks) {
      this.emit('inferenceTaskCancelled', { taskId });
    }
    this.inferenceTasks.clear();
    
    for (const [taskId] of this.datasetTasks) {
      this.emit('datasetTaskCancelled', { taskId });
    }
    this.datasetTasks.clear();
    
    this.models.clear();
    this.datasets.clear();
    this.spaces.clear();
    this.modelCache.clear();
    this.isInitialized = false;
    
    this.emit('shutdown');
    console.log('✅ Hugging Face Integration shutdown complete');
  }

  // Private methods

  private async validateApiToken(): Promise<void> {
    // In a real implementation, this would validate the API token
    console.log('🔑 Validating Hugging Face API token...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async initializeInferenceAPI(): Promise<void> {
    console.log('🔧 Initializing Hugging Face Inference API...');
    // In real implementation, this would setup inference client
  }

  private async initializeDatasetAPI(): Promise<void> {
    console.log('🔧 Initializing Hugging Face Dataset API...');
    // In real implementation, this would setup datasets client
  }

  private async initializeSpacesAPI(): Promise<void> {
    console.log('🔧 Initializing Hugging Face Spaces API...');
    // In real implementation, this would setup spaces client
  }

  private async loadPopularModels(): Promise<void> {
    // Load some popular models for quick access
    const popularModels = [
      { id: 'microsoft/DialoGPT-medium', task: 'text-generation' },
      { id: 'bert-base-uncased', task: 'fill-mask' },
      { id: 'facebook/blenderbot-400M-distill', task: 'conversational' },
      { id: 'distilbert-base-uncased-finetuned-sst-2-english', task: 'text-classification' },
      { id: 'facebook/detr-resnet-50', task: 'object-detection' }
    ];

    for (const model of popularModels) {
      try {
        const modelData = await this.simulateModelFetch(model.id);
        this.models.set(model.id, modelData);
      } catch (error) {
        console.warn(`Failed to load popular model ${model.id}:`, error);
      }
    }
  }

  private async loadPopularDatasets(): Promise<void> {
    // Load some popular datasets for quick access
    const popularDatasets = [
      'squad',
      'imdb',
      'glue',
      'wikitext',
      'common_voice'
    ];

    for (const datasetId of popularDatasets) {
      try {
        const datasetData = await this.simulateDatasetFetch(datasetId);
        this.datasets.set(datasetId, datasetData);
      } catch (error) {
        console.warn(`Failed to load popular dataset ${datasetId}:`, error);
      }
    }
  }

  private async simulateModelSearch(query: string, options: any): Promise<HFModel[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Return mock search results
    return [
      {
        id: `${query}-model-1`,
        name: `${query} Model 1`,
        author: 'huggingface',
        task: options.task || 'text-generation',
        pipeline_tag: options.task || 'text-generation',
        tags: ['pytorch', 'transformers', query],
        downloads: Math.floor(Math.random() * 100000),
        likes: Math.floor(Math.random() * 1000),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_modified: new Date().toISOString(),
        private: false,
        gated: false,
        disabled: false,
        inference: 'supported'
      },
      {
        id: `${query}-model-2`,
        name: `${query} Model 2`,
        author: 'microsoft',
        task: options.task || 'text-classification',
        pipeline_tag: options.task || 'text-classification',
        tags: ['pytorch', 'transformers', query, 'finetuned'],
        downloads: Math.floor(Math.random() * 50000),
        likes: Math.floor(Math.random() * 500),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_modified: new Date().toISOString(),
        private: false,
        gated: false,
        disabled: false,
        inference: 'supported'
      }
    ];
  }

  private async simulateModelFetch(modelId: string): Promise<HFModel> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    return {
      id: modelId,
      name: modelId.split('/').pop() || modelId,
      author: modelId.includes('/') ? modelId.split('/')[0] : 'unknown',
      task: 'text-generation',
      pipeline_tag: 'text-generation',
      tags: ['pytorch', 'transformers'],
      downloads: Math.floor(Math.random() * 1000000),
      likes: Math.floor(Math.random() * 5000),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_modified: new Date().toISOString(),
      private: false,
      gated: false,
      disabled: false,
      inference: 'supported',
      cardData: {
        language: ['en'],
        license: 'apache-2.0',
        model_type: 'transformers'
      }
    };
  }

  private async simulateDatasetSearch(query: string, options: any): Promise<HFDataset[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return [
      {
        id: `${query}-dataset-1`,
        name: `${query} Dataset 1`,
        author: 'huggingface',
        description: `A comprehensive dataset for ${query} tasks`,
        tags: ['dataset', query, 'nlp'],
        downloads: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 100),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_modified: new Date().toISOString(),
        private: false,
        gated: false,
        disabled: false,
        size_categories: ['10K<n<100K'],
        task_categories: [options.task || 'text-classification'],
        language: ['en']
      }
    ];
  }

  private async simulateDatasetFetch(datasetId: string): Promise<HFDataset> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    return {
      id: datasetId,
      name: datasetId.split('/').pop() || datasetId,
      author: datasetId.includes('/') ? datasetId.split('/')[0] : 'unknown',
      description: `Dataset for ${datasetId}`,
      tags: ['dataset', 'nlp'],
      downloads: Math.floor(Math.random() * 100000),
      likes: Math.floor(Math.random() * 1000),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_modified: new Date().toISOString(),
      private: false,
      gated: false,
      disabled: false,
      size_categories: ['1K<n<10K'],
      task_categories: ['text-classification'],
      language: ['en']
    };
  }

  private async simulateInference(task: HFInferenceTask): Promise<any> {
    // Simulate realistic inference time based on task type
    const inferenceTime = {
      'text-generation': 2000 + Math.random() * 3000,
      'text-classification': 500 + Math.random() * 1000,
      'fill-mask': 800 + Math.random() * 1200,
      'question-answering': 1000 + Math.random() * 2000,
      'summarization': 3000 + Math.random() * 5000,
      'translation': 2000 + Math.random() * 3000,
      'conversational': 1500 + Math.random() * 2500
    };

    const executionTime = inferenceTime[task.task as keyof typeof inferenceTime] || 1500;
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    task.execution_time = executionTime;

    // Return mock results based on task type
    switch (task.task) {
      case 'text-generation':
        return [{
          generated_text: `Generated text for input: "${task.inputs}". This is a sample response from the Hugging Face model.`
        }];
      case 'text-classification':
        return [{
          label: 'POSITIVE',
          score: 0.8 + Math.random() * 0.2
        }];
      case 'fill-mask':
        return [{
          sequence: task.inputs.replace('[MASK]', 'world'),
          score: 0.9,
          token: 1234,
          token_str: 'world'
        }];
      case 'question-answering':
        return {
          answer: 'This is a sample answer from the model.',
          score: 0.95,
          start: 0,
          end: 37
        };
      default:
        return { success: true, execution_time: executionTime, model: task.model };
    }
  }

  private async simulateDatasetDownload(task: HFDatasetTask): Promise<string> {
    // Simulate download with progress updates
    const totalSize = Math.floor(Math.random() * 1000000000); // Random size up to 1GB
    task.size = totalSize;
    
    for (let progress = 0; progress <= 100; progress += 10) {
      task.progress = progress;
      task.downloaded = Math.floor((progress / 100) * totalSize);
      this.emit('datasetDownloadProgress', task);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return `/tmp/datasets/${task.dataset}`;
  }

  private async simulateModelDeployment(deployment: HFModelDeployment): Promise<string> {
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000));
    
    switch (deployment.target) {
      case 'cloudflare-worker':
        return `https://${deployment.model.replace('/', '-')}.workers.dev`;
      case 'p2p-peer':
        return `p2p://peer-${Math.random().toString(36).substr(2, 9)}/${deployment.model}`;
      case 'huggingface-space':
        return `https://huggingface.co/spaces/${deployment.model}-space`;
      default:
        return `https://deployed-${deployment.id}.example.com`;
    }
  }

  private createInferenceCacheKey(task: HFInferenceTask): string {
    return `${task.model}:${task.task}:${JSON.stringify(task.inputs)}:${JSON.stringify(task.parameters || {})}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return (Date.now() - timestamp) < (this.config.cacheTTL || 3600000);
  }

  private setupErrorHandling(): void {
    this.on('error', (error) => {
      console.error('🤗 Hugging Face Integration Error:', error);
    });
  }
}

export interface HuggingFaceStats {
  initialized: boolean;
  inferenceEnabled: boolean;
  datasetsEnabled: boolean;
  spacesEnabled: boolean;
  cachedModels: number;
  cachedDatasets: number;
  activeInferenceTasks: number;
  activeDatasetTasks: number;
  activeDeployments: number;
  totalInferences: number;
  totalDownloads: number;
  totalDeployments: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  apiCalls: number;
  errors: number;
}

// Pipeline task types supported by Hugging Face
export const SUPPORTED_TASKS = [
  'text-generation',
  'text-classification',
  'token-classification',
  'question-answering',
  'fill-mask',
  'summarization',
  'translation',
  'conversational',
  'text2text-generation',
  'sentence-similarity',
  'image-classification',
  'object-detection',
  'image-segmentation',
  'image-to-text',
  'text-to-image',
  'text-to-speech',
  'automatic-speech-recognition',
  'audio-classification',
  'voice-activity-detection',
  'depth-estimation',
  'image-to-image',
  'unconditional-image-generation',
  'video-classification',
  'reinforcement-learning',
  'robotics',
  'tabular-classification',
  'tabular-regression',
  'time-series-forecasting',
  'graph-ml'
] as const;

export type HuggingFaceTask = typeof SUPPORTED_TASKS[number];