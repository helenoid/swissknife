/**
 * E2E tests for MCP CLI commands
 * 
 * This test suite verifies that the MCP commands work correctly
 * when executed through the CLI interface.
 */

import { execCLI } from '../../../helpers/cli';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set up temporary directory for tests
const TEST_DIR = join(tmpdir(), 'mcp-cli-test-' + Date.now());
const CONFIG_PATH = join(TEST_DIR, '.tengu', 'config.json');

describe('MCP CLI Commands', () => {
  beforeAll(() => {
    // Set up test environment
    process.env.TENGU_CONFIG_DIR = TEST_DIR;
  });

  afterAll(() => {
    // Clean up
    delete process.env.TENGU_CONFIG_DIR;
    
    // Remove config file if it exists
    if (existsSync(CONFIG_PATH)) {
      unlinkSync(CONFIG_PATH);
    }
  });

  it('should show appropriate message when no MCP servers are configured', async () => {
    // Run the MCP command
    const result = await execCLI(['mcp']);
    
    // Check the output for the expected message
    expect(result.stdout).toContain('No MCP servers configured');
    expect(result.exitCode).toBe(0);
  });
  
  it('should add and list MCP servers', async () => {
    // Add a test server
    const addResult = await execCLI([
      'add-mcp-server', 
      'test-server',
      '--type', 'stdio',
      '--command', 'echo',
      '--args', 'MCP test server'
    ]);
    
    // Check that the add command succeeded
    expect(addResult.exitCode).toBe(0);
    
    // List servers
    const listResult = await execCLI(['list-mcp-servers']);
    
    // Check that the new server is listed
    expect(listResult.stdout).toContain('test-server');
    expect(listResult.stdout).toContain('stdio');
    expect(listResult.stdout).toContain('echo');
    expect(listResult.exitCode).toBe(0);
    
    // Check MCP status
    const statusResult = await execCLI(['mcp']);
    
    // The server should be listed, but may show as disconnected
    // since we're not actually starting it
    expect(statusResult.stdout).toContain('test-server');
    expect(statusResult.exitCode).toBe(0);
  });
  
  it('should remove MCP servers', async () => {
    // Remove the test server
    const removeResult = await execCLI(['remove-mcp-server', 'test-server']);
    
    // Check that the remove command succeeded
    expect(removeResult.exitCode).toBe(0);
    
    // List servers again
    const listResult = await execCLI(['list-mcp-servers']);
    
    // The server should no longer be listed
    expect(listResult.stdout).not.toContain('test-server');
    expect(listResult.exitCode).toBe(0);
  });
  
  it('should handle invalid commands gracefully', async () => {
    // Try to remove a non-existent server
    const removeResult = await execCLI(['remove-mcp-server', 'non-existent-server']);
    
    // Should fail with error message
    expect(removeResult.stderr).toContain('No');
    expect(removeResult.stderr).toContain('server');
    expect(removeResult.exitCode).not.toBe(0);
    
    // Try to add a server with missing required arguments
    const addResult = await execCLI(['add-mcp-server', 'incomplete-server']);
    
    // Should fail with error message about missing arguments
    expect(addResult.stderr).toContain('required');
    expect(addResult.exitCode).not.toBe(0);
  });
});