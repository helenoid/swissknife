/**
 * Command Registry Test (CommonJS version)
 * 
 * This test suite verifies the functionality of the CommandRegistry class,
 * including command registration, retrieval, and execution.
 */

// Mock the logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock LogManager
jest.mock('@/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue(mockLogger)
  },
  logger: mockLogger
}));

// Define the command registry and related types for testing
class ExecutionContext {
  constructor(options = {}) {
    this.options = options;
    this.vars = new Map();
    this.flags = new Map();
  }
  
  getVar(name) {
    return this.vars.get(name);
  }
  
  setVar(name, value) {
    this.vars.set(name, value);
    return this;
  }
  
  hasFlag(name) {
    return this.flags.get(name) === true;
  }
  
  setFlag(name, value = true) {
    this.flags.set(name, value);
    return this;
  }
}

class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
  }
  
  register(command) {
    if ('loader' in command) {
      this.commands.set(command.id, command);
    } else {
      this.commands.set(command.id, command);
      
      // Register aliases if any
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => {
          this.aliases.set(alias, command.id);
        });
      }
    }
    
    return this;
  }
  
  unregister(id) {
    if (this.commands.has(id)) {
      const command = this.commands.get(id);
      
      // Remove aliases
      if (!('loader' in command) && command.aliases) {
        command.aliases.forEach(alias => {
          this.aliases.delete(alias);
        });
      }
      
      this.commands.delete(id);
      return true;
    }
    return false;
  }
  
  async get(id) {
    // Check if this is an alias
    if (this.aliases.has(id)) {
      id = this.aliases.get(id);
    }
    
    if (!this.commands.has(id)) {
      return null;
    }
    
    const command = this.commands.get(id);
    
    // Handle lazy-loaded commands
    if ('loader' in command) {
      try {
        const loadedCommand = await command.loader();
        this.commands.set(id, loadedCommand);
        return loadedCommand;
      } catch (error) {
        console.error(`Failed to load command ${id}:`, error);
        return null;
      }
    }
    
    return command;
  }
  
  has(id) {
    return this.commands.has(id) || this.aliases.has(id);
  }
  
  getAll() {
    const commands = [];
    this.commands.forEach(command => {
      if (!('loader' in command)) {
        commands.push(command);
      }
    });
    return commands;
  }
  
  async execute(id, args = {}, context = new ExecutionContext()) {
    const command = await this.get(id);
    
    if (!command) {
      throw new Error(`Command not found: ${id}`);
    }
    
    return await command.handler(args, context);
  }
}

// Tests
describe('CommandRegistry', () => {
  let registry;
  
  beforeEach(() => {
    registry = new CommandRegistry();
    jest.clearAllMocks();
  });
  
  test('should register and retrieve a command', async () => {
    const mockHandler = jest.fn().mockResolvedValue(0);
    const command = {
      id: 'test',
      name: 'Test Command',
      description: 'A test command',
      handler: mockHandler
    };
    
    registry.register(command);
    
    expect(registry.has('test')).toBe(true);
    const retrievedCommand = await registry.get('test');
    expect(retrievedCommand).toBe(command);
    expect(retrievedCommand.name).toBe('Test Command');
  });
  
  test('should handle command aliases', async () => {
    const command = {
      id: 'install',
      name: 'Install Package',
      description: 'Install a package',
      aliases: ['i', 'add'],
      handler: jest.fn().mockResolvedValue(0)
    };
    
    registry.register(command);
    
    expect(registry.has('i')).toBe(true);
    expect(registry.has('add')).toBe(true);
    
    const fromAlias = await registry.get('i');
    expect(fromAlias).toBe(command);
  });
  
  test('should unregister commands', () => {
    const command = {
      id: 'test',
      name: 'Test Command',
      description: 'A test command',
      aliases: ['t'],
      handler: jest.fn()
    };
    
    registry.register(command);
    expect(registry.has('test')).toBe(true);
    expect(registry.has('t')).toBe(true);
    
    const result = registry.unregister('test');
    expect(result).toBe(true);
    expect(registry.has('test')).toBe(false);
    expect(registry.has('t')).toBe(false);
  });
  
  test('should return null for non-existent commands', async () => {
    expect(registry.has('non-existent')).toBe(false);
    expect(await registry.get('non-existent')).toBeNull();
  });
  
  test('should execute commands', async () => {
    const mockHandler = jest.fn().mockResolvedValue(0);
    const command = {
      id: 'test',
      name: 'Test Command',
      description: 'A test command',
      handler: mockHandler
    };
    
    registry.register(command);
    
    const args = { flag: true };
    const context = new ExecutionContext();
    
    const result = await registry.execute('test', args, context);
    
    expect(result).toBe(0);
    expect(mockHandler).toHaveBeenCalledWith(args, context);
  });
  
  test('should throw when executing non-existent command', async () => {
    await expect(registry.execute('non-existent')).rejects.toThrow();
  });
  
  test('should get all registered commands', () => {
    const commands = [
      {
        id: 'cmd1',
        name: 'Command One',
        description: 'First command',
        handler: jest.fn()
      },
      {
        id: 'cmd2',
        name: 'Command Two',
        description: 'Second command',
        handler: jest.fn()
      }
    ];
    
    commands.forEach(cmd => registry.register(cmd));
    
    const allCommands = registry.getAll();
    expect(allCommands).toHaveLength(2);
    expect(allCommands).toContain(commands[0]);
    expect(allCommands).toContain(commands[1]);
  });
});
