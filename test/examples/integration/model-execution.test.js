/**
 * Integration test for the Model Execution System
 * 
 * This test demonstrates how to test the complete model execution pipeline,
 * including model selection, API key management, and result processing.
 */
const { createTestEnvironment, setupGlobalMocks } = require('../../utils/setup');
const { sampleModels, sampleProviders, sampleResponses } = require('../../fixtures/models/models');
const { MockModelExecutionService } = require('../../mocks/services/mock-services');
const { captureConsoleOutput, wait } = require('../../utils/test-helpers');

/**
 * This test demonstrates how to test the complete model execution pipeline
 * which is a key component in Phase 1 of the SwissKnife project.
 */
describe('Model Execution System', () => {
  let env;
  let modelRegistry;
  let configManager;
  let modelExecutionService;
  let serviceRegistry;
  let cleanup;
  let consoleCapture;
  
  // Mock implementation of the model execution component
  class ModelExecutor {
    constructor(options = {}) {
      this.modelRegistry = options.modelRegistry;
      this.configManager = options.configManager;
      this.executionService = options.executionService;
      
      // Default options
      this.options = {
        defaultTemperature: 0.7,
        defaultMaxTokens: 1000,
        ...options
      };
    }
    
    /**
     * Execute a model with a prompt
     * @param {object} params - Execution parameters
     * @returns {Promise<object>} Execution result
     */
    async execute(params) {
      const {
        modelId,
        prompt,
        temperature = this.options.defaultTemperature,
        maxTokens = this.options.defaultMaxTokens,
        stream = false,
        ...otherOptions
      } = params;
      
      // Get model ID - use specified, default from config, or throw
      const useModelId = modelId || this.configManager.get('models.default');
      if (!useModelId) {
        throw new Error('No model specified and no default model configured');
      }
      
      // Get model
      const model = this.modelRegistry.getModel(useModelId);
      if (!model) {
        throw new Error(`Model not found: ${useModelId}`);
      }
      
      // Get provider
      const provider = this.modelRegistry.getProvider(model.provider);
      if (!provider) {
        throw new Error(`Provider not found for model ${useModelId}: ${model.provider}`);
      }
      
      // Get API key
      const apiKey = this.getApiKey(provider);
      if (!apiKey) {
        throw new Error(`No API key found for provider: ${provider.id}`);
      }
      
      // Check capabilities
      if (stream && !model.capabilities.streaming) {
        throw new Error(`Model ${useModelId} does not support streaming`);
      }
      
      // Prepare execution options
      const executionOptions = {
        temperature,
        maxTokens,
        stream,
        ...otherOptions
      };
      
      // Execute model
      try {
        console.log(`Executing model ${useModelId} with provider ${provider.id}`);
        
        const startTime = Date.now();
        
        const result = await this.executionService.executeModel(
          useModelId,
          prompt,
          executionOptions
        );
        
        const endTime = Date.now();
        
        // Log stats for non-streaming
        if (!stream) {
          console.log(`Model execution completed in ${endTime - startTime}ms`);
          if (result.usage) {
            console.log(`Tokens: ${result.usage.totalTokens} (${result.usage.promptTokens} prompt, ${result.usage.completionTokens} completion)`);
          }
        }
        
        return result;
      } catch (error) {
        console.error(`Model execution error: ${error.message}`);
        throw error;
      }
    }
    
    /**
     * Get API key for a provider
     * @param {object} provider - Provider object
     * @returns {string|null} API key or null if not found
     */
    getApiKey(provider) {
      if (!provider.envVar) {
        return null;
      }
      
      // First check configuration
      const configKeys = this.configManager.get(`apiKeys.${provider.id}`, []);
      if (configKeys.length > 0) {
        return configKeys[0]; // Use first key for simplicity
      }
      
      // Then check environment variable
      const envKey = process.env[provider.envVar];
      if (envKey) {
        return envKey;
      }
      
      return null;
    }
  }
  
  beforeAll(() => {
    // Create test environment
    env = createTestEnvironment({
      // Use sample configuration
      config: {
        models: {
          default: 'gpt-4',
          parameters: {
            temperature: 0.7,
            maxTokens: 1000
          }
        },
        apiKeys: {
          'openai': ['test-openai-key'],
          'anthropic': ['test-anthropic-key']
        }
      },
      // Register sample providers
      providers: [
        sampleProviders.openai,
        sampleProviders.anthropic,
        sampleProviders.goose
      ]
    });
    
    // Set up global mocks
    cleanup = setupGlobalMocks(env);
    
    // Get components
    modelRegistry = env.modelRegistry;
    configManager = env.configManager;
    serviceRegistry = env.serviceRegistry;
    
    // Create model execution service with predefined responses
    modelExecutionService = new MockModelExecutionService({
      responses: {
        // OpenAI models
        'gpt-3.5-turbo': (prompt) => ({
          response: `GPT-3.5 Turbo response to: ${prompt.substring(0, 30)}...`,
          usage: {
            promptTokens: prompt.length / 4,
            completionTokens: 100,
            totalTokens: prompt.length / 4 + 100
          },
          timingMs: 800
        }),
        'gpt-4': (prompt) => ({
          response: `GPT-4 response to: ${prompt.substring(0, 30)}...`,
          usage: {
            promptTokens: prompt.length / 4,
            completionTokens: 150,
            totalTokens: prompt.length / 4 + 150
          },
          timingMs: 1200
        }),
        'gpt-4-vision': (prompt, options) => {
          if (options.images && options.images.length > 0) {
            return {
              response: `GPT-4 Vision analyzed ${options.images.length} images and prompt: ${prompt.substring(0, 30)}...`,
              usage: {
                promptTokens: prompt.length / 4 + 300, // Extra tokens for images
                completionTokens: 200,
                totalTokens: prompt.length / 4 + 500
              },
              timingMs: 1500
            };
          } else {
            return {
              response: `GPT-4 Vision response (no images) to: ${prompt.substring(0, 30)}...`,
              usage: {
                promptTokens: prompt.length / 4,
                completionTokens: 150,
                totalTokens: prompt.length / 4 + 150
              },
              timingMs: 1200
            };
          }
        },
        
        // Anthropic models
        'claude-2': (prompt) => ({
          response: `Claude 2 response to: ${prompt.substring(0, 30)}...`,
          usage: {
            promptTokens: prompt.length / 4,
            completionTokens: 120,
            totalTokens: prompt.length / 4 + 120
          },
          timingMs: 1000
        }),
        
        // Goose models
        'goose-default': (prompt) => ({
          response: `Goose response to: ${prompt.substring(0, 30)}...`,
          usage: {
            promptTokens: prompt.length / 4,
            completionTokens: 80,
            totalTokens: prompt.length / 4 + 80
          },
          timingMs: 600
        })
      },
      // Add some errors for specific cases
      errors: {
        'non-existent-model': new Error('Model not found'),
        // Add a conditional error for API key testing
        'gpt-4': (prompt, options) => {
          // If API key is incorrect, return error
          if (options._forceAuthError) {
            return new Error('Invalid API key');
          }
        }
      }
    });
    
    // Register service
    serviceRegistry.registerService('modelExecution', modelExecutionService);
    
    // Set up console capture
    consoleCapture = captureConsoleOutput();
  });
  
  beforeEach(() => {
    // Reset console capture
    consoleCapture.start();
    
    // Reset execution service calls
    modelExecutionService.executeCalls = [];
  });
  
  afterEach(() => {
    // Stop console capture
    consoleCapture.stop();
  });
  
  afterAll(() => {
    if (cleanup) cleanup();
  });
  
  test('should execute a model with default parameters', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute model with minimal parameters
    const result = await modelExecutor.execute({
      prompt: 'Tell me about quantum computing'
    });
    
    // Verify result
    expect(result.response).toContain('GPT-4 response to: Tell me about quantum computing');
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.timingMs).toBeGreaterThan(0);
    
    // Verify service was called with correct parameters
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].modelId).toBe('gpt-4');
    expect(modelExecutionService.executeCalls[0].prompt).toBe('Tell me about quantum computing');
    expect(modelExecutionService.executeCalls[0].options.temperature).toBe(0.7);
    
    // Verify console output
    expect(consoleCapture.output.log).toContain(expect.stringContaining('Executing model gpt-4'));
    expect(consoleCapture.output.log).toContain(expect.stringContaining('Model execution completed'));
  });
  
  test('should execute a specified model', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute specific model
    const result = await modelExecutor.execute({
      modelId: 'claude-2',
      prompt: 'Explain the theory of relativity'
    });
    
    // Verify result
    expect(result.response).toContain('Claude 2 response to: Explain the theory of relativi');
    
    // Verify service was called with correct model
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].modelId).toBe('claude-2');
  });
  
  test('should use custom execution parameters', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute with custom parameters
    const result = await modelExecutor.execute({
      modelId: 'gpt-3.5-turbo',
      prompt: 'Write a story about a robot',
      temperature: 0.9,
      maxTokens: 2000,
      topP: 0.95,
      presencePenalty: 0.1,
      frequencyPenalty: 0.2
    });
    
    // Verify result
    expect(result.response).toContain('GPT-3.5 Turbo response to: Write a story about a robot');
    
    // Verify service was called with correct parameters
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    const call = modelExecutionService.executeCalls[0];
    expect(call.modelId).toBe('gpt-3.5-turbo');
    expect(call.options).toEqual(expect.objectContaining({
      temperature: 0.9,
      maxTokens: 2000,
      topP: 0.95,
      presencePenalty: 0.1,
      frequencyPenalty: 0.2
    }));
  });
  
  test('should handle multimodal capabilities correctly', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute multimodal model with images
    const result = await modelExecutor.execute({
      modelId: 'gpt-4-vision',
      prompt: 'Describe these images',
      images: [
        { url: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' }
      ]
    });
    
    // Verify result
    expect(result.response).toContain('GPT-4 Vision analyzed 2 images');
    
    // Verify service was called with correct parameters
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].modelId).toBe('gpt-4-vision');
    expect(modelExecutionService.executeCalls[0].options.images).toHaveLength(2);
  });
  
  test('should handle model execution errors', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute non-existent model
    await expect(async () => {
      await modelExecutor.execute({
        modelId: 'non-existent-model',
        prompt: 'This should fail'
      });
    }).rejects.toThrow('Model not found');
    
    // Verify error logging
    expect(consoleCapture.output.error).toContain(expect.stringContaining('Model execution error'));
  });
  
  test('should handle API key errors', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute with invalid API key (using our special flag)
    await expect(async () => {
      await modelExecutor.execute({
        modelId: 'gpt-4',
        prompt: 'This should fail with auth error',
        _forceAuthError: true // Special flag for our mock
      });
    }).rejects.toThrow('Invalid API key');
  });
  
  test('should get API key from configuration', async () => {
    // Create model executor with overridden getApiKey to spy on it
    const getApiKeySpy = jest.fn();
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Override getApiKey to spy on calls
    const originalGetApiKey = modelExecutor.getApiKey;
    modelExecutor.getApiKey = function(provider) {
      const result = originalGetApiKey.call(this, provider);
      getApiKeySpy(provider.id, result);
      return result;
    };
    
    // Execute model
    await modelExecutor.execute({
      modelId: 'gpt-4',
      prompt: 'Test API key retrieval'
    });
    
    // Verify getApiKey was called
    expect(getApiKeySpy).toHaveBeenCalledWith('openai', 'test-openai-key');
  });
  
  test('should fall back to environment variable for API key', async () => {
    // Create model executor with overridden getApiKey
    const getApiKeySpy = jest.fn();
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Override getApiKey to spy on calls
    const originalGetApiKey = modelExecutor.getApiKey;
    modelExecutor.getApiKey = function(provider) {
      // Simulate config without API keys
      const configSpy = jest.spyOn(this.configManager, 'get');
      configSpy.mockImplementationOnce(() => []);
      
      const result = originalGetApiKey.call(this, provider);
      getApiKeySpy(provider.id, result);
      
      configSpy.mockRestore();
      return result;
    };
    
    // Execute model
    await modelExecutor.execute({
      modelId: 'gpt-4',
      prompt: 'Test API key from env'
    });
    
    // Should use env var (set in test environment)
    expect(getApiKeySpy).toHaveBeenCalledWith('openai', 'test-openai-key');
  });
  
  test('should update default model in config', async () => {
    // Change default model in config
    configManager.set('models.default', 'claude-2');
    
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute without specifying model
    const result = await modelExecutor.execute({
      prompt: 'Test with updated default model'
    });
    
    // Verify correct model was used
    expect(result.response).toContain('Claude 2 response');
    expect(modelExecutionService.executeCalls[0].modelId).toBe('claude-2');
  });
  
  test('should execute model from Goose source', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute Goose model
    const result = await modelExecutor.execute({
      modelId: 'goose-default',
      prompt: 'Test Goose model execution'
    });
    
    // Verify result
    expect(result.response).toContain('Goose response to:');
    
    // Verify service was called with correct model
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].modelId).toBe('goose-default');
  });
  
  test('should respect streaming capability', async () => {
    // Create model executor
    const modelExecutor = new ModelExecutor({
      modelRegistry,
      configManager,
      executionService: modelExecutionService
    });
    
    // Execute with streaming for model that supports it
    await modelExecutor.execute({
      modelId: 'gpt-4',
      prompt: 'Test streaming',
      stream: true
    });
    
    // Verify service was called with streaming option
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].options.stream).toBe(true);
    
    // Reset calls
    modelExecutionService.executeCalls = [];
    
    // Try streaming with model that doesn't support it
    // Modify the capabilities of a model temporarily
    const originalCapabilities = { ...sampleModels.tasknet.capabilities };
    sampleModels.tasknet.capabilities.streaming = false;
    
    await expect(async () => {
      await modelExecutor.execute({
        modelId: 'tasknet-model',
        prompt: 'Test streaming failure',
        stream: true
      });
    }).rejects.toThrow('does not support streaming');
    
    // Restore original capabilities
    sampleModels.tasknet.capabilities = originalCapabilities;
  });
});