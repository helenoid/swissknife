// Mock logger
jest.mock('@/utils/logger.js', () => ({ // Use alias
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Use relative paths with .js extension
import { CommandRegistry } from '../../../src/command-registry.js';
// Use relative path for types, add .js extension
import { Command, CommandOption, ExecutionContext } from '../../../src/types/cli.js';

// Define a mock command implementation matching Phase 2 Command interface
class MockCommand implements Command {
  id: string;
  name: string;
  description: string = 'A mock command';
  options?: CommandOption[];
  // Mock handler function
  handler = jest.fn().mockResolvedValue(0); // Resolves with exit code 0

  constructor(id: string, name?: string, desc: string = 'A mock command', options?: CommandOption[]) {
    this.id = id;
    this.name = name || id.split(':').pop() || id; // Default name from last part of id
    this.description = desc;
    this.options = options;
  }
}

describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  let mockContext: ExecutionContext; // Use the imported type

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Instantiate registry
    registry = new CommandRegistry();
    // Mock context (can be simple for registry tests)
    mockContext = {} as ExecutionContext;
  });

  it('should register a command successfully', () => {
    const command = new MockCommand('test:cmd', 'test-cmd');
    registry.register(command);

    expect(registry.get(command.id)).toBe(command); // Use get(id)
    // Assuming listCommands exists based on original test
    expect(registry.listCommands()).toEqual([command]);
    // listCommandNames might not exist, check listCommands length instead
    expect(registry.listCommands().length).toBe(1);
  });

  it('should return undefined for a non-existent command ID', () => {
    expect(registry.get('nonexistent:cmd')).toBeUndefined(); // Use get(id)
  });

  it('should overwrite a command if registered with the same ID and log a warning', () => {
    const command1 = new MockCommand('test:cmd', 'test-cmd', 'Description 1');
    const command2 = new MockCommand('test:cmd', 'test-cmd', 'Description 2');

    registry.register(command1);
    expect(registry.get('test:cmd')).toBe(command1);

    registry.register(command2); // Register again with same ID
    expect(registry.get('test:cmd')).toBe(command2);
    expect(registry.get('test:cmd')?.description).toBe('Description 2');
    expect(registry.listCommands().length).toBe(1);

    // Check if logger.warn was called (requires logger mock setup)
    // Use relative path for require
    const mockLogger = require('../../src/utils/logger.js').logger;
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('already registered. Overwriting.'));
  });

  it('should list multiple registered commands', () => {
    const command1 = new MockCommand('cmd1');
    const command2 = new MockCommand('cmd2');

    registry.register(command1);
    registry.register(command2);

    // listCommandNames might not exist, check listCommands instead
    const commands = registry.listCommands();
    expect(commands).toHaveLength(2);
    expect(commands).toContain(command1);
    expect(commands).toContain(command2);
    // Check names from the retrieved commands
    const names = commands.map(cmd => cmd.name);
    expect(names).toContain('cmd1');
    expect(names).toContain('cmd2');
  });

  // Update placeholder validation tests for Phase 2 Command interface
  it('should ideally throw or warn if registering a command without an ID', () => {
     const invalidCommand = new MockCommand(''); // Empty ID
     // Depending on future validation, this might throw
     expect(() => registry.register(invalidCommand)).not.toThrow(); // Current expectation based on no explicit validation
     // OR expect(() => registry.register(invalidCommand)).toThrow(/must have an ID/);
  });

   it('should ideally throw or warn if registering a command without a name', () => {
     // MockCommand defaults name from ID, so test by forcing empty name
     const invalidCommand = new MockCommand('id-exists', ''); // Empty name
     expect(() => registry.register(invalidCommand)).not.toThrow(); // Current expectation
     // OR expect(() => registry.register(invalidCommand)).toThrow(/must have a name/);
  });

   it('should ideally throw or warn if registering a command without a description', () => {
     const invalidCommand = new MockCommand('no-desc', 'no-desc', ''); // Empty description
     expect(() => registry.register(invalidCommand)).not.toThrow(); // Current expectation
     // OR expect(() => registry.register(invalidCommand)).toThrow(/must have a description/);
  });

   it('should ideally throw or warn if registering a command without a handler', () => {
     const invalidCommand = new MockCommand('no-handler');
     (invalidCommand as any).handler = undefined; // Force missing handler
     expect(() => registry.register(invalidCommand)).not.toThrow(); // Current expectation
     // OR expect(() => registry.register(invalidCommand)).toThrow(/must have a handler/);
  });

});
