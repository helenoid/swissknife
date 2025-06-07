#!/bin/bash
# Test runner for enhanced MCP server tests

set -e

echo "Running enhanced MCP server tests..."

# Make sure the project is built first
echo "Building project..."
npm run build

# Run the enhanced tests
echo "Running tests..."
npx jest test/unit/mcp-server/enhanced-mcp-server.test.ts --verbose

# If we get here, the tests passed
echo "Tests completed successfully!"
exit 0
