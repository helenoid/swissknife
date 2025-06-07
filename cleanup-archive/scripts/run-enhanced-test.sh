#!/bin/bash
# Enhanced test runner for SwissKnife tests
# This script provides better error handling and diagnostics

# Set colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

TEST_PATH=$1

if [ -z "$TEST_PATH" ]; then
  echo -e "${RED}Error: No test path provided${RESET}"
  echo "Usage: ./run-enhanced-test.sh <test-path>"
  echo "Example: ./run-enhanced-test.sh test/basic.test.js"
  exit 1
fi

# Check if the test file exists
if [ ! -f "$TEST_PATH" ]; then
  echo -e "${RED}Error: Test file '$TEST_PATH' does not exist${RESET}"
  exit 1
fi

echo -e "${BLUE}Running test: ${TEST_PATH}${RESET}"

# Print test file content for debugging
echo -e "${YELLOW}Test file content:${RESET}"
cat "$TEST_PATH"
echo ""

# Enable verbose mode for Jest and use NODE_OPTIONS
NODE_OPTIONS="--experimental-vm-modules --trace-warnings" npx jest --config=jest.unified.config.cjs --verbose "$TEST_PATH"

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Test passed successfully!${RESET}"
  exit 0
else
  echo -e "${RED}Test failed. See above for details.${RESET}"
  exit $TEST_EXIT_CODE
fi
