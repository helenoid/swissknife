// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * E2E tests for MCP CLI commands
 */

import { execFileSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, rmdirSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';

// Set up test directories and configuration
const TEST_ROOT = join(tmpdir(), 'mcp-cli-test-' + Date.now());
const PROJECT_DIR = join(TEST_ROOT, 'project');
const CONFIG_DIR = join(TEST_ROOT, '.tengu');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// CLI command path
const CLI_COMMAND = join(process.cwd(), 'cli.mjs');

/**
 * Helper to execute CLI commands in a controlled environment
 */
function execCLI(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync(CLI_COMMAND, args, {
      env: {
        ...process.env,
        TENGU_CONFIG_DIR: CONFIG_DIR,
        NODE_ENV: 'test',
      },
      cwd: PROJECT_DIR,
      encoding: 'utf8',
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

describe('MCP CLI Integration Tests', () => {
  beforeAll(() => {
    // Set up test directories
    if (!existsSync(TEST_ROOT)) {
      mkdirSync(TEST_ROOT, { recursive: true });
    }
    if (!existsSync(PROJECT_DIR)) {
      mkdirSync(PROJECT_DIR, { recursive: true });
    }
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Create mock config file
    const initialConfig = {
      theme: 'dark',
      hasCompletedOnboarding: true,
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2));

    // Create a dummy project file for context
    writeFileSync(join(PROJECT_DIR, 'index.js'), '// Test project file');
  });

  afterAll(() => {
    // Clean up test directories
    try {
      if (existsSync(TEST_ROOT)) {
        rmdirSync(TEST_ROOT, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to clean up test directories:', error);
    }
  });

  describe('MCP Server Management', () => {
    // Adding an MCP server
    it('should add an MCP server', () => {
      const result = execCLI([
        'mcp',
        'add',
        'test-server',
        'echo',
        'MCP test server',
      ]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Added stdio MCP server test-server');
    });

    // Listing MCP servers
    it('should list MCP servers', () => {
      const result = execCLI(['mcp', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-server');
      expect(result.stdout).toContain('echo MCP test server');
    });

    // Getting MCP server details
    it('should get MCP server details', () => {
      const result = execCLI(['mcp', 'get', 'test-server']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Type: stdio');
      expect(result.stdout).toContain('Command: echo');
    });

    // Adding an SSE MCP server
    it('should add an SSE MCP server', () => {
      const result = execCLI([
        'mcp',
        'add-sse',
        'test-sse-server',
        'https://example.com/events',
      ]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Added SSE MCP server');
    });

    // Adding a server with JSON
    it('should add a server with JSON config', () => {
      const jsonConfig = JSON.stringify({
        type: 'stdio',
        command: 'node',
        args: ['--version'],
        env: { TEST_VAR: 'value' },
      });
      const result = execCLI(['mcp', 'add-json', 'json-server', jsonConfig]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Added stdio MCP server json-server');
    });

    // Removing an MCP server
    it('should remove an MCP server', () => {
      const result = execCLI(['mcp', 'remove', 'test-server']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Removed MCP server test-server');

      // Verify it was actually removed
      const listResult = execCLI(['mcp', 'list']);
      expect(listResult.stdout).not.toContain('test-server:');
      expect(listResult.stdout).toContain('test-sse-server:'); // Other server should still be there
    });

    // Error handling
    it('should handle errors gracefully', () => {
      // Try to get details for a non-existent server
      const result = execCLI(['mcp', 'get', 'non-existent-server']);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('No MCP server found');
    });
  });

  describe('MCP Server Operation', () => {
    // Note: We can't fully test the MCP server operation without mocking the server transport,
    // but we can at least test that the CLI command registers without errors.
    it('should initialize MCP server', () => {
      // This won't actually start a server in test mode - it will return quickly
      const result = execCLI(['mcp', 'serve']);
      
      // In test mode, the server won't actually start, but the command should be recognized
      expect(result.stderr).not.toContain('unknown command');
    });
  });
});