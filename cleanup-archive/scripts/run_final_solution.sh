#!/bin/bash
# run_final_solution.sh - Comprehensive MCP server testing script
# This is a robust script for testing MCP server functionality

# Don't exit on errors to collect full diagnostics
# set -e
# set -o pipefail

# Define colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create log directory
LOG_DIR="./test-logs"
mkdir -p "$LOG_DIR"

# Timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/mcp_test_$TIMESTAMP.log"

# Log function that outputs to both terminal and log file
log() {
  local level=$1
  local message=$2
  local color="$RESET"
  
  case "$level" in
    "INFO") color="$BLUE" ;;
    "SUCCESS") color="$GREEN" ;;
    "WARNING") color="$YELLOW" ;;
    "ERROR") color="$RED" ;;
  esac
  
  echo -e "${color}[$level] $message${RESET}" | tee -a "$LOG_FILE"
}

log "INFO" "======================================================"
log "INFO" "🧪 MCP Server Test Suite - Final Solution"
log "INFO" "======================================================"
log "INFO" "Started at: $(date)"
log "INFO" "Log file: $LOG_FILE"

# Step 1: Check environment
log "INFO" "Checking environment..."
NODE_VERSION=$(node --version)
log "INFO" "Node.js version: $NODE_VERSION"

# Check for required NPM packages
log "INFO" "Checking for required NPM packages..."
if ! npm list @modelcontextprotocol/sdk --json --depth=0 > /dev/null 2>&1; then
  log "ERROR" "Required package @modelcontextprotocol/sdk not installed"
  log "INFO" "Installing @modelcontextprotocol/sdk..."
  npm install @modelcontextprotocol/sdk
fi

# Step 2: Build project
log "INFO" "Building project..."
npm run build || {
  log "ERROR" "Build failed"
  exit 1
}

# Step 3: Create test environment
TEST_DIR=$(mktemp -d)
log "INFO" "Created test directory: $TEST_DIR"

# Create test data
echo "Test file content" > "$TEST_DIR/test-file.txt"

# Step 4: Create a simple MCP test client
TEST_CLIENT_PATH="$TEST_DIR/mcp-test-client.js"
log "INFO" "Creating test client at $TEST_CLIENT_PATH"

cat > "$TEST_CLIENT_PATH" << 'EOF'
// Simple MCP test client - Handles both CommonJS and ESM formats
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Enhanced module resolution to handle ESM/CommonJS compatibility issues
async function resolveMcpSdk() {
  console.log("Attempting to resolve MCP SDK modules...");
  
  // Check if the package is installed and get module type
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'node_modules/@modelcontextprotocol/sdk/package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkgInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`Found @modelcontextprotocol/sdk version ${pkgInfo.version}, type: ${pkgInfo.type || 'commonjs'}`);
    } else {
      console.log("SDK package.json not found - attempting to install");
      try {
        execSync('npm install @modelcontextprotocol/sdk --legacy-peer-deps', { stdio: 'inherit' });
        console.log("SDK installation complete");
      } catch (installErr) {
        console.error("Failed to install SDK:", installErr.message);
      }
    }
  } catch (err) {
    console.error("Error checking SDK package:", err.message);
  }
  
  // Different resolution strategies
  const resolutionPaths = [
    // CommonJS paths
    {
      clientPath: path.join(process.cwd(), 'node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js'),
      transportPath: path.join(process.cwd(), 'node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js')
    },
    // ESM paths with .js extension
    {
      clientPath: '@modelcontextprotocol/sdk/client/index.js',
      transportPath: '@modelcontextprotocol/sdk/client/stdio.js'
    },
    // ESM paths without .js extension
    {
      clientPath: '@modelcontextprotocol/sdk/client/index',
      transportPath: '@modelcontextprotocol/sdk/client/stdio'
    }
  ];
  
  // Try all resolution paths
  for (const paths of resolutionPaths) {
    try {
      console.log(`Trying to resolve from: ${paths.clientPath}`);
      const { Client } = require(paths.clientPath);
      const { StdioClientTransport } = require(paths.transportPath);
      console.log("✓ Successfully resolved MCP SDK modules");
      return { Client, StdioClientTransport };
    } catch (err) {
      console.log(`× Resolution failed: ${err.message}`);
    }
  }
  
  throw new Error("Failed to resolve MCP SDK modules using all known paths");
}

