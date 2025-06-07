#!/bin/bash
# MCP Registry Test Diagnostic Script

# Define output directory
OUTPUT_DIR="mcp-test-debug-$(date +%Y%m%d_%H%M%S)"
mkdir -p $OUTPUT_DIR

# Check the test file
TEST_FILE="test/unit/services/mcp/fixed-mcp-registry.test.js"

echo "===== MCP REGISTRY TEST DIAGNOSTIC ====="
echo "Running diagnostics on: $TEST_FILE"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Check if file exists
if [[ ! -f "$TEST_FILE" ]]; then
  echo "ERROR: Test file not found: $TEST_FILE"
  exit 1
fi

# Save test file content for reference
cp "$TEST_FILE" "$OUTPUT_DIR/test-file.js"

# Check Jest helper module
HELPER_FILE="test/utils/jest-test-helper.js"
if [[ -f "$HELPER_FILE" ]]; then
  cp "$HELPER_FILE" "$OUTPUT_DIR/helper-file.js"
  echo "Helper file found and copied to diagnostics"
else
  echo "WARNING: Helper file not found: $HELPER_FILE"
fi

# Try to run the test with explicit node options
echo "Running test with explicit node options..."
NODE_OPTIONS="--trace-warnings --unhandled-rejections=strict" npx jest "$TEST_FILE" --config=jest.config.cjs --no-cache --verbose > "$OUTPUT_DIR/test-run.log" 2>&1
echo "Test exit code: $?"

# Check for common issues
echo ""
echo "===== CHECKING FOR COMMON ISSUES ====="

# Check for module path issues
echo "Checking module paths..."
grep -i "cannot find module" "$OUTPUT_DIR/test-run.log" > "$OUTPUT_DIR/module-errors.log"
if [[ -s "$OUTPUT_DIR/module-errors.log" ]]; then
  echo "ISSUE: Module not found errors detected"
  cat "$OUTPUT_DIR/module-errors.log"
else
  echo "No module path issues found"
fi

# Check for syntax errors
echo "Checking syntax errors..."
grep -i "syntax" "$OUTPUT_DIR/test-run.log" > "$OUTPUT_DIR/syntax-errors.log"
if [[ -s "$OUTPUT_DIR/syntax-errors.log" ]]; then
  echo "ISSUE: Syntax errors detected"
  cat "$OUTPUT_DIR/syntax-errors.log"
else
  echo "No syntax errors found"
fi

# Create a working version of the test
echo ""
echo "===== CREATING MINIMAL WORKING VERSION ====="
cat > "$OUTPUT_DIR/fixed-minimal.test.js" << 'EOL'
// Minimal version of the MCP registry test

// Import Jest globals
const { describe, test, expect, beforeEach } = require('@jest/globals');

// Simple mock implementation
class MockRegistry {
  constructor() {
    this.servers = new Map();
  }
  
  registerServer(config) {
    const id = config.id || `server-${Date.now()}`;
    this.servers.set(id, { ...config, id });
    return id;
  }
  
  getRegisteredServers() {
    return Array.from(this.servers.values());
  }
  
  getServerById(id) {
    return this.servers.get(id);
  }
}

// Basic test
describe('MCP Registry Basic Test', () => {
  let registry;
  
  beforeEach(() => {
    registry = new MockRegistry();
  });
  
  test('should register a server', () => {
    const id = registry.registerServer({ name: 'test' });
    expect(id).toBeTruthy();
  });
});
EOL

echo "Running minimal test version..."
npx jest "$OUTPUT_DIR/fixed-minimal.test.js" --config=jest.config.cjs --no-cache > "$OUTPUT_DIR/minimal-test-run.log" 2>&1
MINIMAL_EXIT=$?
echo "Minimal test exit code: $MINIMAL_EXIT"

if [[ $MINIMAL_EXIT -eq 0 ]]; then
  echo "SUCCESS: Minimal test passed! Use this as a base for fixing the test."
else
  echo "FAILURE: Even the minimal test failed. Check jest configuration."
fi

echo ""
echo "===== DIAGNOSTIC SUMMARY ====="
echo "Full diagnostic report available in: $OUTPUT_DIR"
echo "Next Steps:"
echo "1. Check the minimal test file and output log"
echo "2. Verify module paths and imports"
echo "3. Try running the test with the working configuration"
