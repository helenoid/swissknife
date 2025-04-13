# Configuration System Architecture

This document provides a comprehensive specification for the unified configuration system, which enables consistent configuration management across all integrated components in SwissKnife, with specific support for TypeScript-based Goose features, IPFS Kit MCP Server integration, and enhanced task processing.

## Overview

The configuration system provides a centralized mechanism for storing, retrieving, and validating configuration settings across all components. It ensures consistency, provides schema validation, and supports the TypeScript-first implementation approach for Goose integration.

## Design Goals

1. **Unified Storage**: Single source of truth for all configuration settings
2. **Schema Validation**: Ensure configuration values conform to defined schemas
3. **TypeScript Support**: First-class support for TypeScript-based Goose features
4. **IPFS Kit MCP Configuration**: Dedicated configuration for IPFS Kit MCP Server integration
5. **Enhanced Task Processing**: Configuration options for Graph-of-Thought and task scheduling
6. **Component Isolation**: Allow each component to define and access its own configuration section

## Core Components

### Configuration Manager

The `ConfigurationManager` provides the core functionality for managing configuration:

```typescript
export class ConfigurationManager {
  private static instance: ConfigurationManager; // Singleton instance
  private config: Record<string, any> = {};      // Configuration storage
  private schemas: Map<string, JSONSchema7> = new Map(); // Schema storage
  private configPath: string;                    // Configuration file path
  private validator: Ajv;                        // JSON schema validator
  private initialized = false;                   // Initialization state
  private dirtyKeys: Set<string> = new Set();    // Changed keys that need saving
  
  // Prevent direct construction (singleton)
  private constructor() {
    this.configPath = this.determineConfigPath();
    this.validator = new Ajv({ 
      allErrors: true,
      useDefaults: true,
      coerceTypes: true
    });
  }
  
  // Determine the configuration file path
  private determineConfigPath(): string {
    // Use environment variable if specified
    if (process.env.SWISSKNIFE_CONFIG_PATH) {
      return process.env.SWISSKNIFE_CONFIG_PATH;
    }
    
    // Default to user home directory
    const configDir = path.join(os.homedir(), '.swissknife');
    return path.join(configDir, 'config.json');
  }
  
  // Get singleton instance
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }
  
  // Initialize the configuration system
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Create config directory if it doesn't exist
    const configDir = path.dirname(this.configPath);
    await fs.mkdir(configDir, { recursive: true }).catch(() => {});
    
    // Load configuration
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, use empty config
        this.config = {};
      } else {
        // Other error (e.g., invalid JSON)
        console.error(`Failed to load configuration: ${error.message}`);
        this.config = {};
      }
    }
    
    this.initialized = true;
  }
  
  // Register a JSON Schema for configuration validation
  registerSchema(id: string, schema: JSONSchema7): void {
    this.schemas.set(id, schema);
    this.validator.addSchema(schema, id);
  }
  
  // Get a configuration value by key
  get<T>(key: string, defaultValue?: T): T {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized. Call initialize() first.');
    }
    
    // If no key provided, return the entire config
    if (!key) {
      return (this.config as unknown) as T;
    }
    
    // Navigate the configuration using dot notation
    const parts = key.split('.');
    let current: any = this.config;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue as T;
      }
      
      current = current[part];
    }
    
    return (current === undefined ? defaultValue : current) as T;
  }
  
  // Set a configuration value by key
  set<T>(key: string, value: T, options: { save?: boolean; validate?: boolean } = {}): void {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized. Call initialize() first.');
    }
    
    const { save = false, validate = true } = options;
    
    if (!key) {
      throw new Error('Key is required');
    }
    
    // Navigate the configuration using dot notation and create objects as needed
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    // Set the value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
    
    // Mark as dirty
    this.dirtyKeys.add(key);
    
    // Save if requested
    if (save) {
      this.save().catch(error => {
        console.error(`Failed to save configuration: ${error.message}`);
      });
    }
  }
  
  // Validate configuration against a registered schema
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
  
  // Save configuration to disk
  async save(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized. Call initialize() first.');
    }
    
    if (this.dirtyKeys.size === 0) {
      return; // No changes to save
    }
    
    try {
      // Ensure directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true }).catch(() => {});
      
      // Write configuration
      const configData = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, configData, 'utf-8');
      
      // Clear dirty keys
      this.dirtyKeys.clear();
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }
  
  // Reset configuration to defaults
  reset(key?: string, options: { save?: boolean } = {}): void {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized. Call initialize() first.');
    }
    
    const { save = false } = options;
    
    if (!key) {
      // Reset all configuration
      this.config = {};
      this.dirtyKeys.add('');
    } else {
      // Reset specific key
      const parts = key.split('.');
      let current = this.config;
      
      // Navigate to parent object
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
          // Nothing to reset
          return;
        }
        
        current = current[part];
      }
      
      // Delete the key
      const lastPart = parts[parts.length - 1];
      if (lastPart in current) {
        delete current[lastPart];
        this.dirtyKeys.add(key);
      }
    }
    
    // Save if requested
    if (save) {
      this.save().catch(error => {
        console.error(`Failed to save configuration: ${error.message}`);
      });
    }
  }
}
```

