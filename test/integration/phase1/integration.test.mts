import { ConfigurationManager } from '@src/config/manager';
import { CommandRegistry, Command, CommandExecutionContext } from '@src/command-registry';

// Use manual mocks from __mocks__ directory
jest.mock('@src/config/manager');
jest.mock('@src/command-registry');

describe('Phase 1: Integration Tests', () => {
  describe('Configuration and Command Registry Integration', () => {
    let configManager: any; // Changed type to any
    let commandRegistry: any; // Changed type to any

    beforeEach(() => {
      jest.clearAllMocks();
      configManager = jest.mocked(ConfigurationManager).getInstance();
      commandRegistry = new (jest.mocked(CommandRegistry) as any)(); // Cast to any
    });

    it('should execute commands with configuration context', async () => {
      // Arrange
      const mockCommand: Command = {
        name: 'testCommand',
        description: 'A test command',
        parseArguments: jest.fn().mockReturnValue({}),
        execute: jest.fn().mockImplementation(async (args, context) => {
          // Simulate command accessing config
          const value = context.config.get('someKey');
          context.config.set('resultKey', value + '_processed');
          return { success: true };
        }),
      };

      commandRegistry.register(mockCommand);
      (commandRegistry.getCommand as jest.Mock).mockReturnValue(mockCommand);
      (configManager.get as jest.Mock).mockReturnValue('initialValue');

      const context: CommandExecutionContext = {
        config: configManager,
        taskManager: {
          // Mock necessary taskManager methods if used by commands
          // e.g., addTask: jest.fn(),
        } as any,
        agent: {
          // Mock necessary agent methods if used by commands
          // e.g., performAction: jest.fn(),
        } as any,
        getService: jest.fn((serviceName: string) => {
          // Mock getService to return mocked services if commands rely on them
          if (serviceName === 'someService') {
            return { someMethod: jest.fn() };
          }
          return undefined;
        }) as any,
      };

      // Act
      const command = commandRegistry.getCommand('testCommand');
      if (!command) throw new Error('Command not found');
      await command.execute({}, context);

      // Assert
      expect(configManager.get).toHaveBeenCalledWith('someKey');
      expect(configManager.set).toHaveBeenCalledWith('resultKey', 'initialValue_processed');
      expect(mockCommand.execute).toHaveBeenCalled();
    });

    it('should update configuration through command execution', async () => {
      // Arrange
      const mockCommand: Command = {
        name: 'updateConfigCommand',
        description: 'Updates config',
        parseArguments: jest.fn().mockReturnValue({ newValue: 'updatedValue' }),
        execute: jest.fn().mockImplementation(async (args, context) => {
          context.config.set('settingToUpdate', args.newValue);
          return { success: true };
        }),
      };

      commandRegistry.register(mockCommand);
      (commandRegistry.getCommand as jest.Mock).mockReturnValue(mockCommand);

      const context: CommandExecutionContext = {
        config: configManager,
        taskManager: {} as any,
        agent: {} as any,
        getService: jest.fn() as any,
      };

      // Act
      const command = commandRegistry.getCommand('updateConfigCommand');
      if (!command) throw new Error('Command not found');
      await command.execute({ newValue: 'updatedValue' }, context);

      // Assert
      expect(configManager.set).toHaveBeenCalledWith('settingToUpdate', 'updatedValue');
      expect(mockCommand.execute).toHaveBeenCalled();
    });
  });
});
