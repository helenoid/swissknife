#!/bin/bash
# Specialized test runner for MCP deployment manager tests

# Set up colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create a results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./mcp_test_results_$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}MCP Deployment Manager Test Runner${RESET}"
echo "===================================="

# Check for the test file
TEST_FILE="./test/unit/services/mcp/mcp-deployment-manager.test.ts"
if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}Test file not found: $TEST_FILE${RESET}"
  exit 1
fi

# Create a specialized configuration for the MCP test
MCP_CONFIG="$RESULTS_DIR/mcp-test.config.js"
cat > "$MCP_CONFIG" << 'EOF'
/**
 * Specialized Jest configuration for MCP deployment manager tests
 */
module.exports = {
  // Use Node.js environment
  testEnvironment: 'node',
  
  // Target only the MCP test files
  testMatch: ['**/mcp/**/*.test.ts'],
  
  // Transform TS files
  transform: {
    '^.+\\.tsx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }]
  },
  
  // Map .js extensions to support ESM imports
  moduleNameMapper: {
    '^(.*)\\.js$': '$1'
  },
  
  // Verbose output for debugging
  verbose: true,
  
  // Increase timeout
  testTimeout: 30000,
};
EOF

echo -e "${YELLOW}Created specialized config for MCP tests${RESET}"

# Run the test with our specialized config
echo -e "${BLUE}Running MCP deployment manager test...${RESET}"
TEST_LOG="$RESULTS_DIR/test-output.log"

npx jest "$TEST_FILE" --config="$MCP_CONFIG" > "$TEST_LOG" 2>&1
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Test passed!${RESET}"
else
  echo -e "${RED}❌ Test failed.${RESET}"
  echo -e "${YELLOW}Checking for common issues...${RESET}"
  
  # Check for module resolution issues
  if grep -q "Cannot find module" "$TEST_LOG"; then
    echo -e "${YELLOW}Module resolution issues detected:${RESET}"
    grep -A 2 "Cannot find module" "$TEST_LOG"
  fi
  
  # Check for mock issues
  if grep -q "is not a function" "$TEST_LOG"; then
    echo -e "${YELLOW}Mock function issues detected:${RESET}"
    grep -A 2 "is not a function" "$TEST_LOG"
  fi
  
  # Create a fixed version of the test file
  FIXED_TEST="$RESULTS_DIR/fixed-mcp-test.ts"
  cp "$TEST_FILE" "$FIXED_TEST"
  
  # Fix common issues
  echo -e "${YELLOW}Creating fixed test file: $FIXED_TEST${RESET}"
  
  # 1. Fix imports - ensure all imports have .js extension for ESM compatibility
  sed -i 's/from \(['"'"'"]\)\(\.\.\/\)*src\/\(.*\)\([^.]['"'"'"]\)/from \1\2src\/\3.js\4/g' "$FIXED_TEST"
  
  # 2. Fix mock implementation - ensure proper mock return values
  sed -i 's/mockReturnThis/mockReturnThis()/g' "$FIXED_TEST"
  
  # Run the fixed test
  echo -e "${BLUE}Running fixed MCP test...${RESET}"
  FIXED_LOG="$RESULTS_DIR/fixed-test-output.log"
  
  npx jest "$FIXED_TEST" --config="$MCP_CONFIG" > "$FIXED_LOG" 2>&1
  FIXED_EXIT_CODE=$?
  
  if [ $FIXED_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Fixed test passed!${RESET}"
    echo -e "You should apply these fixes to the original test file:"
    echo -e "1. Ensure all imports have .js extension for ESM compatibility"
    echo -e "2. Fix any mock implementation issues"
  else
    echo -e "${RED}❌ Fixed test still fails.${RESET}"
    
    # Generate a diagnostic report
    echo -e "${BLUE}Generating diagnostic report...${RESET}"
    REPORT="$RESULTS_DIR/mcp_test_report.md"
    
    cat > "$REPORT" << EOF
# MCP Deployment Manager Test Diagnostic Report
Generated: $(date)

## Test Information
- Test file: $TEST_FILE
- Config file: $MCP_CONFIG

## Test Results
- Original test: $([ $TEST_EXIT_CODE -eq 0 ] && echo "PASS" || echo "FAIL")
- Fixed test: $([ $FIXED_EXIT_CODE -eq 0 ] && echo "PASS" || echo "FAIL")

## Issues Detected

### Module Resolution Issues
$(grep -A 2 "Cannot find module" "$TEST_LOG" || echo "None detected")

### Mock Function Issues
$(grep -A 2 "is not a function" "$TEST_LOG" || echo "None detected")

### Other Errors
$(grep -A 5 -B 1 "Error:" "$TEST_LOG" || echo "None detected")

## Recommended Fixes

1. **Fix ESM Imports**
   Ensure all imports have .js extension when importing from src:
   \`\`\`typescript
   // Change this
   import { Something } from '../../src/module';
   
   // To this
   import { Something } from '../../src/module.js';
   \`\`\`

2. **Fix Mock Implementations**
   Ensure mock functions are properly implemented:
   \`\`\`typescript
   // Incorrect
   const mockFn = jest.fn().mockReturnThis;
   
   // Correct
   const mockFn = jest.fn().mockReturnThis();
   \`\`\`

3. **Consistent Module Format**
   Make sure the test is using the same module format as the code:
   - If the project uses ESM (\`"type": "module"\` in package.json), use ESM imports
   - If the project uses CommonJS, use CommonJS requires

## Next Steps
1. Apply the recommended fixes to the original test file
2. Verify the test passes with the fixes
3. Apply similar fixes to other failing tests
EOF
    
    echo -e "${GREEN}Diagnostic report created: $REPORT${RESET}"
  fi
fi

echo -e "\n${BLUE}MCP Test Runner Complete!${RESET}"
