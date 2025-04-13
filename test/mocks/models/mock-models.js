/**
 * Mock implementations for the Model system
 */

/**
 * Mock Model implementation
 */
class MockModel {
  constructor(options = {}) {
    this.id = options.id || 'mock-model';
    this.name = options.name || 'Mock Model';
    this.provider = options.provider || 'mock-provider';
    this.maxTokens = options.maxTokens || 4096;
    this.pricePerToken = options.pricePerToken || 0.00001;
    this.capabilities = {
      streaming: options.streaming !== false,
      images: options.images === true,
      audio: options.audio === true,
      video: options.video === true,
      vectors: options.vectors === true,
      ...(options.capabilities || {})
    };
    this.source = options.source || 'current';
    
    // Track generate calls
    this.generateCalls = [];
    
    // Configure responses
    this.generateResponse = options.generateResponse;
    this.simulateError = options.simulateError;
    this.errorMessage = options.errorMessage || 'Mock model error';
    this.responseDelay = options.responseDelay || 0;
  }
  
  /**
   * Generate a completion
   * @param {string} prompt - The prompt text
   * @param {object} options - Generation options
   * @returns {Promise<object>} The generated response
   */
  async generate(prompt, options = {}) {
    // Record the call
    this.generateCalls.push({ prompt, options });
    
    // Simulate response delay
    if (this.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    }
    
    // Simulate error if configured
    if (this.simulateError) {
      throw new Error(this.errorMessage);
    }
    
    // Return custom response or default
    if (this.generateResponse) {
      if (typeof this.generateResponse === 'function') {
        return this.generateResponse(prompt, options);
      }
      return this.generateResponse;
    }
    
    // Default response
    return {
      content: `Mock response for prompt: ${prompt.substring(0, 20)}...`,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: 100,
        totalTokens: prompt.length / 4 + 100
      },
      finishReason: 'stop'
    };
  }
}

/**
 * Mock Provider implementation
 */
class MockProvider {
  constructor(options = {}) {
    this.id = options.id || 'mock-provider';
    this.name = options.name || 'Mock Provider';
    this.baseURL = options.baseURL || 'https://api.mock-provider.com';
    this.envVar = options.envVar || 'MOCK_PROVIDER_API_KEY';
    this.defaultModel = options.defaultModel || 'mock-default-model';
    
    // Create default models if not provided
    this.models = options.models || [
      new MockModel({
        id: 'mock-default-model',
        name: 'Mock Default Model',
        provider: this.id
      }),
      new MockModel({
        id: 'mock-advanced-model',
        name: 'Mock Advanced Model',
        provider: this.id,
        maxTokens: 8192,
        pricePerToken: 0.00003
      })
    ];
  }
  
  /**
   * Get a model by ID
   * @param {string} modelId - Model identifier
   * @returns {MockModel|undefined} The model or undefined if not found
   */
  getModel(modelId) {
    return this.models.find(model => model.id === modelId);
  }
  
  /**
   * Get the default model
   * @returns {MockModel} The default model
   */
  getDefaultModel() {
    return this.getModel(this.defaultModel) || this.models[0];
  }
}

/**
 * Mock Model Registry implementation
 */
class MockModelRegistry {
  constructor() {
    this.providers = new Map();
    this.models = new Map();
  }
  
  /**
   * Register a provider
   * @param {MockProvider} provider - The provider to register
   */
  registerProvider(provider) {
    this.providers.set(provider.id, provider);
    
    // Register all models from this provider
    provider.models.forEach(model => {
      this.registerModel(model);
    });
  }
  
  /**
   * Register a model
   * @param {MockModel} model - The model to register
   */
  registerModel(model) {
    this.models.set(model.id, model);
  }
  
  /**
   * Get a provider by ID
   * @param {string} providerId - Provider identifier
   * @returns {MockProvider|undefined} The provider or undefined if not found
   */
  getProvider(providerId) {
    return this.providers.get(providerId);
  }
  
  /**
   * Get a model by ID
   * @param {string} modelId - Model identifier
   * @returns {MockModel|undefined} The model or undefined if not found
   */
  getModel(modelId) {
    return this.models.get(modelId);
  }
  
  /**
   * Get all registered providers
   * @returns {MockProvider[]} Array of all providers
   */
  getAllProviders() {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get all registered models
   * @returns {MockModel[]} Array of all models
   */
  getAllModels() {
    return Array.from(this.models.values());
  }
  
  /**
   * Get all models from a specific provider
   * @param {string} providerId - Provider identifier
   * @returns {MockModel[]} Array of models from the provider
   */
  getModelsByProvider(providerId) {
    return this.getAllModels().filter(model => model.provider === providerId);
  }
  
  /**
   * Get all models with a specific capability
   * @param {string} capability - Capability name
   * @returns {MockModel[]} Array of models with the capability
   */
  getModelsByCapability(capability) {
    return this.getAllModels().filter(model => model.capabilities[capability]);
  }
}

// Export mock classes
module.exports = {
  MockModel,
  MockProvider,
  MockModelRegistry
};