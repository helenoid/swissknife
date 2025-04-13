/**
 * Unit tests for CommandRegistry
 */

import { CommandRegistry } from '../../../src/command-registry';
import { generateCommandFixtures } from '../../helpers/fixtures';

describe('CommandRegistry', () => {
  let commandRegistry: any;
  const fixtures = generateCommandFixtures();
  
  beforeEach(() => {
    // Reset the registry singleton for testing
    (CommandRegistry as any).instance = null;
    commandRegistry = CommandRegistry.getInstance();
  });
  
  describe('registerCommand', () => {
    it('should register a command successfully', () => {
      // Arrange
      const command = fixtures.commands[0];
      
      // Act
      commandRegistry.registerCommand(command);
      
      // Assert
      const retrievedCommand = commandRegistry.getCommand(command.id);
      expect(retrievedCommand).toEqual(command);
    });
    
    it('should throw an error when registering an invalid command', () => {
      // Arrange
      const invalidCommand = {
        // Missing required fields
        id: 'invalid-command'
      };
      
      // Act & Assert
      expect(() => {
        commandRegistry.registerCommand(invalidCommand);
      }).toThrow();
    });
  });
  
  describe('getCommand', () => {
    it('should retrieve a registered command by ID', () => {
      // Arrange
      const command = fixtures.commands[0];
      commandRegistry.registerCommand(command);
      
      // Act
      const retrievedCommand = commandRegistry.getCommand(command.id);
      
      // Assert
      expect(retrievedCommand).toEqual(command);
    });
    
    it('should return undefined for an unregistered command ID', () => {
      // Act
      const retrievedCommand = commandRegistry.getCommand('non-existent-command');
      
      // Assert
      expect(retrievedCommand).toBeUndefined();
    });
  });
  
  describe('getAllCommands', () => {
    it('should retrieve all registered commands', () => {
      // Arrange
      fixtures.commands.forEach(command => {
        commandRegistry.registerCommand(command);
      });
      
      // Act
      const allCommands = commandRegistry.getAllCommands();
      
      // Assert
      expect(allCommands.length).toBe(fixtures.commands.length);
      expect(allCommands).toEqual(expect.arrayContaining(fixtures.commands));
    });
  });
  
  describe('getCommandsByCategory', () => {
    it('should retrieve commands by category', () => {
      // Arrange
      fixtures.commands.forEach(command => {
        commandRegistry.registerCommand(command);
      });
      
      // Act
      const testCommands = commandRegistry.getCommandsByCategory('test');
      
      // Assert
      expect(testCommands.length).toBe(fixtures.commands.length);
      expect(testCommands).toEqual(expect.arrayContaining(fixtures.commands));
    });
    
    it('should return empty array for non-existent category', () => {
      // Arrange
      fixtures.commands.forEach(command => {
        commandRegistry.registerCommand(command);
      });
      
      // Act
      const commands = commandRegistry.getCommandsByCategory('non-existent-category');
      
      // Assert
      expect(commands).toEqual([]);
    });
  });
  
  describe('executeCommand', () => {
    it('should execute a command handler successfully', async () => {
      // Arrange
      const command = {
        ...fixtures.commands[0],
        handler: jest.fn().mockResolvedValue(0)
      };
      commandRegistry.registerCommand(command);
      
      const args = { option1: 'test-value', flag1: true };
      const context = { /* mock context */ };
      
      // Act
      const result = await commandRegistry.executeCommand(command.id, args, context);
      
      // Assert
      expect(result).toBe(0);
      expect(command.handler).toHaveBeenCalledWith(args, context);
    });
    
    it('should return error code when command execution fails', async () => {
      // Arrange
      const command = {
        ...fixtures.commands[0],
        handler: jest.fn().mockRejectedValue(new Error('Test error'))
      };
      commandRegistry.registerCommand(command);
      
      const args = { option1: 'test-value', flag1: true };
      const context = { /* mock context */ };
      
      // Act
      const result = await commandRegistry.executeCommand(command.id, args, context);
      
      // Assert
      expect(result).toBe(1); // Error exit code
      expect(command.handler).toHaveBeenCalledWith(args, context);
    });
    
    it('should return error code when command not found', async () => {
      // Act
      const result = await commandRegistry.executeCommand('non-existent-command', {}, {});
      
      // Assert
      expect(result).toBe(1); // Error exit code
    });
  });
});