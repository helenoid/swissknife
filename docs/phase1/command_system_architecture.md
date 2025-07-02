# Command System Architecture

This document provides a comprehensive specification for the enhanced command system architecture, which forms the backbone of the SwissKnife CLI integration with TypeScript-based Goose features.

## Overview

The command system provides a consistent framework for defining, registering, discovering, and executing commands across all integrated components, with special focus on TypeScript implementation of Goose features and integration with IPFS Kit MCP Server.

## Design Goals

1. **TypeScript-First Implementation**: Optimized for TypeScript components without Rust dependencies
2. **AI Agent Integration**: Seamless integration with TypeScript-based Goose AI agent functionality
3. **Enhanced Task Commands**: Support for Graph-of-Thought and advanced task decomposition
4. **IPFS Kit MCP Integration**: Commands for interacting with IPFS Kit MCP Server
5. **Unified Interface**: Consistent interface for all commands regardless of their source component
6. **Extensibility**: Easy registration of new commands from any component

## Core Components

### Command Interface

The `Command` interface defines the structure for all commands in the system:

```typescript
export interface CommandOption {
  name: string;           // Long option name (e.g., "file")
  alias?: string;         // Short option alias (e.g., "f")
  type: 'string' | 'number' | 'boolean' | 'array'; // Option type
  description: string;    // Option description for help text
  required?: boolean;     // Whether option is required
  default?: any;          // Default value if not provided
  choices?: string[];     // Valid choices for enum-like options
  validation?: (value: any) => boolean | string; // Custom validation
}

export interface Command {
  id: string;             // Unique identifier (used in registry)
  name: string;           // Display name (shown in help)
  description: string;    // Short description
  longDescription?: string; // Detailed description for help text
  subcommands?: Command[];  // Nested commands
  options?: CommandOption[]; // Command options
  aliases?: string[];     // Alternative command names
  category?: string;      // For grouping in help (e.g., "Agent", "Task", "IPFS")
  examples?: string[];    // Usage examples for help text
  hidden?: boolean;       // Whether to hide from listings
  experimental?: boolean; // Mark as experimental feature
  handler: (args: any, context: ExecutionContext) => Promise<number>; // Command implementation
}
```

### Command Registry

The `CommandRegistry` manages command registration and lookup:

