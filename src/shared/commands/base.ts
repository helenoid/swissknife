/**
 * Base Command Abstraction
 * 
 * Provides a unified interface for commands that can be used by both
 * the CLI and web virtual desktop components.
 */

import { eventBus } from '../events/index.js';

export interface CommandContext {
  environment: 'cli' | 'web' | 'desktop';
  workingDirectory?: string;
  user?: string;
  session?: string;
  [key: string]: any;
}

export interface CommandResult {
  success: boolean;
  output: string;
  data?: any;
  exitCode?: number;
  error?: string;
  metadata?: {
    timestamp: number;
    duration: number;
    command: string;
    [key: string]: any;
  };
}

export interface CommandOptions {
  [key: string]: any;
}

export abstract class BaseCommand {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly usage: string;
  readonly aliases: string[] = [];
  readonly category: string = 'general';
  readonly requiresAuth: boolean = false;
  readonly supportedEnvironments: Array<'cli' | 'web' | 'desktop'> = ['cli', 'web', 'desktop'];

  /**
   * Execute the command with given arguments and context
   */
  abstract execute(
    args: string[],
    options: CommandOptions,
    context: CommandContext
  ): Promise<CommandResult>;

  /**
   * Parse natural language input to extract command arguments
   * This enables AI-powered flexible command interpretation
   */
  parseNaturalLanguage(input: string): { args: string[]; options: CommandOptions } {
    // Default implementation - can be overridden by subclasses
    const words = input.trim().split(/\s+/);
    const args: string[] = [];
    const options: CommandOptions = {};

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.startsWith('--')) {
        const [key, value] = word.substring(2).split('=');
        options[key] = value || true;
      } else if (word.startsWith('-')) {
        options[word.substring(1)] = true;
      } else {
        args.push(word);
      }
    }

    return { args, options };
  }

  /**
   * Check if command is available in the given context
   */
  isAvailable(context: CommandContext): boolean {
    return this.supportedEnvironments.includes(context.environment);
  }

  /**
   * Get help text for this command
   */
  getHelp(): string {
    let help = `${this.name} - ${this.description}\n\n`;
    help += `Usage: ${this.usage}\n`;
    
    if (this.aliases.length > 0) {
      help += `Aliases: ${this.aliases.join(', ')}\n`;
    }

    return help;
  }

  /**
   * Emit an event related to this command
   */
  protected emit(event: string, data: any): void {
    eventBus.emit(`command:${this.name}:${event}`, data);
  }

  /**
   * Create a successful result
   */
  protected success(output: string, data?: any): CommandResult {
    return {
      success: true,
      output,
      data,
      exitCode: 0,
      metadata: {
        timestamp: Date.now(),
        duration: 0, // Should be calculated by caller
        command: this.name
      }
    };
  }

  /**
   * Create an error result
   */
  protected error(message: string, exitCode: number = 1): CommandResult {
    return {
      success: false,
      output: '',
      error: message,
      exitCode,
      metadata: {
        timestamp: Date.now(),
        duration: 0,
        command: this.name
      }
    };
  }
}

/**
 * Registry for managing shared commands
 */
export class SharedCommandRegistry {
  private static instance: SharedCommandRegistry;
  private commands: Map<string, BaseCommand> = new Map();
  private aliases: Map<string, string> = new Map();

  static getInstance(): SharedCommandRegistry {
    if (!SharedCommandRegistry.instance) {
      SharedCommandRegistry.instance = new SharedCommandRegistry();
    }
    return SharedCommandRegistry.instance;
  }

  register(command: BaseCommand): void {
    this.commands.set(command.name, command);
    
    // Register aliases
    for (const alias of command.aliases) {
      this.aliases.set(alias, command.name);
    }
  }

  get(nameOrAlias: string): BaseCommand | undefined {
    // Try direct name first
    const command = this.commands.get(nameOrAlias);
    if (command) return command;

    // Try alias
    const realName = this.aliases.get(nameOrAlias);
    if (realName) {
      return this.commands.get(realName);
    }

    return undefined;
  }

  list(context?: CommandContext): BaseCommand[] {
    const commands = Array.from(this.commands.values());
    
    if (context) {
      return commands.filter(cmd => cmd.isAvailable(context));
    }
    
    return commands;
  }

  async execute(
    commandName: string,
    args: string[],
    options: CommandOptions,
    context: CommandContext
  ): Promise<CommandResult> {
    const command = this.get(commandName);
    
    if (!command) {
      return {
        success: false,
        output: '',
        error: `Command not found: ${commandName}`,
        exitCode: 127,
        metadata: {
          timestamp: Date.now(),
          duration: 0,
          command: commandName
        }
      };
    }

    if (!command.isAvailable(context)) {
      return {
        success: false,
        output: '',
        error: `Command ${commandName} is not available in ${context.environment} environment`,
        exitCode: 126,
        metadata: {
          timestamp: Date.now(),
          duration: 0,
          command: commandName
        }
      };
    }

    const startTime = Date.now();
    
    try {
      const result = await command.execute(args, options, context);
      const duration = Date.now() - startTime;
      
      if (result.metadata) {
        result.metadata.duration = duration;
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        output: '',
        error: `Command execution failed: ${(error as Error).message}`,
        exitCode: 1,
        metadata: {
          timestamp: Date.now(),
          duration,
          command: commandName
        }
      };
    }
  }
}

export const sharedCommandRegistry = SharedCommandRegistry.getInstance();