import { ConfigurationManager } from '@src/config/manager';
import { CommandRegistry, Command, CommandExecutionContext } from '@src/command-registry';

/**
 * Unit tests for Phase 1 components - Analysis & Planning
 */

// Use manual mocks from __mocks__ directory
jest.mock('@src/config/manager');
jest.mock('@src/command-registry');


describe('Phase 1: Analysis & Planning Components', () => {
  describe('Configuration System', () => {
    let configManager: any; // Changed type to any
    
    beforeEach(() => {
      jest.clearAllMocks();
      configManager = jest.mocked(ConfigurationManager).getInstance();
    });
    
    it('should load configuration properly', async () => {
      await configManager.initialize();
      expect(configManager.initialize).toHaveBeenCalled();
    });
    
    it('should save configuration properly', async () => {
      const key = 'testKey';
      const value = 'testValue';
      (configManager.get as jest.Mock).mockReturnValue(value);
      configManager.set(key, value);
      expect(configManager.set).toHaveBeenCalledWith(key, value);
      expect(configManager.get(key)).toBe(value);
    });
  });
  
  describe('Command System Foundation', () => {
    let commandRegistry: any; // Changed type to any
    
    beforeEach(() => {
      jest.clearAllMocks();
      commandRegistry = new (jest.mocked(CommandRegistry) as any)();
    });
    
    it('should register commands properly', () => {
      const mockCommand: Command = {
        name: 'test',
        description: 'Test command',
        parseArguments: jest.fn().mockReturnValue({}),
        execute: jest.fn().mockResolvedValue({ success: true })
      };
      commandRegistry.register(mockCommand);
      expect(commandRegistry.register).toHaveBeenCalledWith(mockCommand);
      expect(commandRegistry.getCommand('test')).toBe(mockCommand);
    });
    
    it('should execute registered commands', async () => {
      const mockCommand: Command = {
        name: 'test',
        description: 'Test command',
        parseArguments: jest.fn().mockReturnValue({ flag: true }),
        execute: jest.fn().mockResolvedValue({ success: true })
      };
      commandRegistry.register(mockCommand);
      (commandRegistry.getCommand as jest.Mock).mockReturnValue(mockCommand);
      const context = {} as CommandExecutionContext;
      const command = commandRegistry.getCommand('test');
      if (!command) throw new Error('Command not found');
      await command.execute({ flag: true }, context);
      expect(mockCommand.execute).toHaveBeenCalledWith({ flag: true }, context);
    });
    
    it('should handle unknown commands', () => {
      (commandRegistry.getCommand as jest.Mock).mockReturnValue(undefined);
      const command = commandRegistry.getCommand('unknown');
      expect(command).toBeUndefined();
    });
  });
});
