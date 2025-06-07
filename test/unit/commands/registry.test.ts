// test/unit/commands/registry.test.ts
import { CommandRegistry, Command } from '../../../src/commands/registry.js';
import { ExecutionContext } from '../../../src/commands/context.js';
// The LogManager type is not needed for the mock implementation itself.
// import { LogManager } from '../../../src/utils/logging/manager.js';

// Mock the entire ../../../src/utils/logging/manager module
jest.mock('../../../src/utils/logging/manager', () => ({
  // Provide a mock LogManager class/object
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      // Mock the logger instance returned by getInstance
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
  // Also export a mock logger if it's directly imported elsewhere in the code being tested
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));


describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  let context: ExecutionContext;

  beforeEach(() => {
    // Reset the singleton instance before each test to ensure isolation
    // This requires accessing a private member, which is acceptable for testing
    (CommandRegistry as any).instance = null;
    registry = CommandRegistry.getInstance();
    context = {} as ExecutionContext; // Mock ExecutionContext
  });

  it('registry can be instantiated', () => {
    expect(registry).toBeDefined();
    // Optionally check if logger.debug was called if initialization logs
    // expect(logger.debug).toHaveBeenCalledWith('Initializing CommandRegistry...');
  });


  it('should register and retrieve a command', async () => {
    const command: Command = {
      id: 'test-command',
      name: 'Test Command',
      description: 'A test command',
      handler: async () => 0,
    };

    registry.registerCommand(command);
    const retrievedCommand = await registry.getCommand('test-command');
    expect(retrievedCommand).toEqual(command);
  });

  it('should handle lazy command loading', async () => {
    const lazyCommand: Command = {
      id: 'lazy-command',
      name: 'Lazy Command',
      description: 'A lazy command',
      handler: async () => 0,
    };

    const lazyCommandWrapper = {
      id: 'lazy-command',
      loader: async () => lazyCommand,
    };

    registry.registerCommand(lazyCommandWrapper);
    const retrievedCommand = await registry.getCommand('lazy-command');
    expect(retrievedCommand).toEqual(lazyCommand);
  });

  it('should execute a command successfully', async () => {
    const command: Command = {
      id: 'test-command',
      name: 'Test Command',
      description: 'A test command',
      handler: async () => 0,
    };

    registry.registerCommand(command);
    const exitCode = await registry.executeCommand('test-command', {}, context);
    expect(exitCode).toBe(0);
  });

  it('should handle command execution errors', async () => {
    const command: Command = {
      id: 'error-command',
      name: 'Error Command',
      description: 'A command that throws an error',
      handler: async () => {
        throw new Error('Test error');
      },
    };

    registry.registerCommand(command);
    const exitCode = await registry.executeCommand('error-command', {}, context);
    expect(exitCode).toBe(1);
  });

  it('should return undefined for non-existent commands', async () => {
    const retrievedCommand = await registry.getCommand('non-existent');
    expect(retrievedCommand).toBeUndefined();
  });

  it('should handle command aliases', async () => {
    const command: Command = {
      id: 'original-command',
      name: 'Original Command',
      description: 'An original command',
      aliases: ['alias-command'],
      handler: async () => 0,
    };

    registry.registerCommand(command);
    const retrievedCommand = await registry.getCommand('alias-command');
    expect(retrievedCommand?.id).toBe('original-command');
  });
});
