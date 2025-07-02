// src/commands/parser.ts

import minimist from 'minimist';
import { Command, CommandOption, CommandRegistry } from './registry';

/**
 * Result of parsing a command line
 */
export interface ParsedCommand {
  command: Command;
  args: Record<string, any>;
  subcommands: string[];
}

/**
 * Parse command-line arguments to determine command and options
 * 
 * @param argv Process arguments array (process.argv)
 * @returns Parsed command information or null if no valid command
 */
export async function parseCommandLine(argv: string[]): Promise<ParsedCommand | null> {
  // Use the singleton instance of CommandRegistry
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
    const candidate = await registry.getCommand(candidateId);
    
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
      ?.filter((opt: CommandOption) => opt.type === 'string')
      .map((opt: CommandOption) => opt.name) || [],
    boolean: currentCommand.options
      ?.filter((opt: CommandOption) => opt.type === 'boolean')
      .map((opt: CommandOption) => opt.name) || [],
    default: Object.fromEntries(
      (currentCommand.options || [])
        .filter((opt: CommandOption) => opt.default !== undefined)
        .map((opt: CommandOption) => [opt.name, opt.default])
    ),
    alias: Object.fromEntries(
      (currentCommand.options || [])
        .filter((opt: CommandOption) => opt.alias)
        .map((opt: CommandOption) => [opt.name, opt.alias as string])
    )
  });
  
  return {
    command: currentCommand,
    args: parsedArgs,
    subcommands: commandPath.slice(1) // First element is the main command
  };
}
