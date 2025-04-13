/**
 * Unit tests for Command Registry using mocks
 */
const { MockConfigurationManager } = require('../../mocks/config/mock-config');

// Import the component to test (this path may need adjustment)
const { CommandRegistry } = require('../../../src/command-registry');

// Use Jest for testing
describe('CommandRegistry', () => {
  let registry;
  let mockConfig;
  
  // Set up before each test
  beforeEach(() => {
    // Create mock dependencies
    mockConfig = new MockConfigurationManager({
      initialData: {
        commands: {
          enabled: ['test1', 'test2']
        }
      }
    });
    
    // Create component instance with mocked dependencies
    registry = new CommandRegistry({
      configManager: mockConfig
    });
  });
  
  test('should register a command successfully', () => {
    // Create a test command
    const mockHandler = jest.fn().mockResolvedValue(0);
    const command = {
      id: 'test',
      name: 'test',
      description: 'Test command',
      handler: mockHandler
    };
    
    // Register the command
    registry.registerCommand(command);
    
    // Verify the command was registered
    const retrievedCommand = registry.getCommand('test');
    expect(retrievedCommand).toBeDefined();
    expect(retrievedCommand.id).toBe('test');
    expect(retrievedCommand.handler).toBe(mockHandler);
  });
  
  test('should retrieve commands by category', () => {
    // Create test commands
    const command1 = {
      id: 'test1',
      name: 'test1',
      description: 'Test command 1',
      category: 'category1',
      handler: jest.fn()
    };
    
    const command2 = {
      id: 'test2',
      name: 'test2',
      description: 'Test command 2',
      category: 'category1',
      handler: jest.fn()
    };
    
    const command3 = {
      id: 'test3',
      name: 'test3',
      description: 'Test command 3',
      category: 'category2',
      handler: jest.fn()
    };
    
    // Register commands
    registry.registerCommand(command1);
    registry.registerCommand(command2);
    registry.registerCommand(command3);
    
    // Retrieve by category
    const category1Commands = registry.getCommandsByCategory('category1');
    expect(category1Commands).toHaveLength(2);
    expect(category1Commands[0].id).toBe('test1');
    expect(category1Commands[1].id).toBe('test2');
  });
  
  test('should execute command handler', async () => {
    // Create a test command with mock handler
    const mockHandler = jest.fn().mockResolvedValue(42);
    const command = {
      id: 'test',
      name: 'test',
      description: 'Test command',
      handler: mockHandler
    };
    
    // Register command
    registry.registerCommand(command);
    
    // Create mock execution context
    const mockContext = { foo: 'bar' };
    
    // Execute command
    const result = await registry.executeCommand('test', { option: 'value' }, mockContext);
    
    // Verify handler was called with correct arguments
    expect(mockHandler).toHaveBeenCalledWith({ option: 'value' }, mockContext);
    expect(result).toBe(42);
  });
  
  test('should handle command execution errors', async () => {
    // Create a test command that throws an error
    const mockError = new Error('Test error');
    const mockHandler = jest.fn().mockRejectedValue(mockError);
    const command = {
      id: 'error-command',
      name: 'error',
      description: 'Error command',
      handler: mockHandler
    };
    
    // Register command
    registry.registerCommand(command);
    
    // Execute command and verify error handling
    try {
      await registry.executeCommand('error-command', {}, {});
      // Should not reach here
      fail('Expected error was not thrown');
    } catch (error) {
      expect(error).toBe(mockError);
    }
  });
});