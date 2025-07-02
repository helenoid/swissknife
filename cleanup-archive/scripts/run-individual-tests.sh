#!/bin/bash

# Test Runner For Individual SwissKnife Tests
# This script runs individual tests to identify any failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SwissKnife Test Runner ===${NC}"

# Create results directory
mkdir -p test-results

# Function to run a specific test
run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file" .test.js)
  
  echo -e "${YELLOW}Running test: ${test_name}${NC}"
  
  NODE_OPTIONS="--max-old-space-size=4096" npx jest --config=./jest.unified.config.cjs "$test_file" --testTimeout=15000 > "test-results/${test_name}.log" 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed: ${test_name}${NC}"
    return 0
  else
    echo -e "${RED}❌ Test failed: ${test_name}${NC}"
    return 1
  fi
}

# List of tests to run
TESTS=(
  "test/simplified-execution-service.test.js"
  "test/standalone-worker.test.js"
  "test/ultra-basic.test.js"
  "test/command_registry.test.js"
  "test/simple-registry.test.js"
  "test/standalone-commands.test.js"
  "test/standalone-logging.test.js"
  "test/simplified-execution-integration.test.js"
  "test/mcp-deployment-simplified.test.js"
  "test/basic.test.js"
  "test/verify-env.test.js"
  "test/command-registry-simplified.test.js"
)

# Run all specified tests
PASSED=0
FAILED=0
FAILED_TESTS=()

for test in "${TESTS[@]}"; do
  if [ -f "$test" ]; then
    if run_test "$test"; then
      PASSED=$((PASSED+1))
    else
      FAILED=$((FAILED+1))
      FAILED_TESTS+=("$test")
    fi
  else
    echo -e "${YELLOW}Test file not found: ${test}${NC}"
  fi
done

# Print summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"

# Print failed tests
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo -e "${RED}Failed tests:${NC}"
  for test in "${FAILED_TESTS[@]}"; do
    echo -e "  - ${test}"
  done
fi

# Exit with success if all passed
if [ "$FAILED" -eq 0 ]; then
  exit 0
else
  exit 1
fi