### Configuration Schemas

Configuration schemas define the expected structure and types for configuration sections, with special focus on TypeScript Goose features and IPFS Kit integration:

```typescript
// TypeScript Agent configuration schema
export const typescriptAgentConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    defaultModel: { 
      type: 'string',
      description: 'Default model to use for agent',
      default: 'gpt-4o'
    },
    temperature: { 
      type: 'number',
      minimum: 0,
      maximum: 1,
      default: 0.7,
      description: 'Temperature setting for response generation'
    },
    maxTokens: { 
      type: 'number',
      minimum: 100,
      default: 1000,
      description: 'Maximum tokens for generation'
    },
    tools: {
      type: 'object',
      properties: {
        enabled: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of enabled tools'
        },
        defaultTimeout: {
          type: 'number',
          minimum: 1000,
          default: 30000,
          description: 'Default timeout for tool execution in milliseconds'
        }
      }
    },
    memory: {
      type: 'object',
      properties: {
        maxMessages: {
          type: 'number',
          minimum: 1,
          default: 100,
          description: 'Maximum messages to keep in memory'
        },
        persistPath: {
          type: 'string',
          description: 'Path to persist memory'
        }
      }
    }
  }
};

// IPFS Kit MCP Server configuration schema
export const ipfsKitConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    baseUrl: { 
      type: 'string',
      description: 'Base URL for IPFS Kit MCP Server',
      default: 'http://localhost:8000'
    },
    apiKey: { 
      type: 'string',
      description: 'API key for IPFS Kit MCP Server'
    },
    timeout: { 
      type: 'number',
      minimum: 1000,
      default: 30000,
      description: 'Timeout for API requests in milliseconds'
    },
    retries: {
      type: 'number',
      minimum: 0,
      maximum: 10,
      default: 3,
      description: 'Number of retries for failed requests'
    },
    caching: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          default: true,
          description: 'Enable caching'
        },
        maxSize: {
          type: 'number',
          minimum: 1,
          default: 100,
          description: 'Maximum number of items in cache'
        },
        ttl: {
          type: 'number',
          minimum: 0,
          default: 3600,
          description: 'Time-to-live for cache items in seconds'
        }
      }
    }
  }
};

// Enhanced Task System configuration schema
export const taskSystemConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    graphOfThought: {
      type: 'object',
      properties: {
        maxNodes: {
          type: 'number',
          minimum: 10,
          default: 1000,
          description: 'Maximum nodes in a graph'
        },
        maxEdges: {
          type: 'number',
          minimum: 10,
          default: 5000,
          description: 'Maximum edges in a graph'
        },
        defaultThinkingDepth: {
          type: 'number',
          minimum: 1,
          default: 3,
          description: 'Default thinking depth for graph traversal'
        }
      }
    },
    scheduler: {
      type: 'object',
      properties: {
        maxTasks: {
          type: 'number',
          minimum: 1,
          default: 1000,
          description: 'Maximum tasks in scheduler'
        },
        priorityLevels: {
          type: 'number',
          minimum: 1,
          default: 10,
          description: 'Number of priority levels'
        },
        defaultTaskTimeout: {
          type: 'number',
          minimum: 1000,
          default: 60000,
          description: 'Default task timeout in milliseconds'
        }
      }
    },
    decomposition: {
      type: 'object',
      properties: {
        maxDepth: {
          type: 'number',
          minimum: 1,
          default: 5,
          description: 'Maximum decomposition depth'
        },
        defaultStrategy: {
          type: 'string',
          enum: ['recursive', 'parallel', 'sequential'],
          default: 'recursive',
          description: 'Default decomposition strategy'
        }
      }
    }
  }
};

// Core configuration schema
export const coreConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    agent: {
      $ref: 'typescriptAgent'
    },
    ipfsKit: {
      $ref: 'ipfsKit'
    },
    tasks: {
      $ref: 'taskSystem'
    },
    apiKeys: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' }
      },
      description: 'API keys for various providers'
    },
    models: {
      type: 'object',
      properties: {
        default: { 
          type: 'string',
          description: 'Default model to use' 
        },
        history: {
          type: 'array',
          items: { type: 'string' },
          description: 'History of recently used models'
        },
        parameters: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            description: 'Model-specific parameters'
          }
        }
      }
    },
    logs: {
      type: 'object',
      properties: {
        level: { 
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
          default: 'info',
          description: 'Log level'
        },
        file: {
          type: 'string',
          description: 'Log file path'
        }
      }
    },
    ui: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['default', 'dark', 'light'],
          default: 'default',
          description: 'UI theme'
        },
        colors: {
          type: 'boolean',
          default: true,
          description: 'Enable/disable colors in output'
        }
      }
    }
  }
};

// Register all schemas
export function registerConfigurationSchemas(): void {
  const configManager = ConfigurationManager.getInstance();
  
  // Register individual component schemas
  configManager.registerSchema('typescriptAgent', typescriptAgentConfigSchema);
  configManager.registerSchema('ipfsKit', ipfsKitConfigSchema);
  configManager.registerSchema('taskSystem', taskSystemConfigSchema);
  
  // Register core schema (which references component schemas)
  configManager.registerSchema('core', coreConfigSchema);
}
```

