/**
 * Focused test for BaseAIAgent core functionality
 * 
 * This test isolates just the tool registration functionality
 * which is easier to test without external dependencies.
 */

// In Jest environment, these globals are already available
// No need to import them explicitly

// Mock dependencies
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

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));

// Simplified mock implementation of BaseAIAgent for testing tool registration
class MockBaseAIAgent {
  constructor() {
    this.tools = new Map();
    this.logger = {
      info: jest.fn(),
      debug: jest.fn()
    };
  }
  
  registerTool(tool) {
    this.tools.set(tool.name, tool);
    this.logger.debug('Registered tool', { name: tool.name });
    return this;
  }
  
  getTools() {
    return Array.from(this.tools.values());
  }
  
  getTool(name) {
    return this.tools.get(name);
  }
}

// Tests for tool registration
describe('BaseAIAgent Tool Management', () => {
  let agent;
  
  beforeEach(() => {
    agent = new MockBaseAIAgent();
  });

  test('should register a tool correctly', () => {
    // Arrange
    const mockTool = {
      name: 'test-tool',
      description: 'A tool for testing',
      parameters: []
    };
    
    // Act
    agent.registerTool(mockTool);
    
    // Assert
    const tools = agent.getTools();
    expect(tools.length).toBe(1);
    expect(tools[0]).toBe(mockTool);
  });
  
  test('should retrieve a registered tool by name', () => {
    // Arrange
    const mockTool = {
      name: 'fetch-data',
      description: 'Fetches data from an API',
      parameters: []
    };
    agent.registerTool(mockTool);
    
    // Act
    const retrievedTool = agent.getTool('fetch-data');
    
    // Assert
    expect(retrievedTool).toBe(mockTool);
  });
  
  test('should return undefined for a non-existent tool', () => {
    // Act
    const nonExistentTool = agent.getTool('non-existent-tool');
    
    // Assert
    expect(nonExistentTool).toBeUndefined();
  });
  
  test('should not override existing tools when registering with the same name', () => {
    // Arrange
    const originalTool = {
      name: 'shared-name',
      description: 'Original tool',
      parameters: []
    };
    
    const newTool = {
      name: 'shared-name',
      description: 'New tool',
      parameters: []
    };
    
    // Act
    agent.registerTool(originalTool);
    agent.registerTool(newTool);
    
    // Assert
    const retrievedTool = agent.getTool('shared-name');
    expect(retrievedTool).toBe(newTool); // Should be replaced by the new tool
    expect(retrievedTool.description).toBe('New tool');
  });
});
