/**
 * Unit tests for MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { startMCPServer } from '../../src/entrypoints/mcp';
import { spawn } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const mkdtemp = promisify(fs.mkdtemp);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);

describe('MCP Server', () => {
  let tempDir: string;
  let serverProcess: any;
  let client: Client;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = await mkdtemp('mcp-server-test-');
    
    // Create a simple test file in the temp directory
    await writeFile(path.join(tempDir, 'test-file.txt'), 'Test content');
    
    // Start the MCP server in a separate process
    serverProcess = spawn('node', [
      path.resolve(__dirname, '../../../src/entrypoints/mcp.ts'),
      tempDir
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a client to connect to the server
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.resolve(__dirname, '../../../src/entrypoints/mcp.ts'), tempDir],
      stderr: 'pipe'
    });
    
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );
    
    await client.connect(transport);
  });
  
  afterAll(async () => {
    // Disconnect the client
    if (client) {
      await client.disconnect();
    }
    
    // Kill the server process
    if (serverProcess) {
      serverProcess.kill();
    }
    
    // Remove the temporary directory
    await rmdir(tempDir, { recursive: true });
  });
  
  test('Server reports expected capabilities', async () => {
    const capabilities = await client.getServerCapabilities();
    expect(capabilities).toBeDefined();
    expect(capabilities.tools).toBeDefined();
  });
  
  test('Server lists available tools', async () => {
    const result = await client.request(
      { method: 'tools/list' },
      ListToolsRequestSchema
    );
    
    expect(result).toBeDefined();
    expect(result.tools).toBeInstanceOf(Array);
    expect(result.tools.length).toBeGreaterThan(0);
    
    // Check that some expected tools are present
    const toolNames = result.tools.map(tool => tool.name);
    expect(toolNames).toContain('bash');
    expect(toolNames).toContain('fileEdit');
    expect(toolNames).toContain('fileRead');
  });
  
  test('Server can execute bash tool', async () => {
    const result = await client.callTool({
      name: 'bash',
      arguments: {
        command: 'ls -la'
      }
    }, CallToolRequestSchema);
    
    expect(result).toBeDefined();
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('test-file.txt');
  });
  
  test('Server can execute fileRead tool', async () => {
    const result = await client.callTool({
      name: 'fileRead',
      arguments: {
        path: 'test-file.txt'
      }
    }, CallToolRequestSchema);
    
    expect(result).toBeDefined();
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('Test content');
  });
  
  test('Server returns error for invalid tool', async () => {
    try {
      await client.callTool({
        name: 'nonExistentTool',
        arguments: {}
      }, CallToolRequestSchema);
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('Tool nonExistentTool not found');
    }
  });
});