### Component Configuration Pattern

Each component should follow a consistent pattern for defining and accessing configuration, as shown here for the TypeScript Agent:

```typescript
// TypeScript Agent configuration
export class TypeScriptAgentConfiguration {
  private config: ConfigurationManager;
  
  constructor(configManager: ConfigurationManager = ConfigurationManager.getInstance()) {
    this.config = configManager;
  }
  
  // Register the TypeScript Agent configuration schema
  registerSchema(): void {
    this.config.registerSchema('typescriptAgent', typescriptAgentConfigSchema);
  }
  
  // Get default model
  getDefaultModel(): string {
    return this.config.get('agent.defaultModel', 'gpt-4o');
  }
  
  // Set default model
  setDefaultModel(model: string): void {
    this.config.set('agent.defaultModel', model);
  }
  
  // Get temperature
  getTemperature(): number {
    return this.config.get('agent.temperature', 0.7);
  }
  
  // Set temperature
  setTemperature(temperature: number): void {
    this.config.set('agent.temperature', temperature);
  }
  
  // Get max tokens
  getMaxTokens(): number {
    return this.config.get('agent.maxTokens', 1000);
  }
  
  // Set max tokens
  setMaxTokens(maxTokens: number): void {
    this.config.set('agent.maxTokens', maxTokens);
  }
  
  // Get enabled tools
  getEnabledTools(): string[] {
    return this.config.get('agent.tools.enabled', []);
  }
  
  // Set enabled tools
  setEnabledTools(tools: string[]): void {
    this.config.set('agent.tools.enabled', tools);
  }
  
  // Get tool timeout
  getToolTimeout(): number {
    return this.config.get('agent.tools.defaultTimeout', 30000);
  }
  
  // Set tool timeout
  setToolTimeout(timeout: number): void {
    this.config.set('agent.tools.defaultTimeout', timeout);
  }
  
  // Save configuration
  async save(): Promise<void> {
    await this.config.save();
  }
}
```

