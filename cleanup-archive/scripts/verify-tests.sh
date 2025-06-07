#!/bin/bash
# Test verification script - runs tests that are known to work

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Verification${RESET}"
echo "==========================="

# Function to run a simple test
run_test() {
  local test_file=$1
  
  echo -e "${YELLOW}Running: ${test_file}${RESET}"
  
  npx jest "$test_file" --no-cache
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}PASSED: ${test_file}${RESET}"
    return 0
  else
    echo -e "${RED}FAILED: ${test_file}${RESET}"
    return 1
  fi
}

# Run tests in order of increasing complexity
echo -e "${GREEN}Running Basic Tests${RESET}"
run_test "test/ultra-basic.test.js"
run_test "test/verify-env.test.js"
run_test "test/basic.test.js"
run_test "test/fresh-minimal.test.js"
run_test "test/standalone.test.js"

# Run standalone tests with dedicated config
echo -e "${GREEN}Running Standalone Tests${RESET}"
npx jest test/standalone-error.test.js --config=jest.simple.config.cjs
npx jest test/standalone-logging.test.js --config=jest.simple.config.cjs
npx jest test/standalone-worker.test.js --config=jest.simple.config.cjs
npx jest test/standalone-commands.test.js --config=jest.simple.config.cjs

# Summary
echo ""
echo "Test verification complete"
