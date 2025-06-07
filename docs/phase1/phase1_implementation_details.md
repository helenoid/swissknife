# Phase 1 Implementation Details

This document provides comprehensive technical details for Phase 1 of the SwissKnife integration project, covering architecture, implementation, and testing strategies for the foundational components.

## Overview

Phase 1 establishes the core architectural foundation for integrating all source components (SwissKnife core, Goose, IPFS Accelerate JS, SwissKnife Legacy) into a unified system. It follows the CLI-first approach while creating bridges to non-CLI functionality through a consistent interface pattern.

## Phase 1A: Foundation (Weeks 1-2)

### Command System Enhancement

The command system will be enhanced to provide a robust architecture for registering, discovering, and executing commands. This will serve as the primary user interface for all integrated functionality.

#### Command Registry

```typescript
// src/commands/registry.ts
export interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  subcommands?: Command[];
  options?: CommandOption[];
  category?: string;
  examples?: string[];
  handler: (args: any, context: ExecutionContext) => Promise<number>;
}

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();
  
  private constructor() {}
  
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }
  
  registerCommand(command: Command): void {
    // Validate command structure
    if (!command.id || !command.name || !command.description || !command.handler) {
      throw new Error(`Invalid command definition: ${command.id || 'unknown'}`);
    }
    
    // Register command
    this.commands.set(command.id, command);
    
    // Register aliases if provided
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.id);
      }
    }
  }
  
  getCommand(id: string): Command | undefined {
    // Check direct command ID
    if (this.commands.has(id)) {
      return this.commands.get(id);
    }
    
    // Check aliases
    const aliasedId = this.aliases.get(id);
    if (aliasedId) {
      return this.commands.get(aliasedId);
    }
    
    // Command not found
    return undefined;
  }
  
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
  
  getCommandsByCategory(category: string): Command[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }
  
  async executeCommand(id: string, args: any, context: ExecutionContext): Promise<number> {
    const command = this.getCommand(id);
    if (!command) {
      console.error(`Command not found: ${id}`);
      return 1; // Error exit code
    }
    
    try {
      // Execute command handler
      return await command.handler(args, context);
    } catch (error) {
      console.error(`Error executing command ${id}:`, error);
      return 1; // Error exit code
    }
  }
}

// Helper function for registering commands
export function registerCommand(command: Command): void {
  CommandRegistry.getInstance().registerCommand(command);
}
```

#### Command Execution Context

The execution context provides shared resources and state during command execution:

```typescript
// src/commands/context.ts
import { ConfigurationManager } from '../config/manager';
import { LogManager } from '../utils/logging';
import { ModelRegistry } from '../models/registry';
import { ServiceRegistry } from '../services/registry';

export interface ExecutionContext {
  config: ConfigurationManager;
  logger: LogManager;
  models: ModelRegistry;
  services: ServiceRegistry;
  interactive: boolean;
  cwd: string;
  env: Record<string, string>;
  args: Record<string, any>;
}

export function createExecutionContext(
  args: Record<string, any> = {},
  interactive = true
): ExecutionContext {
  return {
    config: ConfigurationManager.getInstance(),
    logger: LogManager.getInstance(),
    models: ModelRegistry.getInstance(),
    services: ServiceRegistry.getInstance(),
    interactive,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    args
  };
}
```

#### Command Parser

The command parser processes command-line arguments into structured data:

```typescript
// src/commands/parser.ts
import minimist from 'minimist';
import { Command, CommandOption, CommandRegistry } from './registry';

export interface ParsedCommand {
  command: Command;
  args: Record<string, any>;
  subcommands: string[];
}

export function parseCommandLine(argv: string[]): ParsedCommand | null {
  const registry = CommandRegistry.getInstance();
  
  // Skip node and script name
  const args = argv.slice(2);
  
  if (args.length === 0) {
    return null;
  }
  
  // Extract command and subcommands
  const commandPath = [];
  let currentArgs = args;
  let currentCommand: Command | undefined;
  
  // Find the deepest matching command/subcommand
  while (currentArgs.length > 0) {
    const candidateId = commandPath.concat(currentArgs[0]).join(':');
    const candidate = registry.getCommand(candidateId);
    
    if (candidate) {
      currentCommand = candidate;
      commandPath.push(currentArgs[0]);
      currentArgs = currentArgs.slice(1);
    } else {
      break;
    }
  }
  
  if (!currentCommand) {
    return null;
  }
  
  // Parse remaining arguments with minimist
  const parsedArgs = minimist(currentArgs, {
    string: currentCommand.options
      ?.filter(opt => opt.type === 'string')
      .map(opt => opt.name) || [],
    boolean: currentCommand.options
      ?.filter(opt => opt.type === 'boolean')
      .map(opt => opt.name) || [],
    default: Object.fromEntries(
      (currentCommand.options || [])
        .filter(opt => opt.default !== undefined)
        .map(opt => [opt.name, opt.default])
    ),
    alias: Object.fromEntries(
      (currentCommand.options || [])
        .filter(opt => opt.alias)
        .map(opt => [opt.name, opt.alias as string])
    )
  });
  
  return {
    command: currentCommand,
    args: parsedArgs,
    subcommands: commandPath.slice(1) // First element is the main command
  };
}
```

#### Implementation Strategy

1. Implement base command registry 
2. Create execution context
3. Develop command parser
4. Implement help generation
5. Create core commands (help, version)
6. Develop testing infrastructure

