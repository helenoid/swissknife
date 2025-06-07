// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * System Integration Test for MCP Server Functionality.
 *
 * This test verifies the end-to-end flow:
 * 1. Starting the MCP server via the CLI entrypoint (`cli.mjs mcp serve`).
 * 2. Connecting a real MCP SDK Client to the running server process using StdioTransport.
 * 3. Listing tools exposed by the server.
 * 4. Calling specific tools (e.g., glob, fileRead) and verifying their output.
 *
 * It uses a temporary directory and file for testing file-based tools.
 */

import { fork, ChildProcess } from 'child_process'; // Import types
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
// Import SDK components - Add .js extension
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
// Import specific types for clarity - Try ToolInfo again
import type { ServerCapabilities, ToolInfo } from '@modelcontextprotocol/sdk/types'; // Use ToolInfo

// --- Test Configuration ---

// Increase timeout for this integration test, as it involves process spawning and communication.
const TEST_TIMEOUT = 60000; // 60 seconds
jest.setTimeout(TEST_TIMEOUT);

// Paths
const PROJECT_ROOT = resolve(__dirname, '../../..'); // Adjust depth as needed
const CLI_ENTRY_POINT = join(PROJECT_ROOT, 'dist/cli.mjs'); // Assuming build output in dist/
const TEST_ROOT_DIR = join(tmpdir(), `mcp-system-test-${Date.now()}`);
const TEST_PROJECT_DIR = join(TEST_ROOT_DIR, 'test-project');
const TEST_FILE_NAME = 'test-file.txt';
const TEST_FILE_PATH = join(TEST_PROJECT_DIR, TEST_FILE_NAME);
const TEST_FILE_CONTENT = 'This is a test file for MCP tools to read and modify.';

// --- Test Suite ---

