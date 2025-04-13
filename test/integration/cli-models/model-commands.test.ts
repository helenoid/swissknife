/**
 * Integration Tests for CLI Model Commands (`model:*`)
 *
 * These tests verify the integration between the CLI command layer
 * and the underlying Model services (Registry, Execution).
 *
 * Dependencies (ModelExecutionService, ModelRegistry, ConfigurationManager)
 * are mocked to isolate the command handling logic and output formatting.
 * Console output is captured to verify user-facing messages.
 */

import * as path from 'path';
// Import helpers - Add .js extension
import { mockEnv, captureConsoleOutput, createTempTestDir, removeTempTestDir } from '../../helpers/testUtils.js';
import { generateModelFixtures, generatePromptFixtures } from '../../helpers/fixtures.js'; // Add .js extension if needed

// --- Mock Setup ---

// Mock ConfigurationManager singleton - Use alias and .js
jest.mock('@/config/manager.js', () => {
    const mockConfigData: Record<string, any> = {};
    const mockInstance = {
        initialize: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockImplementation((key, defaultValue) => {
            const keys = key.split('.');
            let value = mockConfigData;
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) { value = value[k]; }
                else { return defaultValue; }
            }
            return value ?? defaultValue;
        }),
        set: jest.fn().mockImplementation((key, value) => {
            const keys = key.split('.');
            let current = mockConfigData;
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!current[k] || typeof current[k] !== 'object') { current[k] = {}; }
                current = current[k];
            }
            current[keys[keys.length - 1]] = value;
        }),
        save: jest.fn().mockResolvedValue(undefined),
    };
    return {
        ConfigurationManager: { // Assume class with static getInstance
            getInstance: jest.fn(() => mockInstance)
        }
    };
});

// Mock ModelExecutionService singleton - Use alias and .js
jest.mock('@/models/execution.js', () => {
  const mockExecuteModel = jest.fn().mockImplementation(async (modelId, prompt, options) => {
    const responseText = `Mock response for model ${modelId}: ${String(prompt).substring(0, 30)}...`;
    return {
      response: responseText,
      usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
      timingMs: 100,
    };
  });
  return {
    ModelExecutionService: { // Assume class with static getInstance
      getInstance: jest.fn().mockReturnValue({
        executeModel: mockExecuteModel,
      }),
    },
  };
});

// Mock ModelRegistry singleton - Use alias and .js
jest.mock('@/models/registry.js', () => {
    const mockRegistryInstance = {
        registerProvider: jest.fn(),
        registerModel: jest.fn(),
        getModel: jest.fn((modelId) => {
            for (const provider of generateModelFixtures().providers) {
                const model = provider.models.find((m: any) => m.id === modelId);
                if (model) return model;
            }
            return undefined;
        }),
        getAllModels: jest.fn(() => {
            return generateModelFixtures().providers.flatMap((p: any) => p.models);
        }),
    };
    return {
        ModelRegistry: { // Assume class with static getInstance
            getInstance: jest.fn(() => mockRegistryInstance)
        }
    };
});

// Mock CommandRegistry - Use alias and .js
// Assuming it's NOT a singleton and needs instantiation, but mock its methods
jest.mock('@/command-registry.js', () => {
    const commands = new Map();
    return {
        CommandRegistry: jest.fn().mockImplementation(() => ({
            registerCommand: jest.fn((cmd) => commands.set(cmd.name, cmd)),
            getCommand: jest.fn((name) => commands.get(name)),
            executeCommand: jest.fn(async (name, args, context) => { // Simulate execution
                const cmd = commands.get(name);
                if (cmd && cmd.handler) {
                    // Inject args into context for handler
                    const testContext = { ...context, args: args || {} };
                    return await cmd.handler(testContext);
                }
                throw new Error(`Mock CommandRegistry: Command ${name} not found or no handler.`);
            }),
            listCommands: jest.fn(() => Array.from(commands.values())),
        }))
    };
});


// --- Imports (after mocks) ---
// Use alias and .js extension
import { CommandRegistry } from '@/command-registry.js';
import { ModelRegistry } from '@/models/registry.js';
import { ConfigurationManager } from '@/config/manager.js';
import { ModelExecutionService } from '@/models/execution.js';
import type { Command, CommandContext } from '@/types/cli.js'; // Adjust path

// --- Test Suite ---