#### Testing Strategy

Command system tests will focus on:

1. Command registration and retrieval
2. Command execution and error handling
3. Option parsing and validation
4. Subcommand navigation
5. Help generation

```typescript
// test/unit/commands/registry.test.ts (example)
import { CommandRegistry, Command } from '../../../src/commands/registry';
import { expect } from 'chai';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  
  beforeEach(() => {
    // Reset the singleton for testing
    (CommandRegistry as any).instance = null;
    registry = CommandRegistry.getInstance();
  });
  
  it('should register a command successfully', () => {
    const command: Command = {
      id: 'test',
      name: 'test',
      description: 'Test command',
      handler: async () => 0
    };
    
    registry.registerCommand(command);
    const retrievedCommand = registry.getCommand('test');
    
    expect(retrievedCommand).to.deep.equal(command);
  });
  
  // Additional tests...
});
```

### Configuration System Enhancement

The configuration system will provide unified configuration for all components with schema validation and migration capabilities.

#### Configuration Manager

```typescript
// src/config/manager.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as TOML from 'toml';
import { JSONSchema7 } from 'json-schema';
import Ajv from 'ajv';

export interface ConfigurationSchema {
  id: string;
  schema: JSONSchema7;
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Record<string, any> = {};
  private schemas: Map<string, JSONSchema7> = new Map();
  private configPath: string;
  private validator: Ajv;
  
  private constructor() {
    this.configPath = path.join(os.homedir(), '.swissknife', 'config.json');
    this.validator = new Ajv({ allErrors: true });
  }
  
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }
  
  async initialize(): Promise<void> {
    // Create config directory if it doesn't exist
    const configDir = path.dirname(this.configPath);
    await fs.mkdir(configDir, { recursive: true });
    
    // Load configuration
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      // If file doesn't exist or is invalid, use empty config
      this.config = {};
    }
  }
  
  registerSchema(id: string, schema: JSONSchema7): void {
    this.schemas.set(id, schema);
    this.validator.addSchema(schema, id);
  }
  
  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue as T;
      }
      
      current = current[part];
    }
    
    return (current === undefined ? defaultValue : current) as T;
  }
  
  set<T>(key: string, value: T): void {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  validate(schemaId: string, data: any): { valid: boolean; errors: any[] } {
    const validate = this.validator.getSchema(schemaId);
    if (!validate) {
      throw new Error(`Schema not found: ${schemaId}`);
    }
    
    const valid = validate(data);
    return {
      valid: valid === true,
      errors: validate.errors || []
    };
  }
  
  async save(): Promise<void> {
    const configData = JSON.stringify(this.config, null, 2);
    await fs.writeFile(this.configPath, configData, 'utf-8');
  }
  
  async importToml(tomlPath: string, section?: string): Promise<boolean> {
    try {
      const tomlData = await fs.readFile(tomlPath, 'utf-8');
      const tomlConfig = TOML.parse(tomlData);
      
      if (section) {
        this.set(section, tomlConfig);
      } else {
        // Merge with existing config
        this.config = {
          ...this.config,
          ...tomlConfig
        };
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to import TOML configuration from ${tomlPath}:`, error);
      return false;
    }
  }
}
```

#### Configuration Schema Definitions

```typescript
// src/config/schemas.ts
import { JSONSchema7 } from 'json-schema';
import { ConfigurationManager } from './manager';

// Core configuration schema
export const coreConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    apiKeys: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    models: {
      type: 'object',
      properties: {
        default: { type: 'string' },
        history: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    storage: {
      type: 'object',
      properties: {
        backend: { type: 'string' },
        basePath: { type: 'string' }
      }
    }
  }
};

// Register schemas
export function registerConfigurationSchemas(): void {
  const configManager = ConfigurationManager.getInstance();
  configManager.registerSchema('core', coreConfigSchema);
}
```

#### TOML Configuration Migration

```typescript
// src/config/migration.ts
import * as fs from 'fs/promises';
import * as TOML from 'toml';
import { ConfigurationManager } from './manager';

export async function migrateTomlConfig(tomlPath: string): Promise<boolean> {
  try {
    const configManager = ConfigurationManager.getInstance();
    
    // Read TOML file
    const content = await fs.readFile(tomlPath, 'utf-8');
    const tomlConfig = TOML.parse(content);
    
    // Transform TOML configuration to JSON structure
    const transformedConfig = transformTomlConfig(tomlConfig);
    
    // Merge with existing configuration
    for (const [key, value] of Object.entries(transformedConfig)) {
      configManager.set(key, value);
    }
    
    // Save configuration
    await configManager.save();
    
    return true;
  } catch (error) {
    console.error(`Failed to migrate TOML configuration from ${tomlPath}:`, error);
    return false;
  }
}

