/**
 * Unit Tests for the BaseAIAgent class (`src/ai/agent/base-agent.ts`).
 *
 * These tests verify the BaseAIAgent's core functionality, including:
 * - Tool registration and management
 * - Message processing
 * - Tool execution
 * - Thinking process (graph-of-thought reasoning)
 * 
 * Dependencies are mocked to isolate the BaseAIAgent's behavior.
 */

// --- Mock Setup ---
// Mock dependencies before importing BaseAIAgent

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));

// Mock LogManager
const mockLogManager = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.mock('../../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue(mockLogManager)
  }
}));

// Mock GoTManager
const mockGoTManager = {
  getInstance: jest.fn(),
  createGraph: jest.fn(),
  createNode: jest.fn(),
  getNode: jest.fn(),
  getReadyNodes: jest.fn(),
  updateNodeStatus: jest.fn(),
  getNodesByType: jest.fn(),
  getParentNodes: jest.fn(),
  addEdge: jest.fn()
};
mockGoTManager.getInstance.mockReturnValue(mockGoTManager);
mockGoTManager.createGraph.mockReturnValue('test-graph-id');
mockGoTManager.createNode.mockReturnValue({ id: 'test-node-id', type: 'question', content: 'test question' });
mockGoTManager.getReadyNodes.mockReturnValue([{ id: 'ready-node-id', type: 'thought', content: 'ready node' }]);
mockGoTManager.getNode.mockReturnValue({ id: 'test-node-id', type: 'question', content: 'test question' });
mockGoTManager.getParentNodes.mockReturnValue([]);
mockGoTManager.getNodesByType.mockReturnValue([]);

// Mock ModelRegistry and model provider
const mockModelProvider = {
  generateResponse: jest.fn()
};
const mockModelRegistry = {
  getInstance: jest.fn(),
  getModelProvider: jest.fn()
};
mockModelRegistry.getInstance.mockReturnValue(mockModelRegistry);
mockModelRegistry.getModelProvider.mockReturnValue(mockModelProvider);

// Mock these modules before importing BaseAIAgent
jest.mock('../../../../src/tasks/graph/manager', () => ({
  GoTManager: mockGoTManager
}));

jest.mock('../../../../src/ai/models/registry', () => {
  return {
    ModelRegistry: mockModelRegistry,
    __esModule: true,
    default: mockModelRegistry
  };
});

// --- Import BaseAIAgent ---
// Since we're using CommonJS for this test, change from import to require
const { BaseAIAgent } = require('../../../../src/ai/agent/base-agent');
const { v4: uuidv4 } = require('uuid');

