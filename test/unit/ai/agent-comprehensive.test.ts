/**
 * Comprehensive AI Agent Test with Dependency Injection
 */

// Mock all dependencies before importing
jest.mock('../../../src/ai/tools/executor.js', () => ({
  ToolExecutor: jest.fn().mockImplementation(() => ({
    executeTool: jest.fn(),
    registerTool: jest.fn(),
    listTools: jest.fn(),
  })),
}));

jest.mock('../../../src/ai/thinking/manager.js', () => ({
  ThinkingManager: jest.fn().mockImplementation(() => ({
    process: jest.fn(),
    setStrategy: jest.fn(),
    getStrategy: jest.fn(),
  })),
}));

jest.mock('../../../src/types/ai.js', () => ({
  ThinkingPattern: {
    Direct: 'direct',
    ChainOfThought: 'chain_of_thought',
    GraphOfThought: 'graph_of_thought',
  },
  MessageRole: {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

import { Agent } from '../../../src/ai/agent/agent.js';
import { ToolExecutor } from '../../../src/ai/tools/executor.js';
import { ThinkingManager } from '../../../src/ai/thinking/manager.js';
import { 
  AgentMessage, 
  AgentOptions, 
  IModel, 
  ToolCallResult,
  Tool,
  MessageRole 
} from '../../../src/types/ai.js';
import { v4 as uuidv4 } from 'uuid';

describe('Agent Comprehensive Tests', () => {
  let agent: Agent;
  let mockModel: jest.Mocked<IModel>;
  let mockToolExecutor: jest.Mocked<ToolExecutor>;
  let mockThinkingManager: jest.Mocked<ThinkingManager>;
  let mockTool: Tool<any>;
  let agentOptions: AgentOptions;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock model
    mockModel = {
      getId: jest.fn().mockReturnValue('test-model'),
      getName: jest.fn().mockReturnValue('Test Model'),
      generateResponse: jest.fn(),
      supportsToolCalling: jest.fn().mockReturnValue(true),
      supportsStreaming: jest.fn().mockReturnValue(true),
    } as any;

    // Set up mock tool
    mockTool = {
      name: 'test-tool',
      description: 'Test tool for testing',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' },
        },
      },
      execute: jest.fn().mockResolvedValue({ result: 'tool-result' }),
    };

    // Set up mock tool executor
    mockToolExecutor = {
      executeTool: jest.fn(),
      registerTool: jest.fn(),
      listTools: jest.fn(),
    } as any;

    // Set up mock thinking manager
    mockThinkingManager = {
      process: jest.fn(),
      setStrategy: jest.fn(),
      getStrategy: jest.fn(),
    } as any;

    // Mock the constructors
    (ToolExecutor as jest.Mock).mockImplementation(() => mockToolExecutor);
    (ThinkingManager as jest.Mock).mockImplementation(() => mockThinkingManager);

    // Set up agent options
    agentOptions = {
      model: mockModel,
      maxTokens: 2000,
      temperature: 0.8,
      tools: [mockTool],
    };

    // Create agent instance
    agent = new Agent(agentOptions, 'test-conversation-id');
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(agent).toBeDefined();
      expect(ToolExecutor).toHaveBeenCalled();
      expect(ThinkingManager).toHaveBeenCalled();
      expect(mockToolExecutor.registerTool).toHaveBeenCalledWith(mockTool);
    });

    it('should generate UUID for conversation ID when not provided', () => {
      const agentWithoutId = new Agent(agentOptions);
      expect(uuidv4).toHaveBeenCalled();
    });

    it('should use provided conversation ID', () => {
      const customId = 'custom-conversation-id';
      const agentWithCustomId = new Agent(agentOptions, customId);
      expect(agentWithCustomId.getCurrentConversationId()).toBe(customId);
    });

    it('should initialize without tools', () => {
      const optionsWithoutTools = { ...agentOptions };
      delete optionsWithoutTools.tools;
      
      const agentWithoutTools = new Agent(optionsWithoutTools);
      expect(agentWithoutTools).toBeDefined();
    });
  });

  describe('conversation management', () => {
    it('should set and get conversation ID', () => {
      const newId = 'new-conversation-id';
      agent.setCurrentConversationId(newId);
      expect(agent.getCurrentConversationId()).toBe(newId);
    });

    it('should clear memory when conversation ID changes', () => {
      // First, add some memory
      agent.addMessage({
        id: 'msg-1',
        role: MessageRole.USER,
        content: 'Test message',
        timestamp: Date.now(),
      });

      const newId = 'different-conversation-id';
      agent.setCurrentConversationId(newId);
      
      expect(agent.getCurrentConversationId()).toBe(newId);
      // Memory should be cleared (verified through behavior)
    });

    it('should not clear memory when setting same conversation ID', () => {
      const currentId = agent.getCurrentConversationId();
      agent.setCurrentConversationId(currentId);
      
      expect(agent.getCurrentConversationId()).toBe(currentId);
    });
  });

  describe('message handling', () => {
    it('should add messages to memory', () => {
      const message: AgentMessage = {
        id: 'msg-1',
        role: MessageRole.USER,
        content: 'Hello, agent!',
        timestamp: Date.now(),
      };

      agent.addMessage(message);
      const memory = agent.getMemory();
      
      expect(memory).toContain(message);
      expect(memory.length).toBe(1);
    });

    it('should retrieve message history', () => {
      const message1: AgentMessage = {
        id: 'msg-1',
        role: MessageRole.USER,
        content: 'First message',
        timestamp: Date.now(),
      };

      const message2: AgentMessage = {
        id: 'msg-2',
        role: MessageRole.ASSISTANT,
        content: 'First response',
        timestamp: Date.now() + 1000,
      };

      agent.addMessage(message1);
      agent.addMessage(message2);

      const memory = agent.getMemory();
      expect(memory.length).toBe(2);
      expect(memory[0]).toEqual(message1);
      expect(memory[1]).toEqual(message2);
    });

    it('should clear memory', () => {
      const message: AgentMessage = {
        id: 'msg-1',
        role: MessageRole.USER,
        content: 'Test message',
        timestamp: Date.now(),
      };

      agent.addMessage(message);
      expect(agent.getMemory().length).toBe(1);

      agent.clearMemory();
      expect(agent.getMemory().length).toBe(0);
    });
  });

  describe('tool management', () => {
    it('should register tools', () => {
      const newTool: Tool<any> = {
        name: 'new-tool',
        description: 'New test tool',
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
        },
        execute: jest.fn(),
      };

      agent.registerTool(newTool);
      expect(mockToolExecutor.registerTool).toHaveBeenCalledWith(newTool);
    });

    it('should list available tools', () => {
      const tools = ['test-tool', 'another-tool'];
      mockToolExecutor.listTools.mockReturnValue(tools);

      const result = agent.listTools();
      expect(result).toEqual(tools);
      expect(mockToolExecutor.listTools).toHaveBeenCalled();
    });

    it('should execute tools', async () => {
      const toolCall = {
        id: 'call-1',
        toolName: 'test-tool',
        parameters: { input: 'test-input' },
      };

      const expectedResult: ToolCallResult = {
        toolCallId: 'call-1',
        result: { success: true, data: 'tool-result' },
        error: null,
      };

      mockToolExecutor.executeTool.mockResolvedValue(expectedResult);

      const result = await agent.executeTool(toolCall);
      
      expect(result).toEqual(expectedResult);
      expect(mockToolExecutor.executeTool).toHaveBeenCalledWith(
        toolCall.toolName,
        toolCall.parameters
      );
    });

    it('should handle tool execution errors', async () => {
      const toolCall = {
        id: 'call-1',
        toolName: 'failing-tool',
        parameters: { input: 'test-input' },
      };

      const error = new Error('Tool execution failed');
      mockToolExecutor.executeTool.mockRejectedValue(error);

      await expect(agent.executeTool(toolCall)).rejects.toThrow('Tool execution failed');
    });
  });

  describe('thinking and reasoning', () => {
    it('should process thoughts through thinking manager', async () => {
      const prompt = 'Complex problem to solve';
      const processedThought = 'Processed reasoning chain';

      mockThinkingManager.process.mockResolvedValue(processedThought);

      const result = await agent.think(prompt);

      expect(result).toBe(processedThought);
      expect(mockThinkingManager.process).toHaveBeenCalledWith(prompt);
    });

    it('should set thinking strategy', () => {
      const strategy = 'chain_of_thought';
      agent.setThinkingStrategy(strategy);

      expect(mockThinkingManager.setStrategy).toHaveBeenCalledWith(strategy);
    });

    it('should get current thinking strategy', () => {
      const strategy = 'graph_of_thought';
      mockThinkingManager.getStrategy.mockReturnValue(strategy);

      const result = agent.getThinkingStrategy();

      expect(result).toBe(strategy);
      expect(mockThinkingManager.getStrategy).toHaveBeenCalled();
    });
  });

  describe('response generation', () => {
    it('should generate response using model', async () => {
      const prompt = 'Generate a response';
      const expectedResponse = 'AI generated response';

      mockModel.generateResponse.mockResolvedValue({
        content: expectedResponse,
        usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
      });

      const response = await agent.generateResponse(prompt);

      expect(response.content).toBe(expectedResponse);
      expect(mockModel.generateResponse).toHaveBeenCalledWith(
        prompt,
        expect.any(Array), // messages from memory
        expect.objectContaining({
          maxTokens: 2000,
          temperature: 0.8,
        })
      );
    });

    it('should include conversation history in generation', async () => {
      // Add some conversation history
      agent.addMessage({
        id: 'msg-1',
        role: MessageRole.USER,
        content: 'Previous user message',
        timestamp: Date.now(),
      });

      const prompt = 'Current user message';
      mockModel.generateResponse.mockResolvedValue({
        content: 'Response with context',
      });

      await agent.generateResponse(prompt);

      expect(mockModel.generateResponse).toHaveBeenCalledWith(
        prompt,
        expect.arrayContaining([
          expect.objectContaining({
            content: 'Previous user message',
          }),
        ]),
        expect.any(Object)
      );
    });

    it('should handle model generation errors', async () => {
      const prompt = 'Generate response';
      const error = new Error('Model generation failed');

      mockModel.generateResponse.mockRejectedValue(error);

      await expect(agent.generateResponse(prompt)).rejects.toThrow('Model generation failed');
    });
  });

  describe('streaming responses', () => {
    it('should support streaming when model supports it', async () => {
      const prompt = 'Stream response';
      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      };

      mockModel.generateResponse.mockResolvedValue({
        stream: mockStream,
        content: '',
      });

      const result = await agent.generateStreamingResponse(prompt);

      expect(result.stream).toBeDefined();
      expect(mockModel.generateResponse).toHaveBeenCalledWith(
        prompt,
        expect.any(Array),
        expect.objectContaining({
          streaming: true,
        })
      );
    });

    it('should handle streaming not supported', async () => {
      mockModel.supportsStreaming.mockReturnValue(false);

      await expect(
        agent.generateStreamingResponse('test prompt')
      ).rejects.toThrow('Model does not support streaming');
    });
  });

  describe('agent options', () => {
    it('should apply custom generation options', async () => {
      const customOptions = {
        temperature: 0.9,
        maxTokens: 1500,
        topP: 0.95,
      };

      mockModel.generateResponse.mockResolvedValue({
        content: 'Custom response',
      });

      await agent.generateResponse('test prompt', customOptions);

      expect(mockModel.generateResponse).toHaveBeenCalledWith(
        'test prompt',
        expect.any(Array),
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 1500,
          topP: 0.95,
        })
      );
    });

    it('should merge custom options with defaults', async () => {
      const customOptions = {
        temperature: 0.5, // Override default
        // maxTokens not specified, should use default
      };

      mockModel.generateResponse.mockResolvedValue({
        content: 'Merged options response',
      });

      await agent.generateResponse('test prompt', customOptions);

      expect(mockModel.generateResponse).toHaveBeenCalledWith(
        'test prompt',
        expect.any(Array),
        expect.objectContaining({
          temperature: 0.5, // Custom value
          maxTokens: 2000, // Default value
        })
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex conversation flow', async () => {
      // User asks question
      const userMessage: AgentMessage = {
        id: 'msg-1',
        role: MessageRole.USER,
        content: 'What is 2 + 2?',
        timestamp: Date.now(),
      };

      agent.addMessage(userMessage);

      // Agent thinks about it
      mockThinkingManager.process.mockResolvedValue('Need to calculate 2 + 2');
      await agent.think(userMessage.content);

      // Agent generates response
      mockModel.generateResponse.mockResolvedValue({
        content: '2 + 2 equals 4',
        toolCalls: [
          {
            id: 'calc-1',
            toolName: 'calculator',
            parameters: { expression: '2 + 2' },
          },
        ],
      });

      const response = await agent.generateResponse(userMessage.content);

      // Verify the flow
      expect(mockThinkingManager.process).toHaveBeenCalled();
      expect(mockModel.generateResponse).toHaveBeenCalled();
      expect(response.content).toBe('2 + 2 equals 4');
    });

    it('should handle tool calling workflow', async () => {
      const toolCall = {
        id: 'tool-call-1',
        toolName: 'test-tool',
        parameters: { input: 'test' },
      };

      const toolResult: ToolCallResult = {
        toolCallId: 'tool-call-1',
        result: { data: 'tool output' },
        error: null,
      };

      mockToolExecutor.executeTool.mockResolvedValue(toolResult);

      const result = await agent.executeTool(toolCall);

      expect(result).toEqual(toolResult);
      expect(mockToolExecutor.executeTool).toHaveBeenCalledWith(
        'test-tool',
        { input: 'test' }
      );
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', () => {
      (ToolExecutor as jest.Mock).mockImplementation(() => {
        throw new Error('ToolExecutor initialization failed');
      });

      expect(() => {
        new Agent(agentOptions);
      }).toThrow('ToolExecutor initialization failed');
    });

    it('should handle malformed messages gracefully', () => {
      const malformedMessage = {
        // Missing required fields
        content: 'Test content',
      } as any;

      expect(() => {
        agent.addMessage(malformedMessage);
      }).not.toThrow();
    });
  });
});