```typescript
export class CommandRegistry {
  private static instance: CommandRegistry; // Singleton instance
  private commands: Map<string, Command> = new Map(); // Command storage
  private aliases: Map<string, string> = new Map(); // Alias mapping
  
  // Prevent direct construction
  private constructor() {}
  
  // Get singleton instance
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }
  
  // Register a command
  registerCommand(command: Command): void {
    // Validate command
    this.validateCommand(command);
    
    // Register command
    this.commands.set(command.id, command);
    
    // Register aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.id);
      }
    }
    
    // Register subcommands
    if (command.subcommands) {
      for (const subcommand of command.subcommands) {
        // Create full ID for subcommand
        const subcommandId = `${command.id}:${subcommand.id || subcommand.name}`;
        
        // Register with full ID
        this.registerCommand({
          ...subcommand,
          id: subcommandId,
          category: subcommand.category || command.category
        });
      }
    }
  }
  
  // Get a command by ID or alias
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
  
  // Get all registered commands
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
  
  // Get commands by category
  getCommandsByCategory(category: string): Command[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }
  
  // Execute a command
  async executeCommand(id: string, args: any, context: ExecutionContext): Promise<number> {
    const command = this.getCommand(id);
    if (!command) {
      console.error(`Command not found: ${id}`);
      return 1; // Error exit code
    }
    
    if (!command.handler) {
      console.error(`Command ${id} has no handler`);
      return 1; // Error exit code
    }
    
    try {
      // Validate arguments against options
      const validationResult = this.validateArguments(command, args);
      if (!validationResult.valid) {
        for (const error of validationResult.errors) {
          console.error(error);
        }
        return 1; // Error exit code
      }
      
      // Execute command handler
      const exitCode = await command.handler(args, context);
      return exitCode;
    } catch (error) {
      console.error(`Error executing command ${id}:`, error);
      return 1; // Error exit code
    }
  }
  
  // Validate command structure
  private validateCommand(command: Command): void {
    // Basic validation
    if (!command.id) {
      throw new Error('Command must have an ID');
    }
    
    if (!command.name) {
      throw new Error(`Command ${command.id} must have a name`);
    }
    
    if (!command.description) {
      throw new Error(`Command ${command.id} must have a description`);
    }
    
    if (!command.handler && !command.subcommands?.length) {
      throw new Error(`Command ${command.id} must have a handler or subcommands`);
    }
    
    // Validate options if provided
    if (command.options) {
      this.validateOptions(command.id, command.options);
    }
    
    // Check for ID conflicts
    if (this.commands.has(command.id)) {
      throw new Error(`Command ID conflict: ${command.id} already registered`);
    }
  }
  
  // Validate options
  private validateOptions(commandId: string, options: CommandOption[]): void {
    // Check for duplicate option names/aliases
    const names = new Set<string>();
    const aliases = new Set<string>();
    
    for (const option of options) {
      // Check name
      if (!option.name) {
        throw new Error(`Option in command ${commandId} must have a name`);
      }
      
      if (names.has(option.name)) {
        throw new Error(`Duplicate option name '${option.name}' in command ${commandId}`);
      }
      
      names.add(option.name);
      
      // Check alias if provided
      if (option.alias) {
        if (aliases.has(option.alias)) {
          throw new Error(`Duplicate option alias '${option.alias}' in command ${commandId}`);
        }
        
        aliases.add(option.alias);
      }
      
      // Validate option type
      if (!['string', 'number', 'boolean', 'array'].includes(option.type)) {
        throw new Error(`Invalid option type '${option.type}' for option '${option.name}' in command ${commandId}`);
      }
    }
  }
  
  // Validate command arguments
  private validateArguments(command: Command, args: any): { valid: boolean; errors: string[] } {
    if (!command.options) {
      return { valid: true, errors: [] };
    }
    
    const errors: string[] = [];
    
    // Check required options
    for (const option of command.options) {
      if (option.required && (args[option.name] === undefined || args[option.name] === null)) {
        errors.push(`Missing required option: ${option.name}`);
      }
    }
    
    // Validate option values
    for (const [key, value] of Object.entries(args)) {
      const option = command.options.find(opt => opt.name === key);
      if (!option) {
        // Skip unknown options (they might be handled by the command)
        continue;
      }
      
      // Type validation
      if (value !== undefined && value !== null) {
        // Check type
        const valueType = Array.isArray(value) ? 'array' : typeof value;
        if (option.type === 'number' && valueType !== 'number') {
          errors.push(`Option ${key} must be a number`);
        } else if (option.type === 'boolean' && valueType !== 'boolean') {
          errors.push(`Option ${key} must be a boolean`);
        } else if (option.type === 'array' && valueType !== 'array') {
          errors.push(`Option ${key} must be an array`);
        }
        
        // Check choices
        if (option.choices && !option.choices.includes(String(value))) {
          errors.push(`Invalid value for ${key}. Must be one of: ${option.choices.join(', ')}`);
        }
        
        // Custom validation
        if (option.validation && value !== undefined) {
          const validationResult = option.validation(value);
          if (validationResult !== true) {
            const message = typeof validationResult === 'string' 
              ? validationResult
              : `Invalid value for ${key}`;
            errors.push(message);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Helper function for registering commands
export function registerCommand(command: Command): void {
  CommandRegistry.getInstance().registerCommand(command);
}
```

### Execution Context

The `ExecutionContext` provides access to shared resources during command execution:

```typescript
export interface ExecutionContext {
  // Core services
  config: ConfigurationManager;        // Access to configuration
  logger: LogManager;                  // Logging utilities
  models: ModelRegistry;               // Model providers
  agent: TypeScriptAgent;              // AI agent access
  ipfs: IPFSKitClient;                 // IPFS Kit client
  
  // Task system
  taskScheduler: TaskScheduler;        // Task scheduling
  graphOfThought: GraphOfThoughtManager; // Graph-of-Thought processing
  
  // Execution metadata
  id: string;                          // Unique execution ID
  startTime: number;                   // Execution start timestamp
  interactive: boolean;                // Whether execution is interactive
  cwd: string;                         // Current working directory
  env: Record<string, string>;         // Environment variables
  args: Record<string, any>;           // Parsed arguments
  
  // State management
  getState<T>(key: string): T | undefined;     // Get state value
  setState<T>(key: string, value: T): void;    // Set state value
  
  // Output utilities
  success(message: string): void;      // Success message
  warning(message: string): void;      // Warning message
  error(message: string): void;        // Error message
  info(message: string): void;         // Info message
  
  // User interaction
  async prompt(message: string, options?: any): Promise<string>;        // Text prompt
  async confirm(message: string, defaultValue?: boolean): Promise<boolean>; // Yes/no prompt
  async select(message: string, choices: string[]): Promise<string>;    // Selection prompt
}

// Create an execution context
export function createExecutionContext(
  args: Record<string, any> = {},
  options: {
    interactive?: boolean;
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): ExecutionContext {
  // Implement context creation
}
```