### IPFS Kit Configuration

Configuration for the IPFS Kit MCP Server integration:

```typescript
// IPFS Kit configuration
export class IPFSKitConfiguration {
  private config: ConfigurationManager;
  
  constructor(configManager: ConfigurationManager = ConfigurationManager.getInstance()) {
    this.config = configManager;
  }
  
  // Register the IPFS Kit configuration schema
  registerSchema(): void {
    this.config.registerSchema('ipfsKit', ipfsKitConfigSchema);
  }
  
  // Get base URL
  getBaseUrl(): string {
    return this.config.get('ipfsKit.baseUrl', 'http://localhost:8000');
  }
  
  // Set base URL
  setBaseUrl(url: string): void {
    this.config.set('ipfsKit.baseUrl', url);
  }
  
  // Get API key
  getApiKey(): string | undefined {
    return this.config.get('ipfsKit.apiKey');
  }
  
  // Set API key
  setApiKey(apiKey: string): void {
    this.config.set('ipfsKit.apiKey', apiKey);
  }
  
  // Get timeout
  getTimeout(): number {
    return this.config.get('ipfsKit.timeout', 30000);
  }
  
  // Set timeout
  setTimeout(timeout: number): void {
    this.config.set('ipfsKit.timeout', timeout);
  }
  
  // Get retries
  getRetries(): number {
    return this.config.get('ipfsKit.retries', 3);
  }
  
  // Set retries
  setRetries(retries: number): void {
    this.config.set('ipfsKit.retries', retries);
  }
  
  // Get caching settings
  getCachingSettings(): {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  } {
    return {
      enabled: this.config.get('ipfsKit.caching.enabled', true),
      maxSize: this.config.get('ipfsKit.caching.maxSize', 100),
      ttl: this.config.get('ipfsKit.caching.ttl', 3600)
    };
  }
  
  // Save configuration
  async save(): Promise<void> {
    await this.config.save();
  }
}
```

### Task System Configuration

Configuration for the enhanced task system with Graph-of-Thought:

```typescript
// Task System configuration
export class TaskSystemConfiguration {
  private config: ConfigurationManager;
  
  constructor(configManager: ConfigurationManager = ConfigurationManager.getInstance()) {
    this.config = configManager;
  }
  
  // Register the Task System configuration schema
  registerSchema(): void {
    this.config.registerSchema('taskSystem', taskSystemConfigSchema);
  }
  
  // Get Graph-of-Thought settings
  getGraphOfThoughtSettings(): {
    maxNodes: number;
    maxEdges: number;
    defaultThinkingDepth: number;
  } {
    return {
      maxNodes: this.config.get('tasks.graphOfThought.maxNodes', 1000),
      maxEdges: this.config.get('tasks.graphOfThought.maxEdges', 5000),
      defaultThinkingDepth: this.config.get('tasks.graphOfThought.defaultThinkingDepth', 3)
    };
  }
  
  // Get scheduler settings
  getSchedulerSettings(): {
    maxTasks: number;
    priorityLevels: number;
    defaultTaskTimeout: number;
  } {
    return {
      maxTasks: this.config.get('tasks.scheduler.maxTasks', 1000),
      priorityLevels: this.config.get('tasks.scheduler.priorityLevels', 10),
      defaultTaskTimeout: this.config.get('tasks.scheduler.defaultTaskTimeout', 60000)
    };
  }
  
  // Get decomposition settings
  getDecompositionSettings(): {
    maxDepth: number;
    defaultStrategy: 'recursive' | 'parallel' | 'sequential';
  } {
    return {
      maxDepth: this.config.get('tasks.decomposition.maxDepth', 5),
      defaultStrategy: this.config.get('tasks.decomposition.defaultStrategy', 'recursive')
    };
  }
  
  // Save configuration
  async save(): Promise<void> {
    await this.config.save();
  }
}
```

## Configuration Commands

Configuration commands provide a user interface for managing configuration with dedicated commands for TypeScript Agent, IPFS Kit, and task system settings:

```typescript
// TypeScript Agent config command
export const agentConfigCommand: Command = {
  id: 'agent:config',
  name: 'config',
  description: 'Configure the TypeScript Agent',
  category: 'Agent',
  subcommands: [
    {
      id: 'model',
      name: 'model',
      description: 'Set the default model',
      options: [
        {
          name: 'name',
          type: 'string',
          description: 'Model name',
          required: true
        }
      ],
      handler: async (args, context) => {
        const agentConfig = new TypeScriptAgentConfiguration();
        agentConfig.setDefaultModel(args.name);
        await agentConfig.save();
        
        context.success(`Default model set to ${args.name}`);
        return 0;
      }
    },
    {
      id: 'temperature',
      name: 'temperature',
      description: 'Set the temperature',
      options: [
        {
          name: 'value',
          type: 'number',
          description: 'Temperature value (0-1)',
          required: true
        }
      ],
      handler: async (args, context) => {
        const value = Number(args.value);
        if (isNaN(value) || value < 0 || value > 1) {
          context.error('Temperature must be a number between 0 and 1');
          return 1;
        }
        
        const agentConfig = new TypeScriptAgentConfiguration();
        agentConfig.setTemperature(value);
        await agentConfig.save();
        
        context.success(`Temperature set to ${value}`);
        return 0;
      }
    },
    {
      id: 'tools',
      name: 'tools',
      description: 'Manage enabled tools',
      subcommands: [
        {
          id: 'list',
          name: 'list',
          description: 'List enabled tools',
          handler: async (args, context) => {
            const agentConfig = new TypeScriptAgentConfiguration();
            const tools = agentConfig.getEnabledTools();
            
            console.log('Enabled tools:');
            if (tools.length === 0) {
              console.log('  No tools enabled');
            } else {
              tools.forEach(tool => console.log(`  - ${tool}`));
            }
            
            return 0;
          }
        },
        {
          id: 'enable',
          name: 'enable',
          description: 'Enable a tool',
          options: [
            {
              name: 'name',
              type: 'string',
              description: 'Tool name',
              required: true
            }
          ],
          handler: async (args, context) => {
            const agentConfig = new TypeScriptAgentConfiguration();
            const tools = agentConfig.getEnabledTools();
            
            if (!tools.includes(args.name)) {
              tools.push(args.name);
              agentConfig.setEnabledTools(tools);
              await agentConfig.save();
              
              context.success(`Tool ${args.name} enabled`);
            } else {
              context.info(`Tool ${args.name} is already enabled`);
            }
            
            return 0;
          }
        },
        {
          id: 'disable',
          name: 'disable',
          description: 'Disable a tool',
          options: [
            {
              name: 'name',
              type: 'string',
              description: 'Tool name',
              required: true
            }
          ],
          handler: async (args, context) => {
            const agentConfig = new TypeScriptAgentConfiguration();
            const tools = agentConfig.getEnabledTools();
            
            const index = tools.indexOf(args.name);
            if (index !== -1) {
              tools.splice(index, 1);
              agentConfig.setEnabledTools(tools);
              await agentConfig.save();
              
              context.success(`Tool ${args.name} disabled`);
            } else {
              context.info(`Tool ${args.name} is not enabled`);
            }
            
            return 0;
          }
        }
      ],
      handler: async (args, context) => {
        return 0;
      }
    }
  ],
  handler: async (args, context) => {
    const agentConfig = new TypeScriptAgentConfiguration();
    
    console.log('TypeScript Agent Configuration:');
    console.log(`  Default Model: ${agentConfig.getDefaultModel()}`);
    console.log(`  Temperature: ${agentConfig.getTemperature()}`);
    console.log(`  Max Tokens: ${agentConfig.getMaxTokens()}`);
    console.log(`  Tool Timeout: ${agentConfig.getToolTimeout()}ms`);
    
    const tools = agentConfig.getEnabledTools();
    console.log('  Enabled Tools:');
    if (tools.length === 0) {
      console.log('    No tools enabled');
    } else {
      tools.forEach(tool => console.log(`    - ${tool}`));
    }
    
    return 0;
  }
};

// IPFS Kit config command
export const ipfsKitConfigCommand: Command = {
  id: 'ipfs:config',
  name: 'config',
  description: 'Configure IPFS Kit MCP Server integration',
  category: 'IPFS',
  subcommands: [
    {
      id: 'url',
      name: 'url',
      description: 'Set the base URL',
      options: [
        {
          name: 'value',
          type: 'string',
          description: 'Base URL',
          required: true
        }
      ],
      handler: async (args, context) => {
        const ipfsConfig = new IPFSKitConfiguration();
        ipfsConfig.setBaseUrl(args.value);
        await ipfsConfig.save();
        
        context.success(`Base URL set to ${args.value}`);
        return 0;
      }
    },
    {
      id: 'key',
      name: 'key',
      description: 'Set the API key',
      options: [
        {
          name: 'value',
          type: 'string',
          description: 'API key',
          required: true
        }
      ],
      handler: async (args, context) => {
        const ipfsConfig = new IPFSKitConfiguration();
        ipfsConfig.setApiKey(args.value);
        await ipfsConfig.save();
        
        context.success('API key set');
        return 0;
      }
    },
    {
      id: 'timeout',
      name: 'timeout',
      description: 'Set the timeout',
      options: [
        {
          name: 'value',
          type: 'number',
          description: 'Timeout in milliseconds',
          required: true
        }
      ],
      handler: async (args, context) => {
        const value = Number(args.value);
        if (isNaN(value) || value < 1000) {
          context.error('Timeout must be a number greater than or equal to 1000');
          return 1;
        }
        
        const ipfsConfig = new IPFSKitConfiguration();
        ipfsConfig.setTimeout(value);
        await ipfsConfig.save();
        
        context.success(`Timeout set to ${value}ms`);
        return 0;
      }
    }
  ],
  handler: async (args, context) => {
    const ipfsConfig = new IPFSKitConfiguration();
    
    console.log('IPFS Kit Configuration:');
    console.log(`  Base URL: ${ipfsConfig.getBaseUrl()}`);
    console.log(`  API Key: ${ipfsConfig.getApiKey() ? '********' : 'Not set'}`);
    console.log(`  Timeout: ${ipfsConfig.getTimeout()}ms`);
    console.log(`  Retries: ${ipfsConfig.getRetries()}`);
    
    const caching = ipfsConfig.getCachingSettings();
    console.log('  Caching:');
    console.log(`    Enabled: ${caching.enabled}`);
    console.log(`    Max Size: ${caching.maxSize}`);
    console.log(`    TTL: ${caching.ttl}s`);
    
    return 0;
  }
};

// Task System config command
export const taskConfigCommand: Command = {
  id: 'task:config',
  name: 'config',
  description: 'Configure the task system',
  category: 'Tasks',
  subcommands: [
    {
      id: 'got',
      name: 'got',
      description: 'Configure Graph-of-Thought settings',
      options: [
        {
          name: 'max-nodes',
          type: 'number',
          description: 'Maximum nodes in a graph',
          required: false
        },
        {
          name: 'max-edges',
          type: 'number',
          description: 'Maximum edges in a graph',
          required: false
        },
        {
          name: 'thinking-depth',
          type: 'number',
          description: 'Default thinking depth',
          required: false
        }
      ],
      handler: async (args, context) => {
        const taskConfig = new TaskSystemConfiguration();
        
        if (args['max-nodes']) {
          const value = Number(args['max-nodes']);
          if (isNaN(value) || value < 10) {
            context.error('Max nodes must be a number greater than or equal to 10');
            return 1;
          }
          context.config.set('tasks.graphOfThought.maxNodes', value);
        }
        
        if (args['max-edges']) {
          const value = Number(args['max-edges']);
          if (isNaN(value) || value < 10) {
            context.error('Max edges must be a number greater than or equal to 10');
            return 1;
          }
          context.config.set('tasks.graphOfThought.maxEdges', value);
        }
        
        if (args['thinking-depth']) {
          const value = Number(args['thinking-depth']);
          if (isNaN(value) || value < 1) {
            context.error('Thinking depth must be a number greater than or equal to 1');
            return 1;
          }
          context.config.set('tasks.graphOfThought.defaultThinkingDepth', value);
        }
        
        await context.config.save();
        context.success('Graph-of-Thought settings updated');
        return 0;
      }
    },
    {
      id: 'scheduler',
      name: 'scheduler',
      description: 'Configure scheduler settings',
      options: [
        {
          name: 'max-tasks',
          type: 'number',
          description: 'Maximum tasks',
          required: false
        },
        {
          name: 'priority-levels',
          type: 'number',
          description: 'Number of priority levels',
          required: false
        },
        {
          name: 'task-timeout',
          type: 'number',
          description: 'Default task timeout in milliseconds',
          required: false
        }
      ],
      handler: async (args, context) => {
        const taskConfig = new TaskSystemConfiguration();
        
        if (args['max-tasks']) {
          const value = Number(args['max-tasks']);
          if (isNaN(value) || value < 1) {
            context.error('Max tasks must be a number greater than or equal to 1');
            return 1;
          }
          context.config.set('tasks.scheduler.maxTasks', value);
        }
        
        if (args['priority-levels']) {
          const value = Number(args['priority-levels']);
          if (isNaN(value) || value < 1) {
            context.error('Priority levels must be a number greater than or equal to 1');
            return 1;
          }
          context.config.set('tasks.scheduler.priorityLevels', value);
        }
        
        if (args['task-timeout']) {
          const value = Number(args['task-timeout']);
          if (isNaN(value) || value < 1000) {
            context.error('Task timeout must be a number greater than or equal to 1000');
            return 1;
          }
          context.config.set('tasks.scheduler.defaultTaskTimeout', value);
        }
        
        await context.config.save();
        context.success('Scheduler settings updated');
        return 0;
      }
    }
  ],
  handler: async (args, context) => {
    const taskConfig = new TaskSystemConfiguration();
    
    console.log('Task System Configuration:');
    
    const gotSettings = taskConfig.getGraphOfThoughtSettings();
    console.log('  Graph-of-Thought:');
    console.log(`    Max Nodes: ${gotSettings.maxNodes}`);
    console.log(`    Max Edges: ${gotSettings.maxEdges}`);
    console.log(`    Default Thinking Depth: ${gotSettings.defaultThinkingDepth}`);
    
    const schedulerSettings = taskConfig.getSchedulerSettings();
    console.log('  Scheduler:');
    console.log(`    Max Tasks: ${schedulerSettings.maxTasks}`);
    console.log(`    Priority Levels: ${schedulerSettings.priorityLevels}`);
    console.log(`    Default Task Timeout: ${schedulerSettings.defaultTaskTimeout}ms`);
    
    const decompositionSettings = taskConfig.getDecompositionSettings();
    console.log('  Decomposition:');
    console.log(`    Max Depth: ${decompositionSettings.maxDepth}`);
    console.log(`    Default Strategy: ${decompositionSettings.defaultStrategy}`);
    
    return 0;
  }
};
```