function transformTomlConfig(tomlConfig: any): any {
  // Transform TOML structure to match current JSON config structure
  // This is a simplified implementation
  const result: any = {};
  
  // Example transformations
  if (tomlConfig.api_keys) {
    result.apiKeys = {};
    for (const [provider, keys] of Object.entries(tomlConfig.api_keys)) {
      result.apiKeys[provider] = Array.isArray(keys) ? keys : [keys];
    }
  }
  
  if (tomlConfig.models) {
    result.models = {
      default: tomlConfig.models.default,
      history: tomlConfig.models.history || []
    };
  }
  
  // Add more transformations as needed
  
  return result;
}
```

#### Implementation Strategy

1. Implement basic configuration manager
2. Create schema validation system
3. Develop TOML import/export
4. Create configuration migration utilities
5. Implement configuration commands
6. Build testing infrastructure

#### Testing Strategy

Configuration system tests will focus on:

1. Configuration loading and saving
2. Schema validation
3. TOML migration
4. Dot notation path handling
5. Default value management

```typescript
// test/unit/config/manager.test.ts (example)
import { ConfigurationManager } from '../../../src/config/manager';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  let testConfigPath: string;
  
  beforeEach(async () => {
    // Reset the singleton and use a test path
    (ConfigurationManager as any).instance = null;
    configManager = ConfigurationManager.getInstance();
    
    testConfigPath = path.join(os.tmpdir(), `swissknife-test-${Date.now()}.json`);
    (configManager as any).configPath = testConfigPath;
    
    await configManager.initialize();
  });
  
  afterEach(async () => {
    try {
      await fs.unlink(testConfigPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });
  
  it('should get and set values with dot notation', () => {
    configManager.set('test.nested.value', 'test-value');
    expect(configManager.get('test.nested.value')).to.equal('test-value');
  });
  
  // Additional tests...
});
```

### Integration Framework

The integration framework will provide bridges between different component systems, allowing for consistent communication regardless of source.

#### Integration Registry

```typescript
// src/integration/registry.ts
export interface IntegrationBridge {
  id: string;
  name: string;
  source: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
  target: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
  initialize(): Promise<boolean>;
  isInitialized(): boolean;
  call<T>(method: string, args: any): Promise<T>;
}

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private bridges: Map<string, IntegrationBridge> = new Map();
  
  private constructor() {}
  
  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }
  
  registerBridge(bridge: IntegrationBridge): void {
    this.bridges.set(bridge.id, bridge);
  }
  
  getBridge(id: string): IntegrationBridge | undefined {
    return this.bridges.get(id);
  }
  
  async initializeBridge(id: string): Promise<boolean> {
    const bridge = this.getBridge(id);
    if (!bridge) {
      throw new Error(`Bridge not found: ${id}`);
    }
    
    return bridge.initialize();
  }
  
  async initializeAllBridges(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [id, bridge] of this.bridges.entries()) {
      try {
        const success = await bridge.initialize();
        results.set(id, success);
      } catch (error) {
        console.error(`Failed to initialize bridge ${id}:`, error);
        results.set(id, false);
      }
    }
    
    return results;
  }
  
  async callBridge<T>(bridgeId: string, method: string, args: any): Promise<T> {
    const bridge = this.getBridge(bridgeId);
    if (!bridge) {
      throw new Error(`Bridge not found: ${bridgeId}`);
    }
    
    if (!bridge.isInitialized()) {
      throw new Error(`Bridge not initialized: ${bridgeId}`);
    }
    
    return bridge.call<T>(method, args);
  }
}
```

#### Goose MCP Bridge

```typescript
// src/integration/goose/mcp-bridge.ts
import { IntegrationBridge } from '../registry';
import { loadNativeModule } from '../../utils/native-loader';

export class GooseMCPBridge implements IntegrationBridge {
  id: string = 'goose-mcp';
  name: string = 'Goose MCP Bridge';
  source: 'goose' = 'goose';
  target: 'current' = 'current';
  
  private nativeModule: any = null;
  private initialized: boolean = false;
  