async function testMCPServer(serverPath, workDir) {
  console.log('Testing MCP server');
  console.log('Server path:', serverPath);
  console.log('Work dir:', workDir);

  try {
    // Resolve the MCP SDK modules
    const { Client, StdioClientTransport } = await resolveMcpSdk();
    
    // DEBUG: Check if server file exists and is accessible
    try {
      const serverStats = fs.statSync(serverPath);
      console.log(`Server file exists: ${fs.existsSync(serverPath)}, size: ${serverStats.size}B`);
    } catch (err) {
      console.error(`WARNING: Server file issue: ${err.message}`);
    }
    
    console.log('Creating transport...');
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath, workDir],
      stderr: 'pipe',
      // Add additional options to help with debugging
      env: {
        ...process.env,
        DEBUG: 'mcp:*',
        NODE_PATH: process.cwd() + '/node_modules'
      }
    });

    // Add error listener to capture transport errors
    transport.on && transport.on('error', (err) => {
      console.error('Transport error:', err);
    });

    console.log('Creating client...');
    const client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    console.log('Connecting to server...');
    try {
      await client.connect(transport);
      console.log('Connected to server successfully!');
    } catch (connErr) {
      console.error('Connection error:', connErr.message);
      // Try to get some diagnostic information from the server if possible
      if (transport.process?.stderr) {
        const buffers = [];
        transport.process.stderr.on('data', (chunk) => buffers.push(chunk));
        setTimeout(() => {
          console.log('Server stderr output:', Buffer.concat(buffers).toString());
        }, 1000);
      }
      throw connErr;
    }

    console.log('Requesting server capabilities...');
    const capabilities = await client.getServerCapabilities();
    console.log('Server capabilities:', JSON.stringify(capabilities));

    console.log('Listing tools...');
    const result = await client.request({ method: 'tools/list' });
    console.log('Available tools:', JSON.stringify(result.tools.map(t => t.name)));

    if (result.tools.find(t => t.name === 'bash')) {
      console.log('Testing bash tool...');
      const bashResult = await client.callTool({
        name: 'bash',
        arguments: { command: 'ls -la' }
      });
      console.log('Bash tool result:', JSON.stringify(bashResult));
    }

    if (result.tools.find(t => t.name === 'fileRead')) {
      console.log('Testing fileRead tool...');
      const fileResult = await client.callTool({
        name: 'fileRead',
        arguments: { path: 'test-file.txt' }
      });
      console.log('fileRead tool result:', JSON.stringify(fileResult));
    }

    console.log('Disconnecting...');
    if (client.disconnect) {
      await client.disconnect();
      console.log('Successfully disconnected from server');
    } else {
      console.log('Client has no disconnect method, skipping');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error testing MCP server:', error);
    process.exit(1);
  }
}

// Get arguments from process
const serverPath = process.argv[2];
const workDir = process.argv[3];

if (!serverPath || !workDir) {
  console.error('Usage: node mcp-test-client.js <server-path> <work-dir>');
  process.exit(1);
}

// Run the test
testMCPServer(serverPath, workDir);
EOF

# Step 5: Find the MCP server file
SERVER_PATH=""
for path in "dist/src/entrypoints/mcp.js" "dist/entrypoints/mcp.js" "src/entrypoints/mcp.ts"; do
  if [ -f "$path" ]; then
    SERVER_PATH="$path"
    break
  fi
done

if [ -z "$SERVER_PATH" ]; then
  log "ERROR" "Could not find MCP server file"
  exit 1
fi

log "INFO" "Found MCP server at: $SERVER_PATH"

# Step 6: Run basic tests
log "INFO" "Running MCP server basic tests..."
node "$TEST_CLIENT_PATH" "$(pwd)/$SERVER_PATH" "$TEST_DIR" > "$TEST_DIR/client-output.log" 2>&1

