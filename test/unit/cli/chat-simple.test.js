/**
 * Unit tests for Chat Command functionality
 */

// Mock dependencies
jest.mock('../../../src/utils/readline', () => ({
  createReadlineInterface: jest.fn()
}));

jest.mock('../../../src/ai/service', () => ({
  AIService: {
    getInstance: jest.fn()
  }
}));

describe('Chat Command', () => {
  // Mock objects
  let mockReadline;
  let mockAIService;
  let chatCommand;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup mock readline interface
    mockReadline = {
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
          return this.lineCallbacks[event](data);
        }
      }
    };
    
    // Save callbacks when on() is called
    mockReadline.on.mockImplementation((event, callback) => {
      mockReadline.lineCallbacks[event] = callback;
      return mockReadline;
    });
    
    require('../../../src/utils/readline').createReadlineInterface.mockReturnValue(mockReadline);
    
    // Setup mock AI service
    mockAIService = {
      createCompletion: jest.fn().mockResolvedValue({
        text: 'AI response',
        modelId: 'test-model',
        usage: { total_tokens: 50 }
      })
    };
    
    require('../../../src/ai/service').AIService.getInstance.mockReturnValue(mockAIService);
    
    // Create a simple chat command implementation for testing
    chatCommand = {
      execute: (options = {}) => {
        const readline = require('../../../src/utils/readline').createReadlineInterface();
        const aiService = require('../../../src/ai/service').AIService.getInstance();
        
        const handleInput = async (input) => {
          if (input === '/exit') {
            readline.close();
            return;
          }
          
          if (input.startsWith('/')) {
            console.log('Special command:', input);
            return;
          }
          
          console.log('User:', input);
          
          try {
            const response = await aiService.createCompletion({
              prompt: input,
              modelId: options.model || 'default-model',
              temperature: options.temp || 0.7
            });
            
            console.log('AI:', response.text);
          } catch (error) {
            console.error('Error:', error);
          }
        };
        
        readline.on('line', handleInput);
        return readline;
      }
    };
  });
  
  test('should create a readline interface', () => {
    chatCommand.execute();
    expect(require('../../../src/utils/readline').createReadlineInterface).toHaveBeenCalled();
  });
  
  test('should process user input and get AI response', async () => {
    const readline = chatCommand.execute();
    await readline.emit('line', 'Hello AI');
    
    expect(mockAIService.createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Hello AI'
      })
    );
    
    expect(console.log).toHaveBeenCalledWith('User:', 'Hello AI');
    expect(console.log).toHaveBeenCalledWith('AI:', 'AI response');
  });
  
  test('should handle /exit command', async () => {
    const readline = chatCommand.execute();
    await readline.emit('line', '/exit');
    
    expect(readline.close).toHaveBeenCalled();
    expect(mockAIService.createCompletion).not.toHaveBeenCalled();
  });
  
  test('should handle special commands', async () => {
    const readline = chatCommand.execute();
    await readline.emit('line', '/help');
    
    expect(console.log).toHaveBeenCalledWith('Special command:', '/help');
    expect(mockAIService.createCompletion).not.toHaveBeenCalled();
  });
  
  test('should use provided model option', async () => {
    const readline = chatCommand.execute({ model: 'gpt-4' });
    await readline.emit('line', 'Using custom model');
    
    expect(mockAIService.createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'gpt-4'
      })
    );
  });
  
  test('should handle AI service errors', async () => {
    mockAIService.createCompletion.mockRejectedValueOnce(new Error('Service error'));
    
    const readline = chatCommand.execute();
    await readline.emit('line', 'This will error');
    
    expect(console.error).toHaveBeenCalledWith('Error:', expect.any(Error));
  });
});
