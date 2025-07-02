// setupTests.js - Jest setup file for BaseAIAgent tests
// This file is used to set up the global Jest test environment

// Mock modules that are hard to import or cause issues in tests
jest.mock('../../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

jest.mock('../../../../src/tasks/graph/manager', () => ({
  GoTManager: {
    getInstance: jest.fn().mockReturnValue({
      createGraph: jest.fn().mockReturnValue('test-graph-id'),
      createNode: jest.fn().mockReturnValue({ id: 'test-node-id' }),
      getNode: jest.fn().mockReturnValue({ id: 'test-node-id', type: 'question' }),
      getReadyNodes: jest.fn().mockReturnValue([]),
      updateNodeStatus: jest.fn(),
      getNodesByType: jest.fn().mockReturnValue([]),
      getParentNodes: jest.fn().mockReturnValue([])
    })
  }
}));

// Mock the model registry and provider
const mockModelProvider = {
  generateResponse: jest.fn().mockResolvedValue({
    messageId: 'test-id',
    content: 'test response',
    toolCalls: []
  })
};

jest.mock('../../../../src/ai/models/registry', () => {
  const mockRegistry = {
    getInstance: jest.fn().mockReturnValue({
      getModelProvider: jest.fn().mockReturnValue(mockModelProvider)
    }),
    getModelProvider: jest.fn().mockReturnValue(mockModelProvider)
  };

  return {
    ModelRegistry: mockRegistry,
    default: mockRegistry
  };
});

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));
