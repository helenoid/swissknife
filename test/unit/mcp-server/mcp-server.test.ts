// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Unit tests for MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';
import { spawn } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const mkdtemp = promisify(fs.mkdtemp);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);

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
    
    // Wait for the server to indicate it's ready
    await new Promise<void>((resolve, reject) => {
      serverProcess.stdout?.on('data', (data: Buffer) => {
        if (data.toString().includes('MCP server running') || 
            data.toString().includes('listening') ||
            data.toString().includes('Server started')) {
          resolve();
        }
      });
      
      serverProcess.stderr?.on('data', (data: Buffer) => {
        reject(new Error(`Server failed to start: ${data.toString()}`));
      });
    });
    
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
      try {
        await client.close();
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  });

  test('Server properly handles path traversal security', async () => {
    // Attempt to access files outside the working directory
    try {
        await client.callTool({
          name: 'fileRead',
          arguments: {
            path: '../../../etc/passwd'
          }
        }, CallToolRequestSchema);
        
        // Should not reach here if proper security is in place
        expect(true).toBe(false);
      } catch (error) {
        // Should get an error for security reasons
        expect(error).toBeDefined();
        expect((error as Error).message).toMatch(/access|denied|invalid path|outside/i);
      }
    });

    });

    test('Server properly handles tool timeouts', async () => {
      // Set timeout to 5s for this test
      jest.setTimeout(5000);
      
      // Start a command that should timeout
      const startTime = Date.now();
      
      try {
        await client.callTool({
          name: 'bash',
          arguments: {
            command: 'sleep 10', // Command that will take longer than the timeout
            workingDir: tempDir
          }
        }, CallToolRequestSchema);
        
        // Should not reach here if timeout works properly
        fail('Command did not timeout as expected');
      } catch (error) {
        // Should get a timeout error
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        
        expect(error).toBeDefined();
        expect((error as Error).message).toMatch(/timeout|timed out/i);
        
        // The elapsed time should be less than 10 seconds (the sleep duration)
        // but more than the expected timeout
        expect(elapsedTime).toBeLessThan(10000);
      }
    });
