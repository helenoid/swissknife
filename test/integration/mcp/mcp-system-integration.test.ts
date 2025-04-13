/**
 * System integration test for MCP server.
 * 
 * This test verifies that the MCP server can start correctly,
 * register tools, handle requests, and return appropriate results.
 */

import { fork } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Test timeout (longer for this integration test)
jest.setTimeout(60000); // Increased timeout to 60 seconds

// Set up test directories
const TEST_ROOT = join(tmpdir(), 'mcp-system-test-' + Date.now());
const TEST_PROJECT = join(TEST_ROOT, 'test-project');
const CLI_PATH = join(process.cwd(), 'cli.mjs');

describe('MCP Server System Integration', () => {
  beforeAll(() => {
    // Create test directories
    if (!existsSync(TEST_ROOT)) {
      mkdirSync(TEST_ROOT, { recursive: true });
    }
    if (!existsSync(TEST_PROJECT)) {
      mkdirSync(TEST_PROJECT, { recursive: true });
    }
    
    // Create a sample file for testing file tools
    writeFileSync(
      join(TEST_PROJECT, 'test-file.txt'),
      'This is a test file for MCP tools to read and modify.'
    );
  });
  
  afterAll(() => {
    // Clean up test directories
    try {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up test directories:', error);
    }
  });
  
  it('should start MCP server and handle tool requests', async () => {
    // Start MCP server in a child process
    const serverProcess = fork(CLI_PATH, ['mcp', 'serve', '--cwd', TEST_PROJECT], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    
    // Allow some time for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Create a client to connect to the MCP server
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [CLI_PATH, 'mcp', 'serve', '--cwd', TEST_PROJECT],
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      });
      
      const client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );
      
      // Connect to the server
      await client.connect(transport);
      
      // Get server capabilities
      const capabilities = await client.getServerCapabilities();
      expect(capabilities).toBeDefined();
      expect(capabilities.tools).toBeDefined();
      
      // List available tools
      const toolsResponse = await client.request(
        { method: 'tools/list' },
        {
          type: 'object',
          properties: {
            tools: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  inputSchema: { type: 'object' },
                },
                required: ['name', 'description', 'inputSchema'],
              },
            },
          },
          required: ['tools'],
        }
      );
      
      // Verify tools list contains expected tools
      expect(toolsResponse.tools).toBeInstanceOf(Array);
      expect(toolsResponse.tools.length).toBeGreaterThan(0);
      
      // Look for specific tools we expect
      const toolNames = toolsResponse.tools.map(tool => tool.name);
      expect(toolNames).toContain('bash');
      expect(toolNames).toContain('glob');
      expect(toolNames).toContain('fileRead');
      
      // Call a tool (e.g., the glob tool to list files)
      const globResponse = await client.callTool(
        {
          name: 'glob',
          arguments: {
            pattern: '*.txt',
          },
        }
      );
      
      // Verify the response
      expect(globResponse).toBeDefined();
      expect(globResponse.content).toBeInstanceOf(Array);
      expect(globResponse.content[0].text).toContain('test-file.txt');
      
      // Call the file read tool
      const fileReadResponse = await client.callTool(
        {
          name: 'fileRead',
          arguments: {
            path: 'test-file.txt',
          },
        }
      );
      
      // Verify the file contents
      expect(fileReadResponse).toBeDefined();
      expect(fileReadResponse.content).toBeInstanceOf(Array);
      expect(fileReadResponse.content[0].text).toContain('This is a test file');
      
    } finally {
      // Make sure to terminate the server process and release resources
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM');
      }
    }
  }, 60000); // Also add timeout to the test itself
});