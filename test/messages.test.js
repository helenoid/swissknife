/**
 * Messages Module Test
 * 
 * This test verifies that the messages module correctly processes user input,
 * especially slash commands, and handles null/undefined values properly.
 */

// Mock dependencies
const mockContext = {
  options: {
    commands: []
  },
  setForkConvoWithMessagesOnTheNextRender: jest.fn()
};

const mockSetToolJSX = jest.fn();

// Mock commands module
jest.mock('../src/commands.js', () => ({
  getCommand: jest.fn(),
  hasCommand: jest.fn()
}));

const { getCommand, hasCommand } = require('../src/commands.js');

describe('Messages Module', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    hasCommand.mockReset();
    getCommand.mockReset();
    mockSetToolJSX.mockReset();
    mockContext.setForkConvoWithMessagesOnTheNextRender.mockReset();
  });

  test('processUserInput should handle slash commands correctly', async () => {
    // Import the actual module with its dependencies mocked
    const { processUserInput } = require('../src/utils/messages.js');

    // Mock hasCommand to return true for "help"
    hasCommand.mockResolvedValue(true);

    // Mock getCommand to return a simple command
    getCommand.mockResolvedValue({
      name: 'help',
      type: 'local',
      description: 'Help command',
      userFacingName: () => 'Help',
      isHidden: false,
      handler: ({ args }) => 'Help text for ' + args
    });

    // Test with a slash command
    const result = await processUserInput('/help with args', 'prompt', mockSetToolJSX, mockContext, null);

    // Verify hasCommand was called with the right command name
    expect(hasCommand).toHaveBeenCalledWith('help');
    
    // Verify getCommand was called if hasCommand returned true
    expect(getCommand).toHaveBeenCalledWith('help');
    
    // Expect result to be an array of messages
    expect(Array.isArray(result)).toBe(true);
  });

  test('processUserInput should handle undefined getMessagesForSlashCommand result', async () => {
    // Mock implementation to test the fix for the bug
    jest.mock('../src/utils/messages.js', () => {
      // Save the original module
      const originalModule = jest.requireActual('../src/utils/messages.js');
      
      // Return a modified module
      return {
        ...originalModule,
        // Override the function we want to test
        getMessagesForSlashCommand: jest.fn().mockResolvedValue(undefined)
      };
    });

    // Re-import with our mock
    const { processUserInput, getMessagesForSlashCommand } = require('../src/utils/messages.js');

    // Mock hasCommand to return true
    hasCommand.mockResolvedValue(true);

    // Test with a slash command that will result in undefined from getMessagesForSlashCommand
    const result = await processUserInput('/problematic', 'prompt', mockSetToolJSX, mockContext, null);

    // Verify our fix works - should handle undefined gracefully
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0); // Our fix returns an empty array when undefined
  });

  test('getUnresolvedToolUseIDs handles empty messages array', () => {
    const { getUnresolvedToolUseIDs } = require('../src/utils/messages.js');
    
    // Call with an empty array
    const result = getUnresolvedToolUseIDs([]);
    
    // Should return an empty Set without errors
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  test('createUserMessage creates valid message object', () => {
    const { createUserMessage } = require('../src/utils/messages.js');
    
    // Create a user message
    const message = createUserMessage('Test message');
    
    // Verify structure
    expect(message.type).toBe('user');
    expect(message.message.role).toBe('user');
    expect(message.message.content).toBe('Test message');
    expect(typeof message.uuid).toBe('string');
  });

  test('isNotEmptyMessage correctly identifies empty messages', () => {
    const { isNotEmptyMessage, NO_CONTENT_MESSAGE } = require('../src/utils/messages.js');
    
    // Test with various message types
    expect(isNotEmptyMessage({ 
      type: 'user', 
      message: { content: '' } 
    })).toBe(false);
    
    expect(isNotEmptyMessage({ 
      type: 'assistant', 
      message: { content: [{ type: 'text', text: NO_CONTENT_MESSAGE }] } 
    })).toBe(false);
    
    expect(isNotEmptyMessage({ 
      type: 'progress' 
    })).toBe(true);
    
    expect(isNotEmptyMessage({ 
      type: 'user', 
      message: { content: 'Not empty' } 
    })).toBe(true);
  });
});
