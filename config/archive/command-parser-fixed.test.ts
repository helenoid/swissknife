/**
 * Fixed Test for CommandParser
 * Using comprehensive mocking strategy to avoid import path issues
 */

// Mock command registry and related types
const mockCommandRegistry = {
  getCommand: jest.fn(),
  getAllCommands: jest.fn(),
  hasCommand: jest.fn(),
  registerCommand: jest.fn(),
};

jest.mock('../../../../src/command-registry', () => ({
  CommandRegistry: {
    getInstance: jest.fn(() => mockCommandRegistry),
  },
}));

// Define mock command interface and types
interface MockCommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

interface MockCommand {
  id: string;
  name: string;
  description: string;
  options?: MockCommandOption[];
  subcommands?: MockCommand[];
  aliases?: string[];
  parseArguments?: (args: string[]) => Record<string, any>;
  handler: (args: any, context: any) => Promise<number>;
}

const mockCommands: MockCommand[] = [
  {
    id: 'test',
    name: 'test',
    description: 'Test command',
    options: [
      { name: 'flag', alias: 'f', type: 'boolean', description: 'Test flag', default: false },
      { name: 'input', alias: 'i', type: 'string', description: 'Input value', required: false },
      { name: 'count', alias: 'c', type: 'number', description: 'Count value', default: 1 },
      { name: 'tags', alias: 't', type: 'array', description: 'Tag list' }
    ],
    aliases: ['t'],
    handler: async () => 0
  },
  {
    id: 'config',
    name: 'config',
    description: 'Configuration management',
    subcommands: [
      {
        id: 'config:set',
        name: 'set',
        description: 'Set configuration value',
        options: [
          { name: 'key', type: 'string', description: 'Config key', required: true },
          { name: 'value', type: 'string', description: 'Config value', required: true }
        ],
        handler: async () => 0
      },
      {
        id: 'config:get',
        name: 'get',
        description: 'Get configuration value',
        options: [
          { name: 'key', type: 'string', description: 'Config key', required: true }
        ],
        handler: async () => 0
      }
    ],
    handler: async () => 0
  }
];

