// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
const { MockBridge } = require('./mock-bridge');

/**
 * Mock implementation of the Goose MCP Bridge
 */
class MockGooseMCPBridge extends MockBridge {
  constructor(options = {}) {
    super({
      id: 'goose-mcp',
      name: 'Goose MCP Bridge',
      source: 'goose',
      target: 'current',
      ...options
    });
    
    // Default method responses for Goose MCP Bridge
    this.methodResponses = {
      // Model generation method
      generate_completion: (args) => ({
        completion: `Mock response for prompt: ${args.prompt.substring(0, 20)}...`,
        usage: {
          promptTokens: args.prompt.length / 4,
          completionTokens: 100,
          totalTokens: args.prompt.length / 4 + 100
        },
        timing_ms: 1000
      }),
      
      // Task execution method
      execute_task: (args) => ({
        task_id: `task-${Date.now()}`,
        status: 'completed',
        result: {
          message: `Executed task of type ${args.task_type}`
        }
      }),
      
      // Override any custom method responses
      ...(options.methodResponses || {})
    };
  }
}

/**
 * Mock implementation of the IPFS Storage Bridge
 */
class MockIPFSStorageBridge extends MockBridge {
  constructor(options = {}) {
    super({
      id: 'ipfs-storage',
      name: 'IPFS Storage Bridge',
      source: 'ipfs_accelerate',
      target: 'current',
      ...options
    });
    
    // Default method responses for IPFS Storage Bridge
    this.methodResponses = {
      // Storage methods
      store_content: (args) => ({
        cid: `mock-cid-${Buffer.from(args.content.substring(0, 10)).toString('hex')}`,
        size: args.content.length
      }),
      
      retrieve_content: (args) => ({
        content: `Mock content for CID: ${args.cid}`,
        size: 100
      }),
      
      // Override any custom method responses
      ...(options.methodResponses || {})
    };
  }
}

/**
 * Mock implementation of the TaskNet Bridge
 */
class MockTaskNetBridge extends MockBridge {
  constructor(options = {}) {
    super({
      id: 'tasknet',
      name: 'TaskNet Bridge',
      source: 'swissknife_old',
      target: 'current',
      ...options
    });
    
    // Default method responses for TaskNet Bridge
    this.methodResponses = {
      // Task execution methods
      executeModelTask: (args) => ({
        completion: `Mock TaskNet response for: ${args.prompt.substring(0, 20)}...`,
        usage: {
          promptTokens: args.prompt.length / 4,
          completionTokens: 100,
          totalTokens: args.prompt.length / 4 + 100
        },
        timing_ms: 1000
      }),
      
      executeTask: (args) => ({
        taskId: `tasknet-${Date.now()}`,
        status: 'COMPLETED',
        result: {
          data: `Result for task type: ${args.taskType}`
        }
      }),
      
      // Override any custom method responses
      ...(options.methodResponses || {})
    };
  }
}

module.exports = {
  MockGooseMCPBridge,
  MockIPFSStorageBridge,
  MockTaskNetBridge
};