describe('CLI Model Commands Integration', () => {
  // Define types for mocks and instances
  let commandRegistry: CommandRegistry; // Use actual type
  let modelRegistry: jest.Mocked<ModelRegistry>;
  let configManager: jest.Mocked<ConfigurationManager>;
  let modelExecutionService: jest.Mocked<ModelExecutionService>;
  let tempDir: string;
  let restoreEnv: () => void;
  let consoleCapture: ReturnType<typeof captureConsoleOutput>;

  // Generate fixtures once
  const modelFixtures = generateModelFixtures();
  const promptFixtures = generatePromptFixtures();

  beforeAll(async () => {
    // Create temp directory for testing (config file)
    tempDir = await createTempTestDir('cli-model-int');

    // Mock environment variables
    restoreEnv = mockEnv({
      'SWISSKNIFE_CONFIG_PATH': path.join(tempDir, 'config.json'), // Point config to temp dir
    });
  });

  afterAll(async () => {
    // Clean up temp directory and restore environment
    await removeTempTestDir(tempDir);
    restoreEnv();
  });

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Get singleton instances from mocks
    // Note: Accessing mocked getInstance directly
    commandRegistry = new CommandRegistry(); // Instantiate based on new mock
    modelRegistry = ModelRegistry.getInstance() as jest.Mocked<ModelRegistry>;
    configManager = ConfigurationManager.getInstance() as jest.Mocked<ConfigurationManager>;
    modelExecutionService = ModelExecutionService.getInstance() as jest.Mocked<ModelExecutionService>;

    // Initialize config manager (mocked version)
    await configManager.initialize();

    // Setup initial mock config state
    configManager.set('apiKeys.test-provider-1', ['test-api-key-1']);
    configManager.set('apiKeys.test-provider-2', ['test-api-key-2']);
    configManager.set('models.default', 'test-model-1');

    // Register test models into the mocked registry
    modelFixtures.providers.forEach((provider: any) => {
      modelRegistry.registerProvider(provider as any);
      provider.models.forEach((model: any) => modelRegistry.registerModel(model));
    });

    // Initialize console capture
    consoleCapture = captureConsoleOutput();

    // --- Manual Command Registration (for test isolation) ---
    // Register commands using the mocked registry instance
    commandRegistry.registerCommand({
      name: 'list',
      description: 'List available models',
      handler: async (context: CommandContext): Promise<number> => {
        const models = modelRegistry.getAllModels();
        console.log('Available models:');
        models.forEach(model => {
            console.log(`- ${model?.id} (${model?.provider || 'N/A'}): ${model?.name || 'Unknown'}`);
        });
        return 0;
      }
    } as Command);

    commandRegistry.registerCommand({
      name: 'run',
      description: 'Run a model with the given prompt',
      options: [
        { name: 'model', type: 'string', description: 'Model ID' },
        { name: 'temperature', type: 'number', description: 'Temperature' },
        { name: 'max-tokens', type: 'number', description: 'Max tokens' }
      ],
      handler: async (context: CommandContext): Promise<number> => {
        const args = context.args || { _: [] };
        const modelId = args.model || configManager.get('models.default', 'fallback-model');
        const prompt = args._?.join(' ') || '';

        if (!prompt) {
          console.error('Error: Prompt is required');
          return 1;
        }
        console.log(`Using model: ${modelId}`);
        console.log(`Prompt: ${prompt}`);
        try {
          const result = await modelExecutionService.executeModel(modelId, prompt, {
            temperature: args.temperature,
            maxTokens: args['max-tokens']
          });
          console.log('\nResponse:');
          console.log(result.response);
          console.log('\nUsage:');
          console.log(`- Prompt tokens: ${result.usage.promptTokens}`);
          console.log(`- Completion tokens: ${result.usage.completionTokens}`);
          console.log(`- Total tokens: ${result.usage.totalTokens}`);
          console.log(`- Time: ${result.timingMs}ms`);
          return 0;
        } catch (error: any) {
          console.error(`Error: ${error.message}`);
          return 1;
        }
      }
    } as Command);

    commandRegistry.registerCommand({
      name: 'set-default',
      description: 'Set the default model',
      handler: async (context: CommandContext): Promise<number> => {
        const args = context.args || { _: [] };
        const modelId = args._?.[0];

        if (!modelId) {
          console.error('Error: Model ID is required');
          return 1;
        }
        const model = modelRegistry.getModel(modelId);
        if (!model) {
          console.error(`Error: Model not found: ${modelId}`);
          return 1;
        }
        configManager.set('models.default', modelId);
        await configManager.save();
        console.log(`Default model set to: ${modelId}`);
        return 0;
      }
    } as Command);
  });

  afterEach(() => {
    // Restore console output capture
    consoleCapture.restore();
  });

  // --- Test Cases ---

  describe('model list command', () => {
    it('should list all available models from the registry', async () => {
      // Arrange
      const context = {} as CommandContext; // Minimal context

      // Act
      // Execute command via the mocked registry's execute method
      const exitCode = await commandRegistry.executeCommand('list', {}, context);

      // Assert
      expect(exitCode).toBe(0); // Success exit code
      const output = consoleCapture.getOutput();
      expect(output.log).toContain('Available models:');
      const expectedModel1 = modelFixtures.providers[0].models[0];
      const expectedModel2 = modelFixtures.providers[1].models[0];
      expect(output.log.some(line => line.includes(expectedModel1.id))).toBe(true);
      expect(output.log.some(line => line.includes(expectedModel1.name))).toBe(true);
      expect(output.log.some(line => line.includes(expectedModel2.id))).toBe(true);
      expect(output.log.some(line => line.includes(expectedModel2.name))).toBe(true);
      expect(output.error).toEqual([]); // No errors expected
    });
  });

  describe('model run command', () => {
    it('should execute the specified model with the given prompt', async () => {
      // Arrange
      const modelId = 'test-model-1';
      const prompt = 'What is the capital of France?';
      const args = { model: modelId, _: [prompt] }; // Simulate parsed args
      const context = {} as CommandContext;

      // Act
      const exitCode = await commandRegistry.executeCommand('run', args, context);

      // Assert
      expect(exitCode).toBe(0);
      expect(modelExecutionService.executeModel).toHaveBeenCalledTimes(1);
      expect(modelExecutionService.executeModel).toHaveBeenCalledWith(
        modelId,
        prompt,
        { temperature: undefined, maxTokens: undefined }
      );
      const output = consoleCapture.getOutput();
      expect(output.log.join('\n')).toContain('Response:');
      expect(output.log.join('\n')).toContain(`Mock response for model ${modelId}`);
      expect(output.error).toEqual([]);
    });

    it('should use the default model when no model ID is specified', async () => {
      // Arrange
      const prompt = 'What is the capital of Germany?';
      const defaultModelId = 'test-model-1'; // From beforeEach setup
      const args = { _: [prompt] }; // No model specified
      const context = {} as CommandContext;

      // Act
      const exitCode = await commandRegistry.executeCommand('run', args, context);

      // Assert
      expect(exitCode).toBe(0);
      expect(modelExecutionService.executeModel).toHaveBeenCalledTimes(1);
      expect(modelExecutionService.executeModel).toHaveBeenCalledWith(
        defaultModelId,
        prompt,
        expect.anything()
      );
      const output = consoleCapture.getOutput();
      expect(output.log.join('\n')).toContain(`Using model: ${defaultModelId}`);
      expect(output.error).toEqual([]);
    });

    it('should return an error if the prompt is missing', async () => {
      // Arrange
      const args = { model: 'test-model-1', _: [] }; // Missing prompt
      const context = {} as CommandContext;

      // Act
      const exitCode = await commandRegistry.executeCommand('run', args, context);

      // Assert
      expect(exitCode).toBe(1);
      expect(modelExecutionService.executeModel).not.toHaveBeenCalled();
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain('Error: Prompt is required');
    });

    it('should return an error if model execution fails', async () => {
      // Arrange
      const prompt = 'Test error scenario';
      const modelId = 'test-model-1';
      const executionError = new Error('Model API failed');
      (modelExecutionService.executeModel as jest.Mock).mockRejectedValueOnce(executionError);
      const args = { model: modelId, _: [prompt] };
      const context = {} as CommandContext;

      // Act
      const exitCode = await commandRegistry.executeCommand('run', args, context);

      // Assert
      expect(exitCode).toBe(1);
      expect(modelExecutionService.executeModel).toHaveBeenCalledTimes(1);
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain(`Error: ${executionError.message}`);
    });
  });

  describe('model set-default command', () => {
    it('should successfully set the default model in configuration', async () => {
      // Arrange
      const newDefaultModelId = 'test-model-2';
      const args = { _: [newDefaultModelId] };
      const context = {} as CommandContext;

      // Act
      const exitCode = await commandRegistry.executeCommand('set-default', args, context);

      // Assert
      expect(exitCode).toBe(0);
      expect(configManager.set).toHaveBeenCalledWith('models.default', newDefaultModelId);
      expect(configManager.save).toHaveBeenCalledTimes(1);
      const output = consoleCapture.getOutput();
      expect(output.log.join('\n')).toContain(`Default model set to: ${newDefaultModelId}`);
      expect(output.error).toEqual([]);
    });

    it('should return an error if the model ID argument is missing', async () => {
      // Arrange
      const args = { _: [] };
      const context = {} as CommandContext;

      // Act
      const exitCode = await commandRegistry.executeCommand('set-default', args, context);

      // Assert
      expect(exitCode).toBe(1);
      expect(configManager.set).not.toHaveBeenCalled();
      expect(configManager.save).not.toHaveBeenCalled();
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain('Error: Model ID is required');
    });

    it('should return an error if the specified model ID does not exist', async () => {
      // Arrange
      const nonExistentModelId = 'non-existent-model';
      const args = { _: [nonExistentModelId] };
      const context = {} as CommandContext;
      (modelRegistry.getModel as jest.Mock).mockReturnValueOnce(undefined); // Ensure mock returns undefined

      // Act
      const exitCode = await commandRegistry.executeCommand('set-default', args, context);

      // Assert
      expect(exitCode).toBe(1);
      expect(configManager.set).not.toHaveBeenCalled();
      expect(configManager.save).not.toHaveBeenCalled();
      const output = consoleCapture.getOutput();
      expect(output.error.join('\n')).toContain(`Error: Model not found: ${nonExistentModelId}`);
    });
  });
});
