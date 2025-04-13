/**
 * Model Registry - Centralized registry for AI models from various sources
 */

import { EventEmitter } from 'events';
import { ConfigurationManager } from '../config/manager';

/**
 * Model capabilities interface
 */
export interface ModelCapabilities {
  streaming?: boolean;
  images?: boolean;
  audio?: boolean;
  video?: boolean;
  vectors?: boolean;
  functionCalling?: boolean;
}

/**
 * Source of the model
 */
export type ModelSource = 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';

/**
 * Model interface
 */
export interface Model {
  id: string;
  name: string;
  provider: string;
  maxTokens?: number;
  pricePerToken?: number;
  capabilities: ModelCapabilities;
  source: ModelSource;
  description?: string;
  contextWindow?: number;
  version?: string;
}

/**
 * Provider interface
 */
export interface Provider {
  id: string;
  name: string;
  models: Model[];
  baseURL?: string;
  envVar?: string;
  defaultModel?: string;
  authType?: 'bearer' | 'api-key' | 'none';
  description?: string;
}

/**
 * Model Registry class
 * 
 * Manages a registry of models and providers
 */
export class ModelRegistry extends EventEmitter {
  private static instance: ModelRegistry;
  private providers: Map<string, Provider> = new Map();
  private models: Map<string, Model> = new Map();
  private configManager: ConfigurationManager;
  private initialized: boolean = false;
  
  private constructor() {
    super();
    this.configManager = ConfigurationManager.getInstance();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }
  
  /**
   * Initialize the model registry
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Load any persistent model data from configuration
    const savedProviders = this.configManager.get<Provider[]>('models.providers', []);
    for (const provider of savedProviders) {
      this.registerProvider(provider, false);
    }
    
    this.initialized = true;
  }
  
  /**
   * Register a provider
   */
  registerProvider(provider: Provider, persist: boolean = true): void {
    // Validate provider
    if (!provider.id || !provider.name || !provider.models) {
      throw new Error(`Invalid provider definition: ${provider.id || 'unknown'}`);
    }
    
    // Register provider
    this.providers.set(provider.id, { ...provider });
    
    // Register provider's models
    for (const model of provider.models) {
      this.registerModel(model, false);
    }
    
    // Persist to configuration if needed
    if (persist) {
      this.persistProviders();
    }
    
    // Emit event
    this.emit('provider:registered', { providerId: provider.id });
  }
  
  /**
   * Persist providers to configuration
   */
  private async persistProviders(): Promise<void> {
    const providers = this.getAllProviders();
    
    // Save to configuration
    this.configManager.set('models.providers', providers);
    
    try {
      await this.configManager.save();
    } catch (error) {
      console.error('Failed to persist providers:', error);
    }
  }
  
  /**
   * Register a model
   */
  registerModel(model: Model, persist: boolean = true): void {
    // Validate model
    if (!model.id || !model.name || !model.provider || !model.source) {
      throw new Error(`Invalid model definition: ${model.id || 'unknown'}`);
    }
    
    // Register model
    this.models.set(model.id, { ...model });
    
    // Add to provider if not already there
    const provider = this.providers.get(model.provider);
    if (provider) {
      const existingModel = provider.models.find(m => m.id === model.id);
      if (!existingModel) {
        provider.models.push({ ...model });
      }
    }
    
    // Persist to configuration if needed
    if (persist) {
      this.persistProviders();
    }
    
    // Emit event
    this.emit('model:registered', { modelId: model.id });
  }
  
  /**
   * Get a provider by ID
   */
  getProvider(id: string): Provider | undefined {
    return this.providers.get(id);
  }
  
  /**
   * Get a model by ID
   */
  getModel(id: string): Model | undefined {
    return this.models.get(id);
  }
  
  /**
   * Get all providers
   */
  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get all models
   */
  getAllModels(): Model[] {
    return Array.from(this.models.values());
  }
  
  /**
   * Get models by provider
   */
  getModelsByProvider(providerId: string): Model[] {
    return this.getAllModels().filter(model => model.provider === providerId);
  }
  
  /**
   * Get models by capability
   */
  getModelsByCapability(capability: keyof ModelCapabilities): Model[] {
    return this.getAllModels().filter(model => model.capabilities[capability]);
  }
  
  /**
   * Get models by source
   */
  getModelsBySource(source: ModelSource): Model[] {
    return this.getAllModels().filter(model => model.source === source);
  }
  
