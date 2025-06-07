/**
 * Simple Test for CommandParser
 * Using basic mocking strategy focused on actual available methods
 */

// Mock command registry
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

// Import the actual class under test
import { CommandParser } from '../../../../src/cli/command-parser';

describe('CommandParser', () => {
  let parser: CommandParser;

  const mockCommand = {
    id: 'test',
    name: 'test',
    description: 'Test command',
    options: [
      { name: 'flag', alias: 'f', type: 'boolean', description: 'Test flag', default: false },
      { name: 'input', alias: 'i', type: 'string', description: 'Input value', required: false }
    ],
    handler: async () => 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock registry methods
    mockCommandRegistry.getCommand.mockImplementation((name: string) => {
      if (name === 'test') return mockCommand;
      return undefined;
    });
    
    mockCommandRegistry.hasCommand.mockImplementation((name: string) => 
      name === 'test'
    );
    
    // Create parser instance with mocked registry
    parser = new CommandParser(mockCommandRegistry);
  });

  describe('parseCommandLine', () => {
    it('should parse simple command', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'test']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommand);
      expect(result?.subcommands).toEqual([]);
    });

    it('should return null for empty arguments', () => {
      const result = parser.parseCommandLine(['node', 'script.js']);
      expect(result).toBeNull();
    });

    it('should handle unknown command', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'unknown']);
      expect(result).toBeNull();
    });

    it('should parse command with options', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'test', '--flag']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommand);
    });

    it('should handle command with arguments', () => {
      const result = parser.parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);
      
      expect(result).not.toBeNull();
      expect(result?.command).toBe(mockCommand);
    });
  });
});
