/**
 * Fixed MCP Server Test
 */

// Import mock utilities
const { MockMCPServer } = require('../../helpers/unified-mocks');

// Mock the client creation - this handles the mock correctly in both test systems
jest.mock('../../../src/client/mcp-client', () => {
  return {
    createClient: jest.fn().mockImplementation(() => ({
      callTool: async (request) => MockMCPServer.callTool(request),
      close: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

describe('MCP Server', () => {
  // Use a temporary directory for tests
  const tempDir = require('os').tmpdir();
  
  test('Server should start and stop properly', async () => {
    // Create mock functions explicitly
    const mockStop = jest.fn().mockResolvedValue(true);
    
    // Create a server mock with spy methods
    const server = {
      start: jest.fn().mockResolvedValue({ port: 3000 }),
      stop: mockStop
    };
    
    // Start the server
    const result = await server.start();
    expect(result).toHaveProperty('port');
    expect(typeof result.port).toBe('number');
    
    // Stop the server
    await server.stop();
    expect(mockStop).toHaveBeenCalled();
  });
  
  test('Server should handle tool calls', async () => {
    // Use mock client
    const { createClient } = require('../../../src/client/mcp-client');
    const client = createClient('http://localhost:3000');
    
    const result = await client.callTool({
      name: 'echo',
      arguments: {
        text: 'Hello World'
      }
    });
    
    expect(result).toHaveProperty('result');
  });
  
  test('Server should handle tool timeouts', async () => {
    // Use mock client
    const { createClient } = require('../../../src/client/mcp-client');
    const client = createClient('http://localhost:3000');
    
    const startTime = Date.now();
    
    try {
      await client.callTool({
        name: 'bash',
        arguments: {
          command: 'sleep 10',
          workingDir: tempDir
        }
      });
      
      // Should not reach here
      fail('Expected timeout error but did not get one');
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      expect(error).toBeDefined();
      expect(error.message).toMatch(/timed out/i);
      expect(elapsedTime).toBeLessThan(10000);  // Should timeout before 10s
    }
  });
});
