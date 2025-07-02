#!/bin/bash
# Systematic Test Runner and Fixer for SwissKnife
# This script runs tests, reports status, and adds diagnostic information

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

# Use the unified config
JEST_CONFIG="jest.unified.config.cjs"

# File to store the results
REPORT_FILE="test-status-report.md"

echo "# SwissKnife Test Status Report" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Function to run a test and record results
run_test() {
    local test_file=$1
    local config_file=$2
    local label=$3
    
    echo -e "${BLUE}Running test: ${test_file} with config ${config_file}${RESET}"
    echo "### ${label}: \`${test_file}\`" >> $REPORT_FILE
    echo "Using config: \`${config_file}\`" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
    
    NODE_OPTIONS="--experimental-vm-modules" npx jest --config=${config_file} ${test_file} > >(tee -a /tmp/test_output)  2>&1
    local result=$?
    
    cat /tmp/test_output >> $REPORT_FILE
    rm /tmp/test_output
    
    echo "\`\`\`" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED: ${test_file}${RESET}"
        echo "**Status: ✅ PASSED**" >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        return 0
    else
        echo -e "${RED}✗ FAILED: ${test_file}${RESET}"
        echo "**Status: ❌ FAILED**" >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        return 1
    fi
}

# Array of test categories to run
declare -a TEST_CATEGORIES=(
    "Basic Tests"
    "Unit Tests"
    "Integration Tests"
)

# Basic tests - these should always pass and validate our setup
echo -e "${CYAN}==== Running Basic Tests ====${RESET}"
echo "## Basic Tests" >> $REPORT_FILE
echo "These tests validate our basic testing setup." >> $REPORT_FILE
echo "" >> $REPORT_FILE

run_test "test/super-minimal.test.js" "jest-super-minimal.config.cjs" "Super Minimal Test"
basic_test_status=$?
run_test "test/basic.test.js" "jest.unified.config.cjs" "Basic Test"
basic_test2_status=$?

# Unit tests - these test individual components
echo -e "${CYAN}==== Running Unit Tests ====${RESET}"
echo "## Unit Tests" >> $REPORT_FILE
echo "These tests validate individual components." >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Run basic tests first
echo -e "${BLUE}==== Running Basic Tests ====${RESET}"
echo "## Basic Tests" >> $REPORT_FILE
echo "These are simplified tests to verify the Jest setup." >> $REPORT_FILE
echo "" >> $REPORT_FILE

run_test "basic-error-test.mjs" "$JEST_CONFIG" "Super Minimal Test"
basic_test_status=$?

run_test "comprehensive-error-tests.mjs" "$JEST_CONFIG" "Basic Test"
basic_test2_status=$?

# Run core data structure tests
echo -e "${CYAN}==== Running Core Data Structure Tests ====${RESET}"
echo "## Core Data Structure Tests" >> $REPORT_FILE
echo "These test the fundamental data structures used by the task system." >> $REPORT_FILE
echo "" >> $REPORT_FILE
run_test "test/unit/tasks/fibonacci-heap.test.ts" "$JEST_CONFIG" "FibonacciHeap"
fibonacci_heap_status=$?

run_test "test/unit/tasks/dag.test.ts" "$JEST_CONFIG" "DirectedAcyclicGraph"
dag_status=$?

run_test "test/simplified-execution-service.test.js" "$JEST_CONFIG" "Simplified Execution Service"
simplified_execution_service_status=$?

run_test "test/execution-service-isolated.test.js" "$JEST_CONFIG" "Execution Service (Isolated)"
execution_service_status=$?

run_test "test/mcp-minimal.test.js" "$JEST_CONFIG" "MCP Server (Minimal)"
mcp_minimal_status=$?

# Create combined diagnostic tests
echo -e "${CYAN}==== Running Test Diagnostics ====${RESET}"
echo "## Test Diagnostics" >> $REPORT_FILE
echo "These tests help diagnose specific issues." >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Summary of overall results
echo "## Test Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "| Test | Status |" >> $REPORT_FILE
echo "|------|--------|" >> $REPORT_FILE
echo "| Super Minimal Test | $([ $basic_test_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE
echo "| Basic Test | $([ $basic_test2_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE
echo "| FibonacciHeap | $([ $fibonacci_heap_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE
echo "| DirectedAcyclicGraph | $([ $dag_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE
echo "| Simplified Execution Service | $([ $simplified_execution_service_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE
echo "| Execution Service (Isolated) | $([ $execution_service_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE
echo "| MCP Server (Minimal) | $([ $mcp_minimal_status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") |" >> $REPORT_FILE

# Create a summary in the terminal
echo -e "${CYAN}==== Test Summary ====${RESET}"
echo -e "Super Minimal Test: $([ $basic_test_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"
echo -e "Basic Test: $([ $basic_test2_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"
echo -e "FibonacciHeap: $([ $fibonacci_heap_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"
echo -e "DirectedAcyclicGraph: $([ $dag_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"
echo -e "Simplified Execution Service: $([ $simplified_execution_service_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"
echo -e "Execution Service (Isolated): $([ $execution_service_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"
echo -e "MCP Server (Minimal): $([ $mcp_minimal_status -eq 0 ] && echo -e "${GREEN}✓ PASSED${RESET}" || echo -e "${RED}✗ FAILED${RESET}")"

echo -e "${BLUE}Test report written to ${REPORT_FILE}${RESET}"
