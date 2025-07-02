// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ 
  promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() },
  mkdtempSync: jest.fn(() => "/tmp/mcp-test-12345"),
  existsSync: jest.fn(() => true),
  rmSync: jest.fn()
}));
/**
 * Integration Tests for the MCP Server Entrypoint (`src/entrypoints/mcp.ts`)
 *
 * These tests verify that the MCP server process can be started and potentially
 * that it initializes correctly. It does *not* test client-server communication
 * in detail, focusing only on the server process lifecycle.
 *
 * NOTE: This test spawns a real Node.js process. Ensure the entrypoint path is correct.
 * It relies on the server emitting specific output to stdout to confirm startup.
 */

import { spawn, ChildProcess } from 'child_process'; // Import types
import path from 'path';
import fs from 'fs';
import os from 'os';

// --- Test Setup ---

// Define path to the server entrypoint script
// Adjust based on your build output structure
const serverEntrypointPath = path.resolve(__dirname, '../../../dist/entrypoints/mcp.js'); // Assuming build output

describe('MCP Server Integration (Process Lifecycle)', () => {
  let tempDir: string;
  let serverProcess: ChildProcess | null = null; // Store the server process

  beforeAll(() => {
    // Create a temporary directory for potential server logs or files if needed
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-server-int-test-'));
    console.log(`MCP Server Test: Using temp directory ${tempDir}`);

    // Verify the server entrypoint exists before running tests
    if (!fs.existsSync(serverEntrypointPath)) {
        throw new Error(`Server entrypoint not found at ${serverEntrypointPath}. Ensure the project is built.`);
    }
  });

  afterAll(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`MCP Server Test: Cleaned up temp directory ${tempDir}`);
      } catch (err) {
        console.error('Error cleaning up temp directory:', err);
      }
    }
  });

  // Ensure server process is killed after each test or the suite
  afterEach(() => {
    if (serverProcess && !serverProcess.killed) {
      console.log(`MCP Server Test: Killing server process (PID: ${serverProcess.pid})`);
      serverProcess.kill('SIGTERM'); // Use SIGTERM for graceful shutdown if possible
      serverProcess = null;
    }
     // Reset mocks if any were used within tests (none in this version)
     jest.clearAllMocks();
  });

  // --- Test Cases ---

  // Define timeout constant outside the test case
  const STARTUP_TIMEOUT = 5000; // 5 seconds

  it('should start the MCP server process successfully', async () => {
    // Arrange: Timeout is defined above

    // Act: Spawn the server process
    serverProcess = spawn('node', [serverEntrypointPath, tempDir], {
      stdio: ['pipe', 'pipe', 'pipe'], // Pipe stdio to capture output/errors
      // detached: true // Might need detached mode depending on shutdown behavior
    });

    // Assert: Check if process was created
    expect(serverProcess).toBeDefined();
    expect(serverProcess.pid).toBeDefined();

    // Act: Wait for the server to indicate it's ready or timeout
    let serverReady = false;
    let startupError = '';
    const readyPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Server startup timed out after ${STARTUP_TIMEOUT}ms`));
      }, STARTUP_TIMEOUT);

      serverProcess?.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`Server stdout: ${output.trim()}`); // Log for debugging
        // Adjust this string based on the actual output of your mcp.ts entrypoint
        if (output.includes('MCP server running') || output.includes('listening')) {
          serverReady = true;
          clearTimeout(timer);
          resolve();
        }
      });

      serverProcess?.stderr?.on('data', (data) => {
        const errorOutput = data.toString();
        console.error(`Server stderr: ${errorOutput.trim()}`); // Log errors
        startupError += errorOutput; // Collect stderr
      });

      serverProcess?.on('error', (err) => {
        console.error('Server process error:', err);
        clearTimeout(timer);
        reject(err);
      });

      serverProcess?.on('close', (code) => {
        if (!serverReady) { // If it closed before becoming ready
            clearTimeout(timer);
            reject(new Error(`Server process exited prematurely with code ${code}. Stderr: ${startupError}`));
        }
      });
    });

    // Assert: Wait for readiness or timeout
    await expect(readyPromise).resolves.toBeUndefined(); // Expect the promise to resolve (server ready)
    expect(serverReady).toBe(true);
    expect(serverProcess?.killed).toBe(false); // Check it wasn't killed prematurely
  }, STARTUP_TIMEOUT + 1000); // Increase Jest timeout

  // --- Commented Out Client Interaction Test ---
  /*
    This test is commented out because it requires a more complex setup:
    1.  A way for the test client to connect to the spawned server process (e.g., stdio pipe, known port).
        The current `spawn` setup pipes stdio, but connecting a Client via stdio requires careful management.
    2.  Using the actual `@modelcontextprotocol/sdk` Client and Transport classes, not mocks.
    3.  Handling the asynchronous nature of client-server communication.

  it('Server exposes expected tools via SDK Client (requires connection setup)', async () => {
    // Arrange: Start server (handled by a hypothetical setup or previous test)
    // Ensure serverProcess is running and ready from the previous test or a dedicated setup.
    if (!serverProcess || serverProcess.killed) {
        throw new Error("Server process not running for client test.");
    }

    // Arrange: Create an SDK client instance
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

    const client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: { tools: true } } // Declare client capabilities
    );

    // Arrange: Create transport connected to the spawned process's stdio
    // This is the tricky part - need to correctly pipe stdio streams
    const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);
    // transport.stderr.on('data', (data) => console.error(`Client Transport stderr: ${data.toString()}`)); // Log transport errors

    try {
        // Act: Connect the client
        await client.connect(transport);
        console.log("Client connected to server process.");

        // Act: List tools
        const result = await client.request({ method: 'tools/list' });
        console.log("Received tools list:", result);

        // Assert: Verify response structure and expected tools
        expect(result).toHaveProperty('tools');
        expect(Array.isArray(result.tools)).toBe(true);

        // Check for specific tools expected to be registered by the server entrypoint
        const toolNames = result.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('bash'); // Example expected tool
        // expect(toolNames).toContain('fileRead');
        // expect(toolNames).toContain('fileWrite');

    } finally {
        // Clean up: Disconnect the client
        await client.disconnect();
        console.log("Client disconnected.");
    }
  });
  */
});
