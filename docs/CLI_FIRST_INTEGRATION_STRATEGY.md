# CLI-First Integration Strategy for Unified Architecture

This document details how the CLI-first approach fits into the unified TypeScript architecture outlined in the main `unified_integration_plan.md` document. SwissKnife is fundamentally a command-line application, and this strategy ensures all integration decisions optimize for this primary use case.

## Core Principles

1. **CLI-First within Unified Architecture**: SwissKnife is first and foremost a command-line application running in Node.js environments, with all functionality integrated directly into a single TypeScript codebase.

2. **Domain-Driven Organization**: The code is organized by functional domain (AI, CLI, ML, Tasks, Storage) with clear boundaries and cross-domain communication through well-defined interfaces.

3. **Terminal-Optimized UX**: All user interactions are designed for the terminal environment, with consistent command patterns, rich formatting, and responsive feedback.

4. **Direct TypeScript Integration**: All functionality is implemented directly in TypeScript with no external dependencies except for the Python-based IPFS Kit MCP Server.

5. **API-Based MCP Integration**: The Python IPFS Kit MCP Server is integrated through a well-defined API interface for storage operations.

## Domain Organization for CLI Environment

The unified architecture's domain-based organization is optimized for the CLI environment:

```
/src
├── ai/                      # AI agent system
├── cli/                     # CLI-specific components
│   ├── commands/            # Command implementations
│   ├── ui/                  # Terminal UI components
│   ├── formatting/          # Output formatting
│   └── parsing/             # Command parsing
├── ml/                      # ML acceleration
├── tasks/                   # Task processing
├── storage/                 # Storage systems
├── config/                  # Configuration
├── utils/                   # Utilities
└── types/                   # Type definitions
```

## CLI Domain Architecture

The CLI domain is the primary interface for user interaction and orchestrates other domains:

### 1. Command System

The command system provides consistent patterns for defining, parsing, and executing commands:

```typescript
// src/cli/types/command.ts
export interface Command {
  id: string;                 // Unique identifier (e.g., 'agent.chat')
  name: string;               // Display name (e.g., 'agent chat')
  description: string;        // Command description
  args?: CommandArg[];        // Positional arguments
  options?: CommandOption[];  // Named options
  subcommands?: Command[];    // Nested commands
  handler: CommandHandler;    // Execution function
}

export interface CommandArg {
  name: string;
  description: string;
  required: boolean;
}

export interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  default?: any;
}

export type CommandHandler = (
  args: Record<string, any>,
  context: CommandContext
) => Promise<number>;

export interface CommandContext {
  ui: UIManager;
  config: ConfigManager;
  // Other context properties...
}
```

### 2. Command Registry

The command registry manages all available commands and their execution:

```typescript
// src/cli/commands/registry.ts
export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, Command> = new Map();
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }
  
  registerCommand(command: Command): void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command with ID '${command.id}' is already registered`);
    }
    this.commands.set(command.id, command);
  }
  
  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }
  
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
  
  async executeCommand(id: string, args: Record<string, any>, context: CommandContext): Promise<number> {
    const command = this.getCommand(id);
    
    if (!command) {
      context.ui.error(`Command '${id}' not found`);
      return 1;
    }
    
    try {
      return await command.handler(args, context);
    } catch (error) {
      context.ui.error(`Error executing command '${id}': ${error.message}`);
      return 1;
    }
  }
}
```

### 3. Terminal UI Components

The terminal UI system provides rich interaction capabilities:

```typescript
// src/cli/ui/ui-manager.ts
export class UIManager {
  // Output methods
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }
  
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }
  
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }
  
  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }
  
  // Rich output methods
  render(content: string): void {
    // Render content with proper formatting
  }
  
  table(options: { headers: string[], rows: any[][] }): void {
    // Display data in a formatted table
  }
  
  // Interactive input methods
  async prompt<T>(options: PromptOptions): Promise<T> {
    // Display interactive prompt and return result
    return {} as T;
  }
  
  async confirm(message: string): Promise<boolean> {
    // Display confirmation prompt
    return false;
  }
  
  async select<T>(options: SelectOptions<T>): Promise<T> {
    // Display selection prompt
    return {} as T;
  }
  
  // Progress indicators
  createSpinner(message: string): Spinner {
    return new Spinner(message);
  }
  
  progressBar(options: ProgressBarOptions): ProgressBar {
    return new ProgressBar(options);
  }
}
```

## Cross-Domain Integration for CLI

The CLI-first strategy integrates all domains through direct TypeScript imports and interfaces, optimized for the command-line environment:

### 1. AI Domain Integration

```typescript
// src/cli/commands/ai-commands.ts
import { CommandRegistry } from './registry';
import { Agent } from '../../ai/agent/agent';
import { ModelRegistry } from '../../ai/models/registry';
import { ToolRegistry } from '../../ai/tools/registry';

