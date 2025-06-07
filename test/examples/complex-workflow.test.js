// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Example: Testing a complex workflow with multiple components
 * 
 * This example demonstrates how to test a workflow that involves:
 * - Command parsing and execution
 * - Model execution
 * - Task creation and processing
 * - Worker pool interaction
 */
const { createTestEnvironment, setupGlobalMocks } = require('../utils/setup');
const { sampleCommands } = require('../fixtures/commands/commands');
const { sampleModels, sampleProviders } = require('../fixtures/models/models');
const { MockModelExecutionService } = require('../mocks/services/mock-services');

// Import the components we're testing
// In a real test, these would be the actual components from your source code
const { CommandRegistry } = require('../../src/command-registry');  // Adjust path as needed

describe('Complex Workflow: Model Execution Command', () => {
  // Test environment
  let env;
  // Command handler we're testing
  let modelExecuteHandler;
  // Command registry
  let commandRegistry;
  // Cleanup function
  let cleanup;
  
  beforeAll(() => {
    // Create a test environment with all necessary mocks
    env = createTestEnvironment({
      // Use basic configuration
      config: {
        models: {
          default: 'gpt-4'
        },
        apiKeys: {
          'openai': ['test-api-key']
        }
      },
      // Register only the providers we need
      providers: [sampleProviders.openai],
      // Add a mock model execution service
      additionalServices: {
        modelExecution: new MockModelExecutionService({
          responses: {
            'gpt-4': (prompt) => ({
              response: `Mock response to: ${prompt}`,
              usage: {
                promptTokens: prompt.length / 4,
                completionTokens: 100,
                totalTokens: prompt.length / 4 + 100
              },
              timingMs: 500
            })
          }
        })
      }
    });
    
    // Set up global mocks
    cleanup = setupGlobalMocks(env);
    
    // Create the command handler we're testing
    modelExecuteHandler = async (args, context) => {
      const { modelId, prompt, options = {} } = args;
      
      // Get the model execution service from the context
      const modelExecutionService = context.services.getService('modelExecution');
      if (!modelExecutionService) {
        throw new Error('Model execution service not available');
      }
      
      // Get model ID - use specified, default, or error
      const useModelId = modelId || context.config.get('models.default');
      if (!useModelId) {
        throw new Error('No model specified and no default model configured');
      }
      
      // Execute the model
      try {
        const result = await modelExecutionService.executeModel(useModelId, prompt, options);
        
        // Print result to console
        console.log(`\nResponse from ${useModelId}:`);
        console.log(result.response);
        console.log(`\nTokens: ${result.usage.totalTokens} | Time: ${result.timingMs}ms`);
        
        return 0; // Success
      } catch (error) {
        console.error(`Error executing model: ${error.message}`);
        return 1; // Error
      }
    };
    
    // Create and set up command registry
    commandRegistry = new CommandRegistry({
      configManager: env.configManager
    });
    
    // Register the model execute command
    commandRegistry.registerCommand({
      id: 'model:execute',
      name: 'model execute',
      description: 'Execute a model with a prompt',
      options: [
        {
          name: 'model',
          type: 'string',
          description: 'Model ID to use',
          required: false
        },
        {
          name: 'prompt',
          type: 'string',
          description: 'Prompt text',
          required: true
        },
        {
          name: 'temperature',
          type: 'number',
          description: 'Temperature (0-1)',
          required: false,
          default: 0.7
        }
      ],
      handler: modelExecuteHandler
    });
  });
  
  afterAll(() => {
    // Clean up mocks
    if (cleanup) cleanup();
  });
  
  test('should execute a model with specified parameters', async () => {
    // Create mock context
    const context = {
      config: env.configManager,
      services: env.serviceRegistry,
      interactive: true,
      args: {}
    };
    
    // Execute the command with arguments
    const result = await commandRegistry.executeCommand('model:execute', {
      model: 'gpt-4',
      prompt: 'Explain quantum computing in simple terms',
      temperature: 0.8
    }, context);
    
    // Verify command succeeded
    expect(result).toBe(0);
    
    // Verify model execution service was called with correct parameters
    const modelExecutionService = env.serviceRegistry.getService('modelExecution');
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].modelId).toBe('gpt-4');
    expect(modelExecutionService.executeCalls[0].prompt).toBe('Explain quantum computing in simple terms');
    expect(modelExecutionService.executeCalls[0].options.temperature).toBe(0.8);
  });
  
  test('should use default model when not specified', async () => {
    // Create mock context
    const context = {
      config: env.configManager,
      services: env.serviceRegistry,
      interactive: true,
      args: {}
    };
    
    // Reset execution calls
    const modelExecutionService = env.serviceRegistry.getService('modelExecution');
    modelExecutionService.executeCalls = [];
    
    // Execute the command without specifying a model
    const result = await commandRegistry.executeCommand('model:execute', {
      prompt: 'What is machine learning?'
    }, context);
    
    // Verify command succeeded
    expect(result).toBe(0);
    
    // Verify model execution service was called with default model
    expect(modelExecutionService.executeCalls).toHaveLength(1);
    expect(modelExecutionService.executeCalls[0].modelId).toBe('gpt-4'); // Default from config
    expect(modelExecutionService.executeCalls[0].prompt).toBe('What is machine learning?');
  });
  
  test('should handle model execution errors', async () => {
    // Create mock context
    const context = {
      config: env.configManager,
      services: env.serviceRegistry,
      interactive: true,
      args: {}
    };
    
    // Make model execution service throw an error
    const modelExecutionService = env.serviceRegistry.getService('modelExecution');
    modelExecutionService.errors = {
      'gpt-4': new Error('API key invalid')
    };
    
    // Execute the command
    const result = await commandRegistry.executeCommand('model:execute', {
      prompt: 'This should fail'
    }, context);
    
    // Verify command failed
    expect(result).toBe(1);
    
    // Clean up
    modelExecutionService.errors = {};
  });
});