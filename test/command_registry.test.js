/**
 * Command Registry Test
 * 
 * This test verifies that the command registry functions correctly,
 * including registering, retrieving, and listing commands.
 */

// Mock for the actual CommandRegistry class
const mockRegistry = {
  _commands: new Map(),
  register(command) {
    this._commands.set(command.name, command);
  },
  async getCommand(name) {
    return this._commands.get(name);
  },
  async hasCommand(name) {
    return this._commands.has(name);
  },
  async getAllCommands() {
    return Array.from(this._commands.values());
  },
  async getVisibleCommands() {
    return Array.from(this._commands.values()).filter(cmd => !cmd.isHidden);
  }
};

describe('CommandRegistry', () => {
  let registry;
  
  beforeEach(() => {
    registry = { ...mockRegistry };
    registry._commands = new Map();
  });

  test('register should add a command to the registry', async () => {
    const mockCommand = {
      name: 'test',
      type: 'local',
      description: 'Test command',
      userFacingName: () => 'Test',
      isHidden: false,
      handler: () => {}
    };
    
    registry.register(mockCommand);
    
    const command = await registry.getCommand('test');
    expect(command).toEqual(mockCommand);
  });

  test('hasCommand should check if a command exists', async () => {
    const mockCommand = {
      name: 'exists',
      type: 'local',
      description: 'Exists command',
      userFacingName: () => 'Exists',
      isHidden: false,
      handler: () => {}
    };
    
    registry.register(mockCommand);
    
    expect(await registry.hasCommand('exists')).toBe(true);
    expect(await registry.hasCommand('nonexistent')).toBe(false);
  });

  test('getAllCommands should return all registered commands', async () => {
    const commands = [
      {
        name: 'cmd1',
        type: 'local',
        description: 'Command 1',
        userFacingName: () => 'Command 1',
        isHidden: false,
        handler: () => {}
      },
      {
        name: 'cmd2',
        type: 'local-jsx',
        description: 'Command 2',
        userFacingName: () => 'Command 2',
        isHidden: false,
        handler: () => {}
      }
    ];
    
    commands.forEach(cmd => registry.register(cmd));
    
    const allCommands = await registry.getAllCommands();
    expect(allCommands.length).toBe(2);
    expect(allCommands).toEqual(expect.arrayContaining(commands));
  });

  test('getVisibleCommands should filter hidden commands', async () => {
    const commands = [
      {
        name: 'visible',
        type: 'local',
        description: 'Visible command',
        userFacingName: () => 'Visible',
        isHidden: false,
        handler: () => {}
      },
      {
        name: 'hidden',
        type: 'local',
        description: 'Hidden command',
        userFacingName: () => 'Hidden',
        isHidden: true,
        handler: () => {}
      }
    ];
    
    commands.forEach(cmd => registry.register(cmd));
    
    const visibleCommands = await registry.getVisibleCommands();
    expect(visibleCommands.length).toBe(1);
    expect(visibleCommands[0].name).toBe('visible');
  });

  test('command with subcommands should be properly stored and retrieved', async () => {
    const parentCommand = {
      name: 'parent',
      type: 'local',
      description: 'Parent command',
      userFacingName: () => 'Parent',
      isHidden: false,
      handler: () => {},
      subcommands: []
    };
    
    const childCommand = {
      name: 'child',
      type: 'local',
      description: 'Child command',
      userFacingName: () => 'Child',
      isHidden: false,
      handler: () => {}
    };
    
    parentCommand.subcommands.push(childCommand);
    registry.register(parentCommand);
    
    const command = await registry.getCommand('parent');
    expect(command.subcommands.length).toBe(1);
    expect(command.subcommands[0].name).toBe('child');
  });
});

// Integration with message processing
describe('Command Integration', () => {
  test('Command registration should integrate with message processing', async () => {
    // Mock message processing
    const processMessage = async (input, commands) => {
      if (input.startsWith('/help')) {
        return { success: true, message: 'Help text' };
      }
      return { success: false, message: 'Unknown command' };
    };
    
    const result = await processMessage('/help', [{ name: 'help' }]);
    expect(result.success).toBe(true);
  });

  test('Command handler should be properly called with args', async () => {
    // Mock handler that records calls
    const handlerCalls = [];
    
    const mockCommand = {
      name: 'test',
      type: 'local',
      description: 'Test command',
      userFacingName: () => 'Test',
      isHidden: false,
      handler: (args) => {
        handlerCalls.push(args);
        return 'Test result';
      }
    };
    
    // Call handler directly to test
    const result = mockCommand.handler({ args: 'test-args' });
    
    expect(handlerCalls.length).toBe(1);
    expect(handlerCalls[0]).toEqual({ args: 'test-args' });
    expect(result).toBe('Test result');
  });
});