  /**
   * Get the default model for a provider
   */
  getDefaultModel(providerId: string): Model | undefined {
    const provider = this.getProvider(providerId);
    if (!provider || !provider.defaultModel) {
      return undefined;
    }
    
    return this.getModel(provider.defaultModel);
  }
  
  /**
   * Set the default model for a provider
   */
  setDefaultModel(providerId: string, modelId: string): boolean {
    const provider = this.getProvider(providerId);
    const model = this.getModel(modelId);
    
    if (!provider || !model) {
      return false;
    }
    
    if (model.provider !== providerId) {
      return false;
    }
    
    provider.defaultModel = modelId;
    
    // Persist the change
    this.persistProviders();
    
    // Emit event
    this.emit('provider:default-model-changed', { providerId, modelId });
    
    return true;
  }
  
  /**
   * Get API key for a provider
   */
  getApiKey(providerId: string): string | undefined {
    const provider = this.getProvider(providerId);
    
    if (!provider || !provider.envVar) {
      return undefined;
    }
    
    // First check configuration
    const apiKeys = this.configManager.get<string[]>(`core.apiKeys.${providerId}`, []);
    if (apiKeys && apiKeys.length > 0) {
      return apiKeys[0]; // Use first key for now
    }
    
    // Then check environment variable
    if (provider.envVar && process.env[provider.envVar]) {
      return process.env[provider.envVar];
    }
    
    return undefined;
  }
  
  /**
   * Add an API key for a provider
   */
  async addApiKey(providerId: string, apiKey: string): Promise<boolean> {
    const provider = this.getProvider(providerId);
    
    if (!provider) {
      return false;
    }
    
    // Get current API keys
    const apiKeys = this.configManager.get<string[]>(`core.apiKeys.${providerId}`, []);
    
    // Add the new key if not already there
    if (!apiKeys.includes(apiKey)) {
      apiKeys.push(apiKey);
      
      // Update configuration
      this.configManager.set(`core.apiKeys.${providerId}`, apiKeys);
      
      // Save configuration
      try {
        await this.configManager.save();
      } catch (error) {
        console.error('Failed to save API key:', error);
        return false;
      }
      
      // Emit event
      this.emit('provider:api-key-added', { providerId });
    }
    
    return true;
  }
  
  /**
   * Remove an API key for a provider
   */
  async removeApiKey(providerId: string, apiKey: string): Promise<boolean> {
    const provider = this.getProvider(providerId);
    
    if (!provider) {
      return false;
    }
    
    // Get current API keys
    const apiKeys = this.configManager.get<string[]>(`core.apiKeys.${providerId}`, []);
    
    // Remove the key if it exists
    const index = apiKeys.indexOf(apiKey);
    if (index >= 0) {
      apiKeys.splice(index, 1);
      
      // Update configuration
      this.configManager.set(`core.apiKeys.${providerId}`, apiKeys);
      
      // Save configuration
      try {
        await this.configManager.save();
      } catch (error) {
        console.error('Failed to save API key removal:', error);
        return false;
      }
      
      // Emit event
      this.emit('provider:api-key-removed', { providerId });
    }
    
    return true;
  }
  
  /**
   * Remove a provider and its models
   */
  removeProvider(providerId: string): boolean {
    const provider = this.getProvider(providerId);
    
    if (!provider) {
      return false;
    }
    
    // Remove all models for this provider
    for (const model of provider.models) {
      this.models.delete(model.id);
    }
    
    // Remove the provider
    this.providers.delete(providerId);
    
    // Persist the change
    this.persistProviders();
    
    // Emit event
    this.emit('provider:removed', { providerId });
    
    return true;
  }
  
  /**
   * Remove a model
   */
  removeModel(modelId: string): boolean {
    const model = this.getModel(modelId);
    
    if (!model) {
      return false;
    }
    
    // Remove from models map
    this.models.delete(modelId);
    
    // Remove from provider
    const provider = this.getProvider(model.provider);
    if (provider) {
      const index = provider.models.findIndex(m => m.id === modelId);
      if (index >= 0) {
        provider.models.splice(index, 1);
      }
      
      // If this was the default model, clear it
      if (provider.defaultModel === modelId) {
        provider.defaultModel = undefined;
      }
    }
    
    // Persist the change
    this.persistProviders();
    
    // Emit event
    this.emit('model:removed', { modelId });
    
    return true;
  }
}

// Helper function for registering providers
export function registerProvider(provider: Provider): void {
  const registry = ModelRegistry.getInstance();
  registry.registerProvider(provider);
}

// Helper function for registering models
export function registerModel(model: Model): void {
  const registry = ModelRegistry.getInstance();
  registry.registerModel(model);
}