  async initialize(): Promise<boolean> {
    try {
      // Load native Goose module
      this.nativeModule = loadNativeModule('goose_bridge');
      
      // Initialize MCP client
      const success = await this.nativeModule.initialize({});
      this.initialized = success;
      
      return success;
    } catch (error) {
      console.error('Failed to initialize Goose MCP bridge:', error);
      return false;
    }
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  async call<T>(method: string, args: any): Promise<T> {
    if (!this.isInitialized()) {
      throw new Error('Goose MCP bridge not initialized');
    }
    
    if (!this.nativeModule[method]) {
      throw new Error(`Method not found in Goose MCP bridge: ${method}`);
    }
    
    return this.nativeModule[method](args);
  }
}
```

#### Clean Implementation Module Loader

```typescript
// src/utils/implementation-loader.ts
import * as path from 'path';

// Map of module names to loaded modules
const loadedModules: Map<string, any> = new Map();

// Get module path
function getModulePath(moduleName: string): string {
  // Base directory for clean implementations
  const baseDir = path.resolve(__dirname, '../../clean-implementations');
  
  // Module specific path
  return path.join(baseDir, moduleName);
}

/**
 * Load a clean implementation module by name
 * @param moduleName Name of the module to load
 * @returns The loaded module
 * @throws Error if module cannot be loaded
 */
export function loadImplementationModule(moduleName: string): any {
  // Check if module is already loaded
  if (loadedModules.has(moduleName)) {
    return loadedModules.get(moduleName);
  }
  
  try {
    // Try to load the module
    const modulePath = getModulePath(moduleName);
    const module = require(modulePath);
    
    // Cache the loaded module
    loadedModules.set(moduleName, module);
    
    return module;
  } catch (error) {
    console.error(`Failed to load clean implementation module ${moduleName}:`, error);
    throw new Error(`Failed to load clean implementation module ${moduleName}: ${error.message}`);
  }
}

/**
 * Check if a clean implementation module is available
 * @param moduleName Name of the module to check
 * @returns True if module is available, false otherwise
 */
export function isImplementationModuleAvailable(moduleName: string): boolean {
  try {
    const modulePath = getModulePath(moduleName);
    require.resolve(modulePath);
    return true;
  } catch (error) {
    return false;
  }
}
```

#### Implementation Strategy

1. Implement Integration Registry
2. Create basic bridge interface
3. Develop native module loader
4. Implement Goose MCP bridge
5. Create IPFS Storage bridge
6. Implement TaskNet bridge
7. Build testing infrastructure

#### Testing Strategy

Integration framework tests will focus on:

1. Bridge registration and retrieval
2. Bridge initialization
3. Method calling
4. Error handling
5. Native module loading

```typescript
// test/unit/integration/registry.test.ts (example)
import { IntegrationRegistry, IntegrationBridge } from '../../../src/integration/registry';
import { expect } from 'chai';

describe('IntegrationRegistry', () => {
  let registry: IntegrationRegistry;
  
  beforeEach(() => {
    // Reset the singleton for testing
    (IntegrationRegistry as any).instance = null;
    registry = IntegrationRegistry.getInstance();
  });
  
  it('should register and retrieve bridges', () => {
    const mockBridge: IntegrationBridge = {
      id: 'mock-bridge',
      name: 'Mock Bridge',
      source: 'current',
      target: 'goose',
      initialize: async () => true,
      isInitialized: () => true,
      call: async <T>(method: string, args: any) => args as T
    };
    
    registry.registerBridge(mockBridge);
    const retrievedBridge = registry.getBridge('mock-bridge');
    
    expect(retrievedBridge).to.deep.equal(mockBridge);
  });
  
  // Additional tests...
});
```

## Phase 1B: Core Components (Weeks 3-4)

### Model Integration

The model integration creates a unified registry for models from all sources, providing a consistent interface for model execution.

#### Model Registry

```typescript
// src/models/registry.ts
export interface ModelCapabilities {
  streaming?: boolean;
  images?: boolean;
  audio?: boolean;
  video?: boolean;
  vectors?: boolean;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  maxTokens?: number;
  pricePerToken?: number;
  capabilities: ModelCapabilities;
  source: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
}

export interface Provider {
  id: string;
  name: string;
  models: Model[];
  baseURL?: string;
  envVar?: string;
  defaultModel?: string;
}

export class ModelRegistry {
  private static instance: ModelRegistry;
  private providers: Map<string, Provider> = new Map();
  private models: Map<string, Model> = new Map();
  
  private constructor() {}
  
  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }
  
  registerProvider(provider: Provider): void {
    // Validate provider
    if (!provider.id || !provider.name || !provider.models) {
      throw new Error(`Invalid provider definition: ${provider.id || 'unknown'}`);
    }
    
    // Register provider
    this.providers.set(provider.id, provider);
    
    // Register provider's models
    for (const model of provider.models) {
      this.registerModel(model);
    }
  }
  
  registerModel(model: Model): void {
    // Validate model
    if (!model.id || !model.name || !model.provider) {
      throw new Error(`Invalid model definition: ${model.id || 'unknown'}`);
    }
    
    // Register model
    this.models.set(model.id, model);
  }
  
  getProvider(id: string): Provider | undefined {
    return this.providers.get(id);
  }
  
  getModel(id: string): Model | undefined {
    return this.models.get(id);
  }
  
  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }
  
  getAllModels(): Model[] {
    return Array.from(this.models.values());
  }
  
  getModelsByProvider(providerId: string): Model[] {
    return this.getAllModels().filter(model => model.provider === providerId);
  }
  
  getModelsByCapability(capability: keyof ModelCapabilities): Model[] {
    return this.getAllModels().filter(model => model.capabilities[capability]);
  }
}
```

#### Model Execution Service

```typescript
// src/models/execution.ts
import { ModelRegistry, Model, Provider } from './registry';
import { IntegrationRegistry } from '../integration/registry';
import { ConfigurationManager } from '../config/manager';

export interface ModelExecutionOptions {
  streaming?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  [key: string]: any;
}

export interface ModelExecutionResult {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timingMs?: number;
}

export class ModelExecutionService {
  private static instance: ModelExecutionService;
  private modelRegistry: ModelRegistry;
  private integrationRegistry: IntegrationRegistry;
  private configManager: ConfigurationManager;
  
  private constructor() {
    this.modelRegistry = ModelRegistry.getInstance();
    this.integrationRegistry = IntegrationRegistry.getInstance();
    this.configManager = ConfigurationManager.getInstance();
  }
  
  static getInstance(): ModelExecutionService {
    if (!ModelExecutionService.instance) {
      ModelExecutionService.instance = new ModelExecutionService();
    }
    return ModelExecutionService.instance;
  }
  
  async executeModel(
    modelId: string,
    prompt: string,
    options: ModelExecutionOptions = {}
  ): Promise<ModelExecutionResult> {
    // Get model and provider
    const model = this.modelRegistry.getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    const provider = this.modelRegistry.getProvider(model.provider);
    if (!provider) {
      throw new Error(`Provider not found for model ${modelId}: ${model.provider}`);
    }
    
    // Get API key
    const apiKey = this.getApiKey(provider);
    
    // Execute based on source
    switch (model.source) {
      case 'current':
        return this.executeCurrentModel(model, provider, prompt, apiKey, options);
      case 'goose':
        return this.executeGooseModel(model, provider, prompt, apiKey, options);
      case 'swissknife_old':
        return this.executeTaskNetModel(model, provider, prompt, apiKey, options);
      default:
        throw new Error(`Unsupported model source: ${model.source}`);
    }
  }
  
