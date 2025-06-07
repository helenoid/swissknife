#!/bin/bash
# Master Test Script for SwissKnife Project

# Set basic params
TEST_TIMEOUT=30000  # 30 seconds per test

# Define some basic colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${GREEN}SwissKnife Test Runner${RESET}"
echo "========================="

# Function to run a test and report results
run_test() {
  local test_file=$1
  local description=$2
  
  echo -e "${YELLOW}Running: ${test_file}${RESET}"
  echo "Description: $description"
  
  npx jest "$test_file" --no-cache --verbose
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}PASSED: ${test_file}${RESET}"
    return 0
  else
    echo -e "${RED}FAILED: ${test_file}${RESET}"
    return 1
  fi
}

# First run basic sanity tests
echo "Phase 1: Basic Sanity Tests"
echo "-------------------------"
run_test "test/ultra-basic.test.js" "Extremely basic test to verify Jest works" || exit 1
run_test "test/verify-env.test.js" "Verify Jest environment is working" || exit 1
run_test "test/basic.test.js" "Basic test functionality" || exit 1

# Run utility tests
echo ""
echo "Phase 2: Utility Tests"
echo "--------------------"
run_test "test/mcp-minimal.test.js" "Minimal MCP Server test"
run_test "test/simple-registry.test.js" "Simple Model Registry test"
run_test "test/fresh-minimal.test.js" "Fresh minimal test"
run_test "test/extra-minimal.test.js" "Extra minimal test"
run_test "test/enhanced-minimal.test.js" "Enhanced minimal test"

# Run diagnostic tests
echo ""
echo "Phase 3: Diagnostic Tests"
echo "----------------------"
run_test "test/diagnostic-simple.test.js" "Simple diagnostic test"
run_test "test/diagnostic-enhanced.test.js" "Enhanced diagnostic test"

# Run error handling tests
echo ""
echo "Phase 4: Error Handling Tests"
echo "---------------------------"
run_test "test/unit/utils/errors/error-handling.simple.test.js" "Simple error handling tests"
run_test "test/unit/utils/errors/error-handling.fixed.test.js" "Fixed error handling tests"
run_test "test/unit/utils/errors/self-contained.test.js" "Self-contained error tests"

# Run logging tests
echo ""
echo "Phase 5: Logging Tests"
echo "-------------------"
run_test "test/unit/utils/logging/manager.simple.test.js" "Simple logging manager tests"
run_test "test/unit/utils/logging/integrated-manager.test.js" "Integrated logging manager tests"

# Run agent tests
echo ""
echo "Phase 6: Agent Tests"
echo "-----------------"
run_test "test/unit/ai/agent/base-agent-simple.test.js" "Simple base agent tests"
run_test "test/unit/ai/agent/base-agent.test.js" "Base agent tests"
run_test "test/unit/ai/agent/base-agent-tools.test.js" "Base agent tools tests"

# Run MCP tests
echo ""
echo "Phase 7: MCP Tests"
echo "---------------"
run_test "test/unit/services/mcp/fixed-mcp-registry.test.js" "Fixed MCP registry tests"
run_test "test/unit/services/mcp/mcp-registry-enhanced.test.js" "Enhanced MCP registry tests"

# Run Command tests
echo ""
echo "Phase 8: Command Tests"
echo "------------------"
run_test "test/unit/commands/registry.test.js" "Command registry tests"
run_test "test/unit/commands/mcp.test.js" "MCP command tests"

echo ""
echo "Test run complete!"
