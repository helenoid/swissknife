/**
 * Integration tests for CLI and Model integration
 */

import * as path from 'path';
import { createMockGooseBridge } from '../../helpers/mockBridge';
import { mockEnv, captureConsoleOutput, createTempTestDir, removeTempTestDir } from '../../helpers/testUtils';
import { generateModelFixtures, generatePromptFixtures } from '../../helpers/fixtures';

// Mock imports
jest.mock('../../../src/models/execution', () => {
  const originalModule = jest.requireActual('../../../src/models/execution');
  
  return {
    ...originalModule,
    ModelExecutionService: {
      getInstance: jest.fn().mockReturnValue({
        executeModel: jest.fn().mockImplementation(async (modelId, prompt, options) => {
          return {
            response: `Mock response for model ${modelId}: ${prompt.substring(0, 20)}...`,
            usage: {
              promptTokens: Math.floor(prompt.length / 4),
              completionTokens: 100,
              totalTokens: Math.floor(prompt.length / 4) + 100
            },
            timingMs: 500
          };
        })
      })
    }
  };
});

// Import after mocks
import { CommandRegistry } from '../../../src/command-registry';
import { ModelRegistry } from '../../../src/models/registry';
import { ConfigurationManager } from '../../../src/config/manager';
import { ModelExecutionService } from '../../../src/models/execution';

// CLI command imports
// This import will be specific to your project structure
// import { registerModelCommands } from '../../../src/commands/model';

