/**
 * Help Generator - Generates help text and documentation for commands
 */

import { CommandRegistry, Command } from './registry.js';

/**
 * Help formatting options
 */
export interface HelpFormatOptions {
  includeExamples?: boolean;
  includeAliases?: boolean;
  includeDescription?: boolean;
  includeOptions?: boolean;
  includeSubcommands?: boolean;
  color?: boolean;
  maxWidth?: number;
}

/**
 * Default help format options
 */
const DEFAULT_FORMAT_OPTIONS: HelpFormatOptions = {
  includeExamples: true,
  includeAliases: true,
  includeDescription: true,
  includeOptions: true,
  includeSubcommands: true,
  color: true,
  maxWidth: 80
};

/**
 * Help Generator class
 * 
 * Generates help text and documentation for commands
 */
export class HelpGenerator {
  private registry: CommandRegistry;
  
  /**
   * Constructor
   */
  constructor() {
    this.registry = CommandRegistry.getInstance();
  }
  
  /**
   * Generate help for a specific command or general help
   */
  async generateHelp(commandId?: string, options: HelpFormatOptions = {}): Promise<string> {
    // Merge with default options
    const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
    
    if (!commandId) {
      return this.generateGeneralHelp(opts);
    }
    
    const command = await this.registry.getCommand(commandId);
    if (!command) {
      return `Command not found: ${commandId}\n\nRun 'swissknife help' to see available commands.`;
    }
    
    return this.generateCommandHelp(command, opts);
  }
  
  /**
   * Generate general help
   */
  private async generateGeneralHelp(_options: HelpFormatOptions): Promise<string> {
    let helpText = '\nSwissKnife CLI\n\n';
    
    // Add usage section
    helpText += 'USAGE:\n';
    helpText += '  swissknife [command] [subcommand] [options]\n\n';
    
    // Group commands by category
    const categories = await this.registry.getCategories();
    const commands = await this.registry.getAllCommands();
    
    // Add commands with categories
    for (const category of categories) {
      const categoryCommands = await this.registry.getCommandsByCategory(category);
      if (categoryCommands.length === 0) continue;
      
      helpText += `${category.toUpperCase()}:\n`;
      
      // Add each command in the category
      for (const command of categoryCommands) {
        helpText += `  ${command.name.padEnd(15)} ${command.description}\n`;
      }
      
      helpText += '\n';
    }
    
    // Add commands without categories
    const uncategorizedCommands = commands.filter((cmd: Command) => !cmd.category);
    if (uncategorizedCommands.length > 0) {
      helpText += 'COMMANDS:\n';
      
      for (const command of uncategorizedCommands) {
        helpText += `  ${command.name.padEnd(15)} ${command.description}\n`;
      }
      
      helpText += '\n';
    }
    
    // Add more info section
    helpText += 'For more information about a specific command, run:\n';
    helpText += '  swissknife help [command]\n\n';
    
    return helpText;
  }
  
  /**
   * Generate help for a specific command
   */
  private generateCommandHelp(command: Command, options: HelpFormatOptions): string {
    let helpText = `\n${command.name} - ${command.description}\n\n`;
    
    // Add usage section
    helpText += 'USAGE:\n';
    helpText += `  swissknife ${command.name}`;
    
    // Add options summary in usage
    if (command.options && command.options.length > 0 && options.includeOptions) {
      helpText += ' [OPTIONS]';
    }
    
    helpText += '\n\n';
    
    // Add aliases section
    if (command.aliases && command.aliases.length > 0 && options.includeAliases) {
      helpText += 'ALIASES:\n';
      helpText += `  ${command.aliases.join(', ')}\n\n`;
    }
    
    // Add options section
    if (command.options && command.options.length > 0 && options.includeOptions) {
      helpText += 'OPTIONS:\n';
      
      for (const option of command.options) {
        let optionText = `  --${option.name}`;
        
        if (option.alias) {
          optionText += `, -${option.alias}`;
        }
        
        if (option.type !== 'boolean') {
          optionText += ` <${option.type}>`;
        }
        
        if (option.required) {
          optionText += ' (required)';
        } else if (option.default !== undefined) {
          optionText += ` (default: ${option.default})`;
        }
        
        // Wrap the description text if maxWidth is specified
        if (options.maxWidth && optionText.length + option.description.length + 4 > options.maxWidth) {
          helpText += `${optionText}\n    ${option.description}\n\n`;
        } else {
          const padding = Math.max(2, 30 - optionText.length);
          helpText += `${optionText}${' '.repeat(padding)}${option.description}\n`;
        }
      }
      
      helpText += '\n';
    }
    
    // Add examples section
    if (command.examples && command.examples.length > 0 && options.includeExamples) {
      helpText += 'EXAMPLES:\n';
      for (const example of command.examples) {
        helpText += `  ${example}\n`;
      }
      helpText += '\n';
    }
    
    // Add subcommands section
    if (command.subcommands && command.subcommands.length > 0 && options.includeSubcommands) {
      helpText += 'SUBCOMMANDS:\n';
      for (const subcommand of command.subcommands) {
        helpText += `  ${subcommand.name.padEnd(15)} ${subcommand.description}\n`;
      }
      
      helpText += '\n';
    }
    
    return helpText;
  }
  