### Command Parser

The `CommandParser` processes command-line arguments into a structured format:

```typescript
export interface ParsedCommand {
  command: Command;              // The matched command
  args: Record<string, any>;     // Parsed arguments
  commandPath: string[];         // Command path segments
}

export class CommandParser {
  private registry: CommandRegistry;
  
  constructor(registry: CommandRegistry = CommandRegistry.getInstance()) {
    this.registry = registry;
  }
  
  // Parse command line arguments
  parseCommandLine(argv: string[]): ParsedCommand | null {
    // Skip node and script name
    const args = argv.slice(2);
    
    if (args.length === 0) {
      return null;
    }
    
    // Find command and subcommands
    const commandPath = [];
    let currentArgs = args;
    let currentCommand: Command | undefined;
    
    // Find the deepest matching command/subcommand
    while (currentArgs.length > 0) {
      const candidateSegment = currentArgs[0];
      
      // Skip if it starts with a dash (it's an option)
      if (candidateSegment.startsWith('-')) {
        break;
      }
      
      // Build potential command ID
      const potentialPath = [...commandPath, candidateSegment];
      const candidateId = potentialPath.join(':');
      
      // Try to find the command
      const candidate = this.registry.getCommand(candidateId);
      
      if (candidate) {
        currentCommand = candidate;
        commandPath.push(candidateSegment);
        currentArgs = currentArgs.slice(1);
      } else {
        // If already have a command, this might be a positional argument
        if (currentCommand) {
          break;
        }
        
        // If no command yet, try direct lookup (for aliases)
        const directCommand = this.registry.getCommand(candidateSegment);
        if (directCommand) {
          currentCommand = directCommand;
          commandPath.push(candidateSegment);
          currentArgs = currentArgs.slice(1);
        } else {
          // No command found
          break;
        }
      }
    }
    
    if (!currentCommand) {
      return null;
    }
    
    // Parse remaining arguments
    const parsedArgs = this.parseArgs(currentArgs, currentCommand);
    
    return {
      command: currentCommand,
      args: parsedArgs,
      commandPath
    };
  }
  
  // Parse arguments for a command
  private parseArgs(args: string[], command: Command): Record<string, any> {
    // Use minimist or similar library to parse arguments
    // Transform based on option definitions
    return {}; // Placeholder
  }
}
```

## AI Agent Command Implementation

The AI Agent commands expose the TypeScript-based Goose functionality:

```typescript
// AI Agent command implementation
export const agentCommand: Command = {
  id: 'agent',
  name: 'agent',
  description: 'Interact with the AI agent',
  category: 'AI',
  subcommands: [
    {
      id: 'chat',
      name: 'chat',
      description: 'Start an interactive chat with the AI agent',
      options: [
        {
          name: 'model',
          alias: 'm',
          type: 'string',
          description: 'Model to use',
          default: 'gpt-4o'
        },
        {
          name: 'system',
          alias: 's',
          type: 'string',
          description: 'System prompt',
          default: 'You are a helpful AI assistant.'
        }
      ],
      handler: async (args, context) => {
        // Interactive chat implementation
        return 0;
      }
    },
    {
      id: 'execute',
      name: 'execute',
      description: 'Execute a one-off prompt with the AI agent',
      options: [
        {
          name: 'prompt',
          alias: 'p',
          type: 'string',
          description: 'Prompt to send to the agent',
          required: true
        },
        {
          name: 'model',
          alias: 'm',
          type: 'string',
          description: 'Model to use',
          default: 'gpt-4o'
        }
      ],
      handler: async (args, context) => {
        // Execute prompt implementation
        return 0;
      }
    },
    {
      id: 'tools',
      name: 'tools',
      description: 'Manage AI agent tools',
      subcommands: [
        {
          id: 'list',
          name: 'list',
          description: 'List available tools',
          handler: async (args, context) => {
            // Tool listing implementation
            return 0;
          }
        },
        {
          id: 'execute',
          name: 'execute',
          description: 'Execute a specific tool directly',
          options: [
            {
              name: 'tool',
              alias: 't',
              type: 'string',
              description: 'Tool name',
              required: true
            },
            {
              name: 'params',
              alias: 'p',
              type: 'string',
              description: 'Tool parameters (JSON string)',
              required: true
            }
          ],
          handler: async (args, context) => {
            // Tool execution implementation
            return 0;
          }
        }
      ],
      handler: async (args, context) => {
        // Tools command implementation
        return 0;
      }
    }
  ],
  handler: async (args, context) => {
    // Agent command implementation
    return 0;
  }
};

// Register the command
registerCommand(agentCommand);
```