export function registerAICommands() {
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'agent.chat',
    name: 'agent chat',
    description: 'Chat with the AI agent',
    args: [
      {
        name: 'message',
        description: 'Message to send to the agent',
        required: true
      }
    ],
    options: [
      {
        name: 'model',
        alias: 'm',
        type: 'string',
        description: 'Model to use for the agent',
        default: 'default'
      },
      {
        name: 'thinking',
        alias: 't',
        type: 'boolean',
        description: 'Enable thinking mode using Graph-of-Thought',
        default: false
      }
    ],
    
    async handler(args, context) {
      const { message, model = 'default', thinking = false } = args;
      
      try {
        // Get model from registry
        const modelRegistry = ModelRegistry.getInstance();
        const modelInstance = model === 'default' 
          ? modelRegistry.getDefaultModel()
          : modelRegistry.getModel(model);
          
        if (!modelInstance) {
          context.ui.error(`Model "${model}" not found`);
          return 1;
        }
        
        // Get tools from registry
        const toolRegistry = ToolRegistry.getInstance();
        const tools = toolRegistry.getAllTools();
        
        // Create agent
        const agent = new Agent({
          model: modelInstance,
          tools,
          thinking
        });
        
        // Show spinner while agent processes message
        const spinner = context.ui.createSpinner('Processing message...');
        spinner.start();
        
        // Process message
        const response = await agent.processMessage(message);
        
        // Stop spinner and show response
        spinner.stop();
        context.ui.info(`\nAgent response:`);
        context.ui.render(response);
        
        return 0;
      } catch (error) {
        context.ui.error(`Agent error: ${error.message}`);
        return 1;
      }
    }
  });
  
  // Register other AI-related commands...
}
```

### 2. Tasks Domain Integration

```typescript
// src/cli/commands/task-commands.ts
import { CommandRegistry } from './registry';
import { TaskManager } from '../../tasks/manager';
import { StorageFactory } from '../../storage/factory';

export function registerTaskCommands() {
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'task.create',
    name: 'task create',
    description: 'Create a new task',
    args: [
      {
        name: 'description',
        description: 'Task description',
        required: true
      }
    ],
    options: [
      {
        name: 'priority',
        alias: 'p',
        type: 'number',
        description: 'Task priority (1-10)',
        default: 5
      },
      {
        name: 'dependencies',
        alias: 'd',
        type: 'string',
        description: 'Comma-separated list of task IDs this task depends on'
      }
    ],
    
    async handler(args, context) {
      const { description, priority = 5, dependencies = '' } = args;
      
      try {
        // Create task manager with storage
        const storage = StorageFactory.createDefaultStorage();
        const taskManager = new TaskManager({ storage });
        
        // Parse dependencies
        const dependencyIds = dependencies ? dependencies.split(',').map(id => id.trim()) : [];
        
        // Create task
        const taskId = await taskManager.createTask(description, priority, dependencyIds);
        
        context.ui.success(`Task created with ID: ${taskId}`);
        
        // Check if task can be scheduled immediately
        const task = await taskManager.getTask(taskId);
        if (task.status === 'scheduled') {
          context.ui.info('Task is scheduled for execution.');
        } else if (task.status === 'pending') {
          context.ui.info('Task is pending completion of dependencies.');
        }
        
        return 0;
      } catch (error) {
        context.ui.error(`Failed to create task: ${error.message}`);
        return 1;
      }
    }
  });
  
  // Register other task-related commands...
}
```

### 3. Storage Domain Integration

```typescript
// src/cli/commands/storage-commands.ts
import { CommandRegistry } from './registry';
import { StorageFactory } from '../../storage/factory';
import * as fs from 'fs/promises';
import * as path from 'path';

export function registerStorageCommands() {
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'storage.add',
    name: 'storage add',
    description: 'Add content to storage',
    args: [
      {
        name: 'path',
        description: 'Path to file or content to add',
        required: true
      }
    ],
    options: [
      {
        name: 'provider',
        alias: 'p',
        type: 'string',
        description: 'Storage provider (local, ipfs)',
        default: 'ipfs'
      }
    ],
    
    async handler(args, context) {
      const { path: filePath, provider = 'ipfs' } = args;
      
      try {
        // Create storage provider
        const storage = StorageFactory.createStorage(provider);
        
        // Check if path is a file
        let content: string | Buffer;
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            content = await fs.readFile(filePath);
            context.ui.info(`Adding file: ${filePath}`);
          } else {
            context.ui.error(`${filePath} is not a file`);
            return 1;
          }
        } catch (error) {
          // If path doesn't exist, treat as direct content
          content = filePath;
          context.ui.info('Adding content directly');
        }
        
        // Add to storage
        const id = await storage.add(content);
        
        context.ui.success(`Content added with ID: ${id}`);
        return 0;
      } catch (error) {
        context.ui.error(`Failed to add content: ${error.message}`);
        return 1;
      }
    }
  });
  
  // Register other storage-related commands...
}
```

## API-Based MCP Server Integration

The CLI-first approach integrates with the Python-based IPFS Kit MCP Server through a type-safe API client:

```typescript
// src/storage/ipfs/mcp-client.ts
import fetch from 'node-fetch';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { APIKeyManager } from '../../config/api-key-manager';

