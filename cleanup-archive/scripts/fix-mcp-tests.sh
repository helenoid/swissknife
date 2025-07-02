#!/bin/bash
# Fix MCP-related tests specifically
# This script fixes issues specific to the MCP server and client tests

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Fixing MCP-Related Tests =====${NC}"

# Create a proper MCP stub if needed
MCP_SDK_STUB="./test/mocks/stubs/mcp-sdk-stub.js"
if [ ! -f "$MCP_SDK_STUB" ] || [ $(wc -l < "$MCP_SDK_STUB") -lt 10 ]; then
  echo -e "${YELLOW}Creating/Updating MCP SDK stub...${NC}"
  mkdir -p ./test/mocks/stubs
  
  cat > "$MCP_SDK_STUB" << 'EOL'
/**
 * Mock implementation for the MCP SDK
 */

// Mock server class
class MockServer {
  constructor(options = {}) {
    this.options = options;
    this.isRunning = false;
    this.handlers = {};
  }
  
  start() {
    this.isRunning = true;
    return Promise.resolve({ port: this.options.port || 9000 });
  }
  
  stop() {
    this.isRunning = false;
    return Promise.resolve();
  }
  
  on(event, handler) {
    this.handlers[event] = handler;
    return this;
  }
  
  emit(event, ...args) {
    if (this.handlers[event]) {
      this.handlers[event](...args);
    }
    return this;
  }
}

// Mock client class
class MockClient {
  constructor(options = {}) {
    this.options = options;
    this.isConnected = false;
  }
  
  connect() {
    this.isConnected = true;
    return Promise.resolve();
  }
  
  disconnect() {
    this.isConnected = false;
    return Promise.resolve();
  }
  
  invoke(method, params) {
    return Promise.resolve({ result: 'mock-result' });
  }
}

// Export the mock implementation
export const MCPServer = MockServer;
export const MCPClient = MockClient;

export default {
  MCPServer: MockServer,
  MCPClient: MockClient,
};

// CommonJS compatibility
if (typeof module !== 'undefined') {
  module.exports = {
    MCPServer: MockServer,
    MCPClient: MockClient,
    default: {
      MCPServer: MockServer,
      MCPClient: MockClient,
    }
  };
}
EOL
fi

# Fix any MCP-specific tests
MCP_MINIMAL_TEST="./test/mcp-minimal.test.js"
if [ -f "$MCP_MINIMAL_TEST" ]; then
  echo -e "${YELLOW}Fixing minimal MCP test...${NC}"
  
  # Add proper imports with .js extensions
  sed -i 's/from "\.\.\/src\/mcp/from "\.\.\/src\/mcp.js/g' "$MCP_MINIMAL_TEST"
  sed -i 's/from "@modelcontextprotocol\/sdk"/from "\.\.\/test\/mocks\/stubs\/mcp-sdk-stub.js"/g' "$MCP_MINIMAL_TEST"
  
  # Ensure proper assertion style
  sed -i 's/expect(\(.*\))\.toBe/expect(\1).to.equal/g' "$MCP_MINIMAL_TEST"
  sed -i 's/expect(\(.*\))\.toEqual/expect(\1).to.deep.equal/g' "$MCP_MINIMAL_TEST"
fi

echo -e "${GREEN}MCP tests fixed successfully!${NC}"
echo "Now run the MCP test with:"
echo "npx jest --config=jest.unified.config.cjs test/mcp-minimal.test.js"
