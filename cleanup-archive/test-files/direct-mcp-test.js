#!/usr/bin/env node
/**
 * Direct MCP Server Test
 * 
 * This script tests an MCP server directly by spawning the process
 * and communicating with JSON messages rather than using the SDK.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ASCII colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Print colored message
function log(color, message) {
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

/**
 * Test an MCP server directly
 */
async function testMcpServer(serverPath, workDir) {
  log('cyan', `==== Direct MCP Server Test ====`);
  log('cyan', `Testing server at: ${serverPath}`);
  log('cyan', `Working directory: ${workDir}`);
  
  if (!fs.existsSync(serverPath)) {
    log('red', `Server file not found: ${serverPath}`);
    return false;
  }
  
  // Create the server process
  const serverProcess = spawn('node', [serverPath, workDir], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let outputBuffer = '';
  let stderrBuffer = '';
  let connected = false;
  let capabilities = null;
  let tools = [];
  
  // Listen for server stdout
  serverProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    outputBuffer += chunk;
    
    // Process complete JSON messages
    let newlineIndex;
    while ((newlineIndex = outputBuffer.indexOf('\n')) !== -1) {
      const line = outputBuffer.substring(0, newlineIndex).trim();
      outputBuffer = outputBuffer.substring(newlineIndex + 1);
      
      if (line) {
        try {
          const response = JSON.parse(line);
          log('green', `← Received: ${JSON.stringify(response)}`);
          
          // Handle different responses
          if (response.id === 'getCapabilities') {
            capabilities = response.result;
            connected = true;
          } else if (response.id === 'listTools') {
            tools = response.result?.tools || [];
          }
        } catch (err) {
          log('red', `Error parsing response: ${err.message}`);
          log('yellow', `Raw line: ${line}`);
        }
      }
    }
  });
  
  // Listen for server stderr
  serverProcess.stderr.on('data', (data) => {
    stderrBuffer += data.toString();
    log('yellow', `[SERVER] ${data.toString().trim()}`);
  });
  
  // Handle server exit
  serverProcess.on('exit', (code) => {
    log('yellow', `Server exited with code ${code}`);
  });
  
  // Handle errors
  serverProcess.on('error', (err) => {
    log('red', `Server process error: ${err.message}`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Send getCapabilities request
    log('blue', `→ Sending getCapabilities request`);
    const capabilitiesRequest = {
      type: 'request',
      id: 'getCapabilities',
      method: 'getCapabilities'
    };
    
    serverProcess.stdin.write(JSON.stringify(capabilitiesRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (connected) {
      log('green', `✓ Server connected and responded to getCapabilities`);
      
      // Send tools/list request
      log('blue', `→ Sending tools/list request`);
      const listToolsRequest = {
        type: 'request',
        id: 'listTools',
        method: 'tools/list'
      };
      
      serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (tools.length > 0) {
        log('green', `✓ Server reported ${tools.length} tools`);
      } else {
        log('yellow', `! Server reported no tools`);
      }
      
      // Test successful
      log('green', `✓ Basic server communication test passed`);
      serverProcess.kill();
      return true;
    } else {
      log('red', `✗ Server did not respond to getCapabilities`);
      
      // Show server stderr for debugging
      if (stderrBuffer) {
        log('yellow', `Server stderr output:`);
        log('yellow', stderrBuffer);
      } else {
        log('yellow', `No server stderr output captured`);
      }
      
      serverProcess.kill();
      return false;
    }
  } catch (err) {
    log('red', `Test error: ${err.message}`);
    
    try {
      serverProcess.kill();
    } catch (e) {
      // Ignore kill errors
    }
    
    return false;
  }
}

/**
 * Main entry point
 */
async function main() {
  const serverPath = process.argv[2] || 'minimal-mcp-server.js';
  const workDir = process.argv[3] || process.cwd();
  
  if (!serverPath) {
    log('red', `Usage: node direct-mcp-test.js <server-path> [work-dir]`);
    process.exit(1);
  }
  
  try {
    const success = await testMcpServer(serverPath, workDir);
    
    if (success) {
      log('green', `✓ Direct MCP server test passed!`);
      process.exit(0);
    } else {
      log('red', `✗ Direct MCP server test failed`);
      process.exit(1);
    }
  } catch (err) {
    log('red', `Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main();
