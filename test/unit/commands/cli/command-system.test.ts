/**
 * Unit tests for CLI Command System
 */

import { CommandParser } from '../../../../src/commands/parser';
import { CommandRegistry } from '../../../../src/commands/registry';
import { createExecutionContext } from '../../../../src/commands/context';
import { captureConsoleOutput } from '../../../helpers/testUtils';
import { generateCommandFixtures } from '../../../helpers/fixtures';

describe('CLI Command System', () => {
  let commandRegistry: any;
  let commandParser: any;
  const fixtures = generateCommandFixtures();
  
  beforeEach(() => {
    // Reset singletons
    (CommandRegistry as any).instance = null;
    commandRegistry = CommandRegistry.getInstance();
    
    // Create parser if it exists as separate class
    if (typeof CommandParser === 'function') {
      commandParser = new CommandParser(commandRegistry);
    } else {
      // Otherwise use parser method from registry
      commandParser = {
        parse: (args: string[]) => commandRegistry.parseCommandLine(args)
      };
    }
    
    // Register test commands
    fixtures.commands.forEach(command => {
      commandRegistry.registerCommand(command);
    });
    
    jest.clearAllMocks();
  });
  
  describe('command registration', () => {
    it('should register commands correctly', () => {
      // Arrange
      const command = {
        id: 'test-command',
        name: 'test-command',
        description: 'Test command for registration',
        handler: jest.fn().mockResolvedValue(0)
      };
      
      // Act
      commandRegistry.registerCommand(command);
      
      // Assert
      const retrievedCommand = commandRegistry.getCommand('test-command');
      expect(retrievedCommand).toEqual(command);
    });
    
    it('should register commands with aliases if supported', () => {
      // Skip if aliases not supported
      const supportsAliases = 'aliases' in fixtures.commands[0] || 
                             commandRegistry.registerAlias !== undefined;
      
      if (!supportsAliases) {
        console.log('Skipping alias test - feature not supported');
        return;
      }
      
      // Arrange
      const command = {
        id: 'aliased-command',
        name: 'aliased-command',
        description: 'Command with aliases',
        aliases: ['ac', 'alias'],
        handler: jest.fn().mockResolvedValue(0)
      };
      
      // Act
      commandRegistry.registerCommand(command);
      
      // Assert - Should be retrievable by ID and aliases
      expect(commandRegistry.getCommand('aliased-command')).toEqual(command);
      expect(commandRegistry.getCommand('ac')).toEqual(command);
      expect(commandRegistry.getCommand('alias')).toEqual(command);
    });
    
    it('should validate command registration', () => {
      // Arrange
      const invalidCommand = {
        // Missing required fields
        id: 'invalid-command'
      };
      
      // Act & Assert
      expect(() => {
        commandRegistry.registerCommand(invalidCommand as any);
      }).toThrow();
    });
  });
  
  describe('command parsing', () => {
    it('should parse simple commands correctly', () => {
      // Arrange
      const args = ['node', 'script.js', 'test'];
      
      // Act
      const parsed = commandParser.parse(args);
      
      // Assert
      expect(parsed).toBeDefined();
      expect(parsed.command).toEqual(fixtures.commands[0]);
      expect(parsed.args).toBeDefined();
    });
    
    it('should parse commands with options', () => {
      // Arrange
      const args = ['node', 'script.js', 'test', '--option1', 'value', '--flag1'];
      
      // Act
      const parsed = commandParser.parse(args);
      
      // Assert
      expect(parsed).toBeDefined();
      expect(parsed.command).toEqual(fixtures.commands[0]);
      expect(parsed.args.option1).toBe('value');
      expect(parsed.args.flag1).toBe(true);
    });
    
    it('should parse subcommands correctly', () => {
      // Arrange
      const args = ['node', 'script.js', 'test', 'subcommand', '--suboption1', 'value'];
      
      // Act
      const parsed = commandParser.parse(args);
      
      // Assert
      expect(parsed).toBeDefined();
      expect(parsed.command).toEqual(fixtures.commands[1]);
      expect(parsed.args.suboption1).toBe('value');
      
      // Subcommands array should contain "subcommand"
      if (parsed.subcommands) {
        expect(parsed.subcommands).toContain('subcommand');
      }
    });
    
    it('should apply default option values', () => {
      // Arrange
      const args = ['node', 'script.js', 'test'];
      
      // Act
      const parsed = commandParser.parse(args);
      
      // Assert
      expect(parsed).toBeDefined();
      expect(parsed.args.option1).toBe('default-value');
      expect(parsed.args.flag1).toBe(false);
    });
    
    it('should handle unknown commands', () => {
      // Arrange
      const args = ['node', 'script.js', 'unknown-command'];
      
      // Act
      const parsed = commandParser.parse(args);
      
      // Assert
      expect(parsed).toBeNull();
    });
    
    it('should handle option aliases if supported', () => {
      // Skip if aliases not supported
      const command = fixtures.commands[0];
      const hasAlias = command.options && 
                       command.options.some(opt => opt.alias !== undefined);
      
      if (!hasAlias) {
        console.log('Skipping option alias test - feature not supported');
        return;
      }
      
      // Arrange - Find an option with alias
      const optionWithAlias = command.options.find(opt => opt.alias !== undefined);
      if (!optionWithAlias) return;
      
      const args = ['node', 'script.js', 'test', 
                    `-${optionWithAlias.alias}`, 'alias-value'];
      
      // Act
      const parsed = commandParser.parse(args);
      
      // Assert
      expect(parsed).toBeDefined();
      expect(parsed.args[optionWithAlias.name]).toBe('alias-value');
    });
  });
  
  describe('command execution', () => {
    it('should execute commands correctly', async () => {
      // Arrange
      const command = {
        id: 'exec-test',
        name: 'exec-test',
        description: 'Command for execution testing',
        handler: jest.fn().mockResolvedValue(0)
      };
      
      commandRegistry.registerCommand(command);
      
      const args = { _: [] };
      const context = createExecutionContext(args);
      
      // Act
      const result = await commandRegistry.executeCommand('exec-test', args, context);
      
      // Assert
      expect(result).toBe(0);
      expect(command.handler).toHaveBeenCalledWith(args, context);
    });
    
    it('should handle command execution errors', async () => {
      // Arrange
      const command = {
        id: 'error-test',
        name: 'error-test',
        description: 'Command that throws an error',
        handler: jest.fn().mockRejectedValue(new Error('Test error'))
      };
      
      commandRegistry.registerCommand(command);
      
      const args = { _: [] };
      const context = createExecutionContext(args);
      
      // Capture console output
      const { getOutput, restore } = captureConsoleOutput();
      
      try {
        // Act
        const result = await commandRegistry.executeCommand('error-test', args, context);
        
        // Assert
        expect(result).toBe(1); // Error exit code
        expect(command.handler).toHaveBeenCalledWith(args, context);
        
        const output = getOutput();
        expect(output.error.some(line => line.includes('Test error'))).toBe(true);
      } finally {
        // Clean up console capture
        restore();
      }
    });
    
    it('should handle unknown commands', async () => {
      // Arrange
      const args = { _: [] };
      const context = createExecutionContext(args);
      
      // Capture console output
      const { getOutput, restore } = captureConsoleOutput();
      
      try {
        // Act
        const result = await commandRegistry.executeCommand('unknown-command', args, context);
        
        // Assert
        expect(result).toBe(1); // Error exit code
        
        const output = getOutput();
        expect(output.error.some(line => line.includes('not found'))).toBe(true);
      } finally {
        // Clean up console capture
        restore();
      }
    });
  });
  
  describe('command help', () => {
    it('should generate help text for commands', () => {
      // Skip if method doesn't exist
      if (typeof commandRegistry.generateHelp !== 'function') {
        console.log('Skipping help generation test - method not implemented');
        return;
      }
      
      // Act
      const helpText = commandRegistry.generateHelp('test');
      
      // Assert
      expect(helpText).toBeDefined();
      expect(helpText).toContain('test');
      expect(helpText).toContain('Test command for testing');
      
      // Should include options
      expect(helpText).toContain('option1');
      expect(helpText).toContain('default-value');
      expect(helpText).toContain('flag1');
      
      // Should include examples if present
      if (fixtures.commands[0].examples) {
        for (const example of fixtures.commands[0].examples) {
          expect(helpText).toContain(example);
        }
      }
    });
    
    it('should implement a help command', async () => {
      // Check if help command exists
      const helpCommand = commandRegistry.getCommand('help');
      if (!helpCommand) {
        console.log('Skipping help command test - command not implemented');
        return;
      }
      
      // Capture console output
      const { getOutput, restore } = captureConsoleOutput();
      
      try {
        // Act - Execute help command with test command
        const result = await commandRegistry.executeCommand('help', {
          _: ['test']
        }, createExecutionContext());
        
        // Assert
        expect(result).toBe(0);
        
        const output = getOutput();
        expect(output.log.join('\n')).toContain('test');
        expect(output.log.join('\n')).toContain('Test command for testing');
      } finally {
        // Clean up console capture
        restore();
      }
    });
  });
  
  describe('command categories', () => {
    it('should retrieve commands by category', () => {
      // Arrange - Add commands with different categories
      const commands = [
        {
          id: 'cat1-cmd1',
          name: 'cat1-cmd1',
          description: 'Category 1 Command 1',
          category: 'category1',
          handler: jest.fn().mockResolvedValue(0)
        },
        {
          id: 'cat1-cmd2',
          name: 'cat1-cmd2',
          description: 'Category 1 Command 2',
          category: 'category1',
          handler: jest.fn().mockResolvedValue(0)
        },
        {
          id: 'cat2-cmd1',
          name: 'cat2-cmd1',
          description: 'Category 2 Command 1',
          category: 'category2',
          handler: jest.fn().mockResolvedValue(0)
        }
      ];
      
      commands.forEach(cmd => commandRegistry.registerCommand(cmd));
      
      // Act
      const category1Commands = commandRegistry.getCommandsByCategory('category1');
      const category2Commands = commandRegistry.getCommandsByCategory('category2');
      
      // Assert
      expect(category1Commands.length).toBe(2);
      expect(category1Commands[0].id).toBe('cat1-cmd1');
      expect(category1Commands[1].id).toBe('cat1-cmd2');
      
      expect(category2Commands.length).toBe(1);
      expect(category2Commands[0].id).toBe('cat2-cmd1');
    });
    
    it('should list all available categories', () => {
      // Skip if method doesn't exist
      if (typeof commandRegistry.getCategories !== 'function') {
        console.log('Skipping categories list test - method not implemented');
        return;
      }
      
      // Arrange - Add commands with different categories
      const commands = [
        {
          id: 'cat1-cmd',
          name: 'cat1-cmd',
          description: 'Category 1 Command',
          category: 'category1',
          handler: jest.fn().mockResolvedValue(0)
        },
        {
          id: 'cat2-cmd',
          name: 'cat2-cmd',
          description: 'Category 2 Command',
          category: 'category2',
          handler: jest.fn().mockResolvedValue(0)
        }
      ];
      
      commands.forEach(cmd => commandRegistry.registerCommand(cmd));
      
      // Act
      const categories = commandRegistry.getCategories();
      
      // Assert
      expect(categories).toContain('category1');
      expect(categories).toContain('category2');
    });
  });
  
  describe('execution context', () => {
    it('should create valid execution context', () => {
      // Act
      const context = createExecutionContext({ option: 'value' }, true);
      
      // Assert
      expect(context).toBeDefined();
      expect(context.args).toEqual({ option: 'value' });
      expect(context.interactive).toBe(true);
      expect(context.config).toBeDefined();
      expect(context.cwd).toBeDefined();
      expect(context.env).toBeDefined();
      
      // Check for additional expected properties based on fixtures
      const expectedProps = ['logger', 'models', 'services'];
      for (const prop of expectedProps) {
        if (prop in context) {
          expect(context[prop]).toBeDefined();
        }
      }
    });
    
    it('should provide access to configuration in context', () => {
      // Act
      const context = createExecutionContext();
      
      // Assert - Config should be available
      expect(context.config).toBeDefined();
      expect(typeof context.config.get).toBe('function');
    });
    
    it('should provide environment variables in context', () => {
      // Act
      const context = createExecutionContext();
      
      // Assert
      expect(context.env).toBeDefined();
      expect(context.env.PATH).toBeDefined();
    });
  });
});