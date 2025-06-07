export {};
import { CommandParser } from '@/cli/command-parser';
import { CommandRegistry, Command, CommandOption, CommandExecutionContext } from '@/command-registry';

describe('Command Parser', () => {
  let registry: CommandRegistry;
  let commandParser: CommandParser;

  // Helper to create a mock command that implements the Command interface
  const createMockCommand = (
    id: string,
    name: string,
    description: string,
    options: CommandOption[] = [],
    subcommands: Command[] = [],
    handler: (parsedArgs: Record<string, any>, context: CommandExecutionContext) => Promise<any> = async () => 0
  ): Command => ({
    id,
    name,
    description,
    options,
    subcommands,
    handler,
    parseArguments: (args: string[]): Record<string, any> => {
      const parsed: Record<string, any> = {};
      let currentOption: string | null = null;
      const positionalArgs: string[] = [];

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
          const key = arg.substring(2);
          const optionDef = options.find(opt => opt.name === key || opt.alias === key);
          if (key.includes('=')) {
            const [k, v] = key.split('=');
            parsed[k] = optionDef?.type === 'number' ? Number(v) : v;
          } else {
            currentOption = key;
            parsed[key] = true; // Assume boolean flag if no value
          }
        } else if (arg.startsWith('-')) {
          const key = options.find(opt => opt.alias === arg.substring(1))?.name || arg.substring(1);
          const optionDef = options.find(opt => opt.name === key || opt.alias === key);
          currentOption = key;
          parsed[key] = true; // Assume boolean flag if no value
        } else {
          if (currentOption) {
            const optionDef = options.find(opt => opt.name === currentOption);
            parsed[currentOption] = optionDef?.type === 'number' ? Number(arg) : arg;
            currentOption = null;
          } else {
            positionalArgs.push(arg);
          }
        }
      }

      // Apply defaults
      options.forEach(opt => {
        if (parsed[opt.name] === undefined && parsed[opt.alias || ''] === undefined && opt.default !== undefined) {
          parsed[opt.name] = opt.default;
        }
      });

      if (positionalArgs.length > 0) {
        parsed._ = positionalArgs;
      }
      return parsed;
    },
    execute: handler,
  });

  beforeEach(() => {
    registry = new CommandRegistry();
    commandParser = new CommandParser(registry);

    // Register test commands using the mock helper
    const testCommand = createMockCommand(
      'test',
      'test',
      'Test command',
      [
        { name: 'flag', alias: 'f', type: 'boolean', description: 'Test flag', default: false },
        { name: 'input', alias: 'i', type: 'string', description: 'Test input', required: true },
        { name: 'count', alias: 'c', type: 'number', description: 'Test count', default: 1 }
      ]
    );

    const subcommand = createMockCommand(
      'test:subcommand',
      'subcommand',
      'Test subcommand'
    );

    const configCommand = createMockCommand(
      'config',
      'config',
      'Configuration command'
    );

    const configSetCommand = createMockCommand(
      'config:set',
      'set',
      'Set configuration value',
      [{ name: 'global', alias: 'g', type: 'boolean', description: 'Set globally', default: false }]
    );

    registry.register(testCommand);
    registry.register(subcommand);
    registry.register(configCommand);
    registry.register(configSetCommand);
  });

  it('should parse a simple command', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test');
    expect(result?.args.input).toBe('value');
    expect(result?.args.flag).toBe(false);
  });

  it('should parse a command with flags', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '-f', '--input', 'value']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test');
    expect(result?.args.input).toBe('value');
    expect(result?.args.flag).toBe(true);
  });

  it('should parse equals format for options', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '--input=value', '--count=42']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test');
    expect(result?.args.input).toBe('value');
    expect(result?.args.count).toBe(42);
  });

  it('should parse a subcommand', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', 'subcommand']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test:subcommand');
    expect(result?.subcommands).toEqual(['subcommand']);
  });

  it('should parse nested subcommands', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'config', 'set', '--global']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('config:set');
    expect(result?.args.global).toBe(true);
    expect(result?.subcommands).toEqual(['set']);
  });

  it('should return null for unknown command', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'unknown']);

    expect(result).toBeNull();
  });

  it('should handle positional arguments', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '--input', 'value', 'pos1', 'pos2']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test');
    expect(result?.args._).toEqual(['pos1', 'pos2']);
  });

  it('should apply default values for missing options', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);

    expect(result).not.toBeNull();
    expect(result?.args.count).toBe(1);
    expect(result?.args.flag).toBe(false);
  });

  it('should parse numeric values correctly', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '--input', 'value', '--count', '42']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test');
    expect(result?.args.input).toBe('value');
    expect(result?.args.count).toBe(42);
  });

  it('should parse boolean values correctly', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '--input', 'value', '--flag', 'true']);

    expect(result).not.toBeNull();
    expect(result?.command.id).toBe('test');
    expect(result?.args.input).toBe('value');
    expect(result?.args.flag).toBe(true);
  });

  it('should handle options with short aliases', () => {
    const result = commandParser.parseCommandLine(['node', 'script.js', 'test', '-i', 'value', '-c', '5']);

    expect(result).not.toBeNull();
    expect(result?.args.input).toBe('value');
    expect(result?.args.count).toBe(5);
  });
});

export {};
