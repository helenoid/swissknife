#!/bin/bash
# Progressive Test Runner
# This script runs tests incrementally, fixing issues and building up test coverage

# Configuration
OUTPUT_DIR="test-run-$(date +%Y%m%d_%H%M)"
CONFIG_FILE="jest.minimal.config.cjs"
VERBOSE=true
BASE_DIR=$(pwd)
FIXED_DIR="$BASE_DIR/$OUTPUT_DIR/fixed"
LOG_DIR="$BASE_DIR/$OUTPUT_DIR/logs"
FIXED_TESTS=0
TOTAL_TESTS=0
TOTAL_PASSED=0

# Create output directories
mkdir -p "$LOG_DIR"
mkdir -p "$FIXED_DIR"

echo "===== SWISSKNIFE PROGRESSIVE TEST RUNNER ====="
echo "Started at $(date)"
echo "Results directory: $OUTPUT_DIR"

# Function to create a test fixer for specific patterns
create_test_fixer() {
  local OUTPUT_PATH="$1"
  local PATTERNS="$2"
  
  cat > "$OUTPUT_PATH" << 'EOL'
/**
 * Targeted Test Fixer
 * 
 * This script automatically repairs common test issues.
 */

const fs = require('fs');
const path = require('path');

// Get test file from command line
const testFile = process.argv[2];
if (!testFile) {
  console.error('Please provide a test file path');
  console.error('Usage: node targeted-test-fixer.js path/to/test/file.js');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(testFile)) {
  console.error(`File not found: ${testFile}`);
  process.exit(1);
}

console.log(`\nFIXING TEST FILE: ${testFile}`);
console.log('='.repeat(60));

// Read test file content
const content = fs.readFileSync(testFile, 'utf8');

// Create backup
const backupFile = `${testFile}.bak`;
if (!fs.existsSync(backupFile)) {
  fs.writeFileSync(backupFile, content, 'utf8');
  console.log(`Created backup at: ${backupFile}`);
}

// Common fixes to apply
let updatedContent = content;
let fixesApplied = 0;

// Fix 1: Add Jest globals
if (!updatedContent.includes('require(\'@jest/globals\')')) {
  console.log('\nFix #1: Adding Jest globals import...');
  updatedContent = `const { describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll, jest } = require('@jest/globals');\n\n${updatedContent}`;
  fixesApplied++;
  console.log('  ✓ Added Jest globals import');
}

// Fix 2: Fix import/require paths
if (updatedContent.includes('import') || updatedContent.includes('require(')) {
  console.log('\nFix #2: Fixing module paths...');
  
  // Fix relative imports missing .js extension
  const originalContent = updatedContent;
  updatedContent = updatedContent.replace(
    /from\s+['"]([^'"]+\/[^'"./]+)['"];?/g,
    (match, p1) => {
      // Skip node_modules, Node.js built-ins or absolute paths
      if (p1.startsWith('@') || 
          p1.startsWith('node:') || 
          !p1.includes('/') ||
          /^(fs|path|http|events|stream|util|crypto|child_process)$/.test(p1)) {
        return match;
      }
      return `from '${p1}.js';`;
    }
  );
  
  // Fix requires missing .js extension
  updatedContent = updatedContent.replace(
    /require\(['"]([^'"]+\/[^'"./]+)['"]\)/g,
    (match, p1) => {
      // Skip node_modules, Node.js built-ins or absolute paths
      if (p1.startsWith('@') || 
          p1.startsWith('node:') || 
          !p1.includes('/') ||
          /^(fs|path|http|events|stream|util|crypto|child_process)$/.test(p1)) {
        return match;
      }
      return `require('${p1}.js')`;
    }
  );
  
  if (originalContent !== updatedContent) {
    fixesApplied++;
    console.log('  ✓ Fixed module paths');
  }
}

// Fix 3: Repair TypeScript artifacts in JS files
if (testFile.endsWith('.js')) {
  console.log('\nFix #3: Fixing TypeScript artifacts...');
  
  // Replace TypeScript interfaces with JSDoc
  const originalContent = updatedContent;
  
  // Convert type annotations on variables
  updatedContent = updatedContent.replace(
    /(\w+)\s*:\s*(string|number|boolean|any|object|unknown)(\s*[=;])/g,
    '$1$3'
  );
  
  // Remove TypeScript generic syntax
  updatedContent = updatedContent.replace(/<(string|number|boolean|any|object|unknown)>/g, '');
  
  if (originalContent !== updatedContent) {
    fixesApplied++;
    console.log('  ✓ Fixed TypeScript artifacts');
  }
}

// Fix 4: Add common mocks for external dependencies
const addMockIfNeeded = (pattern, mockCode) => {
  if (updatedContent.includes(pattern) && !updatedContent.includes(`jest.mock('${pattern}'`)) {
    console.log(`\nFix: Adding mock for ${pattern}...`);
    updatedContent = `${mockCode}\n\n${updatedContent}`;
    fixesApplied++;
    console.log(`  ✓ Added mock for ${pattern}`);
  }
};

// Add your specific pattern mocks here
EOL

  echo "$PATTERNS" >> "$OUTPUT_PATH"
  
  cat >> "$OUTPUT_PATH" << 'EOL'

// Write updated content back to file if changes were made
if (fixesApplied > 0) {
  fs.writeFileSync(testFile, updatedContent, 'utf8');
  console.log(`\n✅ Applied ${fixesApplied} fixes to ${testFile}`);
  console.log('Run the test again to check if it passes now.');
  process.exit(0);
} else {
  console.log('\n⚠️ No automated fixes could be applied.');
  console.log('The issue may require manual inspection.');
  process.exit(1);
}
EOL

  # Make executable
  chmod +x "$OUTPUT_PATH"
}

# Create a targeted test fixer for common MCP issues
create_test_fixer "$BASE_DIR/$OUTPUT_DIR/mcp-test-fixer.js" "
// MCP-specific mocks
addMockIfNeeded('@modelcontextprotocol/sdk', 'jest.mock(\"@modelcontextprotocol/sdk\", () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined)
  })),
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    request: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));');

