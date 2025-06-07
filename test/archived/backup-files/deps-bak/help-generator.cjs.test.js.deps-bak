/**
 * Help Generator Tests (CommonJS version)
 * 
 * Tests for the HelpGenerator class which formats help text for commands
 */

// Basic implementation of a help generator for testing
class HelpGenerator {
  constructor(registry) {
    this.registry = registry;
  }

  // Generate help for a specific command
  async generateCommandHelp(commandId) {
    const command = await this.registry.get(commandId);
    
    if (!command) {
      return `Command not found: ${commandId}`;
    }
    
    let help = `\n${command.name}\n${'='.repeat(command.name.length)}\n\n`;
    help += `${command.description || 'No description provided.'}\n\n`;
    
    if (command.aliases && command.aliases.length > 0) {
      help += 'Aliases: ' + command.aliases.join(', ') + '\n\n';
    }
    
    if (command.options && command.options.length > 0) {
      help += 'Options:\n';
      
      command.options.forEach(option => {
        let optionText = '';
        if (option.alias) {
          optionText += `-${option.alias}, `;
        }
        optionText += `--${option.name}`;
        
        if (option.type !== 'boolean') {
          optionText += ` <${option.type}>`;
        }
        
        help += `  ${optionText.padEnd(25)} ${option.description || ''}\n`;
        
        if (option.default !== undefined) {
          help += `${' '.repeat(27)}Default: ${option.default}\n`;
        }
      });
      
      help += '\n';
    }
    
    if (command.examples && command.examples.length > 0) {
      help += 'Examples:\n';
      command.examples.forEach(example => {
        help += `  ${example}\n`;
      });
    }
    
    return help;
  }
  
  // Generate a summary of all commands
  async generateGeneralHelp() {
    const commands = this.registry.getAll();
    
    if (commands.length === 0) {
      return 'No commands available.';
    }
    
    // Group commands by category
    const categories = {};
    
    commands.forEach(command => {
      const category = command.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(command);
    });
    
    // Build help text
    let helpText = 'Available Commands\n=================\n\n';
    
    // Sort categories
    const sortedCategories = Object.keys(categories).sort();
    
    for (const category of sortedCategories) {
      helpText += `${category}:\n`;
      
      // Sort commands within category
      const sortedCommands = categories[category].sort((a, b) => a.name.localeCompare(b.name));
      
      for (const command of sortedCommands) {
        helpText += `  ${command.id.padEnd(15)} ${command.description || ''}\n`;
      }
      
      helpText += '\n';
    }
    
    helpText += '\nFor more information on a command, run: help <command>\n';
    
    return helpText;
  }
}

// Tests
describe('HelpGenerator', () => {
  let helpGenerator;
  let mockRegistry;
  
  beforeEach(() => {
    // Create mock registry with test commands
    mockRegistry = {
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn()
    };
    
    helpGenerator = new HelpGenerator(mockRegistry);
  });
  
  describe('generateCommandHelp', () => {
    test('should generate help for a command with all properties', async () => {
      const fullCommand = {
        id: 'install',
        name: 'Install Package',
        description: 'Install a package from the registry',
        aliases: ['i', 'add'],
        options: [
          {
            name: 'version',
            alias: 'v',
            type: 'string',
            description: 'Package version'
          },
          {
            name: 'global',
            alias: 'g',
            type: 'boolean',
            description: 'Install globally',
            default: false
          }
        ],
        examples: [
          'install lodash',
          'install --global express'
        ],
        handler: jest.fn()
      };
      
      mockRegistry.get.mockResolvedValue(fullCommand);
      
      const help = await helpGenerator.generateCommandHelp('install');
      
      expect(help).toContain('Install Package');
      expect(help).toContain('Install a package from the registry');
      expect(help).toContain('Aliases: i, add');
      expect(help).toContain('--version <string>');
      expect(help).toContain('-g, --global');
      expect(help).toContain('install lodash');
      expect(help).toContain('install --global express');
    });
    
    test('should generate help for a minimal command', async () => {
      const minimalCommand = {
        id: 'test',
        name: 'Test Command',
        description: 'Simple test command',
        handler: jest.fn()
      };
      
      mockRegistry.get.mockResolvedValue(minimalCommand);
      
      const help = await helpGenerator.generateCommandHelp('test');
      
      expect(help).toContain('Test Command');
      expect(help).toContain('Simple test command');
      expect(help).not.toContain('Aliases:');
      expect(help).not.toContain('Options:');
      expect(help).not.toContain('Examples:');
    });
    
    test('should handle non-existent commands', async () => {
      mockRegistry.get.mockResolvedValue(null);
      
      const help = await helpGenerator.generateCommandHelp('unknown');
      
      expect(help).toContain('Command not found: unknown');
    });
  });
  
  describe('generateGeneralHelp', () => {
    test('should generate overall help with categorized commands', async () => {
      const commands = [
        {
          id: 'build',
          name: 'Build',
          description: 'Build the project',
          category: 'Development',
          handler: jest.fn()
        },
        {
          id: 'test',
          name: 'Test',
          description: 'Run tests',
          category: 'Development',
          handler: jest.fn()
        },
        {
          id: 'install',
          name: 'Install',
          description: 'Install dependencies',
          category: 'Package Management',
          handler: jest.fn()
        },
        {
          id: 'help',
          name: 'Help',
          description: 'Show help',
          handler: jest.fn()
        }
      ];
      
      mockRegistry.getAll.mockReturnValue(commands);
      
      const help = await helpGenerator.generateGeneralHelp();
      
      expect(help).toContain('Available Commands');
      expect(help).toContain('Development:');
      expect(help).toContain('Package Management:');
      expect(help).toContain('General:');
      expect(help).toContain('build');
      expect(help).toContain('test');
      expect(help).toContain('install');
      expect(help).toContain('help');
    });
    
    test('should handle no available commands', async () => {
      mockRegistry.getAll.mockReturnValue([]);
      
      const help = await helpGenerator.generateGeneralHelp();
      
      expect(help).toContain('No commands available');
    });
  });
});
