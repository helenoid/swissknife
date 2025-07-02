import { logger } from './utils/logger.js';
import { ConfigurationManager, IConfigManager } from './config/manager.js';
import { TaskManager } from './tasks/manager.js'; // Import TaskManager
import { StorageProvider } from './types/storage.js'; // Import StorageProvider
import { Agent } from './ai/agent/agent.js'; // Import Agent
import { ModelRegistry } from './ai/models/registry.js'; // Import ModelRegistry
import { ToolExecutor } from './tools/executor.js'; // Import ToolExecutor
import { Tool } from './Tool.js'; // Import Tool

/**
 * Interface defining the context passed to a command's execute method.
 * Contains shared resources and services needed by commands.
 */
export interface CommandExecutionContext {
  config: IConfigManager;
  taskManager: TaskManager;
  // Add other shared resources as they are implemented and needed
  agent: Agent; // Add Agent instance
  // storage?: StorageProvider; // Storage is likely accessed via Agent/TaskManager now

  /**
   * Retrieves a service by name.
   * @param serviceName The name of the service to retrieve.
   * @returns The requested service instance.
   */
  getService<T>(serviceName: string): T;

  /**
   * Retrieves a service from the context by name.
   * @param serviceName The name of the service to retrieve.
   * @returns The requested service instance.
   */
}

/**
 * Defines a single command-line option with its metadata.
 */
export interface CommandOption {
  /** Name of the option (e.g., "help", "output") */
  readonly name: string;
  /** Type of the option value (e.g., "boolean", "string") */
  readonly type: 'boolean' | 'string' | 'number';
  /** Short alias for the option (e.g., "h" for "--help") */
  readonly alias?: string;
  /** Description shown in help text */
  readonly description: string;
  /** Default value if not provided */
  readonly default?: any;
  /** Whether the option is required */
  readonly required?: boolean;
}

/**
 * Interface defining the structure for CLI command definitions.
 */
export interface Command {
  /** Unique identifier for the command (e.g., "task:create") */
  readonly id: string;
  /** Name used to invoke the command (e.g., "create" for "task create") */
  readonly name: string;
  /** Short description shown in help */
  readonly description: string;
  /** Detailed help text (optional) */
  readonly help?: string;
  /** Definition of expected arguments/options (e.g., using yargs-parser options) */
  readonly argumentParserOptions?: any; // Define a stricter type if using a specific parser library
  /** Options for the command */
  readonly options?: CommandOption[];
  /** Optional nested commands */
  readonly subcommands?: Command[];

  /** 
   * Parses raw command-line arguments into a structured object.
   * @param args Raw string arguments (excluding command name).
   * @returns A structured object of parsed arguments/options.
   * @throws If arguments are invalid.
   */
  parseArguments(args: string[]): Record<string, any>; // Return type depends on parser

  /**
   * Executes the command's logic.
   * @param parsedArgs The structured arguments object from parseArguments.
   * @param context Execution context providing access to shared resources.
   * @returns A promise resolving to the command's result (can be any type).
   */
  execute(parsedArgs: Record<string, any>, context: CommandExecutionContext): Promise<any>;
}

/**
 * Manages the registration and retrieval of CLI commands.
 */
export class CommandRegistry {
  private commands = new Map<string, Command>();

  constructor() {
    logger.debug('Initializing CommandRegistry...');
  }

  /**
   * Registers a command definition.
   * @param command An instance of a class implementing the Command interface.
   */
  register(command: Command): void {
    if (this.commands.has(command.name)) {
      logger.warn(`Command "${command.name}" is already registered. Overwriting.`);
    }
    logger.debug(`Registering command: ${command.name}`);
    this.commands.set(command.name, command);
  }

  /**
   * Retrieves a command definition by its name.
   * @param name The name of the command to retrieve.
   * @returns The Command definition or undefined if not found.
   */
  getCommand(name: string): Command | undefined {
    const command = this.commands.get(name);
    // if (!command) {
    //   logger.warn(`Command "${name}" not found in registry.`);
    // }
    return command;
  }

  /**
   * Lists the names of all registered commands.
   * @returns An array of command names.
   */
  listCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Lists all registered command definitions.
   * @returns An array of Command objects.
   */
  listCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get the CommandRegistry singleton instance.
   * @returns The singleton instance of CommandRegistry.
   */
  static getInstance(): CommandRegistry {
    if (!(global as any)._commandRegistryInstance) {
      (global as any)._commandRegistryInstance = new CommandRegistry();
    }
    return (global as any)._commandRegistryInstance;
  }
}