  private async executeCurrentModel(
    model: Model,
    provider: Provider,
    prompt: string,
    apiKey: string,
    options: ModelExecutionOptions
  ): Promise<ModelExecutionResult> {
    // Implementation for current models
    return {
      response: `Mock response from ${model.name}`,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: 100,
        totalTokens: prompt.length / 4 + 100
      },
      timingMs: 1000
    };
  }
  
  private async executeGooseModel(
    model: Model,
    provider: Provider,
    prompt: string,
    apiKey: string,
    options: ModelExecutionOptions
  ): Promise<ModelExecutionResult> {
    // Execute with Goose MCP bridge
    const bridge = this.integrationRegistry.getBridge('goose-mcp');
    if (!bridge) {
      throw new Error('Goose MCP bridge not found');
    }
    
    // Initialize if needed
    if (!bridge.isInitialized()) {
      await bridge.initialize();
    }
    
    // Call the bridge
    const result = await bridge.call<any>('generate_completion', {
      model: model.id,
      prompt,
      api_key: apiKey,
      options
    });
    
    return {
      response: result.completion,
      usage: result.usage,
      timingMs: result.timing_ms
    };
  }
  
  private async executeTaskNetModel(
    model: Model,
    provider: Provider,
    prompt: string,
    apiKey: string,
    options: ModelExecutionOptions
  ): Promise<ModelExecutionResult> {
    // Execute with TaskNet bridge
    const bridge = this.integrationRegistry.getBridge('tasknet');
    if (!bridge) {
      throw new Error('TaskNet bridge not found');
    }
    
    // Initialize if needed
    if (!bridge.isInitialized()) {
      await bridge.initialize();
    }
    
    // Create and execute task
    const result = await bridge.call<any>('executeModelTask', {
      model: model.id,
      prompt,
      api_key: apiKey,
      options
    });
    
    return {
      response: result.completion,
      usage: result.usage,
      timingMs: result.timing_ms
    };
  }
  
  private getApiKey(provider: Provider): string {
    if (!provider.envVar) {
      throw new Error(`No environment variable defined for provider: ${provider.id}`);
    }
    
    // First check configuration
    const configKeys = this.configManager.get<string[]>(`apiKeys.${provider.id}`, []);
    if (configKeys.length > 0) {
      return configKeys[0]; // Use first key for simplicity
    }
    
    // Then check environment variable
    const envKey = process.env[provider.envVar];
    if (envKey) {
      return envKey;
    }
    
    throw new Error(`No API key found for provider: ${provider.id}`);
  }
}
```

#### Model Provider Definitions

Define models from different sources:

```typescript
// src/models/definitions/current.ts
import { Provider, registerProvider } from '../registry';

// Current models from existing SwissKnife
export const openaiProvider: Provider = {
  id: 'openai',
  name: 'OpenAI',
  baseURL: 'https://api.openai.com/v1',
  envVar: 'OPENAI_API_KEY',
  defaultModel: 'gpt-4',
  models: [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      maxTokens: 4096,
      pricePerToken: 0.000002,
      capabilities: {
        streaming: true
      },
      source: 'current'
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      maxTokens: 8192,
      pricePerToken: 0.00003,
      capabilities: {
        streaming: true
      },
      source: 'current'
    }
  ]
};

// Register provider
registerProvider(openaiProvider);
```

```typescript
// src/models/definitions/goose.ts
import { Provider, registerProvider } from '../registry';

// Goose models
export const gooseProvider: Provider = {
  id: 'goose',
  name: 'Goose',
  baseURL: 'local:goose',
  envVar: 'GOOSE_API_KEY',
  defaultModel: 'goose-default',
  models: [
    {
      id: 'goose-default',
      name: 'Goose Default',
      provider: 'goose',
      maxTokens: 8192,
      capabilities: {
        streaming: true
      },
      source: 'goose'
    }
  ]
};

// Register provider
registerProvider(gooseProvider);
```

#### Implementation Strategy

1. Implement Model Registry
2. Create Provider Registration
3. Develop Model Execution Service
4. Create API Key Management
5. Implement Model Commands
6. Build Testing Infrastructure

#### Testing Strategy

Model system tests will focus on:

1. Model and provider registration
2. API key retrieval
3. Model execution
4. Source-specific execution paths
5. Error handling

```typescript
// test/unit/models/registry.test.ts (example)
import { ModelRegistry, Provider, Model } from '../../../src/models/registry';
import { expect } from 'chai';

describe('ModelRegistry', () => {
  let modelRegistry: ModelRegistry;
  
  beforeEach(() => {
    // Reset the singleton for testing
    (ModelRegistry as any).instance = null;
    modelRegistry = ModelRegistry.getInstance();
  });
  
  it('should register and retrieve providers', () => {
    const provider: Provider = {
      id: 'test-provider',
      name: 'Test Provider',
      models: []
    };
    
    modelRegistry.registerProvider(provider);
    const retrievedProvider = modelRegistry.getProvider('test-provider');
    
    expect(retrievedProvider).to.deep.equal(provider);
  });
  
  // Additional tests...
});
```

### Worker System Implementation

The worker system provides distributed task execution using Node.js worker threads.

#### Worker Thread

```typescript
// src/workers/thread.ts
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as path from 'path';