describe('CLI and Model Integration', () => {
  let commandRegistry: any;
  let modelRegistry: any;
  let configManager: any;
  let modelExecutionService: any;
  let tempDir: string;
  let restoreEnv: () => void;
  let consoleCapture: ReturnType<typeof captureConsoleOutput>;
  
  const fixtures = generateModelFixtures();
  const promptFixtures = generatePromptFixtures();
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await createTempTestDir();
    
    // Mock environment variables
    restoreEnv = mockEnv({
      'TEST_PROVIDER_1_API_KEY': 'test-api-key-1',
      'TEST_PROVIDER_2_API_KEY': 'test-api-key-2',
      'SWISSKNIFE_CONFIG_PATH': path.join(tempDir, 'config.json')
    });
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await removeTempTestDir(tempDir);
    
    // Restore environment variables
    restoreEnv();
  });
  
  beforeEach(async () => {
    // Reset singletons
    (CommandRegistry as any).instance = null;
    (ModelRegistry as any).instance = null;
    (ConfigurationManager as any).instance = null;
    
    // Get instances
    commandRegistry = CommandRegistry.getInstance();
    modelRegistry = ModelRegistry.getInstance();
    configManager = ConfigurationManager.getInstance();
    modelExecutionService = ModelExecutionService.getInstance();
    
    // Initialize config
    await configManager.initialize();
    
    // Register test models
    fixtures.providers.forEach(provider => {
      modelRegistry.registerProvider(provider);
    });
    
    // Configure API keys
    configManager.set('apiKeys.test-provider-1', ['test-api-key-1']);
    configManager.set('apiKeys.test-provider-2', ['test-api-key-2']);
    configManager.set('models.default', 'test-model-1');
    
    // Initialize console capture
    consoleCapture = captureConsoleOutput();
    
    // Register model commands
    // NOTE: You'll need to adjust this based on your actual command registration process
    // registerModelCommands();
    
    // For this test, we'll manually create and register model commands
    commandRegistry.registerCommand({
      id: 'model:list',
      name: 'list',
      description: 'List available models',
      category: 'model',
      handler: async (args, context) => {
        const models = modelRegistry.getAllModels();
        console.log('Available models:');
        for (const model of models) {
          console.log(`- ${model.id} (${model.provider}): ${model.name}`);
        }
        return 0;
      }
    });
    
    commandRegistry.registerCommand({
      id: 'model:run',
      name: 'run',
      description: 'Run a model with the given prompt',
      category: 'model',
      options: [
        {
          name: 'model',
          type: 'string',
          description: 'Model ID to use'
        },
        {
          name: 'temperature',
          type: 'number',
          description: 'Temperature for generation',
          default: 0.7
        },
        {
          name: 'max-tokens',
          type: 'number',
          description: 'Maximum tokens to generate',
          default: 100
        }
      ],
      handler: async (args, context) => {
        const modelId = args.model || configManager.get('models.default');
        const prompt = args._.join(' ');
        
        if (!prompt) {
          console.error('Error: Prompt is required');
          return 1;
        }
        
        console.log(`Using model: ${modelId}`);
        console.log(`Prompt: ${prompt}`);
        
        try {
          const result = await modelExecutionService.executeModel(modelId, prompt, {
            temperature: args.temperature,
            maxTokens: args.maxTokens
          });
          
          console.log('\nResponse:');
          console.log(result.response);
          
          console.log('\nUsage:');
          console.log(`- Prompt tokens: ${result.usage.promptTokens}`);
          console.log(`- Completion tokens: ${result.usage.completionTokens}`);
          console.log(`- Total tokens: ${result.usage.totalTokens}`);
          console.log(`- Time: ${result.timingMs}ms`);
          
          return 0;
        } catch (error) {
          console.error(`Error: ${error.message}`);
          return 1;
        }
      }
    });
    
    commandRegistry.registerCommand({
      id: 'model:set-default',
      name: 'set-default',
      description: 'Set the default model',
      category: 'model',
      handler: async (args, context) => {
        const modelId = args._[0];
        
        if (!modelId) {
          console.error('Error: Model ID is required');
          return 1;
        }
        
        // Check if model exists
        const model = modelRegistry.getModel(modelId);
        if (!model) {
          console.error(`Error: Model not found: ${modelId}`);
          return 1;
        }
        
        // Set default model
        configManager.set('models.default', modelId);
        await configManager.save();
        
        console.log(`Default model set to: ${modelId}`);
        return 0;
      }
    });
  });
  
  afterEach(() => {
    // Restore console
    consoleCapture.restore();
    
    // Clear mocks
    jest.clearAllMocks();
  });
  
  describe('model:list command', () => {
    it('should list all available models', async () => {
      // Act
      const result = await commandRegistry.executeCommand('model:list', {}, {});
      
      // Assert
      expect(result).toBe(0); // Success exit code
      
      const output = consoleCapture.getOutput();
      expect(output.log).toContain('Available models:');
      
      // Check that all models are listed
      for (const provider of fixtures.providers) {
        for (const model of provider.models) {
          const modelLine = output.log.find(line => line.includes(model.id));
          expect(modelLine).toBeDefined();
          expect(modelLine).toContain(model.name);
        }
      }
    });
  });
  
  describe('model:run command', () => {
    it('should run a model with the given prompt', async () => {
      // Arrange
      const modelId = 'test-model-1';
      const prompt = 'What is the capital of France?';
      
      const executeModelSpy = jest.spyOn(modelExecutionService, 'executeModel');
      
      // Act
      const result = await commandRegistry.executeCommand('model:run', {
        model: modelId,
        _: [prompt]
      }, {});
      
      // Assert
      expect(result).toBe(0); // Success exit code
      
      // Check that model was executed with correct parameters
      expect(executeModelSpy).toHaveBeenCalledWith(
        modelId,
        prompt,
        expect.anything()
      );
      
      // Check console output
      const output = consoleCapture.getOutput();
      expect(output.log.join('\n')).toContain('Response:');
      expect(output.log.join('\n')).toContain('Usage:');
      expect(output.log.join('\n')).toContain('Mock response for model');
    });
    
    it('should use default model when no model is specified', async () => {
      // Arrange
      const prompt = 'What is the capital of Germany?';
      const defaultModel = configManager.get('models.default');
      
      const executeModelSpy = jest.spyOn(modelExecutionService, 'executeModel');
      
      // Act
      const result = await commandRegistry.executeCommand('model:run', {
        _: [prompt]
      }, {});
      
      // Assert
      expect(result).toBe(0); // Success exit code
      
      // Check that default model was used
      expect(executeModelSpy).toHaveBeenCalledWith(
        defaultModel,
        prompt,
        expect.anything()
      );
    });
    
    it('should handle missing prompt', async () => {
      // Act
      const result = await commandRegistry.executeCommand('model:run', {
        model: 'test-model-1',
        _: []
      }, {});
      
      // Assert
      expect(result).toBe(1); // Error exit code
      
      // Check error message
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain('Prompt is required');
    });
    
    it('should handle model execution errors', async () => {
      // Arrange
      const prompt = 'Test error prompt';
      
      // Mock execution service to throw error
      jest.spyOn(modelExecutionService, 'executeModel')
        .mockRejectedValueOnce(new Error('Test execution error'));
      
      // Act
      const result = await commandRegistry.executeCommand('model:run', {
        model: 'test-model-1',
        _: [prompt]
      }, {});
      
      // Assert
      expect(result).toBe(1); // Error exit code
      
      // Check error message
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain('Test execution error');
    });
  });
  
  describe('model:set-default command', () => {
    it('should set the default model', async () => {
      // Arrange
      const modelId = 'test-model-2';
      
      // Act
      const result = await commandRegistry.executeCommand('model:set-default', {
        _: [modelId]
      }, {});
      
      // Assert
      expect(result).toBe(0); // Success exit code
      
      // Check that default model was updated
      expect(configManager.get('models.default')).toBe(modelId);
      
      // Check console output
      const output = consoleCapture.getOutput();
      expect(output.log.join('\n')).toContain(`Default model set to: ${modelId}`);
    });
    
    it('should handle missing model ID', async () => {
      // Act
      const result = await commandRegistry.executeCommand('model:set-default', {
        _: []
      }, {});
      
      // Assert
      expect(result).toBe(1); // Error exit code
      
      // Check error message
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain('Model ID is required');
    });
    
    it('should handle non-existent model', async () => {
      // Act
      const result = await commandRegistry.executeCommand('model:set-default', {
        _: ['non-existent-model']
      }, {});
      
      // Assert
      expect(result).toBe(1); // Error exit code
      
      // Check error message
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain('Model not found');
    });
  });
});