if [ $? -eq 0 ]; then
  log "SUCCESS" "MCP server basic tests passed"
  cat "$TEST_DIR/client-output.log" >> "$LOG_FILE" 
else
  log "ERROR" "MCP server basic tests failed"
  log "INFO" "Client output:"
  cat "$TEST_DIR/client-output.log" | tee -a "$LOG_FILE"
  
  # Analyze errors
  if grep -q "Cannot find module" "$TEST_DIR/client-output.log"; then
    log "ERROR" "Module resolution error detected"
    log "INFO" "Trying to resolve module issues..."
    
    # Create a node_modules symlink in the test directory if needed
    if [ ! -d "$TEST_DIR/node_modules" ]; then
      ln -s "$(pwd)/node_modules" "$TEST_DIR/node_modules"
      log "INFO" "Created symlink to node_modules in test directory"
    fi
    
    # Try again with updated configuration
    log "INFO" "Retrying with fixed module paths..."
    NODE_PATH="$(pwd)/node_modules:$NODE_PATH" node "$TEST_CLIENT_PATH" "$(pwd)/$SERVER_PATH" "$TEST_DIR" > "$TEST_DIR/client-output-retry.log" 2>&1
    
    if [ $? -eq 0 ]; then
      log "SUCCESS" "MCP server tests passed after module resolution fix"
      cat "$TEST_DIR/client-output-retry.log" >> "$LOG_FILE" 
    else
      log "ERROR" "MCP server tests still failing after module resolution fix"
      cat "$TEST_DIR/client-output-retry.log" | tee -a "$LOG_FILE"
    fi
  fi
fi

# Step 7: Run unit tests
log "INFO" "Running MCP server unit tests..."
npx jest test/unit/mcp-server/mcp-server.test.ts --verbose > "$TEST_DIR/unit-tests.log" 2>&1

if [ $? -eq 0 ]; then
  log "SUCCESS" "MCP server unit tests passed"
else
  log "ERROR" "MCP server unit tests failed"
  cat "$TEST_DIR/unit-tests.log" | tee -a "$LOG_FILE"
fi

# Step 8: Run enhanced tests if available
if [ -f "test/unit/mcp-server/enhanced-mcp-server.test.ts" ]; then
  log "INFO" "Running enhanced MCP server tests..."
  npx jest test/unit/mcp-server/enhanced-mcp-server.test.ts --verbose > "$TEST_DIR/enhanced-tests.log" 2>&1
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "Enhanced MCP server tests passed"
  else
    log "ERROR" "Enhanced MCP server tests failed"
    cat "$TEST_DIR/enhanced-tests.log" | tee -a "$LOG_FILE"
  fi
fi

# Step 9: Run Python diagnostic tool if present
if [ -f "mcp_server_diagnostic.py" ] && command -v python3 &> /dev/null; then
  log "INFO" "Running Python diagnostic tool..."
  python3 mcp_server_diagnostic.py --target-dir "$TEST_DIR" --report "$TEST_DIR/python-diagnostic.json" > "$TEST_DIR/python-diagnostic.log" 2>&1
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "Python diagnostic checks passed"
  else
    log "WARNING" "Python diagnostic detected issues"
    cat "$TEST_DIR/python-diagnostic.log" | tee -a "$LOG_FILE"
    
    # Extract recommendations
    if [ -f "$TEST_DIR/python-diagnostic.json" ]; then
      log "INFO" "Diagnostic recommendations:"
      grep -A 20 '"recommendations":' "$TEST_DIR/python-diagnostic.json" | tee -a "$LOG_FILE"
    fi
  fi
fi

# Step 10: Create a simple MCP server in Python for comparison testing
log "INFO" "Creating Python MCP server for comparison..."

cat > "$TEST_DIR/final_mcp_server.py" << 'EOF'
#!/usr/bin/env python3
"""
Simple MCP Server Implementation in Python 

This is a minimal implementation of an MCP server that can be used
for testing and as a reference for the JavaScript implementation.
"""

import json
import os
import subprocess
import sys
import threading
from typing import Dict, List, Optional, Any

