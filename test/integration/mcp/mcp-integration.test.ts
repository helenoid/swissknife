/**
 * Integration tests for MCP server components
 */

import { startMCPServer } from '../../../src/entrypoints/mcp';
import { addMcpServer, removeMcpServer, getClients, getMCPTools } from '../../../src/services/mcpClient';
import { getMcprcConfig } from '../../../src/utils/config';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getCwd } from '../../../src/utils/state';
import { Tool } from '../../../src/Tool';

// Create a temporary directory for tests
const TEST_DIR = join(__dirname, '..', '..', 'fixtures', 'mcp-test');

// Mock child process spawning for the MCP server
jest.mock('child_process', () => {
  const origModule = jest.requireActual('child_process');
  return {
    ...origModule,
    spawn: jest.fn(() => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              // Simulate process output
              setTimeout(() => callback(Buffer.from('MCP server started')), 100);
            }
            return mockProcess.stdout;
          }),
          pipe: jest.fn(),
        },
        stderr: {
          on: jest.fn(),
          pipe: jest.fn(),
        },
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            // Don't trigger error
          } else if (event === 'close') {
            // Don't trigger close
          }
          return mockProcess;
        }),
        kill: jest.fn(),
        pid: 12345,
      };
      return mockProcess;
    }),
  };
});

// Mock StdioClientTransport and SSEClientTransport
jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
  return {
    StdioClientTransport: class StdioClientTransport {
      stderr = {
        on: jest.fn()
      };
      
      constructor() {
        // Mock constructor
      }
      
      connect() {
        return Promise.resolve();
      }
      
      disconnect() {
        return Promise.resolve();
      }
      
      sendMessage() {
        return Promise.resolve();
      }
    }
  };
});

jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => {
  return {
    SSEClientTransport: class SSEClientTransport {
      constructor() {
        // Mock constructor
      }
      
      connect() {
        return Promise.resolve();
      }
      
      disconnect() {
        return Promise.resolve();
      }
      
      sendMessage() {
        return Promise.resolve();
      }
    }
  };
});

// Mock Client
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: class Client {
      constructor() {
        // Mock constructor
      }
      
      connect() {
        return Promise.resolve();
      }
      
      getServerCapabilities() {
        return Promise.resolve({
          tools: true,
          prompts: true
        });
      }
      
      async request(req, schema) {
        if (req.method === 'tools/list') {
          return {
            tools: [
              {
                name: 'test-tool',
                description: 'A test tool',
                inputSchema: {
                  type: 'object',
                  properties: {
                    input: {
                      type: 'string'
                    }
                  }
                }
              }
            ]
          };
        }
        
        if (req.method === 'prompts/list') {
          return {
            prompts: [
              {
                name: 'test-prompt',
                description: 'A test prompt',
                arguments: {
                  arg1: { name: 'arg1' }
                }
              }
            ]
          };
        }
        
        return {};
      }
      
      async callTool(params) {
        return {
          content: [
            {
              type: 'text',
              text: `Result for ${params.name} with args: ${JSON.stringify(params.arguments)}`
            }
          ]
        };
      }
      
      async getPrompt(params) {
        return {
          messages: [
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `Prompt result for ${params.name} with args: ${JSON.stringify(params.arguments)}`
              }
            }
          ]
        };
      }
    }
  };
});

// Mock setCwd 
jest.mock('../../../src/utils/state', () => ({
  ...jest.requireActual('../../../src/utils/state'),
  setCwd: jest.fn(),
  getCwd: jest.fn(() => TEST_DIR),
}));

// Mock getSlowAndCapableModel
jest.mock('../../../src/utils/model', () => ({
  getSlowAndCapableModel: jest.fn().mockResolvedValue({
    name: 'test-model',
    provider: 'test-provider'
  })
}));

// Set up our test framework
describe('MCP Server Integration', () => {
  beforeAll(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Set up test environment
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(() => {
    // Clean up
    delete process.env.NODE_ENV;
  });
  
  describe('MCP Server and Client Integration', () => {
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
    });
    
    it('should be able to add and remove MCP servers', () => {
      // Define test server
      const serverConfig = {
        type: 'stdio' as const,
        command: 'node',
        args: ['test-server.js'],
        env: { TEST_ENV: 'value' }
      };
      
      // Add server
      addMcpServer('test-server', serverConfig, 'project');
      
      // Remove server
      removeMcpServer('test-server', 'project');
      
      // Expect config functions to have been called
      expect(require('../../../src/utils/config').getCurrentProjectConfig).toHaveBeenCalled();
      expect(require('../../../src/utils/config').saveCurrentProjectConfig).toHaveBeenCalled();
    });
    
    it('should connect to MCP servers and get tools', async () => {
      // Define test server
      const serverConfig = {
        type: 'stdio' as const,
        command: 'node',
        args: ['test-server.js']
      };
      
      // Mock project config with our test server
      require('../../../src/utils/config').getCurrentProjectConfig.mockReturnValue({
        mcpServers: {
          'test-server': serverConfig
        }
      });
      
      // Get clients
      const clients = await getClients();
      
      // Check if we have a client for our test server
      expect(clients.length).toBeGreaterThan(0);
      expect(clients[0].name).toBe('test-server');
      expect(clients[0].type).toBe('connected');
      
      // Get tools
      const tools = await getMCPTools();
      
      // Verify we have tools
      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0].name).toContain('mcp__test-server');
    });
    
    it('should be able to call MCP tools', async () => {
      // Mock project config with our test server
      require('../../../src/utils/config').getCurrentProjectConfig.mockReturnValue({
        mcpServers: {
          'test-server': {
            type: 'stdio',
            command: 'node',
            args: ['test-server.js']
          }
        }
      });
      
      // Get tools
      const tools = await getMCPTools();
      
      // Find a tool
      const tool = tools.find(t => t.name.startsWith('mcp__test-server'));
      expect(tool).toBeDefined();
      
      if (tool) {
        // Call the tool
        const generator = tool.call({ input: 'test' }, {
          abortController: new AbortController(),
          messageId: '123',
          options: {
            commands: [],
            tools: [],
            slowAndCapableModel: { name: 'test-model', provider: 'test' },
            forkNumber: 0,
            messageLogName: 'test',
            maxThinkingTokens: 0
          },
          readFileTimestamps: {}
        });
        
        // Get the result
        const result = await generator.next();
        
        // Verify the result
        expect(result.value).toBeDefined();
        expect(result.value.type).toBe('result');
      }
    });
  });
});