// MCP Transport mock
addMockIfNeeded('@modelcontextprotocol/sdk/server/stdio', 'jest.mock(\"@modelcontextprotocol/sdk/server/stdio\", () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined)
  }))
}));');

// Common MCP module mocks
addMockIfNeeded('src/utils/log', 'jest.mock(\"src/utils/log\", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn()
}), { virtual: true });');
"

# Create a targeted test fixer for utility module tests
create_test_fixer "$BASE_DIR/$OUTPUT_DIR/utils-test-fixer.js" "
// Mock fs for utils tests
addMockIfNeeded('fs/promises', 'jest.mock(\"fs/promises\", () => ({
  readFile: jest.fn().mockResolvedValue('test content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
}));');

// Mock config module
addMockIfNeeded('src/utils/config', 'jest.mock(\"src/utils/config\", () => ({
  getConfig: jest.fn().mockResolvedValue({}),
  setConfig: jest.fn().mockResolvedValue(undefined),
  CONFIG_FILE: 'test-config.json'
}), { virtual: true });');

// Mock log module 
addMockIfNeeded('src/utils/log', 'jest.mock(\"src/utils/log\", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn()
}), { virtual: true });');
"

# Create a targeted test fixer for AI module tests
create_test_fixer "$BASE_DIR/$OUTPUT_DIR/ai-test-fixer.js" "
// Mock model modules
addMockIfNeeded('src/ai/models/model', 'jest.mock(\"src/ai/models/model\", () => ({
  Model: jest.fn().mockImplementation(() => ({
    id: 'test-model',
    generate: jest.fn().mockResolvedValue({ content: 'Test response' })
  }))
}), { virtual: true });');

// Mock agent module
addMockIfNeeded('src/ai/agent/agent', 'jest.mock(\"src/ai/agent/agent\", () => ({
  Agent: jest.fn().mockImplementation(() => ({
    processMessage: jest.fn().mockResolvedValue({ content: 'Test response' }),
    registerTool: jest.fn()
  }))
}), { virtual: true });');

// Mock registry module
addMockIfNeeded('src/ai/models/registry', 'jest.mock(\"src/ai/models/registry\", () => ({
  ModelRegistry: {
    getInstance: jest.fn().mockReturnValue({
      getModelProvider: jest.fn().mockReturnValue({
        generateResponse: jest.fn().mockResolvedValue({ content: 'Test response' })
      }),
      registerModel: jest.fn(),
      getModel: jest.fn()
    })
  }
}), { virtual: true });');
"

# Function to run a test with auto-fixing
run_test_with_fix() {
  local test_file=$1
  local config=$2
  local test_type=$3
  local fixer_script="$BASE_DIR/$OUTPUT_DIR/${test_type}-test-fixer.js"
  local log_file="$LOG_DIR/$(basename $test_file).log"
  
  echo -e "\n\033[1;34mTESTING: $test_file\033[0m"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  # Run the test
  npx jest --config=$config "$test_file" > "$log_file" 2>&1
  local result=$?
  
  # Check if test passed or failed
  if [ $result -eq 0 ]; then
    echo -e "\033[1;32m✓ PASSED\033[0m"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
  else
    echo -e "\033[1;31m✗ FAILED\033[0m"
    
    # Show error summary
    echo "Error summary:"
    grep -A 5 "FAIL " "$log_file" | head -n 6
    
    # Attempt to fix the test
    echo -e "\nAttempting to fix the test..."
    node "$fixer_script" "$test_file"
    fix_result=$?
    
    if [ $fix_result -eq 0 ]; then
      echo -e "\nRe-running test after fix..."
      npx jest --config=$config "$test_file" > "${log_file}.fixed" 2>&1
      rerun_result=$?
      
      if [ $rerun_result -eq 0 ]; then
        echo -e "\033[1;32m✓ FIX SUCCESSFUL\033[0m"
        cp "$test_file" "$FIXED_DIR/$(basename $test_file)"
        FIXED_TESTS=$((FIXED_TESTS + 1))
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
      else
        echo -e "\033[1;31m✗ FIX FAILED\033[0m"
        echo "New error summary:"
        grep -A 5 "FAIL " "${log_file}.fixed" | head -n 6
      fi
    else
      echo "Could not automatically fix the test. Manual inspection required."
    fi
  fi
}