# Define MCP protocol constants
REQUEST_MESSAGE = "request"
RESPONSE_MESSAGE = "response"
NOTIFICATION_MESSAGE = "notification"

# Available tools
TOOLS = [
    {
        "name": "bash",
        "description": "Execute a bash command",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The bash command to execute"
                }
            },
            "required": ["command"]
        },
        "returns": {
            "type": "object",
            "properties": {
                "output": {
                    "type": "string",
                    "description": "Command output"
                },
                "exitCode": {
                    "type": "number",
                    "description": "Exit code"
                }
            }
        }
    },
    {
        "name": "fileRead",
        "description": "Read a file",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to read"
                }
            },
            "required": ["path"]
        },
        "returns": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "File content"
                }
            }
        }
    }
]

class MCPServer:
    def __init__(self, workspace_dir: str):
        self.workspace_dir = workspace_dir
        self.request_id = 0
        self.stop_event = threading.Event()
        
        # Ensure the workspace directory exists
        os.makedirs(workspace_dir, exist_ok=True)
        
    def start(self):
        """Start the MCP server main loop"""
        print(f"Python MCP server starting with workspace: {self.workspace_dir}", file=sys.stderr)
        
        try:
            while not self.stop_event.is_set():
                # Read a message from stdin
                message_line = sys.stdin.readline()
                if not message_line:
                    break
                    
                # Parse the message
                try:
                    message = json.loads(message_line)
                    self.handle_message(message)
                except json.JSONDecodeError as e:
                    print(f"Error parsing message: {e}", file=sys.stderr)
                except Exception as e:
                    print(f"Error handling message: {e}", file=sys.stderr)
        except KeyboardInterrupt:
            print("Server stopped by user", file=sys.stderr)
        except Exception as e:
            print(f"Server error: {e}", file=sys.stderr)
        
        print("Python MCP server stopped", file=sys.stderr)
    
    def handle_message(self, message: Dict[str, Any]):
        """Handle an incoming MCP message"""
        if message.get("type") != REQUEST_MESSAGE:
            print(f"Ignoring non-request message: {message}", file=sys.stderr)
            return
            
        request_id = message.get("id")
        method = message.get("method")
        
        if not method:
            self.send_error_response(request_id, "No method specified")
            return
            
        if method == "getCapabilities":
            self.handle_get_capabilities(request_id)
        elif method == "tools/list":
            self.handle_list_tools(request_id)
        elif method == "tools/call":
            self.handle_call_tool(request_id, message.get("params", {}))
        else:
            self.send_error_response(request_id, f"Unknown method: {method}")
    
    def handle_get_capabilities(self, request_id: str):
        """Handle getCapabilities request"""
        capabilities = {
            "tools": True
        }
        self.send_response(request_id, capabilities)
    
    def handle_list_tools(self, request_id: str):
        """Handle tools/list request"""
        self.send_response(request_id, {"tools": TOOLS})
    
    def handle_call_tool(self, request_id: str, params: Dict[str, Any]):
        """Handle tools/call request"""
        tool_name = params.get("name")
        args = params.get("arguments", {})
        
        if not tool_name:
            self.send_error_response(request_id, "No tool name specified")
            return
            
        # Find the requested tool
        tool = next((t for t in TOOLS if t["name"] == tool_name), None)
        
        if not tool:
            self.send_error_response(request_id, f"Tool {tool_name} not found")
            return
            
        try:
            if tool_name == "bash":
                result = self.execute_bash(args.get("command", ""))
            elif tool_name == "fileRead":
                result = self.read_file(args.get("path", ""))
            else:
                self.send_error_response(request_id, f"Tool {tool_name} implementation not found")
                return
                
            self.send_response(request_id, result)
        except Exception as e:
            self.send_error_response(request_id, f"Error executing tool: {e}")
    
    def execute_bash(self, command: str) -> Dict[str, Any]:
        """Execute a bash command"""
        print(f"Executing bash command: {command}", file=sys.stderr)
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=self.workspace_dir
            )
            
            output = result.stdout
            if result.stderr:
                output += "\n" + result.stderr
                
            return {
                "content": [{"type": "text", "text": output}]
            }
        except Exception as e:
            print(f"Error executing command: {e}", file=sys.stderr)
            return {
                "content": [{"type": "text", "text": f"Error: {e}"}]
            }
    
    def read_file(self, path: str) -> Dict[str, Any]:
        """Read a file"""
        full_path = os.path.join(self.workspace_dir, path)
        print(f"Reading file: {full_path}", file=sys.stderr)
        
        try:
            with open(full_path, "r") as f:
                content = f.read()
                
            return {
                "content": [{"type": "text", "text": content}]
            }
        except Exception as e:
            print(f"Error reading file: {e}", file=sys.stderr)
            return {
                "content": [{"type": "text", "text": f"Error: {e}"}]
            }
    
    def send_response(self, request_id: str, result: Any):
        """Send a response message"""
        response = {
            "type": RESPONSE_MESSAGE,
            "id": request_id,
            "result": result
        }
        self._send_message(response)
    
    def send_error_response(self, request_id: str, message: str):
        """Send an error response message"""
        response = {
            "type": RESPONSE_MESSAGE,
            "id": request_id,
            "error": {
                "message": message
            }
        }
        self._send_message(response)
    
    def _send_message(self, message: Dict[str, Any]):
        """Send a message to stdout"""
        message_json = json.dumps(message)
        print(message_json, flush=True)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python final_mcp_server.py <workspace-dir>", file=sys.stderr)
        sys.exit(1)
        
    workspace_dir = sys.argv[1]
    server = MCPServer(workspace_dir)
    server.start()

