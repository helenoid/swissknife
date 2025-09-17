/**
 * Built-in Shared Commands
 * 
 * These commands work across CLI, web, and desktop environments
 */

import { BaseCommand, CommandContext, CommandResult, CommandOptions } from './base.js';
import { sharedCommandRegistry } from './base.js';
import { configManager } from '../config/index.js';
import { aiManager } from '../ai/index.js';

/**
 * Help command - shows available commands and usage
 */
export class HelpCommand extends BaseCommand {
  readonly name = 'help';
  readonly description = 'Show available commands and usage information';
  readonly usage = 'help [command]';
  readonly aliases = ['h', '?'];
  readonly category = 'system';

  async execute(args: string[], options: CommandOptions, context: CommandContext): Promise<CommandResult> {
    if (args.length > 0) {
      // Show help for specific command
      const commandName = args[0];
      const command = sharedCommandRegistry.get(commandName);
      
      if (!command) {
        return this.error(`Command not found: ${commandName}`);
      }

      return this.success(command.getHelp());
    }

    // Show general help
    const availableCommands = sharedCommandRegistry.list(context);
    let output = `SwissKnife CLI - Flexible AI-Powered Tool\n\n`;
    output += `Usage: swissknife <command> [args...] [options]\n\n`;
    output += `You can use natural language or specific commands:\n`;
    output += `  "show me the status"           → status\n`;
    output += `  "create a new task"            → task create\n`;
    output += `  "help with ai commands"        → help ai\n\n`;
    
    if (availableCommands.length > 0) {
      output += `Available Commands:\n`;
      
      // Group by category
      const categories = new Map<string, BaseCommand[]>();
      for (const cmd of availableCommands) {
        if (!categories.has(cmd.category)) {
          categories.set(cmd.category, []);
        }
        categories.get(cmd.category)!.push(cmd);
      }

      for (const [category, commands] of categories) {
        output += `\n${category.toUpperCase()}:\n`;
        for (const cmd of commands) {
          const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
          output += `  ${cmd.name}${aliases.padEnd(20)} ${cmd.description}\n`;
        }
      }
    }

    output += `\nFor command-specific help: help <command>\n`;
    output += `For natural language usage, just describe what you want to do!\n`;

    return this.success(output);
  }
}

/**
 * Status command - shows system status
 */
export class StatusCommand extends BaseCommand {
  readonly name = 'status';
  readonly description = 'Show system status and health information';
  readonly usage = 'status [component]';
  readonly aliases = ['stat', 'info'];
  readonly category = 'system';

  async execute(args: string[], options: CommandOptions, context: CommandContext): Promise<CommandResult> {
    let output = `SwissKnife System Status\n`;
    output += `========================\n\n`;
    
    // Environment info
    output += `Environment: ${context.environment}\n`;
    output += `Working Directory: ${context.workingDirectory || 'N/A'}\n`;
    output += `User: ${context.user || 'N/A'}\n`;
    output += `Session: ${context.session || 'N/A'}\n\n`;

    // Component status
    const components = ['AI Manager', 'Config Manager', 'Event Bus', 'Command Registry'];
    output += `Components:\n`;
    
    for (const component of components) {
      const status = await this.checkComponentStatus(component);
      output += `  ${component}: ${status}\n`;
    }

    // Command statistics
    const availableCommands = sharedCommandRegistry.list(context);
    output += `\nCommands: ${availableCommands.length} available in ${context.environment} environment\n`;

    return this.success(output);
  }

  private async checkComponentStatus(component: string): Promise<string> {
    try {
      switch (component) {
        case 'AI Manager':
          return aiManager ? '✅ Ready' : '❌ Not available';
        case 'Config Manager':
          return configManager ? '✅ Ready' : '❌ Not available';
        case 'Event Bus':
          return '✅ Ready';
        case 'Command Registry':
          return sharedCommandRegistry ? '✅ Ready' : '❌ Not available';
        default:
          return '❓ Unknown';
      }
    } catch (error) {
      return `❌ Error: ${(error as Error).message}`;
    }
  }
}

/**
 * AI Chat command - interactive AI conversation
 */
export class AIChatCommand extends BaseCommand {
  readonly name = 'ai';
  readonly description = 'Interactive AI chat and assistance';
  readonly usage = 'ai [message] or just describe what you want to do';
  readonly aliases = ['chat', 'ask'];
  readonly category = 'ai';

  async execute(args: string[], options: CommandOptions, context: CommandContext): Promise<CommandResult> {
    const message = args.join(' ');
    
    if (!message) {
      return this.success(
        `AI Assistant Ready! 🤖\n\n` +
        `You can:\n` +
        `- Ask questions: "ai how do I create a task?"\n` +
        `- Get help: "ai explain the status command"\n` +
        `- Natural language: Just describe what you want to do!\n\n` +
        `Example: "ai help me understand this codebase"`
      );
    }

    try {
      const systemPrompt = `You are SwissKnife AI Assistant. Help users with:
- Using SwissKnife commands and features
- Understanding the system
- Coding and development tasks
- General assistance

Context: ${context.environment} environment
Available commands: ${sharedCommandRegistry.list(context).map(cmd => cmd.name).join(', ')}

Be helpful, concise, and practical. If a user needs to run a command, suggest the exact syntax.`;

      const response = await aiManager.generateText(
        `${systemPrompt}\n\nUser: ${message}`,
        {
          maxTokens: 1000,
          temperature: 0.7
        }
      );

      return this.success(`🤖 AI Assistant:\n\n${response}`);
    } catch (error) {
      return this.error(`AI service unavailable: ${(error as Error).message}`);
    }
  }
}

/**
 * Config command - configuration management
 */
export class ConfigCommand extends BaseCommand {
  readonly name = 'config';
  readonly description = 'Manage SwissKnife configuration';
  readonly usage = 'config [get|set|list] [key] [value]';
  readonly aliases = ['cfg', 'conf'];
  readonly category = 'system';

  async execute(args: string[], options: CommandOptions, context: CommandContext): Promise<CommandResult> {
    const action = args[0];
    
    if (!action) {
      return this.success(
        `Configuration Management\n\n` +
        `Usage:\n` +
        `  config list              - Show all configuration\n` +
        `  config get <key>         - Get a configuration value\n` +
        `  config set <key> <value> - Set a configuration value\n`
      );
    }

    try {
      switch (action.toLowerCase()) {
        case 'list':
          const config = await configManager.getAll();
          return this.success(JSON.stringify(config, null, 2));
          
        case 'get':
          const key = args[1];
          if (!key) {
            return this.error('Key required for get operation');
          }
          const value = await configManager.get(key);
          return this.success(`${key}: ${JSON.stringify(value)}`);
          
        case 'set':
          const setKey = args[1];
          const setValue = args[2];
          if (!setKey || setValue === undefined) {
            return this.error('Key and value required for set operation');
          }
          await configManager.set(setKey, setValue);
          return this.success(`Set ${setKey} = ${setValue}`);
          
        default:
          return this.error(`Unknown action: ${action}. Use list, get, or set.`);
      }
    } catch (error) {
      return this.error(`Configuration error: ${(error as Error).message}`);
    }
  }
}

// Register all built-in commands
export function registerBuiltinCommands(): void {
  sharedCommandRegistry.register(new HelpCommand());
  sharedCommandRegistry.register(new StatusCommand());
  sharedCommandRegistry.register(new AIChatCommand());
  sharedCommandRegistry.register(new ConfigCommand());
}

// Auto-register when module is imported
registerBuiltinCommands();

// Also import task commands
import './task-commands.js';