describe('BaseAIAgent', () => {
  let agent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocked UUID
    uuidv4.mockReturnValue('test-uuid');
    // Create a new agent instance for each test
    agent = new BaseAIAgent();
  });

  // --- Tool Registration Tests ---
  describe('Tool Registration', () => {
    it('should register a tool', () => {
      const mockTool = {
        name: 'test-tool',
        description: 'A test tool',
        parameters: []
      };

      agent.registerTool(mockTool);
      const tools = agent.getTools();

      expect(tools).toHaveLength(1);
      expect(tools[0]).toBe(mockTool);
      expect(mockLogManager.debug).toHaveBeenCalledWith('Registered tool', { name: 'test-tool' });
    });

    it('should get a registered tool by name', () => {
      const mockTool = {
        name: 'test-tool',
        description: 'A test tool',
        parameters: []
      };

      agent.registerTool(mockTool);
      const retrievedTool = agent.getTool('test-tool');

      expect(retrievedTool).toBe(mockTool);
    });

    it('should return undefined for non-existent tool', () => {
      const retrievedTool = agent.getTool('non-existent');
      expect(retrievedTool).toBeUndefined();
    });
  });

  // --- Message Processing Tests ---
  describe('Message Processing', () => {
    const mockContext = {
      conversationId: 'test-conversation',
      userId: 'test-user',
      messages: [],
      systemPrompt: 'You are a helpful AI assistant'
    };
    
    it('should process a message and return a response', async () => {
      const mockMessage = 'Hello, AI!';
      
      // Mock the model provider response
      mockModelProvider.generateResponse.mockResolvedValue({
        messageId: 'response-id',
        content: 'Hello, human!',
        toolCalls: []
      });

      const response = await agent.processMessage(mockMessage, mockContext);

      expect(uuidv4).toHaveBeenCalled();
      expect(mockModelRegistry.getModelProvider).toHaveBeenCalled();
      expect(mockModelProvider.generateResponse).toHaveBeenCalledWith({
        messages: [
          {
            id: 'test-uuid',
            role: 'user',
            content: 'Hello, AI!',
            timestamp: expect.any(Number),
            metadata: {}
          }
        ],
        model: 'gpt-4o',
        tools: [],
        systemPrompt: 'You are a helpful AI assistant',
        maxTokens: undefined,
        temperature: undefined
      });
      
      expect(response).toEqual({
        messageId: 'response-id',
        content: 'Hello, human!',
        toolCalls: []
      });
    });

    it('should handle exceptions during message processing', async () => {
      const mockMessage = 'Trigger an error';
      
      // Mock the model provider to throw an error
      mockModelProvider.generateResponse.mockRejectedValue(new Error('Model error'));

      await expect(agent.processMessage(mockMessage, mockContext))
        .rejects.toThrow('Model error');
      
      expect(mockLogManager.error).toHaveBeenCalledWith('Error processing message', expect.any(Error));
    });
  });

  // --- Tool Execution Tests ---
  describe('Tool Execution', () => {
    const mockToolContext = {
      conversationId: 'test-conversation',
      userId: 'test-user',
      toolCallId: 'test-tool-call-id',
      messages: []
    };

    it('should execute a tool successfully', async () => {
      const mockTool = {
        name: 'test-tool',
        description: 'A test tool',
        parameters: [],
        execute: jest.fn().mockResolvedValue('Tool result')
      };
      
      const mockToolCall = {
        id: 'test-tool-call-id',
        name: 'test-tool',
        arguments: { param1: 'value1' },
        status: 'pending'
      };

      // Register the mock tool
      agent.registerTool(mockTool);
      
      // Execute the tool
      const result = await agent.executeTool(mockToolCall, mockToolContext);

      expect(mockTool.execute).toHaveBeenCalledWith({ param1: 'value1' }, mockToolContext);
      expect(result).toBe('Tool result');
      expect(mockToolCall.status).toBe('completed');
      expect(mockToolCall.result).toBe('Tool result');
    });

    it('should handle tool execution errors', async () => {
      const mockTool = {
        name: 'error-tool',
        description: 'A tool that errors',
        parameters: [],
        execute: jest.fn().mockRejectedValue(new Error('Tool execution error'))
      };
      
      const mockToolCall = {
        id: 'test-tool-call-id',
        name: 'error-tool',
        arguments: {},
        status: 'pending'
      };

      // Register the mock tool
      agent.registerTool(mockTool);
      
      // Execute the tool and expect it to throw
      await expect(agent.executeTool(mockToolCall, mockToolContext))
        .rejects.toThrow('Tool execution error');

      expect(mockToolCall.status).toBe('failed');
      expect(mockToolCall.result).toEqual({ error: 'Tool execution error' });
      expect(mockLogManager.error).toHaveBeenCalledWith(
        'Error executing tool', 
        { name: 'error-tool', error: expect.any(Error) }
      );
    });

    it('should throw an error for non-existent tools', async () => {
      const mockToolCall = {
        id: 'test-tool-call-id',
        name: 'non-existent-tool',
        arguments: {},
        status: 'pending'
      };
      
      await expect(agent.executeTool(mockToolCall, mockToolContext))
        .rejects.toThrow('Tool not found: non-existent-tool');
    });
  });

  // --- Thinking Process Tests ---
  describe('Thinking Process', () => {
    const mockContext = {
      conversationId: 'test-conversation',
      userId: 'test-user',
      messages: []
    };

    it('should initiate a thinking process', async () => {
      const question = 'How do I solve this problem?';
      
      // Mock continueThinking method
      agent.continueThinking = jest.fn().mockResolvedValue({
        graphId: 'test-graph-id',
        rootNodeId: 'test-node-id',
        currentNodeId: 'test-node-id',
        completed: false,
        reasoning: [],
        conclusions: []
      });
      
      const result = await agent.think(question, mockContext);
      
      expect(mockGoTManager.createGraph).toHaveBeenCalled();
      expect(mockGoTManager.createNode).toHaveBeenCalledWith('test-graph-id', {
        type: 'question',
        content: question,
        data: {
          conversationId: 'test-conversation',
          userId: 'test-user',
          timestamp: expect.any(Number)
        }
      });
      
      expect(agent.continueThinking).toHaveBeenCalledWith({
        graphId: 'test-graph-id',
        rootNodeId: 'test-node-id',
        currentNodeId: 'test-node-id',
        completed: false,
        reasoning: [],
        conclusions: []
      }, mockContext);
      
      expect(result).toEqual({
        graphId: 'test-graph-id',
        rootNodeId: 'test-node-id',
        currentNodeId: 'test-node-id',
        completed: false,
        reasoning: [],
        conclusions: []
      });
    });

    it('should handle errors during thinking process', async () => {
      mockGoTManager.createGraph.mockImplementation(() => {
        throw new Error('Graph creation error');
      });
      
      await expect(agent.think('Question', mockContext))
        .rejects.toThrow('Graph creation error');
      
      expect(mockLogManager.error).toHaveBeenCalledWith(
        'Error initiating thinking process', 
        expect.any(Error)
      );
    });
  });
});