if __name__ == "__main__":
    main()
EOF

chmod +x "$TEST_DIR/final_mcp_server.py"

# Step 11: Test the Python MCP server
log "INFO" "Testing Python MCP server..."
PYTHON_SERVER_LOG="$TEST_DIR/python-server.log"
PYTHON_CLIENT_LOG="$TEST_DIR/python-client.log"

# Start the Python server in the background
python3 "$TEST_DIR/final_mcp_server.py" "$TEST_DIR" > "$PYTHON_SERVER_LOG" 2>&1 &
PYTHON_SERVER_PID=$!

# Allow time for server to start
sleep 1

# Run the test client against the Python server
cat > "$TEST_DIR/python-test-client.js" << 'EOF'
// Test client for the Python MCP server
const { spawn } = require('child_process');
const path = require('path');

function testPythonServer(serverPath, workDir) {
  console.log(`Testing Python MCP server at: ${serverPath}`);
  
  // Start the Python server process
  const server = spawn('python3', [serverPath, workDir], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Buffer for server response
  let responseBuffer = '';
  
  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    processResponses();
  });
  
  server.stderr.on('data', (data) => {
    console.log(`Server stderr: ${data}`);
  });
  
  server.on('error', (err) => {
    console.error(`Server error: ${err}`);
    process.exit(1);
  });
  
  // Process complete JSON responses
  function processResponses() {
    let newlineIndex;
    while ((newlineIndex = responseBuffer.indexOf('\n')) !== -1) {
      const responseLine = responseBuffer.substring(0, newlineIndex);
      responseBuffer = responseBuffer.substring(newlineIndex + 1);
      
      try {
        const response = JSON.parse(responseLine);
        handleResponse(response);
      } catch (err) {
        console.error(`Error parsing response: ${err.message}`);
        console.error(`Response was: ${responseLine}`);
      }
    }
  }
  
  // Send a request to the server
  function sendRequest(method, params) {
    const id = `req-${Date.now()}`;
    const request = {
      type: 'request',
      id,
      method,
      params
    };
    
    console.log(`Sending request: ${method}`);
    server.stdin.write(JSON.stringify(request) + '\n');
    return id;
  }
  
  // Response handler
  const responseHandlers = new Map();
  function handleResponse(response) {
    const { id, result, error } = response;
    
    if (error) {
      console.error(`Error response for ${id}: ${error.message}`);
      return;
    }
    
    console.log(`Received response for ${id}`);
    
    const handler = responseHandlers.get(id);
    if (handler) {
      handler(result);
      responseHandlers.delete(id);
    }
  }
  
  // Start tests
  console.log('Starting tests...');
  
  // Test 1: Get capabilities
  const capabilitiesId = sendRequest('getCapabilities');
  responseHandlers.set(capabilitiesId, (result) => {
    console.log('Capabilities:', result);
    
    // Test 2: List tools
    const toolsId = sendRequest('tools/list');
    responseHandlers.set(toolsId, (result) => {
      console.log('Tools:', result.tools.map(t => t.name));
      
      // Test 3: Call bash tool
      const bashId = sendRequest('tools/call', {
        name: 'bash',
        arguments: { command: 'ls -la' }
      });
      responseHandlers.set(bashId, (result) => {
        console.log('Bash result:', result);
        
        // Test 4: Call fileRead tool
        const fileId = sendRequest('tools/call', {
          name: 'fileRead',
          arguments: { path: 'test-file.txt' }
        });
        responseHandlers.set(fileId, (result) => {
          console.log('FileRead result:', result);
          
          // All tests complete
          console.log('All tests completed successfully');
          server.kill();
          process.exit(0);
        });
      });
    });
  });
  
  // Set timeout for tests
  setTimeout(() => {
    console.error('Tests timed out after 10 seconds');
    server.kill();
    process.exit(1);
  }, 10000);
}

