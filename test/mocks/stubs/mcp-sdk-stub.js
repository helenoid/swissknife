// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Stub for @modelcontextprotocol/sdk
 * 
 * This provides minimal implementations of the MCP SDK classes
 * for tests that depend on the SDK.
 */

/**
 * Client class for MCP
 */
export class Client {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
    this.capabilities = {
      modelInfo: {
        model: 'test-model',
        contextWindow: 4096,
        capabilities: ['chat', 'function-calling']
      },
      tools: [
        {
          name: 'bash',
          description: 'Execute bash commands',
          parameters: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to execute'
              }
            },
            required: ['command']
          }
        },
        {
          name: 'fileRead',
          description: 'Read file contents',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to file'
              }
            },
            required: ['path']
          }
        }
      ]
    };
  }

  /**
   * Connect to MCP server
   */
  async connect() {
    this.connected = true;
    return true;
  }

  /**
   * Get server capabilities
   */
  async getCapabilities() {
    return this.capabilities;
  }

  /**
   * Execute a tool
   */
  async executeTool(name, params) {
    switch (name) {
      case 'bash':
        return {
          stdout: `Mock output for command: ${params.command}`,
          stderr: '',
          exitCode: 0
        };
      case 'fileRead':
        return {
          content: `Mock content for file: ${params.path}`
        };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Generate a response
   */
  async generate(messages, options = {}) {
    return {
      message: {
        role: 'assistant',
        content: `Mock response for messages: ${JSON.stringify(messages)}`
      },
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      }
    };
  }

  /**
   * Close the connection
   */
  async close() {
    this.connected = false;
    return true;
  }
}

/**
 * McpError class for error handling
 */
export class McpError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'McpError';
  }
}

/**
 * Create an MCP client using stdio transport
 */
export function createStdioClient(command, args = [], options = {}) {
  return new Client({ ...options, transport: 'stdio', command, args });
}

/**
 * Create an MCP client using WebSocket transport
 */
export function createWebSocketClient(url, options = {}) {
  return new Client({ ...options, transport: 'websocket', url });
}

/**
 * Create an MCP client using HTTP transport
 */
export function createHttpClient(url, options = {}) {
  return new Client({ ...options, transport: 'http', url });
}

// Export additional utilities and constants
export const MCPErrorCodes = {
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  CONNECTION_CLOSED: -32000
};