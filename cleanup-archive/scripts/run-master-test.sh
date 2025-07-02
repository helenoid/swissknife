#!/bin/bash
# Run a specific test with the master configuration

# Set colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

TEST_PATH=$1

if [ -z "$TEST_PATH" ]; then
  echo -e "${YELLOW}Running verification test...${RESET}"
  TEST_PATH="test/master-verification.test.js"
else
  echo -e "${YELLOW}Running test: ${TEST_PATH}${RESET}"
fi

npx jest --config=jest-master.config.cjs "$TEST_PATH"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test passed successfully!${RESET}"
else
  echo -e "${RED}Test failed. See above for details.${RESET}"
fi