// Get arguments
const serverPath = process.argv[2];
const workDir = process.argv[3];

if (!serverPath || !workDir) {
  console.error('Usage: node python-test-client.js <server-path> <work-dir>');
  process.exit(1);
}

testPythonServer(serverPath, workDir);
EOF

# Run the test client
node "$TEST_DIR/python-test-client.js" "$TEST_DIR/final_mcp_server.py" "$TEST_DIR" > "$PYTHON_CLIENT_LOG" 2>&1

# Kill the Python server if it's still running
if kill -0 $PYTHON_SERVER_PID 2>/dev/null; then
  kill $PYTHON_SERVER_PID
fi

# Check results
if grep -q "All tests completed successfully" "$PYTHON_CLIENT_LOG"; then
  log "SUCCESS" "Python MCP server tests passed"
else
  log "ERROR" "Python MCP server tests failed"
  cat "$PYTHON_CLIENT_LOG" | tee -a "$LOG_FILE"
fi

# Step 12: Generate a report
log "INFO" "Generating test report..."

REPORT_FILE="mcp_test_report_$TIMESTAMP.md"
cat > "$REPORT_FILE" << EOF
# MCP Server Test Report

- **Date:** $(date)
- **Platform:** $(uname -a)
- **Node.js:** $NODE_VERSION

## Test Summary

The following tests were performed:

1. JavaScript MCP Server Tests
2. MCP Server Unit Tests
3. Enhanced MCP Server Tests
4. Python MCP Server Reference Implementation Tests

## Results

### JavaScript MCP Server Tests

$(if grep -q "MCP server basic tests passed" "$LOG_FILE"; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### MCP Server Unit Tests

$(if grep -q "MCP server unit tests passed" "$LOG_FILE"; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### Enhanced MCP Server Tests

$(if grep -q "Enhanced MCP server tests passed" "$LOG_FILE"; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### Python MCP Server Tests

$(if grep -q "Python MCP server tests passed" "$LOG_FILE"; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

## Issues Found

$(grep -A 1 "ERROR" "$LOG_FILE" | sed 's/^/- /' | sort | uniq)

## Recommendations

- Ensure @modelcontextprotocol/sdk package is correctly installed
- Use consistent module import styles (CommonJS vs ESM)
- Add proper error handling to MCP server implementation
- Implement comprehensive logging for easier debugging

EOF

log "INFO" "Test report generated: $REPORT_FILE"

# Step 13: Clean up
log "INFO" "Cleaning up..."
rm -rf "$TEST_DIR"

log "SUCCESS" "All tests completed!"
log "INFO" "Test report: $REPORT_FILE"
log "INFO" "Test log: $LOG_FILE"
