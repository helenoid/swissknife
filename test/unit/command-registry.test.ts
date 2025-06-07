import { CommandRegistry } from '../../src/command-registry';
import { Command, CommandOption, ExecutionContext } from '../../src/types/cli';
import { LogManager } from '../../src/utils/logging/manager'; // Import LogManager

// Mock logger - Assuming logger is correctly mocked via jest.mock
jest.mock('../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// Use relative paths - Assuming module resolution handles '.js' or lack thereof
// Add .js extension to relative imports
// Remove .js extension from relative imports
// Add .js extension to relative imports


// Define a mock command implementation aligning with the target Command interface
class MockCliCommand implements Command {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly options?: CommandOption[];
  readonly handler: (context: ExecutionContext) => Promise<number>;
  readonly subcommands?: Command[];
  readonly aliases?: string[];
  readonly examples?: string[];
  readonly isEnabled: boolean = true;
  readonly isHidden: boolean = false;

  constructor(
    name: string,
    desc: string = 'A mock command description',
    options?: CommandOption[],
    handler?: (context: ExecutionContext) => Promise<number>
  ) {
    this.id = `cmd-${name}`;
    this.name = name;
    this.description = desc;
    this.options = options;
    this.handler = handler || jest.fn().mockResolvedValue(0); // Default mock handler
  }

  // Add mock implementations for missing methods from Command interface
  parseArguments(_args: string[]): Record<string, any> {
    // Simple mock implementation
    return {};
  }

  async execute(_parsedArgs: Record<string, any>, context: ExecutionContext): Promise<any> {
    // Simple mock implementation
    return this.handler(context);
  }
}

describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  let mockLogger: any; // Explicitly type mockLogger

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks
    registry = new CommandRegistry(); // Create fresh registry
    mockLogger = LogManager.getInstance(); // Get the mocked logger instance
  });

  // --- Registration and Retrieval ---

  it('should register a single command successfully', () => {
    // Arrange
    const command = new MockCliCommand('test-cmd', 'Test command description');

    // Act
    registry.register(command);
    const retrievedCommand = registry.getCommand('test-cmd');
    const allCommands = registry.listCommands();

    // Assert
    expect(retrievedCommand).toBe(command);
    expect(allCommands).toHaveLength(1);
    expect(allCommands[0]).toBe(command);
  });

  it('should return undefined when getting a command that is not registered', () => {
    // Arrange (Registry is empty)

    // Act
    const result = registry.getCommand('nonexistent-cmd');

    // Assert
    expect(result).toBeUndefined();
  });

  it('should overwrite an existing command when registering with the same name and log a warning', () => {
    // Arrange
    const command1 = new MockCliCommand('test-cmd', 'Description 1');
    const command2 = new MockCliCommand('test-cmd', 'Description 2'); // Same name
    registry.register(command1); // Initial registration

    // Act
    registry.register(command2); // Re-register with the same name
    const retrievedCommand = registry.getCommand('test-cmd');
    const allCommands = registry.listCommands();

    // Assert
    expect(retrievedCommand).toBe(command2); // Should now be the second command
    expect(retrievedCommand?.description).toBe('Description 2');
    expect(allCommands).toHaveLength(1); // Count should remain 1
    expect(allCommands[0]).toBe(command2);
    expect(mockLogger.warn).toHaveBeenCalledTimes(1); // Use mockLogger
    expect(mockLogger.warn).toHaveBeenCalledWith("Command 'test-cmd' already registered. Overwriting."); // Use mockLogger
  });

  it('should list all registered commands', () => {
    // Arrange
    const command1 = new MockCliCommand('cmd1');
    const command2 = new MockCliCommand('cmd2');
    registry.register(command1);
    registry.register(command2);

    // Act
    const commands = registry.listCommands();
    const commandNames = commands.map((cmd: Command) => cmd.name);

    // Assert
    expect(commands).toHaveLength(2);
    expect(commands).toEqual(expect.arrayContaining([command1, command2]));
    expect(commandNames).toEqual(expect.arrayContaining(['cmd1', 'cmd2']));
  });

  // --- Basic Validation on Registration ---
  // Note: More complex validation (options, etc.) is likely handled by the CLI framework (commander/yargs)

  it('should throw an error if attempting to register a command without a name', () => {
    // Arrange
    const invalidCommand = new MockCliCommand('', 'Command with no name');

    // Act & Assert
    expect(() => registry.register(invalidCommand))
      .toThrow('Command registration failed: Command name cannot be empty.');
  });

  it('should throw an error if attempting to register a command without a description', () => {
    // Arrange
    const invalidCommand = new MockCliCommand('no-desc-cmd', ''); // Empty description

    // Act & Assert
    expect(() => registry.register(invalidCommand))
      .toThrow("Command registration failed: Command description cannot be empty for command 'no-desc-cmd'.");
  });

  it('should throw an error if attempting to register a command without a handler function', () => {
    // Arrange
    const invalidCommand = new MockCliCommand('no-handler-cmd') as any; // Use 'as any' to bypass TS check for test
    delete invalidCommand.handler; // Remove the handler

    // Act & Assert
    expect(() => registry.register(invalidCommand as Command)) // Cast back for method signature
      .toThrow("Command registration failed: Command handler is required for command 'no-handler-cmd'.");
  });

  // --- Alias Handling ---
  // Removing alias tests as registerAlias is not part of CommandRegistry based on src/command-registry.ts

  // TODO: Add tests for subcommands if CommandRegistry handles them directly
  // (though often subcommand routing is handled by the CLI framework like commander/yargs)

});
