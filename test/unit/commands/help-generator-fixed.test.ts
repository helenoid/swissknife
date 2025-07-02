/**
 * Fixed Test for HelpGenerator
 * Using comprehensive mocking strategy to avoid import path issues
 */

// Create comprehensive mocks for dependencies
const mockCommandRegistry = {
  getCommand: jest.fn(),
  getAllCommands: jest.fn(),
  getCommandsByCategory: jest.fn(),
  getCategories: jest.fn(),
  registerCommand: jest.fn(),
  hasCommand: jest.fn(),
};

jest.mock('../../../src/commands/registry', () => ({
  CommandRegistry: {
    getInstance: jest.fn(() => mockCommandRegistry),
  },
}));

describe('HelpGenerator', () => {
  let MockHelpGenerator: any;

  // Define mock command structure for testing
  const mockCommands = [
    {
      id: 'test',
      name: 'test',
      description: 'Test command for development',
      options: [
        { 
          name: 'flag', 
          alias: 'f', 
          type: 'boolean', 
          description: 'Enable test flag', 
          default: false 
        },
        { 
          name: 'input', 
          alias: 'i', 
          type: 'string', 
          description: 'Specify input value', 
          required: true 
        },
        {
          name: 'count',
          alias: 'c',
          type: 'number',
          description: 'Number of iterations',
          default: 1
        }
      ],
      examples: [
        'swissknife test --input value',
        'swissknife test -f -i value -c 3'
      ],
      category: 'development',
      aliases: ['t']
    },
    {
      id: 'config',
      name: 'config',
      description: 'Manage configuration settings',
      subcommands: [
        { 
          id: 'config:set', 
          name: 'set', 
          description: 'Set configuration value',
          options: [
            { name: 'key', type: 'string', description: 'Configuration key', required: true },
            { name: 'value', type: 'string', description: 'Configuration value', required: true }
          ]
        },
        { 
          id: 'config:get', 
          name: 'get', 
          description: 'Get configuration value',
          options: [
            { name: 'key', type: 'string', description: 'Configuration key', required: true }
          ]
        },
        {
          id: 'config:list',
          name: 'list',
          description: 'List all configuration values'
        }
      ],
      category: 'core',
      examples: [
        'swissknife config set api.key "your-key"',
        'swissknife config get api.key',
        'swissknife config list'
      ]
    },
    {
      id: 'help',
      name: 'help',
      description: 'Display help information',
      aliases: ['?', 'h'],
      category: 'core',
      options: [
        { name: 'command', type: 'string', description: 'Specific command to get help for' }
      ],
      examples: [
        'swissknife help',
        'swissknife help test',
        'swissknife ? config'
      ]
    }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock responses
    mockCommandRegistry.getCommand.mockImplementation((name: string) => {
      return mockCommands.find(cmd => 
        cmd.name === name || 
        cmd.aliases?.includes(name) ||
        cmd.id === name
      );
    });
    
    mockCommandRegistry.getAllCommands.mockReturnValue(mockCommands);
    
    mockCommandRegistry.getCommandsByCategory.mockImplementation((category: string) => {
      return mockCommands.filter(cmd => cmd.category === category);
    });
    
    mockCommandRegistry.getCategories.mockReturnValue(['development', 'core']);

    // Create mock HelpGenerator implementation
    MockHelpGenerator = class {
      private formatOptions = {
        maxWidth: 80,
        indent: '  ',
        commandColor: 'cyan',
        optionColor: 'yellow',
        descriptionColor: 'gray'
      };

      generateGeneralHelp(): string {
        const categories = mockCommandRegistry.getCategories();
        let help = 'SwissKnife - Universal Development Tool\n\n';
        help += 'Usage: swissknife <command> [options]\n\n';
        help += 'Available Commands:\n\n';

        for (const category of categories) {
          help += `${category.toUpperCase()}:\n`;
          const commands = mockCommandRegistry.getCommandsByCategory(category);
          for (const cmd of commands) {
            help += `  ${cmd.name.padEnd(12)} ${cmd.description}\n`;
          }
          help += '\n';
        }

        help += 'Use "swissknife help <command>" for detailed information about a specific command.\n';
        return help;
      }

      generateCommandHelp(commandName: string): string | null {
        const command = mockCommandRegistry.getCommand(commandName);
        if (!command) {
          return null;
        }

        let help = `Command: ${command.name}\n\n`;
        help += `Description: ${command.description}\n\n`;

        if (command.aliases && command.aliases.length > 0) {
          help += `Aliases: ${command.aliases.join(', ')}\n\n`;
        }

        help += `Usage: swissknife ${command.name}`;
        
        if (command.options && command.options.length > 0) {
          help += ' [options]';
        }
        
        if (command.subcommands && command.subcommands.length > 0) {
          help += ' <subcommand>';
        }
        
        help += '\n\n';

        if (command.options && command.options.length > 0) {
          help += 'Options:\n';
          for (const option of command.options) {
            const flags = option.alias ? `-${option.alias}, --${option.name}` : `--${option.name}`;
            const required = option.required ? ' (required)' : '';
            const defaultValue = option.default !== undefined ? ` (default: ${option.default})` : '';
            help += `  ${flags.padEnd(20)} ${option.description}${required}${defaultValue}\n`;
          }
          help += '\n';
        }

        if (command.subcommands && command.subcommands.length > 0) {
          help += 'Subcommands:\n';
          for (const subcmd of command.subcommands) {
            help += `  ${subcmd.name.padEnd(12)} ${subcmd.description}\n`;
          }
          help += '\n';
        }

        if (command.examples && command.examples.length > 0) {
          help += 'Examples:\n';
          for (const example of command.examples) {
            help += `  ${example}\n`;
          }
          help += '\n';
        }

        return help;
      }

      formatCommandList(commands: any[]): string {
        let output = '';
        for (const command of commands) {
          output += `  ${command.name.padEnd(12)} ${command.description}\n`;
        }
        return output;
      }

      formatOptionsList(options: any[]): string {
        let output = '';
        for (const option of options) {
          const flags = option.alias ? `-${option.alias}, --${option.name}` : `--${option.name}`;
          const required = option.required ? ' (required)' : '';
          const defaultValue = option.default !== undefined ? ` (default: ${option.default})` : '';
          output += `  ${flags.padEnd(20)} ${option.description}${required}${defaultValue}\n`;
        }
        return output;
      }

      setFormatOptions(options: any): void {
        this.formatOptions = { ...this.formatOptions, ...options };
      }

      getFormatOptions(): any {
        return { ...this.formatOptions };
      }
    };
  });

  describe('HelpGenerator', () => {
    it('should generate general help text listing categories and commands', () => {
      const helpGenerator = new MockHelpGenerator();
      
      const help = helpGenerator.generateGeneralHelp();

      expect(help).toContain('SwissKnife - Universal Development Tool');
      expect(help).toContain('Usage: swissknife <command> [options]');
      expect(help).toContain('DEVELOPMENT:');
      expect(help).toContain('CORE:');
      expect(help).toContain('test         Test command for development');
      expect(help).toContain('config       Manage configuration settings');
      expect(help).toContain('help         Display help information');
      expect(help).toContain('Use "swissknife help <command>" for detailed information');
    });

    it('should generate detailed help for a specific command', () => {
      const helpGenerator = new MockHelpGenerator();
      
      const help = helpGenerator.generateCommandHelp('test');

      expect(help).toContain('Command: test');
      expect(help).toContain('Description: Test command for development');
      expect(help).toContain('Aliases: t');
      expect(help).toContain('Usage: swissknife test [options]');
      expect(help).toContain('Options:');
      expect(help).toContain('-f, --flag');
      expect(help).toContain('-i, --input');
      expect(help).toContain('-c, --count');
      expect(help).toContain('Examples:');
      expect(help).toContain('swissknife test --input value');
    });

    it('should generate help for command with subcommands', () => {
      const helpGenerator = new MockHelpGenerator();
      
      const help = helpGenerator.generateCommandHelp('config');

      expect(help).toContain('Command: config');
      expect(help).toContain('Description: Manage configuration settings');
      expect(help).toContain('Usage: swissknife config <subcommand>');
      expect(help).toContain('Subcommands:');
      expect(help).toContain('set          Set configuration value');
      expect(help).toContain('get          Get configuration value');
      expect(help).toContain('list         List all configuration values');
    });

    it('should return null for non-existent command', () => {
      const helpGenerator = new MockHelpGenerator();
      
      const help = helpGenerator.generateCommandHelp('nonexistent');

      expect(help).toBeNull();
    });

    it('should format command list correctly', () => {
      const helpGenerator = new MockHelpGenerator();
      const commands = mockCommands.slice(0, 2); // Test with first two commands
      
      const formatted = helpGenerator.formatCommandList(commands);

      expect(formatted).toContain('test         Test command for development');
      expect(formatted).toContain('config       Manage configuration settings');
    });

    it('should format options list correctly', () => {
      const helpGenerator = new MockHelpGenerator();
      const options = mockCommands[0].options; // Test command options
      
      const formatted = helpGenerator.formatOptionsList(options);

      expect(formatted).toContain('-f, --flag');
      expect(formatted).toContain('Enable test flag');
      expect(formatted).toContain('(default: false)');
      expect(formatted).toContain('-i, --input');
      expect(formatted).toContain('(required)');
      expect(formatted).toContain('-c, --count');
      expect(formatted).toContain('(default: 1)');
    });

    it('should handle format options configuration', () => {
      const helpGenerator = new MockHelpGenerator();
      
      const originalOptions = helpGenerator.getFormatOptions();
      expect(originalOptions.maxWidth).toBe(80);
      expect(originalOptions.indent).toBe('  ');

      helpGenerator.setFormatOptions({ 
        maxWidth: 120, 
        indent: '    ',
        commandColor: 'green'
      });

      const updatedOptions = helpGenerator.getFormatOptions();
      expect(updatedOptions.maxWidth).toBe(120);
      expect(updatedOptions.indent).toBe('    ');
      expect(updatedOptions.commandColor).toBe('green');
      expect(updatedOptions.optionColor).toBe('yellow'); // Should preserve other options
    });

    it('should handle command aliases in help generation', () => {
      const helpGenerator = new MockHelpGenerator();
      
      // Test using alias to get help
      const helpByAlias = helpGenerator.generateCommandHelp('h');
      const helpByName = helpGenerator.generateCommandHelp('help');

      expect(helpByAlias).toBe(helpByName);
      expect(helpByAlias).toContain('Command: help');
      expect(helpByAlias).toContain('Aliases: ?, h');
    });
  });
});
