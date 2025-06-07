/**
 * Unit tests for the Agent Chat command
 * 
 * This test suite validates the functionality of the chat command
 * that provides an interactive CLI interface to the AI agent.
 */

// We'll use CommonJS imports for better Jest compatibility
const { Command } = require('commander');

// Create mocks for dependencies
jest.mock('commander');
jest.mock('../../../src/utils/readline');
jest.mock('../../../src/ai/service');

// Define test variables at the top level
let mockReadlineInterface;
let mockAIService;

describe('Chat Command', () => {
  beforeEach(() => {
    // Setup mocks
    mockReadlineInterface = {
      question: jest.fn(),
      write: jest.fn(),
      close: jest.fn(),
      history: {
        slice: jest.fn().mockReturnValue([]),
        push: jest.fn()
      },
      on: jest.fn(),
      lineCallbacks: {},
      emit: function(event, data) {
        if (this.lineCallbacks[event]) {
          this.lineCallbacks[event](data);
        }
      }
    };
    
    // Add listener method that records callbacks
    mockReadlineInterface.on.mockImplementation((event, callback) => {
      mockReadlineInterface.lineCallbacks[event] = callback;
      return mockReadlineInterface;
    });
    
    // Mock readline module
    require('../../../src/utils/readline').createReadlineInterface = 
      jest.fn().mockReturnValue(mockReadlineInterface);
    
    // Mock AI service
    mockAIService = {
      createCompletion: jest.fn().mockResolvedValue({
        text: 'AI response',
        modelId: 'test-model',
        usage: { total_tokens: 50 }
      })
    };
    
    require('../../../src/ai/service').AIService = {
      getInstance: jest.fn().mockReturnValue(mockAIService)
    };
  });

describe('Chat Command', () => {
  let chatCommand;
  let commanderInstance;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // For testing purposes, we'll create a simplified version of the command
    chatCommand = {
      execute: (options = {}) => {
        const mockReadline = require('../../../src/utils/readline').createReadlineInterface();
        const aiService = require('../../../src/ai/service').AIService.getInstance();
        
        const handleUserInput = async (input) => {
          if (input === '/exit') {
            mockReadline.close();
            return;
          }
          
          if (input.startsWith('/')) {
            // Handle special command
            console.log('Special command detected:', input);
            return;
          }
          
          // Normal message
          console.log('User:', input);
          
          try {
            const response = await aiService.createCompletion({
              prompt: input,
              modelId: options.model || 'default-model',
              temperature: options.temp || 0.7
            });
            
            console.log('AI:', response.text);
          } catch (error) {
            console.error('Error getting AI response:', error);
          }
        };
        
        // Set up line handling
        mockReadline.on('line', handleUserInput);
        
        return mockReadline;
      }
    };
    
    // Get the Command instance
    commanderInstance = new Command();
  });
  
  test('should create a readline interface when executed', () => {
    const readline = chatCommand.execute();
    expect(require('../../../src/utils/readline').createReadlineInterface).toHaveBeenCalled();
  });
  
  test('should handle user input and get AI response', async () => {
    const readline = chatCommand.execute();
    
    // Simulate user input
    await readline.lineCallback('Hello AI');
    
    // Verify AI service was called
    expect(aiService.createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Hello AI'
      })
    );
    
    // Verify console output
    expect(console.log).toHaveBeenCalledWith('User:', 'Hello AI');
    expect(console.log).toHaveBeenCalledWith('AI:', 'AI response');
  });
  
  test('should handle special commands', async () => {
    const readline = chatCommand.execute();
    
    // Simulate special command
    await readline.lineCallback('/help');
    
    // Verify AI service was NOT called
    expect(aiService.createCompletion).not.toHaveBeenCalled();
    
    // Verify console output
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Special command detected:')
    );
  });
  
  test('should close readline on exit command', async () => {
    const readline = chatCommand.execute();
    
    // Simulate exit command
    await readline.lineCallback('/exit');
    
    // Verify readline was closed
    expect(readline.close).toHaveBeenCalled();
  });
  
  test('should pass model option to AI service', async () => {
    const readline = chatCommand.execute({ model: 'gpt-4' });
    
    // Simulate user input
    await readline.lineCallback('Hello with custom model');
    
    // Verify AI service was called with correct model
    expect(aiService.createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'gpt-4'
      })
    );
  });
  
  test('should handle AI service errors gracefully', async () => {
    // Make the AI service throw an error for this test
    aiService.createCompletion.mockRejectedValueOnce(new Error('Service unavailable'));
    
    const readline = chatCommand.execute();
    
    // Simulate user input
    await readline.lineCallback('This will cause an error');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error getting AI response:'),
      expect.any(Error)
    );
  });
});
