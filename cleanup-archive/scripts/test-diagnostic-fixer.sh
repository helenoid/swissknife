#!/bin/bash
# Comprehensive Test Diagnostic and Fixer for SwissKnife
# This script diagnoses and fixes test issues in the SwissKnife codebase

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}=== SwissKnife Test Diagnostic and Fixer ===${RESET}"
echo "This script will diagnose and attempt to fix test issues"

# Create diagnostic report file
REPORT_FILE="test-diagnostic-report.md"
echo "# SwissKnife Test Diagnostic Report" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Function to run a test with specific configs
run_test() {
  local test_pattern=$1
  local config_file=$2
  local name=$3
  local options=$4
  
  echo -e "\n${YELLOW}Running test: ${name}${RESET}"
  echo -e "Test pattern: ${test_pattern}"
  echo -e "Config: ${config_file}"
  
  echo -e "\n## ${name}" >> $REPORT_FILE
  echo -e "Test pattern: \`${test_pattern}\`" >> $REPORT_FILE
  echo -e "Config: \`${config_file}\`" >> $REPORT_FILE
  echo -e "\n\`\`\`" >> $REPORT_FILE
  
  # Run the test
  NODE_OPTIONS="${options}" npx jest --config=${config_file} ${test_pattern} > >(tee -a /tmp/jest_output.log) 2>&1
  local result=$?
  
  # Capture output
  cat /tmp/jest_output.log >> $REPORT_FILE
  echo -e "\`\`\`\n" >> $REPORT_FILE
  
  # Check result
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED: ${name}${RESET}"
    echo -e "\n**Result: ✅ PASSED**\n" >> $REPORT_FILE
    return 0
  else
    echo -e "${RED}✗ FAILED: ${name}${RESET}"
    echo -e "\n**Result: ❌ FAILED**\n" >> $REPORT_FILE
    return 1
  fi
}

# Stage 1: Run basic tests with super minimal config
echo -e "\n${BLUE}Stage 1: Verifying basic test functionality${RESET}"
run_test "test/basic.test.js" "jest-super-minimal.config.cjs" "Basic Test - Super Minimal Config" ""
basic_minimal_status=$?

# Stage 2: Test our fixed configuration
echo -e "\n${BLUE}Stage 2: Testing fixed configuration${RESET}"
run_test "test/basic.test.js" "jest.fixed.config.cjs" "Basic Test - Fixed Config" ""
basic_fixed_status=$?

# Stage 3: Run the fixed component tests
echo -e "\n${BLUE}Stage 3: Testing fixed component tests${RESET}"
run_test "test/unit/mcp-server/fixed-mcp-server.test.js" "jest.fixed.config.cjs" "Fixed MCP Server Test" ""
mcp_fixed_status=$?

run_test "test/unit/execution/fixed-execution-service.test.js" "jest.fixed.config.cjs" "Fixed Execution Service Test" ""
execution_fixed_status=$?

# Stage 4: Now try the original tests with the fixed configuration
echo -e "\n${BLUE}Stage 4: Testing original tests with fixed configuration${RESET}"
run_test "test/unit/mcp-server/mcp-server.test.ts" "jest.fixed.config.cjs" "Original MCP Server Test" "--experimental-vm-modules"
original_mcp_status=$?

# Generate test report summary
echo -e "\n## Summary of Test Results" >> $REPORT_FILE
echo -e "\n| Test | Status |" >> $REPORT_FILE
echo -e "|------|--------|" >> $REPORT_FILE
echo -e "| Basic Test - Super Minimal Config | $([ $basic_minimal_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED') |" >> $REPORT_FILE
echo -e "| Basic Test - Fixed Config | $([ $basic_fixed_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED') |" >> $REPORT_FILE
echo -e "| Fixed MCP Server Test | $([ $mcp_fixed_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED') |" >> $REPORT_FILE
echo -e "| Fixed Execution Service Test | $([ $execution_fixed_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED') |" >> $REPORT_FILE
echo -e "| Original MCP Server Test | $([ $original_mcp_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED') |" >> $REPORT_FILE

# Provide recommendations
echo -e "\n## Recommendations" >> $REPORT_FILE

if [ $basic_fixed_status -eq 0 ] && [ $mcp_fixed_status -eq 0 ] && [ $execution_fixed_status -eq 0 ]; then
  echo -e "\n${GREEN}✓ Fixed tests are working correctly!${RESET}"
  echo -e "\nThe fixed test configurations and mock implementations are working correctly. To fix all tests in the codebase:" >> $REPORT_FILE
  echo -e "\n1. Use the \`jest.fixed.config.cjs\` configuration for all tests" >> $REPORT_FILE
  echo -e "\n2. Use the mock implementations from \`test/helpers/comprehensive-mocks.js\`" >> $REPORT_FILE
  echo -e "\n3. Make sure all tests properly mock external dependencies" >> $REPORT_FILE
  echo -e "\n4. Run tests with \`--experimental-vm-modules\` for ESM compatibility if needed" >> $REPORT_FILE
else
  echo -e "\n${RED}✗ Some fixed tests are still failing${RESET}"
  echo -e "\nSome issues still exist in the test configuration. Further debugging is required." >> $REPORT_FILE
fi

echo -e "\n${BLUE}Test diagnostic report generated: ${REPORT_FILE}${RESET}"
echo -e "Review this report for detailed test results and recommendations."