## Task System Commands

The task system commands expose the enhanced TaskNet functionality:

```typescript
// Task command implementation
export const taskCommand: Command = {
  id: 'task',
  name: 'task',
  description: 'Manage tasks with advanced decomposition',
  category: 'Tasks',
  subcommands: [
    {
      id: 'create',
      name: 'create',
      description: 'Create a new task',
      options: [
        {
          name: 'description',
          alias: 'd',
          type: 'string',
          description: 'Task description',
          required: true
        },
        {
          name: 'priority',
          alias: 'p',
          type: 'number',
          description: 'Task priority (1-10)',
          default: 5
        }
      ],
      handler: async (args, context) => {
        // Task creation implementation
        return 0;
      }
    },
    {
      id: 'decompose',
      name: 'decompose',
      description: 'Decompose a complex task into subtasks',
      options: [
        {
          name: 'id',
          type: 'string',
          description: 'Task ID to decompose',
          required: true
        },
        {
          name: 'strategy',
          type: 'string',
          description: 'Decomposition strategy',
          choices: ['recursive', 'parallel', 'sequential'],
          default: 'recursive'
        }
      ],
      handler: async (args, context) => {
        // Task decomposition implementation
        return 0;
      }
    },
    {
      id: 'got',
      name: 'got',
      description: 'Graph-of-Thought operations',
      subcommands: [
        {
          id: 'create',
          name: 'create',
          description: 'Create a new Graph-of-Thought',
          handler: async (args, context) => {
            // GoT creation implementation
            return 0;
          }
        },
        {
          id: 'visualize',
          name: 'visualize',
          description: 'Visualize a Graph-of-Thought',
          options: [
            {
              name: 'id',
              type: 'string',
              description: 'Graph ID',
              required: true
            }
          ],
          handler: async (args, context) => {
            // GoT visualization implementation
            return 0;
          }
        }
      ],
      handler: async (args, context) => {
        // GoT command implementation
        return 0;
      }
    }
  ],
  handler: async (args, context) => {
    // Task command implementation
    return 0;
  }
};

// Register the command
registerCommand(taskCommand);
```

## IPFS Kit Commands

The IPFS Kit commands provide access to the IPFS Kit MCP Server:

```typescript
// IPFS command implementation
export const ipfsCommand: Command = {
  id: 'ipfs',
  name: 'ipfs',
  description: 'Interact with IPFS Kit MCP Server',
  category: 'Storage',
  subcommands: [
    {
      id: 'add',
      name: 'add',
      description: 'Add content to IPFS',
      options: [
        {
          name: 'file',
          alias: 'f',
          type: 'string',
          description: 'File path',
          required: true
        },
        {
          name: 'pin',
          alias: 'p',
          type: 'boolean',
          description: 'Pin the content',
          default: true
        }
      ],
      handler: async (args, context) => {
        // Add implementation
        return 0;
      }
    },
    {
      id: 'get',
      name: 'get',
      description: 'Get content from IPFS',
      options: [
        {
          name: 'cid',
          alias: 'c',
          type: 'string',
          description: 'Content identifier',
          required: true
        },
        {
          name: 'output',
          alias: 'o',
          type: 'string',
          description: 'Output file path',
          required: false
        }
      ],
      handler: async (args, context) => {
        // Get implementation
        return 0;
      }
    },
    {
      id: 'pin',
      name: 'pin',
      description: 'Pin management operations',
      subcommands: [
        {
          id: 'add',
          name: 'add',
          description: 'Pin content',
          options: [
            {
              name: 'cid',
              type: 'string',
              description: 'Content identifier',
              required: true
            }
          ],
          handler: async (args, context) => {
            // Pin add implementation
            return 0;
          }
        },
        {
          id: 'ls',
          name: 'ls',
          description: 'List pinned content',
          handler: async (args, context) => {
            // Pin list implementation
            return 0;
          }
        },
        {
          id: 'rm',
          name: 'rm',
          description: 'Unpin content',
          options: [
            {
              name: 'cid',
              type: 'string',
              description: 'Content identifier',
              required: true
            }
          ],
          handler: async (args, context) => {
            // Pin remove implementation
            return 0;
          }
        }
      ],
      handler: async (args, context) => {
        // Pin command implementation
        return 0;
      }
    }
  ],
  handler: async (args, context) => {
    // IPFS command implementation
    return 0;
  }
};

// Register the command
registerCommand(ipfsCommand);
```

