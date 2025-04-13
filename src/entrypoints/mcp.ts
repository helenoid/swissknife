/**
 * MCP Server Entry Point
 * 
 * This is the main entry point for the MCP server.
 * It uses the MCPServerController to manage the server lifecycle.
 */

import { MCPServerController } from '../patches/mcp/mcp-server-controller';

// Import patches first to ensure they're applied
import '../patches';

/**
 * Start the MCP server in the specified directory
 * @param cwd The current working directory for the server
 */
export async function startMCPServer(cwd: string): Promise<void> {
  console.log(`Starting MCP server in directory: ${cwd}`);
  
  // Create the controller
  const controller = new MCPServerController();
  
  // Handle process signals to ensure clean shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal. Shutting down MCP server...');
    await controller.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal. Shutting down MCP server...');
    await controller.stop();
    process.exit(0);
  });
  
  // Start the server
  try {
    await controller.start(cwd);
    console.log('MCP server started successfully');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}