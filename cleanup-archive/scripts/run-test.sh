#!/bin/bash
# Run a specific test with the unified configuration

# Set colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

TEST_PATH=$1

if [ -z "$TEST_PATH" ]; then
  echo -e "${RED}Error: No test path provided${RESET}"
  echo "Usage: ./run-test.sh <test-path>"
  echo "Example: ./run-test.sh test/unit/models/execution/execution-service.test.ts"
  exit 1
fi

echo -e "${YELLOW}Running test: ${TEST_PATH}${RESET}"

# Run the test with the unified configuration
npx jest --config=jest.unified.config.cjs "$TEST_PATH" $2 $3 $4

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test passed successfully!${RESET}"
  exit 0
else
  echo -e "${RED}Test failed. See above for details.${RESET}"
  exit 1
fi
