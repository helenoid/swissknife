#!/bin/bash

# SwissKnife Comprehensive Test Runner v4
# Implements best practices for running tests with proper isolation and diagnostics

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Set NODE_OPTIONS for memory management
export NODE_OPTIONS="--max-old-space-size=4096"

# Create directory for test reports
mkdir -p test-reports

# Print header
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}     SWISSKNIFE COMPREHENSIVE TEST RUNNER    ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${CYAN}Date: $(date)${NC}"
echo -e "${CYAN}Node version: $(node -v)${NC}"
echo -e "${CYAN}NPM version: $(npm -v)${NC}"
echo ""

# Function to run a specific test with a specific config
run_test() {
  local test_file=$1
  local config_file=$2
  local test_name=$(basename "$test_file" .js)
  local test_name=${test_name%.test}
  local report_file="test-reports/${test_name}-report.log"
  
  echo -e "${BLUE}Running test: ${test_name}${NC}"
  
  # Run the test with Jest
  npx jest --config "$config_file" "$test_file" --verbose > "$report_file" 2>&1
  local result=$?
  
  # Process the result
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
    return 0
  else
    echo -e "${RED}❌ FAILED: ${test_name}${NC}"
    echo -e "${YELLOW}Last few lines of error:${NC}"
    tail -n 15 "$report_file" | grep -v "at Object" | grep -v "at processTicksAndRejections"
    return 1
  fi
}

# Run our successfully fixed tests
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}     RUNNING FIXED COMPONENT TESTS          ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Run BaseAIAgent tool management test
run_test "test/unit/ai/agent/focused-agent-test.js" "jest.focused.config.cjs"
AGENT_TEST_RESULT=$?

# Run LogManager tests
run_test "test/unit/utils/logging/manager.simple.test.js" "jest.focused.config.cjs"
LOGGING_TEST_RESULT=$?

# Display summary of fixed components
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}     FIXED COMPONENTS TEST SUMMARY          ${NC}"
echo -e "${BLUE}==============================================${NC}"

if [ $AGENT_TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ BaseAIAgent Tool Management: PASSED${NC}"
else
  echo -e "${RED}❌ BaseAIAgent Tool Management: FAILED${NC}"
fi

if [ $LOGGING_TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ LogManager: PASSED${NC}"
else
  echo -e "${RED}❌ LogManager: FAILED${NC}"
fi

# Overall status
if [ $AGENT_TEST_RESULT -eq 0 ] && [ $LOGGING_TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ All fixed component tests passed!${NC}"
  echo -e "${CYAN}See TEST-REPORT.md for details on remaining tests to fix${NC}"
  exit 0
else
  echo -e "${RED}❌ Some fixed component tests failed${NC}"
  echo -e "${CYAN}See test-reports directory for detailed logs${NC}"
  exit 1
fi