export interface WorkerInitMessage {
  type: 'init';
  workerId: string;
  config: any;
}

export interface WorkerTaskMessage {
  type: 'task';
  taskId: string;
  taskType: string;
  data: any;
}

export interface WorkerResponseMessage {
  type: 'response';
  taskId: string;
  result: any;
  error?: string;
}

export interface WorkerStatusMessage {
  type: 'status';
  workerId: string;
  status: 'idle' | 'busy' | 'error';
  error?: string;
}

// Worker thread implementation
if (!isMainThread) {
  // This code runs in the worker thread
  
  // Worker state
  let workerId: string;
  let config: any;
  let taskHandlers: Map<string, (data: any) => Promise<any>> = new Map();
  
  // Register task handlers
  function registerTaskHandler(taskType: string, handler: (data: any) => Promise<any>): void {
    taskHandlers.set(taskType, handler);
  }
  
  // Listen for messages from the main thread
  parentPort.on('message', async (message: WorkerInitMessage | WorkerTaskMessage) => {
    try {
      if (message.type === 'init') {
        // Initialize worker
        workerId = message.workerId;
        config = message.config;
        
        // Send status message
        parentPort.postMessage({
          type: 'status',
          workerId,
          status: 'idle'
        } as WorkerStatusMessage);
      } else if (message.type === 'task') {
        // Execute task
        const { taskId, taskType, data } = message;
        
        // Send busy status
        parentPort.postMessage({
          type: 'status',
          workerId,
          status: 'busy'
        } as WorkerStatusMessage);
        
        // Find task handler
        const handler = taskHandlers.get(taskType);
        if (!handler) {
          throw new Error(`No handler registered for task type: ${taskType}`);
        }
        
        // Execute handler
        const result = await handler(data);
        
        // Send response
        parentPort.postMessage({
          type: 'response',
          taskId,
          result
        } as WorkerResponseMessage);
        
        // Send idle status
        parentPort.postMessage({
          type: 'status',
          workerId,
          status: 'idle'
        } as WorkerStatusMessage);
      }
    } catch (error) {
      // Send error response
      if (message.type === 'task') {
        parentPort.postMessage({
          type: 'response',
          taskId: message.taskId,
          result: null,
          error: error.message || String(error)
        } as WorkerResponseMessage);
      }
      
      // Send error status
      parentPort.postMessage({
        type: 'status',
        workerId: workerId || 'unknown',
        status: 'error',
        error: error.message || String(error)
      } as WorkerStatusMessage);
    }
  });
  
  // Register built-in task handlers
  registerTaskHandler('echo', async (data) => {
    // Simple echo handler for testing
    return data;
  });
}

// Helper function to create a worker
export function createWorker(workerId: string, config: any = {}): Worker {
  const worker = new Worker(path.resolve(__filename), {
    workerData: {
      workerId
    }
  });
  
  // Initialize worker
  worker.postMessage({
    type: 'init',
    workerId,
    config
  } as WorkerInitMessage);
  
  return worker;
}
```

#### Worker Pool

```typescript
// src/workers/pool.ts
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { createWorker, WorkerResponseMessage, WorkerStatusMessage, WorkerTaskMessage } from './thread';
import { ConfigurationManager } from '../config/manager';

export interface WorkerPoolOptions {
  size?: number;
  maxConcurrent?: number;
  taskTimeout?: number;
}

export interface WorkerInfo {
  id: string;
  worker: Worker;
  status: 'idle' | 'busy' | 'error';
  lastTask?: string;
  error?: string;
  createdAt: number;
  taskCount: number;
}

export class WorkerPool extends EventEmitter {
  private static instance: WorkerPool;
  private workers: Map<string, WorkerInfo> = new Map();
  private taskQueue: Map<string, {
    taskType: string;
    data: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    submittedAt: number;
  }> = new Map();
  private size: number;
  private maxConcurrent: number;
  private taskTimeout: number;
  private workerCount = 0;
  private timeoutChecker: NodeJS.Timeout;
  
  private constructor(options: WorkerPoolOptions = {}) {
    super();
    
    const config = ConfigurationManager.getInstance();
    
    this.size = options.size || config.get('worker.poolSize', 4);
    this.maxConcurrent = options.maxConcurrent || config.get('worker.maxConcurrent', 10);
    this.taskTimeout = options.taskTimeout || config.get('worker.taskTimeout', 60000);
    
    // Start timeout checker
    this.timeoutChecker = setInterval(() => this.checkTimeouts(), 1000);
  }
  
  static getInstance(options: WorkerPoolOptions = {}): WorkerPool {
    if (!WorkerPool.instance) {
      WorkerPool.instance = new WorkerPool(options);
    }
    return WorkerPool.instance;
  }
  
  async initialize(): Promise<void> {
    // Create initial worker pool
    for (let i = 0; i < this.size; i++) {
      await this.createWorker();
    }
  }
  