## CLI Entry Point

The main CLI entry point integrates all command components:

```typescript
// src/cli.ts
#!/usr/bin/env node
import { CommandParser } from './commands/parser';
import { CommandRegistry } from './commands/registry';
import { createExecutionContext } from './commands/context';
import { ConfigurationManager } from './config/manager';
import { TypeScriptAgent } from './agent/typescript-agent';
import { IPFSKitClient } from './ipfs/client';
import { TaskScheduler } from './tasks/scheduler';
import { GraphOfThoughtManager } from './tasks/got';

// Register all commands
import './commands';

async function main() {
  try {
    // Initialize the configuration system
    await ConfigurationManager.getInstance().initialize();
    
    // Initialize TypeScript Agent
    const agent = new TypeScriptAgent({
      model: ConfigurationManager.getInstance().get('agent.model', 'gpt-4o')
    });
    
    // Initialize IPFS Kit client
    const ipfsClient = new IPFSKitClient({
      baseUrl: ConfigurationManager.getInstance().get('ipfs.baseUrl', 'http://localhost:8000')
    });
    
    // Initialize task system
    const taskScheduler = new TaskScheduler();
    const gotManager = new GraphOfThoughtManager();
    
    // Parse command line arguments
    const parser = new CommandParser();
    const parsed = parser.parseCommandLine(process.argv);
    
    if (!parsed) {
      // No command specified, show help
      const helpCommand = CommandRegistry.getInstance().getCommand('help');
      if (helpCommand) {
        await CommandRegistry.getInstance().executeCommand('help', {}, createExecutionContext());
      } else {
        console.error('Help command not found!');
        process.exit(1);
      }
      return;
    }
    
    // Create execution context with all required services
    const context = createExecutionContext(parsed.args, {
      agent,
      ipfsClient,
      taskScheduler,
      gotManager
    });
    
    // Execute the command
    const exitCode = await CommandRegistry.getInstance()
      .executeCommand(parsed.command.id, parsed.args, context);
    
    process.exit(exitCode);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main();
}

// Export for testing
export { main };
```

## Testing Approach

The command system testing will include:

1. **TypeScript Unit Tests**
   - Command registry validation
   - Tool implementation testing
   - Graph-of-Thought node testing
   - IPFS Kit client mocking

2. **Integration Tests**
   - TypeScript agent command execution
   - Task decomposition workflow
   - IPFS operations via client

3. **End-to-End Tests**
   - CLI execution with real commands
   - Output formatting
   - Exit code handling

## Implementation Plan

The command system implementation will proceed as follows:

1. **Core Infrastructure**
   - Implement command registry and interfaces
   - Create argument parser
   - Implement execution context

2. **TypeScript Agent Commands**
   - Implement agent chat command
   - Implement agent execute command
   - Implement tool management commands

3. **Task System Commands**
   - Implement task creation and management
   - Add Graph-of-Thought commands
   - Implement decomposition visualization

4. **IPFS Kit Commands**
   - Implement content addition and retrieval
   - Add pin management commands
   - Create status commands

5. **Advanced Features**
   - Add command suggestions for typos
   - Implement tab completion
   - Add interactive mode

## Best Practices

When implementing commands, follow these best practices:

1. **TypeScript Type Safety**: Leverage TypeScript's type system for robust implementations
2. **Asynchronous Patterns**: Use async/await for all asynchronous operations
3. **Error Handling**: Provide clear error messages and proper error handling
4. **Testing**: Write comprehensive tests for all command functionality
5. **Documentation**: Include detailed help text and examples for all commands
6. **Progress Feedback**: For long-running operations, provide progress updates