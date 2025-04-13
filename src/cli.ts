import React from 'react'; // Needed if using Ink components directly for rendering
import { render, Box, Text } from 'ink'; // Example Ink components
import { CommandRegistry, CommandExecutionContext } from './command-registry.js';
import { ConfigManager } from './config/manager.js';
import { logger } from './utils/logger.js';
import { StorageFactory } from './storage/factory.js';
import { StorageProvider } from './types/storage.js'; 
import { TaskManager } from './tasks/manager.js'; 
import { Agent } from './ai/agent/agent.js'; // Import Agent
import { ModelRegistry } from './ai/models/registry.js'; // Import ModelRegistry
import { Model } from './types/ai.js'; // Import Model type
// Import command implementations
import { TaskCreateCommand } from './cli/commands/taskCreateCommand.js'; 
import { AiChatCommand } from './cli/commands/aiChatCommand.js'; 
import { StorageAddCommand } from './cli/commands/storageAddCommand.js'; 
import { TaskStatusCommand } from './cli/commands/taskStatusCommand.js'; 
import { TaskListCommand } from './cli/commands/taskListCommand.js'; // Import TaskListCommand

/**
 * Main CLI application class.
 * Orchestrates command parsing, execution, and output rendering.
 */
export class CLI {
  private commandRegistry: CommandRegistry;
  private configManager: ConfigManager;
  // Core services needed in the execution context
  private agent: Agent; 
  private taskManager: TaskManager;
  private storage: StorageProvider;
  private modelRegistry: ModelRegistry;
  private defaultModel: Model; // Store the default model

  constructor() {
    logger.debug('Initializing CLI...');
    this.commandRegistry = new CommandRegistry();
    this.configManager = ConfigManager.getInstance(); 
    this.modelRegistry = ModelRegistry.getInstance(); 
    
    // Initialize core services
    this.storage = StorageFactory.createStorage(); 
    
    const model = this.modelRegistry.getDefaultModel();
    if (!model) {
        logger.error("No default AI model found or configured. Cannot initialize Agent.");
        throw new Error("CLI initialization failed: No default model available."); 
    }
    this.defaultModel = model; 

    this.taskManager = new TaskManager({ storage: this.storage });
    
    this.agent = new Agent({ 
        model: this.defaultModel, 
        storage: this.storage, 
        config: this.configManager,
        // TODO: Pass tools dynamically or from config later
        // tools: [new EchoTool()], 
        // TODO: Make useGraphOfThought configurable
        // useGraphOfThought: this.configManager.get('ai.useGoT') 
    }); 

    this.registerCommands();
    logger.info('CLI initialized.');
  }

  private registerCommands(): void {
    logger.debug('Registering CLI commands...');
    // Explicitly register commands here
    this.commandRegistry.register(new TaskCreateCommand());
    this.commandRegistry.register(new AiChatCommand()); 
    this.commandRegistry.register(new StorageAddCommand()); 
    this.commandRegistry.register(new TaskStatusCommand()); 
    this.commandRegistry.register(new TaskListCommand()); // Register TaskListCommand
    logger.info(`Registered commands: ${this.commandRegistry.listCommandNames().join(', ')}`);
  }

  /**
   * Runs the CLI with the given command-line arguments.
   */
  async run(argv: string[]): Promise<void> {
    logger.debug('CLI run started with args:', argv);
    if (argv.length === 0 || ['-h', '--help', '--h'].includes(argv[0])) { 
      this.renderHelp();
      return;
    }

    const commandName = argv[0];
    const commandArgs = argv.slice(1);

    if (commandArgs.includes('-h') || commandArgs.includes('--help')) {
       this.renderHelp(commandName);
       return;
    }

    const command = this.commandRegistry.getCommand(commandName);
    if (!command) {
      this.renderError(`Unknown command: ${commandName}`);
      this.renderHelp(); 
      process.exitCode = 1; 
      return;
    }

    // Prepare execution context
    const context: CommandExecutionContext = {
      config: this.configManager,
      taskManager: this.taskManager, 
      agent: this.agent, 
    };

    try {
      logger.debug(`Parsing arguments for command: ${commandName}`);
      const parsedArgs = command.parseArguments(commandArgs); 
      logger.debug(`Parsed arguments:`, parsedArgs);

      logger.info(`Executing command: ${commandName}`);
      const result = await command.execute(parsedArgs, context);
      logger.info(`Command ${commandName} executed successfully.`);

      this.renderResult(result);
      process.exitCode = 0; 

    } catch (error: any) {
      logger.error(`Error executing command ${commandName}:`, error);
      this.renderError(error.message || 'An unknown error occurred.');
      process.exitCode = 1; 
    }
  }

  /** Renders the command result to the console. */
  private renderResult(result: any): void {
    if (result !== undefined && result !== null) {
        // Basic pretty printing for arrays of objects (like task list)
        if (Array.isArray(result)) {
           console.table(result); // Use console.table for better array display
        } else {
           const output = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
           console.log(output); 
        }
    } else {
        console.log("Command completed successfully.");
    }
  }

  /** Renders an error message to the console. */
  private renderError(message: string): void {
     console.error(`Error: ${message}`);
  }

  /** Renders general help information or help for a specific command. */
  private renderHelp(commandName?: string): void {
     logger.info(`Rendering help${commandName ? ` for ${commandName}` : ''}...`);
     
     if (commandName) {
        const command = this.commandRegistry.getCommand(commandName);
        if (command) {
           let helpText = `Usage: swissknife ${command.name} [options]\n\n`;
           helpText += `${command.description}\n`;
           if (command.help) {
              helpText += `\n${command.help}\n`;
           }
           // TODO: Add details based on command.argumentParserOptions
           console.log(helpText);
           return;
        } else {
           this.renderError(`Command "${commandName}" not found.`);
        }
     }
     
     let helpText = "SwissKnife CLI - Unified Tool\n\nUsage: swissknife <command> [options]\n\nAvailable Commands:\n";
     const commands = this.commandRegistry.listCommands();
     if (commands.length === 0) {
        helpText += "  (No commands registered yet)\n";
     } else {
        // Basic formatting for alignment
        const maxNameLength = Math.max(...commands.map(cmd => cmd.name.length));
        commands.forEach(cmd => {
           const padding = ' '.repeat(maxNameLength - cmd.name.length + 4); // 4 spaces padding
           helpText += `  ${cmd.name}${padding}${cmd.description}\n`;
        });
     }
     helpText += "\nUse 'swissknife <command> --help' for more information on a specific command.";
     
     console.log(helpText);
  }

  /** Static factory method for creating and setting up the CLI instance. */
  static async create(): Promise<CLI> {
    const cli = new CLI();
    return cli;
  }
}

// --- Potential Entry Point ---
// #!/usr/bin/env node
// import { CLI } from '../dist/cli.js'; 
// 
// (async () => {
//   try {
//     const cli = await CLI.create();
//     await cli.run(process.argv.slice(2));
//   } catch (error) {
//     console.error("Failed to initialize CLI:", error);
//     process.exit(1);
//   }
// })();
