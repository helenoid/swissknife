// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Integration test example for Configuration and Command systems
 * 
 * This test demonstrates how to test the integration between the
 * configuration system and command system components in Phase 1.
 */
const { createTestEnvironment, setupGlobalMocks } = require('../../utils/setup');
const { sampleConfigurations } = require('../../fixtures/config/config');
const { sampleCommands } = require('../../fixtures/commands/commands');
const { MockConfigurationManager } = require('../../mocks/config/mock-config');
const { createTempFile, deleteFile } = require('../../utils/test-helpers');
const path = require('path');
const fs = require('fs').promises;

/**
 * This test demonstrates how to test the integration between the configuration
 * system and command system, including command registration, config-dependent
 * commands, and configuration persistence.
 */
describe('Configuration-Command System Integration', () => {
  let env;
  let configManager;
  let commandRegistry;
  let configFilePath;
  let cleanup;
  
  // Define mock command implementations
  const configCommands = {
    // Get config value command
    getCommand: {
      id: 'config:get',
      name: 'config get',
      description: 'Get configuration value',
      options: [
        {
          name: 'key',
          type: 'string',
          description: 'Configuration key (dot notation)',
          required: true
        }
      ],
      handler: async (args, context) => {
        try {
          const value = context.config.get(args.key);
          
          if (value === undefined) {
            console.log(`Configuration key not found: ${args.key}`);
            return 1;
          }
          
          // Format value based on type
          if (typeof value === 'object') {
            console.log(JSON.stringify(value, null, 2));
          } else {
            console.log(value);
          }
          
          return 0; // Success
        } catch (error) {
          console.error(`Error getting configuration: ${error.message}`);
          return 1; // Error
        }
      }
    },
    
    // Set config value command
    setCommand: {
      id: 'config:set',
      name: 'config set',
      description: 'Set configuration value',
      options: [
        {
          name: 'key',
          type: 'string',
          description: 'Configuration key (dot notation)',
          required: true
        },
        {
          name: 'value',
          type: 'string',
          description: 'Configuration value',
          required: true
        },
        {
          name: 'json',
          type: 'boolean',
          description: 'Parse value as JSON',
          default: false
        }
      ],
      handler: async (args, context) => {
        try {
          let value = args.value;
          
          // Parse as JSON if requested
          if (args.json) {
            try {
              value = JSON.parse(value);
            } catch (parseError) {
              console.error(`Invalid JSON: ${parseError.message}`);
              return 1;
            }
          }
          
          // Set configuration value
          context.config.set(args.key, value);
          
          // Save configuration
          await context.config.save();
          
          console.log(`Configuration updated: ${args.key} = ${JSON.stringify(value)}`);
          return 0; // Success
        } catch (error) {
          console.error(`Error setting configuration: ${error.message}`);
          return 1; // Error
        }
      }
    },
    
    // Export config command
    exportCommand: {
      id: 'config:export',
      name: 'config export',
      description: 'Export configuration to file',
      options: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to export file',
          required: true
        },
        {
          name: 'format',
          type: 'string',
          description: 'Export format (json or toml)',
          default: 'json'
        }
      ],
      handler: async (args, context) => {
        try {
          const config = context.config.getAll();
          
          // Export based on format
          if (args.format === 'json') {
            await fs.writeFile(args.path, JSON.stringify(config, null, 2), 'utf8');
          } else if (args.format === 'toml') {
            // In a real implementation, convert to TOML format
            await fs.writeFile(args.path, JSON.stringify(config, null, 2), 'utf8');
            console.log('Note: TOML export not implemented in this test');
          } else {
            console.error(`Unsupported format: ${args.format}`);
            return 1;
          }
          
          console.log(`Configuration exported to ${args.path}`);
          return 0; // Success
        } catch (error) {
          console.error(`Error exporting configuration: ${error.message}`);
          return 1; // Error
        }
      }
    },
    
    // Import config command
    importCommand: {
      id: 'config:import',
      name: 'config import',
      description: 'Import configuration from file',
      options: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to import file',
          required: true
        },
        {
          name: 'merge',
          type: 'boolean',
          description: 'Merge with existing config',
          default: true
        }
      ],
      handler: async (args, context) => {
        try {
          // Read file
          const content = await fs.readFile(args.path, 'utf8');
          
          // Parse based on file extension
          let importedConfig;
          if (args.path.endsWith('.json')) {
            importedConfig = JSON.parse(content);
          } else if (args.path.endsWith('.toml')) {
            // In a real implementation, parse TOML format
            console.log('Note: TOML import not implemented in this test');
            return 1;
          } else {
            console.error(`Unsupported file format: ${args.path}`);
            return 1;
          }
          
          // Apply imported config
          if (args.merge) {
            // Merge with existing config
            for (const [key, value] of Object.entries(flattenObject(importedConfig))) {
              context.config.set(key, value);
            }
          } else {
            // Replace entire config
            context.config.clear();
            for (const [key, value] of Object.entries(flattenObject(importedConfig))) {
              context.config.set(key, value);
            }
          }
          
          // Save configuration
          await context.config.save();
          
          console.log(`Configuration imported from ${args.path}`);
          return 0; // Success
        } catch (error) {
          console.error(`Error importing configuration: ${error.message}`);
          return 1; // Error
        }
      }
    },
    
    // Configuration-dependent command example
    modelCommand: {
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
          default: 0.7
        }
      ],
      handler: async (args, context) => {
        try {
          // Get model ID - use specified, default from config, or error
          const modelId = args.model || context.config.get('models.default');
          if (!modelId) {
            console.error('No model specified and no default model configured');
            return 1;
          }
          
          // In a real implementation, execute the model
          console.log(`Executing model ${modelId} with prompt: ${args.prompt}`);
          console.log(`Using temperature: ${args.temperature}`);
          
          // Simulate model response
          console.log('\nModel response:');
          console.log(`This is a simulated response from ${modelId} for the prompt: "${args.prompt}"`);
          
          return 0; // Success
        } catch (error) {
          console.error(`Error executing model: ${error.message}`);
          return 1; // Error
        }
      }
    }
  };
  
  // Helper function to flatten nested objects for config import
  function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix.length ? `${prefix}.` : '';
      if (
        typeof obj[key] === 'object' && 
        obj[key] !== null && 
        !Array.isArray(obj[key])
      ) {
        Object.assign(acc, flattenObject(obj[key], pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  }
  
  beforeAll(async () => {
    // Create a temporary config file
    const configContent = JSON.stringify(sampleConfigurations.basic, null, 2);
    configFilePath = await createTempFile(configContent);
    
    // Create test environment with custom config
    env = createTestEnvironment({
      config: sampleConfigurations.basic
    });
    
    // Set up global mocks
    cleanup = setupGlobalMocks(env);
    
    // Get instances
    configManager = env.configManager;
    
    // Override save method to write to our temp file
    configManager.save = async function() {
      this.saveCount++;
      const configData = JSON.stringify(this.store.getAll(), null, 2);
      await fs.writeFile(configFilePath, configData, 'utf8');
    };
    
    // Create command registry
    commandRegistry = {
      commands: new Map(),
      
      registerCommand(command) {
        this.commands.set(command.id, command);
      },
      
      getCommand(id) {
        return this.commands.get(id);
      },
      
      async executeCommand(id, args, context) {
        const command = this.getCommand(id);
        if (!command) {
          throw new Error(`Command not found: ${id}`);
        }
        
        return await command.handler(args, context);
      }
    };
    
    // Register commands
    for (const command of Object.values(configCommands)) {
      commandRegistry.registerCommand(command);
    }
  });
  
  afterAll(async () => {
    // Clean up
    if (cleanup) cleanup();
    
    if (configFilePath) {
      await deleteFile(configFilePath);
    }
  });
  
  // Create execution context for tests
  function createContext() {
    return {
      config: configManager,
      interactive: true,
      args: {}
    };
  }
  
  test('should get configuration values', async () => {
    // Execute config:get command
    const context = createContext();
    const result = await commandRegistry.executeCommand('config:get', { key: 'models.default' }, context);
    
    // Verify command success
    expect(result).toBe(0);
    
    // Verify config value was retrieved
    expect(configManager.getCalls).toContainEqual(
      expect.objectContaining({ key: 'models.default' })
    );
  });
  
  test('should set configuration values', async () => {
    // Execute config:set command
    const context = createContext();
    const result = await commandRegistry.executeCommand('config:set', { 
      key: 'models.default', 
      value: 'claude-2'
    }, context);
    
    // Verify command success
    expect(result).toBe(0);
    
    // Verify config value was set
    expect(configManager.setCalls).toContainEqual(
      expect.objectContaining({ 
        key: 'models.default', 
        value: 'claude-2'
      })
    );
    
    // Verify config was saved
    expect(configManager.saveCount).toBeGreaterThan(0);
    
    // Verify value was actually set
    expect(configManager.get('models.default')).toBe('claude-2');
  });
  
  test('should set JSON configuration values', async () => {
    // Execute config:set command with JSON value
    const context = createContext();
    const result = await commandRegistry.executeCommand('config:set', { 
      key: 'models.parameters', 
      value: '{"temperature": 0.8, "maxTokens": 1000}',
      json: true
    }, context);
    
    // Verify command success
    expect(result).toBe(0);
    
    // Verify config value was set as object
    expect(configManager.get('models.parameters')).toEqual({
      temperature: 0.8,
      maxTokens: 1000
    });
  });
  
  test('should export configuration to file', async () => {
    // Create temporary export path
    const exportPath = path.join(path.dirname(configFilePath), `export-${Date.now()}.json`);
    
    // Execute config:export command
    const context = createContext();
    const result = await commandRegistry.executeCommand('config:export', { 
      path: exportPath
    }, context);
    
    // Verify command success
    expect(result).toBe(0);
    
    // Verify file was created
    const fileExists = await fs.access(exportPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    // Verify file contents
    const fileContent = await fs.readFile(exportPath, 'utf8');
    const exportedConfig = JSON.parse(fileContent);
    
    // Should match our config
    expect(exportedConfig.models.default).toBe('claude-2');
    
    // Clean up
    await deleteFile(exportPath);
  });
  
  test('should import configuration from file', async () => {
    // Create temporary import config
    const importConfig = {
      models: {
        default: 'gpt-4',
        parameters: {
          temperature: 0.5,
          topP: 0.9
        }
      },
      storage: {
        backend: 'ipfs'
      }
    };
    
    const importPath = path.join(path.dirname(configFilePath), `import-${Date.now()}.json`);
    await fs.writeFile(importPath, JSON.stringify(importConfig, null, 2), 'utf8');
    
    // Execute config:import command
    const context = createContext();
    const result = await commandRegistry.executeCommand('config:import', { 
      path: importPath,
      merge: true
    }, context);
    
    // Verify command success
    expect(result).toBe(0);
    
    // Verify config was merged
    expect(configManager.get('models.default')).toBe('gpt-4');
    expect(configManager.get('models.parameters.temperature')).toBe(0.5);
    expect(configManager.get('models.parameters.topP')).toBe(0.9);
    expect(configManager.get('storage.backend')).toBe('ipfs');
    
    // Original values should still be there if not overwritten
    expect(configManager.get('storage.basePath')).toBe('/tmp/swissknife-storage');
    
    // Clean up
    await deleteFile(importPath);
  });
  
  test('should use configuration in dependent commands', async () => {
    // First set a default model
    await commandRegistry.executeCommand('config:set', { 
      key: 'models.default', 
      value: 'gpt-4-turbo'
    }, createContext());
    
    // Execute model command without specifying model (should use default)
    const context = createContext();
    const result = await commandRegistry.executeCommand('model:execute', { 
      prompt: 'Tell me a joke'
    }, context);
    
    // Verify command success
    expect(result).toBe(0);
    
    // Verify default model was used (checking getCalls)
    expect(configManager.getCalls).toContainEqual(
      expect.objectContaining({ key: 'models.default' })
    );
    
    // Execute with explicit model (should override default)
    const result2 = await commandRegistry.executeCommand('model:execute', { 
      model: 'claude-2',
      prompt: 'Tell me a joke'
    }, context);
    
    // Verify command success
    expect(result2).toBe(0);
  });
  
  test('should persist configuration changes between commands', async () => {
    // Read the actual config file to verify persistence
    const fileContent = await fs.readFile(configFilePath, 'utf8');
    const persistedConfig = JSON.parse(fileContent);
    
    // Should contain values we set in previous tests
    expect(persistedConfig.models.default).toBe('gpt-4-turbo');
    expect(persistedConfig.models.parameters.temperature).toBe(0.5);
    
    // Execute a sequence of related commands
    const context = createContext();
    
    // Set a new config value
    await commandRegistry.executeCommand('config:set', { 
      key: 'api.baseUrl', 
      value: 'https://api.example.com'
    }, context);
    
    // Set another related value
    await commandRegistry.executeCommand('config:set', { 
      key: 'api.version', 
      value: 'v2'
    }, context);
    
    // Read these values with config:get
    await commandRegistry.executeCommand('config:get', { 
      key: 'api'
    }, context);
    
    // Verify values were persisted to file
    const updatedContent = await fs.readFile(configFilePath, 'utf8');
    const updatedConfig = JSON.parse(updatedContent);
    
    expect(updatedConfig.api.baseUrl).toBe('https://api.example.com');
    expect(updatedConfig.api.version).toBe('v2');
  });
  
  test('should validate configuration with schema', async () => {
    // Set up a schema for testing
    const schema = {
      type: 'object',
      properties: {
        models: {
          type: 'object',
          properties: {
            default: { type: 'string' },
            parameters: {
              type: 'object',
              properties: {
                temperature: { 
                  type: 'number',
                  minimum: 0,
                  maximum: 1
                }
              }
            }
          }
        }
      }
    };
    
    // Register schema
    configManager.registerSchema('test-schema', schema);
    
    // Valid update
    const context = createContext();
    const validResult = await commandRegistry.executeCommand('config:set', { 
      key: 'models.parameters.temperature', 
      value: '0.7',
      json: true
    }, context);
    
    // Verify command success
    expect(validResult).toBe(0);
    
    // Validate configuration
    const validValidation = configManager.validate('test-schema', configManager.getAll());
    expect(validValidation.valid).toBe(true);
    
    // Invalid update (temperature > 1)
    const invalidResult = await commandRegistry.executeCommand('config:set', { 
      key: 'models.parameters.temperature', 
      value: '1.5',
      json: true
    }, context);
    
    // Command should still succeed (validation is separate)
    expect(invalidResult).toBe(0);
    
    // But validation should fail
    const invalidValidation = configManager.validate('test-schema', configManager.getAll());
    expect(invalidValidation.valid).toBe(false);
    expect(invalidValidation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'maximum'
        })
      ])
    );
  });
});