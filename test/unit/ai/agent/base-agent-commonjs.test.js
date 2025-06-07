/**
 * Unit Tests for the BaseAIAgent class (CommonJS version)
 * 
 * Tests the core functionality of the BaseAIAgent including:
 * - Tool registration and management
 * - Message processing
 * - Tool execution
 * - Thinking process (graph-of-thought reasoning)
 */

// Using CommonJS syntax for better Jest compatibility
const { v4: uuidv4 } = require('uuid');

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

// Mock LogManager module
jest.mock('../../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue(mockLogManager)
  }
}));

// Mock GoTManager
const mockGoTManager = {
  getInstance: jest.fn(),
  createGraph: jest.fn().mockReturnValue('test-graph-id'),
  createNode: jest.fn().mockReturnValue({ id: 'test-node-id', type: 'question', content: 'test question' }),
  getNode: jest.fn().mockReturnValue({ id: 'test-node-id', type: 'question', content: 'test question' }),
  getReadyNodes: jest.fn().mockReturnValue([{ id: 'ready-node-id', type: 'thought', content: 'ready node' }]),
  updateNodeStatus: jest.fn(),
  getNodesByType: jest.fn().mockReturnValue([]),
  getParentNodes: jest.fn().mockReturnValue([])
};

// Mock GoTManager module
jest.mock('../../../../src/tasks/graph/manager', () => ({
  GoTManager: {
    getInstance: jest.fn().mockReturnValue(mockGoTManager)
  }
}));

// Mock ModelProvider
const mockModelProvider = {
  generateResponse: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    content: 'test response',
    toolCalls: []
  })
};

// Mock ModelRegistry
const mockModelRegistry = {
  getInstance: jest.fn(),
  getModelProvider: jest.fn()
};
mockModelRegistry.getInstance.mockReturnValue(mockModelRegistry);
mockModelRegistry.getModelProvider.mockReturnValue(mockModelProvider);

// Mock ModelRegistry module
jest.mock('../../../../src/ai/models/registry', () => {
  return {
    ModelRegistry: mockModelRegistry,
    getModelProvider: jest.fn().mockReturnValue(mockModelProvider)
  };
});

// Import the BaseAIAgent class after mocks are set up
// Note: We're using require instead of import for CommonJS compatibility
const BaseAIAgent = require('../../../../src/ai/agent/base-agent').BaseAIAgent;

describe('BaseAIAgent', () => {
  let agent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create a new agent instance for each test
    agent = new BaseAIAgent();
  });

  describe('Tool Registration', () => {
    it('should register a tool', () => {
      const mockTool = {
        name: 'test-tool',
        description: 'A test tool',
        parameters: []
      };

      agent.registerTool(mockTool);
      const tools = agent.getTools();
      
      expect(tools).toBeDefined();
      expect(tools.length).toBe(1);
      expect(tools[0]).toBe(mockTool);
      expect(mockLogManager.debug).toHaveBeenCalled();
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

  describe('Message Processing', () => {
    const mockContext = {
      conversationId: 'test-conversation',
      userId: 'test-user',
      messages: []
    };
    
    it('should process a message and return a response', async () => {
      const mockMessage = 'Hello, AI!';
      
      const response = await agent.processMessage(mockMessage, mockContext);
      
      expect(mockModelRegistry.getModelProvider).toHaveBeenCalled();
      expect(mockModelProvider.generateResponse).toHaveBeenCalled();
      expect(response).toBeDefined();
      expect(response.content).toBe('test response');
    });
  });

  describe('Thinking Process', () => {
    const mockContext = {
      conversationId: 'test-conversation',
      userId: 'test-user',
      messages: []
    };

    it('should initiate a thinking process', async () => {
      // Mock the continueThinking method to avoid testing its implementation
      agent.continueThinking = jest.fn().mockResolvedValue({
        graphId: 'test-graph-id',
        rootNodeId: 'test-node-id',
        currentNodeId: 'test-node-id',
        completed: false,
        reasoning: [],
        conclusions: []
      });
      
      const question = 'How do I solve this problem?';
      const result = await agent.think(question, mockContext);
      
      expect(mockGoTManager.createGraph).toHaveBeenCalled();
      expect(mockGoTManager.createNode).toHaveBeenCalled();
      expect(agent.continueThinking).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.graphId).toBe('test-graph-id');
    });
  });
});
