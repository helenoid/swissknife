#!/bin/bash

# Comprehensive Test Runner v3
# This script runs all Jest tests and provides detailed diagnostic information about failures

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
echo -e "${BLUE}     COMPREHENSIVE TEST RUNNER v3           ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${CYAN}Date: $(date)${NC}"
echo -e "${CYAN}Node version: $(node -v)${NC}"
echo -e "${CYAN}NPM version: $(npm -v)${NC}"
echo ""

# Function to run a specific test file with a given config
run_test() {
  local test_file=$1
  local config_file=$2
  local test_name=$(basename "$test_file")
  local report_file="test-reports/$(basename "$test_file" .js).log"
  
  echo -e "${YELLOW}Running test: ${test_name}${NC}"
  echo -e "${YELLOW}Config: ${config_file}${NC}"
  echo -e "${YELLOW}Report will be saved to: ${report_file}${NC}"
  
  # Run the test with specified config
  npx jest --config "$config_file" "$test_file" --verbose > "$report_file" 2>&1
  
  # Check exit code
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
    echo -e "${GREEN}=============================================${NC}"
    return 0
  else
    echo -e "${RED}❌ FAILED: ${test_name}${NC}"
    echo -e "${YELLOW}Last few lines of error:${NC}"
    tail -n 15 "$report_file" | grep -v "at Object" | grep -v "at processTicksAndRejections"
    echo -e "${RED}=============================================${NC}"
    return 1
  }
}

# Function to find test files
find_tests() {
  local pattern=$1
  find . -path "*/test/*" -name "$pattern" | sort
}

# Run tests in a specified directory with a specific config
run_directory_tests() {
  local dir_pattern=$1
  local config_file=$2
  local test_name=$3
  
  echo -e "${BLUE}==============================================${NC}"
  echo -e "${BLUE}Running ${test_name} Tests${NC}"
  echo -e "${BLUE}==============================================${NC}"
  
  local test_files=$(find_tests "$dir_pattern")
  local passed=0
  local failed=0
  local all_tests=0
  
  for test_file in $test_files; do
    run_test "$test_file" "$config_file"
    if [ $? -eq 0 ]; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi
    all_tests=$((all_tests + 1))
  done
  
  echo -e "${BLUE}Summary for ${test_name}:${NC}"
  echo -e "${GREEN}Passed: ${passed}${NC}"
  echo -e "${RED}Failed: ${failed}${NC}"
  echo -e "${BLUE}Total: ${all_tests}${NC}"
  echo ""
  
  return $failed
}

# Main execution
echo -e "${YELLOW}Checking for jest-baseagent.config.js...${NC}"
if [ -f "jest-baseagent.config.js" ]; then
  echo -e "${GREEN}Found jest-baseagent.config.js${NC}"
  run_test "test/unit/ai/agent/base-agent.test.js" "jest-baseagent.config.js"
else
  echo -e "${RED}jest-baseagent.config.js not found${NC}"
fi

# Run all AI agent tests
echo -e "${YELLOW}Running all AI agent tests...${NC}"
run_directory_tests "ai/agent/*.test.js" "jest.hybrid.config.cjs" "AI Agent"

# Run all AI model tests
echo -e "${YELLOW}Running all AI model tests...${NC}"
run_directory_tests "ai/models/*.test.js" "jest.hybrid.config.cjs" "AI Model"

# Run all util tests
echo -e "${YELLOW}Running all utility tests...${NC}"
run_directory_tests "utils/**/*.test.js" "jest.hybrid.config.cjs" "Utils"

# Run all task tests
echo -e "${YELLOW}Running all task tests...${NC}"
run_directory_tests "tasks/**/*.test.js" "jest.hybrid.config.cjs" "Tasks"

# Run all other tests
echo -e "${YELLOW}Running remaining tests...${NC}"
run_directory_tests "**/*.test.js" "jest.hybrid.config.cjs" "Remaining"

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}       TEST EXECUTION COMPLETE              ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${YELLOW}Check test-reports directory for detailed logs${NC}"
echo ""

# Final report
echo -e "${CYAN}Test Report Summary:${NC}"
passed_tests=$(grep -l "PASS" test-reports/*.log | wc -l)
failed_tests=$(grep -l "FAIL" test-reports/*.log | wc -l)
total_tests=$((passed_tests + failed_tests))

echo -e "${GREEN}Passed: ${passed_tests}${NC}"
echo -e "${RED}Failed: ${failed_tests}${NC}"
echo -e "${BLUE}Total: ${total_tests}${NC}"

if [ $failed_tests -gt 0 ]; then
  echo -e "${RED}Some tests failed. Please check the reports.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
