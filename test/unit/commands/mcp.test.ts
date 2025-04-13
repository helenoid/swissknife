/**
 * Unit tests for MCP command
 */

import mcpCommand from '../../../src/commands/mcp';
import { listMCPServers, getClients } from '../../../src/services/mcpClient';
import { PRODUCT_COMMAND } from '../../../src/constants/product';

// Mock dependencies
jest.mock('../../../src/services/mcpClient', () => ({
  listMCPServers: jest.fn(),
  getClients: jest.fn(),
}));

jest.mock('../../../src/utils/log', () => ({
  logError: jest.fn(),
}));

jest.mock('../../../src/utils/theme', () => ({
  getTheme: jest.fn().mockReturnValue({
    success: '#00ff00',
    error: '#ff0000',
  }),
}));

describe('MCP Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show appropriate message when no servers are configured', async () => {
    // Mock empty server list
    listMCPServers.mockReturnValue({});
    
    // Call the command handler
    const result = await mcpCommand.handler({}, {});
    
    // Check the result contains the expected instructions
    expect(result).toContain('No MCP servers configured');
    expect(result).toContain(`${PRODUCT_COMMAND} add-mcp-server`);
  });

  it('should show server status when servers are configured', async () => {
    // Mock servers list
    listMCPServers.mockReturnValue({
      'server1': { type: 'stdio', command: 'node', args: ['server.js'] },
      'server2': { type: 'stdio', command: 'python', args: ['server.py'] },
    });
    
    // Mock clients with one connected and one disconnected
    getClients.mockResolvedValue([
      { name: 'server1', type: 'connected', client: {} },
      { name: 'server2', type: 'failed' },
    ]);
    
    // Call the command handler
    const result = await mcpCommand.handler({}, {});
    
    // Check the result contains the server status
    expect(result).toContain('MCP Server Status');
    expect(result).toContain('server1');
    expect(result).toContain('server2');
    expect(result).toContain('connected');
    expect(result).toContain('disconnected');
    
    // Should include a helpful note about disconnected servers
    expect(result).toContain('Disconnected servers may need to be started manually');
  });

  it('should start MCP server when --cwd is provided', async () => {
    // Call the command handler with cwd option
    const result = await mcpCommand.handler({ cwd: '/test-dir' }, {});
    
    // Check the result indicates the server is starting
    expect(result).toContain('Starting MCP server');
    expect(result).toContain('/test-dir');
  });

  it('should handle errors gracefully', async () => {
    // Mock an error being thrown
    listMCPServers.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // Call the command handler
    const result = await mcpCommand.handler({}, {});
    
    // Check the result contains the error message
    expect(result).toContain('Error getting MCP server status');
    expect(result).toContain('Test error');
  });

  it('should have the correct command metadata', () => {
    // Check the command metadata
    expect(mcpCommand.name).toBe('mcp');
    expect(mcpCommand.type).toBe('local');
    expect(mcpCommand.description).toBeDefined();
    expect(mcpCommand.isEnabled).toBe(true);
    
    // Check that the cwd option is defined
    const cwdOption = mcpCommand.options.find(opt => opt.name === 'cwd');
    expect(cwdOption).toBeDefined();
    expect(cwdOption?.type).toBe('string');
    expect(cwdOption?.required).toBe(false);
    
    // Check the userFacingName function
    expect(mcpCommand.userFacingName()).toBe('mcp');
  });
});