## Testing Strategy

The configuration system testing includes:

1. **TypeScript-Specific Tests**
   - TypeScript Agent configuration
   - Tool management configuration
   - TypeScript type correctness

2. **IPFS Kit MCP Integration Tests**
   - Server connection configuration
   - API key management
   - Caching configuration

3. **Enhanced Task System Tests**
   - Graph-of-Thought configuration 
   - Fibonacci heap scheduler settings
   - Task decomposition configuration

Example unit test for TypeScript agent configuration:

```typescript
// test/unit/config/typescript-agent-config.test.ts
import { TypeScriptAgentConfiguration } from '../../../src/config/typescript-agent-config';
import { ConfigurationManager } from '../../../src/config/manager';
import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('TypeScriptAgentConfiguration', () => {
  let configManager: ConfigurationManager;
  let agentConfig: TypeScriptAgentConfiguration;
  let testConfigPath: string;
  
  beforeEach(async () => {
    // Create temporary test config path
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'swissknife-test-'));
    testConfigPath = path.join(tempDir, 'config.json');
    
    // Reset the singleton for testing
    (ConfigurationManager as any).instance = null;
    configManager = ConfigurationManager.getInstance();
    
    // Set the test config path (using internal property for testing)
    (configManager as any).configPath = testConfigPath;
    
    // Initialize
    await configManager.initialize();
    
    // Create agent config
    agentConfig = new TypeScriptAgentConfiguration(configManager);
    agentConfig.registerSchema();
  });
  
  afterEach(async () => {
    // Clean up test config file
    try {
      await fs.unlink(testConfigPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });
  
  describe('default values', () => {
    it('should return default values when config is empty', () => {
      expect(agentConfig.getDefaultModel()).to.equal('gpt-4o');
      expect(agentConfig.getTemperature()).to.equal(0.7);
      expect(agentConfig.getMaxTokens()).to.equal(1000);
      expect(agentConfig.getToolTimeout()).to.equal(30000);
      expect(agentConfig.getEnabledTools()).to.deep.equal([]);
    });
  });
  
  describe('get and set methods', () => {
    it('should get and set default model', () => {
      agentConfig.setDefaultModel('gpt-3.5-turbo');
      expect(agentConfig.getDefaultModel()).to.equal('gpt-3.5-turbo');
    });
    
    it('should get and set temperature', () => {
      agentConfig.setTemperature(0.5);
      expect(agentConfig.getTemperature()).to.equal(0.5);
    });
    
    it('should get and set max tokens', () => {
      agentConfig.setMaxTokens(2000);
      expect(agentConfig.getMaxTokens()).to.equal(2000);
    });
    
    it('should get and set enabled tools', () => {
      const tools = ['file', 'web', 'calculator'];
      agentConfig.setEnabledTools(tools);
      expect(agentConfig.getEnabledTools()).to.deep.equal(tools);
    });
    
    it('should get and set tool timeout', () => {
      agentConfig.setToolTimeout(60000);
      expect(agentConfig.getToolTimeout()).to.equal(60000);
    });
  });
  
  describe('persistence', () => {
    it('should persist and reload settings', async () => {
      // Set values
      agentConfig.setDefaultModel('gpt-4');
      agentConfig.setTemperature(0.8);
      agentConfig.setMaxTokens(1500);
      agentConfig.setEnabledTools(['file', 'web']);
      agentConfig.setToolTimeout(45000);
      
      // Save
      await agentConfig.save();
      
      // Create new config manager and agent config
      (ConfigurationManager as any).instance = null;
      const newConfigManager = ConfigurationManager.getInstance();
      (newConfigManager as any).configPath = testConfigPath;
      
      await newConfigManager.initialize();
      
      const newAgentConfig = new TypeScriptAgentConfiguration(newConfigManager);
      
      // Verify settings were loaded
      expect(newAgentConfig.getDefaultModel()).to.equal('gpt-4');
      expect(newAgentConfig.getTemperature()).to.equal(0.8);
      expect(newAgentConfig.getMaxTokens()).to.equal(1500);
      expect(newAgentConfig.getEnabledTools()).to.deep.equal(['file', 'web']);
      expect(newAgentConfig.getToolTimeout()).to.equal(45000);
    });
  });
});
```

## Implementation Plan

The configuration system implementation will proceed as follows:

1. **Core Infrastructure**
   - Implement ConfigurationManager class
   - Create basic JSON schema validation
   - Implement configuration persistence

2. **TypeScript Agent Configuration**
   - Define TypeScript agent schema
   - Implement agent configuration class
   - Create agent config commands

3. **IPFS Kit Configuration**
   - Define IPFS Kit schema
   - Implement IPFS Kit configuration class
   - Create IPFS Kit config commands

4. **Task System Configuration**
   - Define enhanced task system schema
   - Implement task configuration class
   - Create task config commands

5. **Integration & Testing**
   - Integrate all configuration components
   - Implement comprehensive tests
   - Create configuration documentation

## Best Practices

When implementing TypeScript-based configuration, follow these best practices:

1. **Type Safety**: Leverage TypeScript's type system for configuration
2. **Default Values**: Provide sensible defaults for all settings
3. **Validation**: Use JSON Schema for configuration validation
4. **Component-Specific Configuration**: Create dedicated classes for each component
5. **Clear Documentation**: Document all configuration options and their effects
6. **Configuration Commands**: Provide user-friendly commands for configuration management