describe('MCP Server System Integration', () => {
  let serverProcess: ChildProcess | null = null;
  let mcpClient: Client | null = null; // Store client for potential cleanup

  beforeAll(() => {
    // Create test directories and files
    if (!existsSync(TEST_PROJECT_DIR)) {
      mkdirSync(TEST_PROJECT_DIR, { recursive: true });
    }
    writeFileSync(TEST_FILE_PATH, TEST_FILE_CONTENT);
    console.log(`MCP System Test: Created test directory ${TEST_PROJECT_DIR}`);

    // Verify CLI entry point exists
     if (!existsSync(CLI_ENTRY_POINT)) {
        throw new Error(`CLI entry point not found at ${CLI_ENTRY_POINT}. Ensure the project is built.`);
    }
  });

  afterAll(() => {
    // Clean up test directories
    try {
      if (existsSync(TEST_ROOT_DIR)) {
        rmSync(TEST_ROOT_DIR, { recursive: true, force: true });
        console.log(`MCP System Test: Cleaned up test directory ${TEST_ROOT_DIR}`);
      }
    } catch (error) {
      console.error('Failed to clean up test directories:', error);
    }
  });

  // Ensure server process is killed and client disconnected after each test
  afterEach(async () => {
     // Disconnecting the client might not be necessary if the process is killed,
     // and the SDK might not expose a disconnect method on the Client itself.
     mcpClient = null; // Clear client reference

     if (serverProcess && !serverProcess.killed) {
       console.log(`MCP System Test: Killing server process (PID: ${serverProcess.pid})`);
       const killed = serverProcess.kill('SIGTERM'); // Use SIGTERM for graceful shutdown
       if (!killed) {
            console.warn(`Failed to send SIGTERM to server process ${serverProcess.pid}`);
            serverProcess.kill('SIGKILL'); // Force kill if needed
       }
       // Wait briefly for process to exit
       await new Promise(resolve => setTimeout(resolve, 200));
       serverProcess = null;
     }
     jest.clearAllMocks(); // Clear any mocks if used elsewhere
  });

  it('should start server, connect client, list tools, and call tools', async () => {
    // --- Arrange: Start Server ---
    console.log(`MCP System Test: Spawning server: node ${CLI_ENTRY_POINT} mcp serve --cwd ${TEST_PROJECT_DIR}`);
    serverProcess = fork(CLI_ENTRY_POINT, ['mcp', 'serve', '--cwd', TEST_PROJECT_DIR], {
      // Run in test project directory context
      cwd: TEST_PROJECT_DIR,
      env: {
        ...process.env,
        NODE_ENV: 'test', // Set test environment
        // Add any other required ENV vars for the server
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'], // Use 'pipe' for stdio
      silent: true // Suppress child process output in test console unless needed
    });

    let serverReady = false;
    let serverErrorOutput = '';
    serverProcess.stderr?.on('data', (data) => serverErrorOutput += data.toString());

    // Wait for server to signal readiness (adjust message as needed)
    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Server startup timed out.")), 10000); // 10s timeout
        serverProcess?.stdout?.on('data', (data) => {
            const output = data.toString();
            if (output.includes('MCP server running on stdio')) { // Check for ready message
                console.log("MCP System Test: Server ready signal received.");
                serverReady = true;
                clearTimeout(timer);
                resolve();
            }
        });
         serverProcess?.on('error', (err) => { clearTimeout(timer); reject(err); });
         serverProcess?.on('exit', (code) => { if (!serverReady) clearTimeout(timer); reject(new Error(`Server exited prematurely with code ${code}. Stderr: ${serverErrorOutput}`)); });
    });
    expect(serverReady).toBe(true);
    expect(serverErrorOutput).toBe(''); // Ensure no errors during startup

    // --- Arrange: Create Client & Transport ---
    // Pass the process object itself to the transport constructor
    if (!serverProcess) {
        throw new Error("Server process was not created successfully.");
    }
    // Corrected: Pass the process object
    const transport = new StdioClientTransport({ process: serverProcess });
    mcpClient = new Client( // Assign to suite-level variable
      { name: 'integration-test-client', version: '1.0.0' },
      { capabilities: { tools: true } } // Declare capabilities
    );

    // --- Act: Connect Client ---
    console.log("MCP System Test: Connecting client...");
    await mcpClient.connect(transport);
    console.log("MCP System Test: Client connected.");

    // --- Act & Assert: Get Capabilities ---
    console.log("MCP System Test: Getting server capabilities...");
    const capabilities = await mcpClient.getServerCapabilities();
    expect(capabilities).toBeDefined();
    // Check capabilities safely
    expect(capabilities?.tools).toBe(true); // Expect server to support tools

    // --- Act & Assert: List Tools ---
    console.log("MCP System Test: Listing tools...");
    // Define expected schema for validation (optional but good practice)
    // Using basic object check as ZodType might not be available/correct here
    const listToolsResponseSchema = { type: 'object' };
    // Use 'any' for response type initially, then validate structure
    const toolsResponse: any = await mcpClient.request({ method: 'tools/list' }, listToolsResponseSchema as any);
    expect(toolsResponse).toBeDefined();
    expect(toolsResponse).toHaveProperty('tools');
    expect(Array.isArray(toolsResponse.tools)).toBe(true);
    expect(toolsResponse.tools.length).toBeGreaterThan(0);

    // Verify specific expected tools are present
    const toolNames = toolsResponse.tools.map((tool: ToolInfo) => tool.name); // Use ToolInfo type
    console.log("MCP System Test: Found tools:", toolNames);
    expect(toolNames).toContain('bash');
    expect(toolNames).toContain('glob');
    expect(toolNames).toContain('fileRead');
    expect(toolNames).toContain('fileWrite'); // Assuming it's available

    // --- Act & Assert: Call 'glob' Tool ---
    console.log("MCP System Test: Calling 'glob' tool...");
    const globArgs = { pattern: '*.txt' };
    const globResponse: any = await mcpClient.callTool({ name: 'glob', arguments: globArgs });
    expect(globResponse).toBeDefined();
    expect(globResponse.content).toBeInstanceOf(Array);
    expect(globResponse.content.length).toBeGreaterThan(0);
    // Safely access potentially nested properties
    expect(globResponse.content?.[0]?.type).toBe('text');
    expect(globResponse.content?.[0]?.text).toContain(TEST_FILE_NAME);

    // --- Act & Assert: Call 'fileRead' Tool ---
    console.log("MCP System Test: Calling 'fileRead' tool...");
    const fileReadArgs = { path: TEST_FILE_NAME }; // Use relative path within TEST_PROJECT_DIR
    const fileReadResponse: any = await mcpClient.callTool({ name: 'fileRead', arguments: fileReadArgs });
    expect(fileReadResponse).toBeDefined();
    expect(fileReadResponse.content).toBeInstanceOf(Array);
    expect(fileReadResponse.content.length).toBeGreaterThan(0);
    expect(fileReadResponse.content?.[0]?.type).toBe('text');
    // Expect the file content to be returned
    expect(fileReadResponse.content?.[0]?.text).toBe(TEST_FILE_CONTENT);

    // --- Cleanup (handled in afterEach) ---

  }, TEST_TIMEOUT); // Use longer timeout for the entire test case
});