  async shutdown(): Promise<void> {
    // Stop timeout checker
    clearInterval(this.timeoutChecker);
    
    // Terminate all workers
    const terminationPromises = [];
    for (const workerInfo of this.workers.values()) {
      terminationPromises.push(new Promise<void>((resolve) => {
        workerInfo.worker.once('exit', () => resolve());
        workerInfo.worker.terminate();
      }));
    }
    
    await Promise.all(terminationPromises);
    
    // Clear maps
    this.workers.clear();
    this.taskQueue.clear();
  }
  
  async executeTask<T>(taskType: string, data: any): Promise<T> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise<T>((resolve, reject) => {
      // Add task to queue
      this.taskQueue.set(taskId, {
        taskType,
        data,
        resolve,
        reject,
        submittedAt: Date.now()
      });
      
      // Process queue
      this.processQueue();
    });
  }
  
  // Other methods from previous implementation
}

// Create singleton instance
let workerPoolInstance: WorkerPool | null = null;

export function getWorkerPool(options?: WorkerPoolOptions): WorkerPool {
  if (!workerPoolInstance) {
    workerPoolInstance = WorkerPool.getInstance(options);
  }
  return workerPoolInstance;
}

export function shutdownWorkerPool(): Promise<void> {
  if (workerPoolInstance) {
    return workerPoolInstance.shutdown();
  }
  return Promise.resolve();
}
```

#### Implementation Strategy

1. Implement Worker Thread
2. Create Worker Pool
3. Develop Task Distribution
4. Create Worker Commands
5. Implement Worker Monitoring
6. Build Testing Infrastructure

#### Testing Strategy

Worker system tests will focus on:

1. Worker creation and management
2. Task distribution
3. Worker status tracking
4. Error handling
5. Task timeout management

```typescript
// test/unit/workers/pool.test.ts (example)
import { WorkerPool } from '../../../src/workers/pool';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { EventEmitter } from 'events';

// Mock worker thread
jest.mock('../../../src/workers/thread', () => {
  const mockWorker = new EventEmitter();
  mockWorker.postMessage = sinon.stub();
  mockWorker.terminate = sinon.stub().callsFake(() => {
    mockWorker.emit('exit', 0);
  });
  
  return {
    createWorker: () => mockWorker
  };
});

describe('WorkerPool', () => {
  let workerPool: WorkerPool;
  
  beforeEach(() => {
    // Reset singleton
    (WorkerPool as any).instance = null;
    workerPool = WorkerPool.getInstance({
      size: 2,
      maxConcurrent: 4,
      taskTimeout: 1000
    });
  });
  
  afterEach(async () => {
    await workerPool.shutdown();
  });
  
  // Tests...
});
```

### Task System Implementation

The task system provides task queue management and execution tracking.

#### Task Manager

```typescript
// src/tasks/manager.ts
import { EventEmitter } from 'events';
import { getWorkerPool } from '../workers/pool';
import { ConfigurationManager } from '../config/manager';

export interface Task {
  id: string;
  type: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  result?: any;
  error?: string;
  submittedAt: number;
  startedAt?: number;
  completedAt?: number;
  timeoutMs?: number;
}

export interface TaskOptions {
  priority?: 'high' | 'medium' | 'low';
  timeoutMs?: number;
}

export class TaskManager extends EventEmitter {
  private static instance: TaskManager;
  private tasks: Map<string, Task> = new Map();
  private configManager: ConfigurationManager;
  
  private constructor() {
    super();
    this.configManager = ConfigurationManager.getInstance();
  }
  
  static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }
  
  async createTask(
    type: string,
    data: any,
    options: TaskOptions = {}
  ): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultTimeout = this.configManager.get('task.defaultTimeout', 60000);
    
    const task: Task = {
      id: taskId,
      type,
      data,
      priority: options.priority || 'medium',
      status: 'pending',
      submittedAt: Date.now(),
      timeoutMs: options.timeoutMs || defaultTimeout
    };
    
    this.tasks.set(taskId, task);
    
    // Emit event
    this.emit('taskCreated', { taskId, type, priority: task.priority });
    
    return taskId;
  }
  
  // Other methods from previous implementation
}
```

#### Task Registry

```typescript
// src/tasks/registry.ts
export interface TaskDefinition {
  type: string;
  description: string;
  schema?: any; // JSON Schema for task data
  handler?: (data: any) => Promise<any>; // Optional direct handler
}

export class TaskRegistry {
  private static instance: TaskRegistry;
  private taskDefinitions: Map<string, TaskDefinition> = new Map();
  
  private constructor() {}
  
  static getInstance(): TaskRegistry {
    if (!TaskRegistry.instance) {
      TaskRegistry.instance = new TaskRegistry();
    }
    return TaskRegistry.instance;
  }
  
  registerTaskDefinition(definition: TaskDefinition): void {
    if (!definition.type) {
      throw new Error('Task definition must have a type');
    }
    
    this.taskDefinitions.set(definition.type, definition);
  }
  
  getTaskDefinition(type: string): TaskDefinition | undefined {
    return this.taskDefinitions.get(type);
  }
  