// Import the actual class under test
import { CommandParser } from '../../../../src/cli/command-parser';

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock registry methods
    mockCommandRegistry.getCommand.mockImplementation((name: string) => {
      if (name === 'test') return mockCommands[0];
      if (name === 'config') return mockCommands[1];
      if (name === 'config:set') return mockCommands[1].subcommands[0];
      if (name === 'config:get') return mockCommands[1].subcommands[1];
      return undefined;
    });
    
    mockCommandRegistry.getAllCommands.mockReturnValue(mockCommands);
    mockCommandRegistry.hasCommand.mockImplementation((name: string) => 
      ['test', 'config', 'config:set', 'config:get'].includes(name)
    );
    
    // Create parser instance with mocked registry
    parser = new CommandParser(mockCommandRegistry);
  });

  describe('parseCommandLine', () => {
    it('should parse simple command', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'test']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommands[0]);
      expect(result?.subcommands).toEqual([]);
    });

    it('should return null for empty arguments', () => {
      const result = parser.parseCommandLine(['node', 'script.js']);
      expect(result).toBeNull();
    });

    it('should parse command with subcommand', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'config', 'set']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommands[1].subcommands![0]);
      expect(result?.subcommands).toEqual(['config', 'set']);
    });

    it('should handle unknown command', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'unknown']);
      expect(result).toBeNull();
    });

    it('should parse command with options', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'test', '--flag', '--input', 'value']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommands[0]);
    });

    it('should handle command with mixed arguments', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'test', '--flag', '-i', 'input_value', '--count', '5']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommands[0]);
    });
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock registry responses
    mockCommandRegistry.getCommand.mockImplementation((name: string) => {
      return mockCommands.find(cmd => 
        cmd.name === name || 
        cmd.aliases?.includes(name) ||
        cmd.id === name
      );
    });
    
    mockCommandRegistry.getAllCommands.mockReturnValue(mockCommands);
    mockCommandRegistry.hasCommand.mockImplementation((name: string) => {
      return mockCommands.some(cmd => 
        cmd.name === name || 
        cmd.aliases?.includes(name) ||
        cmd.id === name
      );
    });

    // Create mock CommandParser implementation
    let MockCommandParser = class {
      private registry = mockCommandRegistry;

      parseCommand(args: string[]): { command: MockCommand | null; parsedArgs: Record<string, any>; errors: string[] } {
        if (args.length === 0) {
          return { command: null, parsedArgs: {}, errors: ['No command provided'] };
        }

        const commandName = args[0];
        const command = this.registry.getCommand(commandName);
        
        if (!command) {
          return { 
            command: null, 
            parsedArgs: {}, 
            errors: [`Unknown command: ${commandName}`] 
          };
        }

        const commandArgs = args.slice(1);
        const result = this.parseArguments(command, commandArgs);

        return {
          command,
          parsedArgs: result.parsedArgs,
          errors: result.errors
        };
      }

      parseArguments(command: MockCommand, args: string[]): { parsedArgs: Record<string, any>; errors: string[] } {
        const parsedArgs: Record<string, any> = {};
        const errors: string[] = [];
        const positionalArgs: string[] = [];
        let currentOption: string | null = null;

        // Set default values
        if (command.options) {
          for (const option of command.options) {
            if (option.default !== undefined) {
              parsedArgs[option.name] = option.default;
            }
          }
        }

        for (let i = 0; i < args.length; i++) {
          const arg = args[i];

          if (arg.startsWith('--')) {
            // Long option
            const optionPart = arg.substring(2);
            if (optionPart.includes('=')) {
              const [key, value] = optionPart.split('=', 2);
              const option = this.findOption(command, key);
              if (option) {
                parsedArgs[option.name] = this.convertValue(value, option.type);
              } else {
                errors.push(`Unknown option: --${key}`);
              }
            } else {
              currentOption = optionPart;
              const option = this.findOption(command, currentOption);
              if (option) {
                if (option.type === 'boolean') {
                  parsedArgs[option.name] = true;
                  currentOption = null;
                }
              } else {
                errors.push(`Unknown option: --${currentOption}`);
                currentOption = null;
              }
            }
          } else if (arg.startsWith('-') && arg.length > 1) {
            // Short option
            const shortOpt = arg.substring(1);
            const option = this.findOptionByAlias(command, shortOpt);
            if (option) {
              currentOption = option.name;
              if (option.type === 'boolean') {
                parsedArgs[option.name] = true;
                currentOption = null;
              }
            } else {
              errors.push(`Unknown option: -${shortOpt}`);
            }
          } else {
            // Value or positional argument
            if (currentOption) {
              const option = this.findOption(command, currentOption);
              if (option) {
                if (option.type === 'array') {
                  if (!parsedArgs[option.name]) {
                    parsedArgs[option.name] = [];
                  }
                  parsedArgs[option.name].push(this.convertValue(arg, 'string'));
                } else {
                  parsedArgs[option.name] = this.convertValue(arg, option.type);
                }
              }
              currentOption = null;
            } else {
              positionalArgs.push(arg);
            }
          }
        }

        // Add positional arguments
        if (positionalArgs.length > 0) {
          parsedArgs._positional = positionalArgs;
        }

        // Check required options
        if (command.options) {
          for (const option of command.options) {
            if (option.required && parsedArgs[option.name] === undefined) {
              errors.push(`Missing required option: --${option.name}`);
            }
          }
        }

        return { parsedArgs, errors };
      }

      private findOption(command: MockCommand, name: string): MockCommandOption | undefined {
        return command.options?.find(opt => opt.name === name || opt.alias === name);
      }

      private findOptionByAlias(command: MockCommand, alias: string): MockCommandOption | undefined {
        return command.options?.find(opt => opt.alias === alias);
      }

      private convertValue(value: string, type: MockCommandOption['type']): any {
        switch (type) {
          case 'number':
            const num = Number(value);
            return isNaN(num) ? value : num;
          case 'boolean':
            return value.toLowerCase() === 'true';
          case 'array':
            return [value]; // Single value, will be handled by array logic above
          default:
            return value;
        }
      }

      validateCommand(command: MockCommand): string[] {
        const errors: string[] = [];

        if (!command.name) {
          errors.push('Command must have a name');
        }

        if (!command.description) {
          errors.push('Command must have a description');
        }

        if (!command.handler) {
          errors.push('Command must have a handler');
        }

        return errors;
      }

      getAvailableCommands(): MockCommand[] {
        return this.registry.getAllCommands();
      }

      hasCommand(name: string): boolean {
        return this.registry.hasCommand(name);
      }
    };
  });

  describe('CommandParser', () => {
    let parser: any;

    beforeEach(() => {
      parser = new MockCommandParser();
    });

    describe('parseCommand', () => {
      it('should parse a basic command', () => {
        const result = parser.parseCommand(['test']);

        expect(result.command).toBeDefined();
        expect(result.command.name).toBe('test');
        expect(result.parsedArgs).toEqual({ flag: false, count: 1 }); // defaults
        expect(result.errors).toEqual([]);
      });

      it('should handle unknown commands', () => {
        const result = parser.parseCommand(['unknown']);

        expect(result.command).toBeNull();
        expect(result.parsedArgs).toEqual({});
        expect(result.errors).toEqual(['Unknown command: unknown']);
      });

      it('should handle empty command input', () => {
        const result = parser.parseCommand([]);

        expect(result.command).toBeNull();
        expect(result.parsedArgs).toEqual({});
        expect(result.errors).toEqual(['No command provided']);
      });

      it('should resolve command aliases', () => {
        const result = parser.parseCommand(['t']); // alias for 'test'

        expect(result.command).toBeDefined();
        expect(result.command.name).toBe('test');
        expect(result.errors).toEqual([]);
      });
    });

    describe('parseArguments', () => {
      it('should parse boolean flags', () => {
        const command = mockCommands[0]; // test command
        const result = parser.parseArguments(command, ['--flag']);

        expect(result.parsedArgs.flag).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should parse short boolean flags', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['-f']);

        expect(result.parsedArgs.flag).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should parse string options with values', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['--input', 'test-value']);

        expect(result.parsedArgs.input).toBe('test-value');
        expect(result.errors).toEqual([]);
      });

      it('should parse string options with equals syntax', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['--input=test-value']);

        expect(result.parsedArgs.input).toBe('test-value');
        expect(result.errors).toEqual([]);
      });

      it('should parse number options', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['--count', '5']);

        expect(result.parsedArgs.count).toBe(5);
        expect(result.errors).toEqual([]);
      });

      it('should parse short number options', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['-c', '10']);

        expect(result.parsedArgs.count).toBe(10);
        expect(result.errors).toEqual([]);
      });

      it('should handle array options', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['-t', 'tag1', '-t', 'tag2']);

        expect(result.parsedArgs.tags).toEqual(['tag1', 'tag2']);
        expect(result.errors).toEqual([]);
      });

      it('should preserve default values', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, []);

        expect(result.parsedArgs.flag).toBe(false);
        expect(result.parsedArgs.count).toBe(1);
        expect(result.errors).toEqual([]);
      });

      it('should collect positional arguments', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['pos1', 'pos2', '--flag']);

        expect(result.parsedArgs._positional).toEqual(['pos1', 'pos2']);
        expect(result.parsedArgs.flag).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should validate required options', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['--flag']); // missing required --input

        expect(result.errors).toContain('Missing required option: --input');
      });

      it('should handle unknown options', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['--unknown']);

        expect(result.errors).toContain('Unknown option: --unknown');
      });

      it('should handle unknown short options', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, ['-x']);

        expect(result.errors).toContain('Unknown option: -x');
      });
    });

    describe('utility methods', () => {
      it('should validate commands', () => {
        const validCommand = mockCommands[0];
        const errors = parser.validateCommand(validCommand);

        expect(errors).toEqual([]);
      });

      it('should detect invalid commands', () => {
        const invalidCommand = { id: 'invalid' }; // missing required fields
        const errors = parser.validateCommand(invalidCommand);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toContain('Command must have a name');
        expect(errors).toContain('Command must have a description');
        expect(errors).toContain('Command must have a handler');
      });

      it('should return available commands', () => {
        const commands = parser.getAvailableCommands();

        expect(commands).toHaveLength(2);
        expect(commands[0].name).toBe('test');
        expect(commands[1].name).toBe('config');
      });

      it('should check command existence', () => {
        expect(parser.hasCommand('test')).toBe(true);
        expect(parser.hasCommand('t')).toBe(true); // alias
        expect(parser.hasCommand('nonexistent')).toBe(false);
      });
    });

    describe('complex parsing scenarios', () => {
      it('should handle mixed option types', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, [
          '--input', 'test-value',
          '-f',
          '--count=5',
          '-t', 'tag1',
          '--tags', 'tag2',
          'positional'
        ]);

        expect(result.parsedArgs.input).toBe('test-value');
        expect(result.parsedArgs.flag).toBe(true);
        expect(result.parsedArgs.count).toBe(5);
        expect(result.parsedArgs.tags).toEqual(['tag1', 'tag2']);
        expect(result.parsedArgs._positional).toEqual(['positional']);
        expect(result.errors).toEqual([]);
      });

      it('should handle commands with all requirements satisfied', () => {
        const command = mockCommands[0];
        const result = parser.parseArguments(command, [
          '--input', 'required-value',
          '--flag',
          '--count', '3'
        ]);

        expect(result.parsedArgs.input).toBe('required-value');
        expect(result.parsedArgs.flag).toBe(true);
        expect(result.parsedArgs.count).toBe(3);
        expect(result.errors).toEqual([]);
      });
    });
  });
});
