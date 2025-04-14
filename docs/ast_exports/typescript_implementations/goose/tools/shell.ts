/**
 * TypeScript implementation of Shell Tool functionality
 * Equivalent to the Rust developer/shell.rs 
 */

import { Tool, ToolRequest, ToolResult, createSuccessToolResult, createErrorToolResult } from '../mcp-core/tool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Shell tool definition
 */
export const shellTool: Tool = {
  name: 'developer__shell',
  description: 'Execute a command in the shell.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute'
      }
    },
    required: ['command']
  },
  enabledForAI: true
};

/**
 * Execute a shell command
 */
export async function executeShellCommand(request: ToolRequest): Promise<ToolResult> {
  const { command } = request.parameters;
  
  if (!command || typeof command !== 'string') {
    return createErrorToolResult(
      request,
      'Invalid command parameter',
      { required: 'string' }
    );
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      shell: '/bin/bash',
      timeout: 30000 // 30 seconds timeout
    });
    
    // Combine stdout and stderr, similar to Rust implementation
    const output = stdout + (stderr ? stderr : '');
    
    return createSuccessToolResult(request, output);
  } catch (error) {
    // Handle command execution errors
    let errorMessage = error.message || 'Unknown error';
    let output = '';
    
    // If we still got stdout/stderr, include it in the output
    if (error.stdout || error.stderr) {
      output = (error.stdout || '') + (error.stderr || '');
    }
    
    return createErrorToolResult(request, errorMessage, { output });
  }
}
