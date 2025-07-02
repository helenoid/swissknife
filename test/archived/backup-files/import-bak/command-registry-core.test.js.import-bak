/**
 * Command Registry Core Test Suite
 * 
 * This test verifies the CommandRegistry implementation works correctly
 * without dependencies on other modules.
 */

// Mocks for dependencies
jest.mock('../src/utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Import the CommandRegistry
const { CommandRegistry } = require('../src/command-registry.ts');

// Create a basic mock Command implementation
class MockCommand {
  constructor(name, description = 'Mock command') {
    this.name = name;
    this.description = description;
  }
  
  parseArguments(args) {
    return { parsed: true, args };
  }
  
  async execute(parsedArgs, context) {
    return `Executed ${this.name} with ${JSON.stringify(parsedArgs)}`;
  }
}

describe('CommandRegistry Core', () => {
  let registry;
  
  beforeEach(() => {
    registry = new CommandRegistry();
  });
  
  test('registry can be instantiated', () => {
    expect(registry).toBeDefined();
    expect(registry).toBeInstanceOf(CommandRegistry);
  });
  
  test('registry can register a command', () => {
    const command = new MockCommand('test');
    registry.register(command);
    expect(registry.getCommand('test')).toBe(command);
  });
  
  test('registry returns undefined for non-existent commands', () => {
    expect(registry.getCommand('nonexistent')).toBeUndefined();
  });
  
  test('registry lists registered command names', () => {
    const command1 = new MockCommand('test1');
    const command2 = new MockCommand('test2');
    registry.register(command1);
    registry.register(command2);
    
    const names = registry.listCommandNames();
    expect(names).toContain('test1');
    expect(names).toContain('test2');
    expect(names.length).toBe(2);
  });
  
  test('registry lists all registered commands', () => {
    const command1 = new MockCommand('test1');
    const command2 = new MockCommand('test2');
    registry.register(command1);
    registry.register(command2);
    
    const commands = registry.listCommands();
    expect(commands).toContain(command1);
    expect(commands).toContain(command2);
    expect(commands.length).toBe(2);
  });
  
  test('registry overwrites existing commands with warning', () => {
    const command1 = new MockCommand('test', 'First command');
    const command2 = new MockCommand('test', 'Second command');
    
    registry.register(command1);
    registry.register(command2);
    
    const retrieved = registry.getCommand('test');
    expect(retrieved).toBe(command2);
    expect(retrieved).not.toBe(command1);
  });
});
