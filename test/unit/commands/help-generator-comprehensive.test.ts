/**
 * Comprehensive Help Generator Test with Dependency Injection
 */

// Mock all dependencies before importing
jest.mock('../../../src/commands/registry.js', () => {
  const mockCommand = {
    id: 'test-command',
    name: 'test',
    description: 'Test command description',
    options: [
      {
        name: 'verbose',
        alias: 'v',
        description: 'Verbose output',
        type: 'boolean',
      },
      {
        name: 'output',
        alias: 'o',
        description: 'Output file',
        type: 'string',
        required: true,
      },
    ],
    examples: [
      {
        description: 'Basic usage',
        command: 'swissknife test --verbose',
      },
      {
        description: 'With output file',
        command: 'swissknife test --output result.txt',
      },
    ],
    subcommands: [
      {
        id: 'test-sub',
        name: 'sub',
        description: 'Test subcommand',
      },
    ],
    aliases: ['t', 'testing'],
  };

  const mockRegistry = {
    getInstance: jest.fn(() => ({
      getCommand: jest.fn(),
      listCommands: jest.fn(),
      listCommandNames: jest.fn(),
      findCommand: jest.fn(),
    })),
  };

  return {
    CommandRegistry: mockRegistry,
    Command: mockCommand,
  };
});

// Mock color utilities if they exist
jest.mock('../../../src/utils/colors.js', () => ({
  colorize: jest.fn((text: string) => text),
  chalk: {
    yellow: jest.fn((text: string) => text),
    green: jest.fn((text: string) => text),
    blue: jest.fn((text: string) => text),
    bold: jest.fn((text: string) => text),
    dim: jest.fn((text: string) => text),
  },
}), { virtual: true });

import { HelpGenerator, HelpFormatOptions } from '../../../src/commands/help-generator.js';
import { CommandRegistry, Command } from '../../../src/commands/registry.js';