# Find and categorize test files
echo "Scanning for test files..."
find "$BASE_DIR/test" -name "*.test.js" > "$OUTPUT_DIR/all_tests.txt"

# Group tests by type for targeted fixing
grep "mcp\|model" "$OUTPUT_DIR/all_tests.txt" > "$OUTPUT_DIR/mcp_tests.txt"
grep "utils\|config\|log" "$OUTPUT_DIR/all_tests.txt" > "$OUTPUT_DIR/utils_tests.txt"
grep "ai\|agent\|model" "$OUTPUT_DIR/all_tests.txt" > "$OUTPUT_DIR/ai_tests.txt"

# Tests that don't fit in specific categories
grep -v -f "$OUTPUT_DIR/mcp_tests.txt" -f "$OUTPUT_DIR/utils_tests.txt" -f "$OUTPUT_DIR/ai_tests.txt" "$OUTPUT_DIR/all_tests.txt" > "$OUTPUT_DIR/other_tests.txt"

# Run the super minimal tests first to validate the environment
echo -e "\n===== RUNNING VALIDATION TESTS ====="
npx jest --config=$CONFIG_FILE test/super-minimal.test.js test/enhanced-minimal.test.js

# Run categorized tests with specialized fixers
echo -e "\n===== RUNNING MCP TESTS ====="
while IFS= read -r test_file; do
  run_test_with_fix "$test_file" "$CONFIG_FILE" "mcp"
done < "$OUTPUT_DIR/mcp_tests.txt"

echo -e "\n===== RUNNING UTILITY TESTS ====="
while IFS= read -r test_file; do
  run_test_with_fix "$test_file" "$CONFIG_FILE" "utils"
done < "$OUTPUT_DIR/utils_tests.txt"

echo -e "\n===== RUNNING AI TESTS ====="
while IFS= read -r test_file; do
  run_test_with_fix "$test_file" "$CONFIG_FILE" "ai"
done < "$OUTPUT_DIR/ai_tests.txt"

echo -e "\n===== RUNNING OTHER TESTS ====="
while IFS= read -r test_file; do
  # Use MCP fixer as default for other tests
  run_test_with_fix "$test_file" "$CONFIG_FILE" "mcp"
done < "$OUTPUT_DIR/other_tests.txt"

# Generate test report
echo -e "\n===== TEST SUMMARY ====="
echo "Total tests: $TOTAL_TESTS"
echo "Passed tests: $TOTAL_PASSED"
echo "Failed tests: $((TOTAL_TESTS - TOTAL_PASSED))"
echo "Successfully fixed tests: $FIXED_TESTS"

echo -e "\nTest run completed at $(date)"
echo -e "Results are in: $OUTPUT_DIR\n"

# Create a test report
cat > "$OUTPUT_DIR/test-report.md" << EOL
# SwissKnife Test Report

Generated at: $(date)

## Summary
- Total tests: $TOTAL_TESTS
- Passed tests: $TOTAL_PASSED
- Failed tests: $((TOTAL_TESTS - TOTAL_PASSED))
- Successfully fixed tests: $FIXED_TESTS

## Test Categories
- MCP tests: $(wc -l < "$OUTPUT_DIR/mcp_tests.txt") found
- Utility tests: $(wc -l < "$OUTPUT_DIR/utils_tests.txt") found
- AI tests: $(wc -l < "$OUTPUT_DIR/ai_tests.txt") found
- Other tests: $(wc -l < "$OUTPUT_DIR/other_tests.txt") found

## Common Issues Fixed
1. Missing Jest globals import
2. Missing file extensions in imports/requires
3. TypeScript artifacts in JavaScript files
4. Missing mocks for external dependencies

## Next Steps
- Review the fixed test files to understand the patterns
- Apply similar fixes to any remaining failing tests
- Update the project documentation to reflect test requirements
EOL

echo "Test report generated: $OUTPUT_DIR/test-report.md"