export interface MCPClientOptions {
  baseUrl: string;
  authentication?: {
    type: 'apiKey' | 'token';
    value: string;
  };
  timeout?: number;
}

export class MCPClient extends EventEmitter {
  private baseUrl: string;
  private authentication?: {
    type: 'apiKey' | 'token';
    value: string;
  };
  private timeout: number;
  private ws: WebSocket | null = null;
  
  constructor(options: MCPClientOptions) {
    super();
    this.baseUrl = options.baseUrl;
    this.authentication = options.authentication;
    this.timeout = options.timeout || 30000;
  }
  
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    const formData = new FormData();
    const blob = content instanceof Buffer 
      ? new Blob([content]) 
      : new Blob([Buffer.from(content)]);
    formData.append('file', blob);
    
    const response = await fetch(`${this.baseUrl}/api/v0/add`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
      timeout: this.timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add content: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { cid: data.Hash };
  }
  
  async getContent(cid: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/api/v0/cat?arg=${cid}`, {
      method: 'GET',
      headers: this.getHeaders(),
      timeout: this.timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get content: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
      this.ws = new WebSocket(wsUrl, {
        headers: this.getHeaders()
      });
      
      this.ws.on('open', () => {
        resolve();
      });
      
      this.ws.on('error', (error) => {
        reject(error);
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.emit('message', message);
          
          if (message.type) {
            this.emit(message.type, message);
          }
        } catch (error) {
          this.emit('error', error);
        }
      });
    });
  }
  
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.authentication) {
      if (this.authentication.type === 'apiKey') {
        headers['X-API-Key'] = this.authentication.value;
      } else {
        headers['Authorization'] = `Bearer ${this.authentication.value}`;
      }
    }
    
    return headers;
  }
}
```

## Implementation Timeline for CLI-First Approach

### Phase 1: CLI Foundation (Weeks 1-2)
- Create domain-driven project structure
- Implement command registry and parser
- Build terminal UI components
- Set up configuration system

### Phase 2: Core CLI Commands (Weeks 3-4)
- Implement basic agent commands
- Create storage commands
- Build task management commands
- Develop configuration commands

### Phase 3: Advanced CLI Features (Weeks 5-6)
- Implement interactive chat interface
- Build task visualization in terminal
- Create progress tracking for long operations
- Develop help system and documentation

### Phase 4: Integration with MCP Server (Weeks 7-8)
- Implement MCP client API
- Create storage commands for IPFS operations
- Build WebSocket integration for real-time updates
- Implement caching for improved performance

### Phase 5: ML and Advanced Features (Weeks 9-10)
- Implement ML acceleration commands
- Create Graph-of-Thought visualization
- Build benchmark and diagnostics commands
- Develop advanced task workflow commands

## Benefits of CLI-First in Unified Architecture

1. **Simplified Development**: Direct TypeScript integration simplifies the development process
2. **Consistent User Experience**: Uniform command patterns and output formatting
3. **Performance Optimization**: Node.js-optimized implementation for CLI environment
4. **Enhanced Developer Tools**: Rich CLI interface for development and debugging
5. **Streamlined Testing**: Easier testing through consistent command interface

## Cross-Platform Considerations

The CLI-first approach in the unified architecture ensures compatibility across platforms:

1. **Node.js Environment**: Primary target is Node.js on all major platforms
2. **Terminal Compatibility**: UI components account for different terminal capabilities
3. **File System Abstraction**: Cross-platform file system operations
4. **MCP Server Connectivity**: Platform-agnostic API client for MCP server

## Conclusion

The CLI-First Integration Strategy aligns perfectly with our unified TypeScript architecture by emphasizing SwissKnife's primary nature as a command-line application. By organizing code by domain and implementing all functionality directly in TypeScript (with the Python MCP server as the only external component), we create a cohesive, maintainable system that delivers an excellent user experience through the terminal.

This approach leverages the strengths of Node.js for command-line applications while providing advanced AI capabilities, sophisticated task management, and powerful storage integration through a consistent, intuitive interface. The API-based integration with the IPFS Kit MCP Server maintains architectural simplicity while enabling powerful content-addressed storage capabilities.

The strategy detailed in this document provides a clear path for implementing SwissKnife's core functionality as a unified TypeScript codebase optimized for the CLI environment, delivering a powerful tool that meets the needs of both users and developers.