/**
 * MCP Patches Index
 * 
 * This file exports all MCP-related patches and provides a single function
 * to apply all patches at once.
 */

import { initMcpPatches } from './client-integration.js';

export { initMcpPatches };

// Add a convenience function to apply all patches
export function applyAllMcpPatches() {
  initMcpPatches();
  console.log('All MCP patches applied successfully');
}