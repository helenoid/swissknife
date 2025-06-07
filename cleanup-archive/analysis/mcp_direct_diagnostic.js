#!/usr/bin/env node
/**
 * MCP Direct Diagnostic Tool
 * 
 * This script provides direct diagnostic capabilities for the MCP server
 * by attempting to load it in various ways and determining compatibility issues.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Utility to log with timestamp and colored output
function log(level, message) {
  const now = new Date().toISOString();
  const colors = {
    info: '\x1b[34m',   // blue
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'     // reset
  };
  
  console.log(`${colors[level]}[${now}] [${level.toUpperCase()}] ${message}${colors.reset}`);
}

// Find potential server paths
function findServerPaths() {
  const basePaths = [
    path.join(__dirname, 'dist/src/entrypoints/mcp.js'),
    path.join(__dirname, 'dist/entrypoints/mcp.js'),
    path.join(__dirname, 'src/entrypoints/mcp.ts')
  ];
  
  const foundPaths = basePaths.filter(p => fs.existsSync(p));
  
  if (foundPaths.length === 0) {
    log('error', 'No MCP server paths found');
    return null;
  }
  
  log('info', `Found ${foundPaths.length} potential MCP server paths:`);
  foundPaths.forEach(p => log('info', `  - ${p}`));
  
  return foundPaths;
}

// Check SDK installation
function checkSdk() {
  try {
    log('info', 'Checking @modelcontextprotocol/sdk installation...');
    
    // Check if SDK installed
    const sdkPaths = [
      path.join(__dirname, 'node_modules/@modelcontextprotocol/sdk/package.json'),
      path.join(__dirname, 'node_modules/@modelcontextprotocol/sdk')
    ];
    
    const found = sdkPaths.some(p => fs.existsSync(p));
    
    if (!found) {
      log('warning', 'SDK not found in node_modules - attempting to install');
      try {
        execSync('npm install @modelcontextprotocol/sdk --legacy-peer-deps', { stdio: 'inherit' });
        log('success', 'Successfully installed @modelcontextprotocol/sdk');
        return true;
      } catch (err) {
        log('error', `Failed to install SDK: ${err.message}`);
        return false;
      }
    }
    
    log('success', 'Found SDK in node_modules');
    
    // Check if it's a valid installation by trying to import
    try {
      const p = require.resolve('@modelcontextprotocol/sdk/package.json');
      const pkg = require(p);
      log('success', `SDK version: ${pkg.version}, type: ${pkg.type || 'commonjs'}`);
      return true;
    } catch (err) {
      log('error', `SDK resolution error: ${err.message}`);
      return false;
    }
  } catch (err) {
    log('error', `SDK check failed: ${err.message}`);
    return false;
  }
}

// Try running the server directly
function testServerDirect(serverPath) {
  return new Promise((resolve) => {
    log('info', `Testing server directly: ${serverPath}`);
    
    const workDir = path.join(__dirname, 'temp-test-dir');
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }
    
    const serverProcess = spawn('node', [serverPath, workDir], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DEBUG: 'mcp:*',
        NODE_PATH: path.join(__dirname, 'node_modules')
      }
    });
    
    let stdoutData = '';
    let stderrData = '';
    
    serverProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log(`[SERVER-STDOUT] ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log(`[SERVER-STDERR] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (err) => {
      log('error', `Failed to start server: ${err.message}`);
      resolve({
        success: false,
        error: err.message,
        stdout: stdoutData,
        stderr: stderrData
      });
    });
    
    // Allow server to start then kill it after timeout
    setTimeout(() => {
      try {
        serverProcess.kill();
      } catch (e) {
        // Ignore errors on kill
      }
      
      const success = !stderrData.includes('Error') && !stderrData.includes('error');
      
      resolve({
        success,
        stdout: stdoutData,
        stderr: stderrData,
        exitCode: serverProcess.exitCode
      });
    }, 5000);
  });
}

async function runDiagnostics() {
  log('info', '=== MCP Server Diagnostic Tool ===');
  
  // Build the project
  log('info', 'Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('success', 'Build completed successfully');
  } catch (err) {
    log('error', 'Build failed');
  }
  
  // Check SDK
  const sdkOk = checkSdk();
  if (!sdkOk) {
    log('warning', 'SDK issues detected - server may not function correctly');
  }
  
  // Find server paths
  const serverPaths = findServerPaths();
  if (!serverPaths) {
    log('error', 'No server paths found - build may have failed');
    return;
  }
  
  // Test each server path
  for (const serverPath of serverPaths) {
    log('info', `Testing server: ${serverPath}`);
    const result = await testServerDirect(serverPath);
    
    if (result.success) {
      log('success', `Server ${path.basename(serverPath)} started successfully`);
    } else {
      log('error', `Server ${path.basename(serverPath)} failed to start properly`);
    }
    
    // Output diagnostics
    log('info', 'Output summary:');
    log('info', `  Exit code: ${result.exitCode !== null ? result.exitCode : 'N/A (process killed)'}`);
    
    // Save detailed logs
    const logDir = path.join(__dirname, 'mcp-diagnostic-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(logDir, `${path.basename(serverPath)}-${timestamp}.log`);
    
    fs.writeFileSync(logFilePath, `
=== MCP SERVER DIAGNOSTIC LOG ===
Server path: ${serverPath}
Timestamp: ${new Date().toISOString()}
Exit code: ${result.exitCode}

=== STDOUT ===
${result.stdout}

=== STDERR ===
${result.stderr}
`);
    
    log('info', `Detailed logs saved to: ${logFilePath}`);
  }
  
  log('info', 'Diagnostics complete!');
}

// Run the diagnostics
runDiagnostics().catch(err => {
  log('error', `Diagnostics failed: ${err.message}`);
  process.exit(1);
});
