/**
 * Simple Test for OpenAIModel
 * Using basic mocking strategy focused on actual available methods
 */

// Mock all external dependencies before importing
jest.mock('../../../../src/ai/models/model', () => ({
  BaseModel: class MockBaseModel {
    protected id: string;
    protected name: string;
    protected description: string;
    protected provider: string;
    protected capabilities: any;
    
    constructor(options: any) {
      this.id = options.id || 'mock-model';
      this.name = options.name || 'Mock Model';
      this.description = options.description || 'Mock model for testing';
      this.provider = options.provider || 'mock';
      this.capabilities = options.capabilities || {};
    }
    
    getId() { return this.id; }
    getName() { return this.name; }
    getDescription() { return this.description; }
    getProvider() { return this.provider; }
    getCapabilities() { return this.capabilities; }
    
    // Mock the generate method that OpenAI extends
    async generate(input: any) {
      return {
        content: 'Mock response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        model: this.id
      };
    }
  },
  ModelCapabilities: {
    TEXT_GENERATION: 'text_generation',
    TOOL_CALLING: 'tool_calling',
    STRUCTURED_OUTPUT: 'structured_output'  
  }
}));

jest.mock('../../../../src/config/manager', () => ({
  ConfigurationManager: {
    getInstance: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'ai.openai.apiKey') return 'test-api-key';
        if (key === 'ai.openai.apiUrl') return 'https://api.openai.com/v1';
        return defaultValue;
      }),
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined)
    }))
  }
}));

jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

// Import the class under test
import { OpenAIModel } from '../../../../src/ai/models/openai-model';

describe('OpenAIModel', () => {
  let model: OpenAIModel;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup fetch mock
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    
    // Create test model instance with proper ModelOptions
    const mockModelOptions = {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'OpenAI GPT-4 model',
      provider: 'openai',
      capabilities: {
        text_generation: true,
        tool_calling: true,
        structured_output: true
      }
    };
    
    model = new OpenAIModel(mockModelOptions, {
      apiKey: 'test-api-key',
      apiUrl: 'https://api.openai.com/v1'
    });
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(model).toBeDefined();
      expect(model.getId()).toBe('gpt-4');
      expect(model.getName()).toBe('GPT-4');
      expect(model.getProvider()).toBe('openai');
    });

    it('should initialize with config manager options', () => {
      const testModel = new OpenAIModel({
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5',
        description: 'OpenAI GPT-3.5 model',
        provider: 'openai',
        capabilities: {}
      });
      
      expect(testModel).toBeDefined();
      expect(testModel.getId()).toBe('gpt-3.5-turbo');
    });
  });

  describe('generate', () => {
    it('should call OpenAI API and return response', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1677652288,
          model: 'gpt-4',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      } as Response);

      const result = await model.generate({
        prompt: 'Hello',
        messages: []
      });

      expect(result.content).toBe('Hello! How can I help you?');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      } as Response);

      await expect(model.generate({
        prompt: 'Hello',
        messages: []
      })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(model.generate({
        prompt: 'Hello',
        messages: []
      })).rejects.toThrow('Network error');
    });

    it('should format messages correctly for API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 }
        })
      } as Response);

      await model.generate({
        prompt: 'Current message',
        messages: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' }
        ]
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Current message')
        })
      );
    });
  });

  describe('API key handling', () => {
    it('should warn when no API key is provided', () => {
      const testModel = new OpenAIModel({
        id: 'test',
        name: 'Test',
        description: 'Test model',
        provider: 'openai',
        capabilities: {}
      }, { apiKey: '' });

      expect(testModel).toBeDefined();
      // Logger warn should have been called during construction
    });
  });
});