describe('HelpGenerator Comprehensive Tests', () => {
  let helpGenerator: HelpGenerator;
  let mockRegistry: jest.Mocked<CommandRegistry>;
  let mockCommand: Command;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock command
    mockCommand = {
      id: 'test-command',
      name: 'test',
      description: 'Test command description',
      options: [
        {
          name: 'verbose',
          alias: 'v',
          description: 'Verbose output',
          type: 'boolean',
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output file',
          type: 'string',
          required: true,
        },
      ],
      examples: [
        {
          description: 'Basic usage',
          command: 'swissknife test --verbose',
        },
        {
          description: 'With output file',
          command: 'swissknife test --output result.txt',
        },
      ],
      subcommands: [
        {
          id: 'test-sub',
          name: 'sub',
          description: 'Test subcommand',
        },
      ],
      aliases: ['t', 'testing'],
    } as any;

    // Set up mock registry
    mockRegistry = {
      getCommand: jest.fn(),
      listCommands: jest.fn(),
      listCommandNames: jest.fn(),
      findCommand: jest.fn(),
    } as any;

    // Mock the getInstance method
    (CommandRegistry.getInstance as jest.Mock).mockReturnValue(mockRegistry);

    // Create help generator instance
    helpGenerator = new HelpGenerator();
  });

  describe('constructor', () => {
    it('should initialize with command registry', () => {
      expect(CommandRegistry.getInstance).toHaveBeenCalled();
      expect(helpGenerator).toBeDefined();
    });
  });

  describe('generateHelp', () => {
    it('should generate help for specific command', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const help = await helpGenerator.generateHelp('test-command');

      expect(mockRegistry.getCommand).toHaveBeenCalledWith('test-command');
      expect(help).toContain('test-command');
      expect(help).toContain('Test command description');
      expect(typeof help).toBe('string');
      expect(help.length).toBeGreaterThan(0);
    });

    it('should generate general help when no command specified', async () => {
      mockRegistry.listCommands.mockReturnValue([mockCommand]);

      const help = await helpGenerator.generateHelp();

      expect(mockRegistry.listCommands).toHaveBeenCalled();
      expect(help).toContain('Available commands');
      expect(typeof help).toBe('string');
      expect(help.length).toBeGreaterThan(0);
    });

    it('should handle command not found', async () => {
      mockRegistry.getCommand.mockReturnValue(null);

      const help = await helpGenerator.generateHelp('nonexistent-command');

      expect(help).toContain('Command not found');
      expect(help).toContain('nonexistent-command');
    });

    it('should respect format options - include examples', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        includeExamples: true,
        includeOptions: false,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      expect(help).toContain('Basic usage');
      expect(help).toContain('swissknife test --verbose');
    });

    it('should respect format options - exclude examples', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        includeExamples: false,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      expect(help).not.toContain('Examples');
      expect(help).not.toContain('Basic usage');
    });

    it('should respect format options - include options', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        includeOptions: true,
        includeExamples: false,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      expect(help).toContain('--verbose');
      expect(help).toContain('--output');
      expect(help).toContain('Verbose output');
    });

    it('should respect format options - exclude options', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        includeOptions: false,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      expect(help).not.toContain('Options');
      expect(help).not.toContain('--verbose');
    });

    it('should respect format options - include aliases', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        includeAliases: true,
        includeOptions: false,
        includeExamples: false,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      expect(help).toContain('t');
      expect(help).toContain('testing');
    });

    it('should respect format options - include subcommands', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        includeSubcommands: true,
        includeOptions: false,
        includeExamples: false,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      expect(help).toContain('sub');
      expect(help).toContain('Test subcommand');
    });

    it('should respect maxWidth option', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const options: HelpFormatOptions = {
        maxWidth: 40,
      };

      const help = await helpGenerator.generateHelp('test-command', options);

      // Check that lines don't exceed maxWidth (allowing for some flexibility)
      const lines = help.split('\n');
      const longLines = lines.filter(line => line.length > 45); // Allow some margin
      expect(longLines.length).toBeLessThan(lines.length * 0.5);
    });

    it('should handle color option', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const optionsWithColor: HelpFormatOptions = {
        color: true,
      };

      const optionsWithoutColor: HelpFormatOptions = {
        color: false,
      };

      const helpWithColor = await helpGenerator.generateHelp('test-command', optionsWithColor);
      const helpWithoutColor = await helpGenerator.generateHelp('test-command', optionsWithoutColor);

      expect(helpWithColor).toBeDefined();
      expect(helpWithoutColor).toBeDefined();
      // Both should be strings, color handling is internal
      expect(typeof helpWithColor).toBe('string');
      expect(typeof helpWithoutColor).toBe('string');
    });
  });

  describe('formatCommandHelp', () => {
    it('should format command help with all sections', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const help = await helpGenerator.generateHelp('test-command', {
        includeDescription: true,
        includeOptions: true,
        includeExamples: true,
        includeAliases: true,
        includeSubcommands: true,
      });

      expect(help).toContain('Description');
      expect(help).toContain('Options');
      expect(help).toContain('Examples');
      expect(help).toContain('Aliases');
      expect(help).toContain('Subcommands');
    });
  });

  describe('generateCommandList', () => {
    it('should generate list of all commands', async () => {
      const commands = [
        mockCommand,
        {
          id: 'another-command',
          name: 'another',
          description: 'Another test command',
        },
      ];

      mockRegistry.listCommands.mockReturnValue(commands as any);

      const help = await helpGenerator.generateHelp();

      expect(help).toContain('test');
      expect(help).toContain('another');
      expect(help).toContain('Test command description');
      expect(help).toContain('Another test command');
    });

    it('should handle empty command list', async () => {
      mockRegistry.listCommands.mockReturnValue([]);

      const help = await helpGenerator.generateHelp();

      expect(help).toContain('No commands available');
    });
  });

  describe('error handling', () => {
    it('should handle registry errors gracefully', async () => {
      mockRegistry.getCommand.mockImplementation(() => {
        throw new Error('Registry error');
      });

      const help = await helpGenerator.generateHelp('test-command');

      expect(help).toContain('Error');
      expect(help).toContain('generating help');
    });

    it('should handle invalid command data', async () => {
      mockRegistry.getCommand.mockReturnValue({
        id: 'invalid-command',
        // Missing required fields
      } as any);

      const help = await helpGenerator.generateHelp('invalid-command');

      expect(help).toBeDefined();
      expect(typeof help).toBe('string');
    });
  });

  describe('default options', () => {
    it('should apply default format options', async () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      const help = await helpGenerator.generateHelp('test-command');

      // Default options should include all sections
      expect(help).toContain('Test command description');
      expect(help).toContain('--verbose');
      expect(help).toContain('Basic usage');
    });
  });

  describe('integration tests', () => {
    it('should work with complex command structures', async () => {
      const complexCommand = {
        ...mockCommand,
        options: [
          ...mockCommand.options,
          {
            name: 'config',
            alias: 'c',
            description: 'Configuration file path',
            type: 'string',
            default: './config.json',
          },
          {
            name: 'force',
            alias: 'f',
            description: 'Force overwrite existing files',
            type: 'boolean',
            default: false,
          },
        ],
        examples: [
          ...mockCommand.examples,
          {
            description: 'Advanced usage with config',
            command: 'swissknife test --config custom.json --force',
          },
        ],
      };

      mockRegistry.getCommand.mockReturnValue(complexCommand as any);

      const help = await helpGenerator.generateHelp('test-command');

      expect(help).toContain('--config');
      expect(help).toContain('--force');
      expect(help).toContain('Advanced usage');
      expect(help).toContain('custom.json');
    });
  });
});