  getAllTaskDefinitions(): TaskDefinition[] {
    return Array.from(this.taskDefinitions.values());
  }
}
```

#### Implementation Strategy

1. Implement Task Manager
2. Create Task Registry
3. Develop Task Definitions
4. Create Task Commands
5. Implement Task Monitoring
6. Build Testing Infrastructure

#### Testing Strategy

Task system tests will focus on:

1. Task creation and management
2. Task execution
3. Task status tracking
4. Priority handling
5. Task cancellation

```typescript
// test/unit/tasks/manager.test.ts (example)
import { TaskManager } from '../../../src/tasks/manager';
import { expect } from 'chai';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  
  beforeEach(() => {
    // Reset singleton
    (TaskManager as any).instance = null;
    taskManager = TaskManager.getInstance();
  });
  
  it('should create a task with unique ID', async () => {
    const taskId = await taskManager.createTask('test', { foo: 'bar' });
    
    expect(taskId).to.be.a('string');
    expect(taskId).to.include('task-');
    
    const task = taskManager.getTask(taskId);
    expect(task).to.exist;
    expect(task!.type).to.equal('test');
    expect(task!.data).to.deep.equal({ foo: 'bar' });
    expect(task!.status).to.equal('pending');
  });
  
  // Additional tests...
});
```

## Testing Strategy

### Unit Testing

Unit tests will be developed for each component using Jest. Each unit test will focus on testing a specific component in isolation, mocking dependencies as needed.

```typescript
// Example unit test structure
describe('ComponentName', () => {
  let component;
  
  beforeEach(() => {
    // Setup component and mocks
    component = new ComponentName();
  });
  
  it('should perform specific functionality', () => {
    // Test specific functionality
    const result = component.doSomething();
    expect(result).toBe(expectedValue);
  });
  
  it('should handle errors properly', () => {
    // Test error handling
    expect(() => component.doSomethingThatErrors()).toThrow();
  });
});
```

### Integration Testing

Integration tests will be developed to test the interaction between components. These tests will ensure that components work together as expected.

```typescript
// Example integration test structure
describe('Component Integration', () => {
  let componentA;
  let componentB;
  
  beforeEach(async () => {
    // Setup real (not mocked) components
    componentA = new ComponentA();
    componentB = new ComponentB();
    
    // Initialize components
    await componentA.initialize();
    await componentB.initialize();
  });
  
  it('should interact properly', async () => {
    // Test interaction between components
    const result = await componentA.interactWith(componentB);
    expect(result).toBe(expectedValue);
  });
});
```

### End-to-End Testing

End-to-end tests will be developed to test complete workflows from the command line. These tests will ensure that the CLI interface works correctly.

```typescript
// Example end-to-end test structure
describe('CLI Workflow', () => {
  it('should execute command', async () => {
    // Execute command via CLI
    const result = await executeCommand('swissknife test-command');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Expected output');
  });
});
```

## Documentation Standards

### API Documentation

All functions, classes, and interfaces will be documented with JSDoc comments.

```typescript
/**
 * Executes a task with the specified type and data.
 * 
 * @param taskType - The type of task to execute
 * @param data - The data to pass to the task
 * @returns A promise that resolves with the task result
 * @throws Error if the task fails
 * 
 * @example
 * ```typescript
 * const result = await executeTask('echo', { message: 'Hello, World!' });
 * console.log(result); // { message: 'Hello, World!' }
 * ```
 */
async function executeTask<T>(taskType: string, data: any): Promise<T> {
  // Implementation...
}
```

### Component Documentation

Each component will be documented with a markdown file in the docs directory.

```markdown
# Component Name

This component is responsible for...

## API

### method1(param1, param2)

This method does...

Parameters:
- `param1` - Description of param1
- `param2` - Description of param2

Returns:
- Description of return value

Example:
```typescript
const result = component.method1('foo', 'bar');
```

## Command Documentation

Commands will be documented with help text and examples.

```typescript
export const sampleCommand: Command = {
  id: 'sample',
  name: 'sample',
  description: 'Sample command demonstrating the implementation pattern',
  examples: [
    'swissknife sample',
    'swissknife sample --flag'
  ],
  // Other command properties...
};
```

## Sprint Planning

### Sprint 1 (Week 1)

**Focus**: Command System and Configuration Foundation

**Goals**:
- Implement Command Registry
- Implement Command Parser
- Implement Help Generator
- Create Core Commands
- Implement Configuration Manager
- Implement Schema Validation
- Create Configuration Commands

**Deliverables**:
- Functional command execution system
- Configuration management system
- Unit tests for all components

### Sprint 2 (Week 2)

**Focus**: Integration Framework

**Goals**:
- Implement Integration Registry
- Implement Native Module Loader
- Create Bridge Interfaces
- Create Goose MCP Bridge (mock)
- Create IPFS Storage Bridge (mock)
- Create TaskNet Bridge (mock)

**Deliverables**:
- Integration framework with mock bridges
- Unit tests for integration components
- Integration tests for bridge communication

### Sprint 3 (Week 3)

**Focus**: Model Integration

**Goals**:
- Implement Model Registry
- Implement Model Definitions
- Create Provider Registration
- Implement Model Execution Service
- Implement API Key Management
- Create Model Commands

**Deliverables**:
- Unified model registry
- Model execution service
- Unit tests for model components
- Integration tests for model execution

### Sprint 4 (Week 4)

**Focus**: Worker and Task System

**Goals**:
- Implement Worker Thread
- Implement Worker Pool
- Create Worker Commands
- Implement Task Manager
- Implement Task Registry
- Create Task Commands

**Deliverables**:
- Worker system for distributed task execution
- Task management system
- Unit tests for worker and task components
- Integration tests for task execution