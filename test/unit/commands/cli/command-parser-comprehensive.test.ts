/**
 * Comprehensive Command Parser Test with Dependency Injection
 */

// Mock the command registry and related dependencies
jest.mock('../../../../src/command-registry.js', () => {
  const mockCommand = {
    id: 'test-command',
    name: 'test',
    description: 'Test command',
    parseArguments: jest.fn(),
    execute: jest.fn(),
  };

  const mockRegistry = {
    getCommand: jest.fn(),
    listCommands: jest.fn(),
    listCommandNames: jest.fn(),
    register: jest.fn(),
  };

  return {
    CommandRegistry: jest.fn(() => mockRegistry),
    Command: mockCommand,
    CommandOption: {},
    CommandExecutionContext: {},
  };
});

import { CommandParser, ParsedCommandLine } from '../../../../src/cli/command-parser.js';
import { CommandRegistry, Command } from '../../../../src/command-registry.js';

describe('Command Parser with Dependency Injection', () => {
  let parser: CommandParser;
  let mockRegistry: jest.Mocked<CommandRegistry>;
  let mockCommand: jest.Mocked<Command>;

  beforeEach(() => {
    // Create mock registry
    mockRegistry = {
      getCommand: jest.fn(),
      listCommands: jest.fn(),
      listCommandNames: jest.fn(),
      register: jest.fn(),
    } as any;

    // Create mock command
    mockCommand = {
      id: 'test-command',
      name: 'test',
      description: 'Test command',
      parseArguments: jest.fn(),
      execute: jest.fn(),
      options: [
        {
          name: 'flag',
          alias: 'f',
          type: 'boolean',
          description: 'Test flag',
          default: false,
        },
        {
          name: 'input',
          alias: 'i',
          type: 'string',
          description: 'Input value',
          required: true,
        },
      ],
    } as any;

    // Create parser with injected dependency
    parser = new CommandParser(mockRegistry);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should inject CommandRegistry dependency', () => {
      expect(parser).toBeInstanceOf(CommandParser);
      expect(parser['registry']).toBe(mockRegistry);
    });

    test('should allow dependency injection for testing', () => {
      const customRegistry = {
        getCommand: jest.fn(),
        listCommands: jest.fn(),
        listCommandNames: jest.fn(),
        register: jest.fn(),
      } as any;

      const customParser = new CommandParser(customRegistry);
      expect(customParser['registry']).toBe(customRegistry);
    });
  });

  describe('parseCommandLine', () => {
    test('should return null for empty arguments', () => {
      const result = parser.parseCommandLine([]);
      expect(result).toBeNull();
    });

    test('should return null for only node and script arguments', () => {
      const result = parser.parseCommandLine(['node', 'script.js']);
      expect(result).toBeNull();
    });

    test('should return null when command not found', () => {
      mockRegistry.getCommand.mockReturnValue(undefined);

      const result = parser.parseCommandLine(['node', 'script.js', 'unknown']);
      
      expect(result).toBeNull();
      expect(mockRegistry.getCommand).toHaveBeenCalledWith('unknown');
    });

    test('should parse simple command successfully', () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);
      mockCommand.parseArguments.mockReturnValue({ flag: true });

      const result = parser.parseCommandLine(['node', 'script.js', 'test', '--flag']);

      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommand);
      expect(result?.args).toEqual({ flag: true });
      expect(result?.subcommands).toEqual([]);
      expect(mockRegistry.getCommand).toHaveBeenCalledWith('test');
      expect(mockCommand.parseArguments).toHaveBeenCalledWith(['--flag']);
    });

    test('should handle subcommands correctly', () => {
      const subCommand = {
        ...mockCommand,
        id: 'test:sub',
        name: 'sub',
      };

      mockRegistry.getCommand
        .mockReturnValueOnce(undefined) // First call for 'test' returns undefined
        .mockReturnValueOnce(subCommand); // Second call for 'test:sub' returns subCommand

      mockCommand.parseArguments.mockReturnValue({ input: 'value' });

      const result = parser.parseCommandLine(['node', 'script.js', 'test', 'sub', '--input', 'value']);

      expect(result).not.toBeNull();
      expect(result?.command).toBe(subCommand);
      expect(result?.subcommands).toEqual(['sub']);
      expect(mockRegistry.getCommand).toHaveBeenCalledWith('test');
      expect(mockRegistry.getCommand).toHaveBeenCalledWith('test:sub');
    });

    test('should handle command with no options', () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);
      mockCommand.parseArguments.mockReturnValue({});

      const result = parser.parseCommandLine(['node', 'script.js', 'test']);

      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommand);
      expect(result?.args).toEqual({});
      expect(result?.subcommands).toEqual([]);
      expect(mockCommand.parseArguments).toHaveBeenCalledWith([]);
    });

    test('should handle complex command arguments', () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);
      mockCommand.parseArguments.mockReturnValue({
        flag: true,
        input: 'test-input',
        verbose: false,
      });

      const result = parser.parseCommandLine([
        'node',
        'script.js',
        'test',
        '--flag',
        '--input',
        'test-input',
      ]);

      expect(result).not.toBeNull();
      expect(result?.args).toEqual({
        flag: true,
        input: 'test-input',
        verbose: false,
      });
      expect(mockCommand.parseArguments).toHaveBeenCalledWith([
        '--flag',
        '--input',
        'test-input',
      ]);
    });
  });

  describe('integration with CommandRegistry', () => {
    test('should delegate command lookup to registry', () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);

      parser.parseCommandLine(['node', 'script.js', 'test']);

      expect(mockRegistry.getCommand).toHaveBeenCalledWith('test');
      expect(mockRegistry.getCommand).toHaveBeenCalledTimes(1);
    });

    test('should handle registry returning undefined', () => {
      mockRegistry.getCommand.mockReturnValue(undefined);

      const result = parser.parseCommandLine(['node', 'script.js', 'nonexistent']);

      expect(result).toBeNull();
      expect(mockRegistry.getCommand).toHaveBeenCalledWith('nonexistent');
    });

    test('should work with different registry implementations', () => {
      // Test that the parser works with any registry that implements the interface
      const alternativeRegistry = {
        getCommand: jest.fn().mockReturnValue(mockCommand),
        listCommands: jest.fn(),
        listCommandNames: jest.fn(),
        register: jest.fn(),
      } as any;

      const alternativeParser = new CommandParser(alternativeRegistry);
      alternativeParser.parseCommandLine(['node', 'script.js', 'test']);

      expect(alternativeRegistry.getCommand).toHaveBeenCalledWith('test');
    });
  });

  describe('error handling', () => {
    test('should handle registry throwing errors', () => {
      mockRegistry.getCommand.mockImplementation(() => {
        throw new Error('Registry error');
      });

      expect(() => {
        parser.parseCommandLine(['node', 'script.js', 'test']);
      }).toThrow('Registry error');
    });

    test('should handle command parseArguments throwing errors', () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);
      mockCommand.parseArguments.mockImplementation(() => {
        throw new Error('Parse error');
      });

      expect(() => {
        parser.parseCommandLine(['node', 'script.js', 'test', '--invalid']);
      }).toThrow('Parse error');
    });
  });

  describe('type safety', () => {
    test('should return correctly typed ParsedCommandLine', () => {
      mockRegistry.getCommand.mockReturnValue(mockCommand);
      mockCommand.parseArguments.mockReturnValue({ test: true });

      const result: ParsedCommandLine | null = parser.parseCommandLine(['node', 'script.js', 'test']);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.command).toBe(mockCommand);
        expect(result.args).toEqual({ test: true });
        expect(result.subcommands).toEqual([]);
      }
    });
  });
});