  /**
   * Generate markdown documentation for all commands
   */
  async generateMarkdownDocs(): Promise<string> {
    let markdownDoc = '# SwissKnife CLI Documentation\n\n';
    
    // Add overview section
    markdownDoc += '## Overview\n\n';
    markdownDoc += 'The SwissKnife CLI provides a unified interface for all SwissKnife functionality.\n\n';
    
    // Add usage section
    markdownDoc += '## Usage\n\n';
    markdownDoc += '```\n';
    markdownDoc += 'swissknife [command] [subcommand] [options]\n';
    markdownDoc += '```\n\n';
    
    // Group commands by category
    const categories = await this.registry.getCategories();
    const commands = await this.registry.getAllCommands();
    
    // Add commands with categories
    for (const category of categories) {
      const categoryCommands = await this.registry.getCommandsByCategory(category);
      if (categoryCommands.length === 0) continue;
      
      markdownDoc += `## ${category}\n\n`;
      
      // Add each command in the category
      for (const command of categoryCommands) {
        markdownDoc += this.generateCommandMarkdown(command);
        markdownDoc += '\n---\n\n';
      }
    }
    
    // Add commands without categories
    const uncategorizedCommands = commands.filter((cmd: Command) => !cmd.category);
    if (uncategorizedCommands.length > 0) {
      markdownDoc += '## General Commands\n\n';
      
      for (const command of uncategorizedCommands) {
        markdownDoc += this.generateCommandMarkdown(command);
        markdownDoc += '\n---\n\n';
      }
    }
    
    return markdownDoc;
  }
  
  /**
   * Generate markdown documentation for a specific command
   */
  private generateCommandMarkdown(command: Command): string {
    let markdown = `### ${command.name}\n\n`;
    
    // Add description
    markdown += `${command.description}\n\n`;
    
    // Add usage section
    markdown += '#### Usage\n\n';
    markdown += '```\n';
    markdown += `swissknife ${command.name}`;
    
    // Add options summary in usage
    if (command.options && command.options.length > 0) {
      markdown += ' [OPTIONS]';
    }
    
    markdown += '\n```\n\n';
    
    // Add aliases section
    if (command.aliases && command.aliases.length > 0) {
      markdown += '#### Aliases\n\n';
      markdown += `\`${command.aliases.join('`, `')}\`\n\n`;
    }
    
    // Add options section
    if (command.options && command.options.length > 0) {
      markdown += '#### Options\n\n';
      markdown += '| Option | Type | Description | Default |\n';
      markdown += '|--------|------|-------------|--------|\n';
      
      for (const option of command.options) {
        let optionText = `--${option.name}`;
        
        if (option.alias) {
          optionText += `, -${option.alias}`;
        }
        
        const defaultValue = option.default !== undefined ? 
          `\`${option.default}\`` : 
          (option.required ? 'Required' : '-');
        
        markdown += `| \`${optionText}\` | ${option.type} | ${option.description} | ${defaultValue} |\n`;
      }
      
      markdown += '\n';
    }
    
    // Add examples section
    if (command.examples && command.examples.length > 0) {
      markdown += '#### Examples\n\n';
      
      for (const example of command.examples) {
        markdown += '```\n';
        markdown += `${example}\n`;
        markdown += '```\n\n';
      }
    }
    
    // Add subcommands section
    if (command.subcommands && command.subcommands.length > 0) {
      markdown += '#### Subcommands\n\n';
      
      for (const subcommand of command.subcommands) {
        markdown += `- \`${subcommand.name}\`: ${subcommand.description}\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }
  
  /**
   * Generate a help command implementation
   */
  createHelpCommand(): Command {
    return {
      id: 'help',
      name: 'help',
      description: 'Display help information for SwissKnife commands',
      options: [
        {
          name: 'markdown',
          alias: 'm',
          type: 'boolean',
          description: 'Generate help in Markdown format',
          default: false
        }
      ],
      examples: [
        'swissknife help',
        'swissknife help config',
        'swissknife help --markdown > docs.md'
      ],
      handler: async (args, context) => {
        // If a command is specified, show help for that command
        if (args._.length > 0) {
          const commandId = args._[0];
          const command = await this.registry.getCommand(commandId); // Await getCommand
          if (!command) {
            console.log(`Command not found: ${commandId}\n\nRun 'swissknife help' to see available commands.`);
            return 1; // Indicate error
          }
          const helpText = this.generateCommandHelp(command, {
            color: context.interactive,
            includeExamples: true,
            includeOptions: true,
            includeSubcommands: true
          });
          
          console.log(helpText);
          return 0;
        }
        
        // If --markdown flag is set, generate markdown docs
        if (args.markdown) {
          const markdown = await this.generateMarkdownDocs();
          console.log(markdown);
          return 0;
        }
        
        // Otherwise show general help
        const helpText = await this.generateGeneralHelp({
          color: context.interactive
        });
        
        console.log(helpText);
        return 0;
      }
    };
  }
}
