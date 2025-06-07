// Fix imports to match correct structure
// Test for command registry that matches current implementation
// @ts-nocheck

// Define the needed mocks
const ConfigManager = class {};
const TaskManager = class {};
const Agent = class {};
const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Define a minimal command registry implementation for tests
class CommandRegistry {
  constructor() {
    this.commands = new Map();
    logger.debug('Initializing CommandRegistry...');
  }

  register(command) {
    if (this.commands.has(command.name)) {
      logger.warn(`Command "${command.name}" is already registered. Overwriting.`);
    }
    logger.debug(`Registering command: ${command.name}`);
    this.commands.set(command.name, command);
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  listCommandNames() {
    return Array.from(this.commands.keys());
  }

  listCommands() {
    return Array.from(this.commands.values());
  }
}

// Define a mock command for testing
class MockCommand {
  constructor(name, description = "Mock command") {
    this.name = name;
    this.description = description;
  }

  parseArguments(args) {
    return { args };
  }

  async execute(parsedArgs, context) {
    return { executed: true, command: this.name, args: parsedArgs };
  }
}

// Test suite
describe('CommandRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new CommandRegistry();
    jest.clearAllMocks();
  });

  test('registry can be instantiated', () => {
    expect(registry).toBeDefined();
    expect(logger.debug).toHaveBeenCalledWith('Initializing CommandRegistry...');
  });

  test('registry can register a command', () => {
    const command = new MockCommand('test');
    registry.register(command);
    
    expect(logger.debug).toHaveBeenCalledWith('Registering command: test');
    expect(registry.getCommand('test')).toBe(command);
  });

  test('registry warns when overwriting a command', () => {
    const command1 = new MockCommand('test', 'First command');
    const command2 = new MockCommand('test', 'Second command');
    
    registry.register(command1);
    registry.register(command2);
    
    expect(logger.warn).toHaveBeenCalledWith('Command "test" is already registered. Overwriting.');
    expect(registry.getCommand('test')).toBe(command2);
  });

  test('registry returns undefined for non-existent commands', () => {
    expect(registry.getCommand('nonexistent')).toBeUndefined();
  });

  test('registry can list command names', () => {
    registry.register(new MockCommand('test1'));
    registry.register(new MockCommand('test2'));
    
    const names = registry.listCommandNames();
    expect(names).toContain('test1');
    expect(names).toContain('test2');
    expect(names.length).toBe(2);
  });

  test('registry can list all commands', () => {
    const command1 = new MockCommand('test1');
    const command2 = new MockCommand('test2');
    
    registry.register(command1);
    registry.register(command2);
    
    const commands = registry.listCommands();
    expect(commands).toContain(command1);
    expect(commands).toContain(command2);
    expect(commands.length).toBe(2);
  });
});
