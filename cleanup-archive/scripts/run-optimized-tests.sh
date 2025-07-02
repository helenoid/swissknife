#!/bin/bash

# Colors for better visibility in output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SwissKnife Optimized Test Runner ===${NC}"
echo -e "${YELLOW}Running tests with enhanced configuration${NC}"

if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage:${NC}"
  echo -e "  ./run-optimized-tests.sh <test-file-pattern>"
  echo -e "  ./run-optimized-tests.sh all"
  echo -e "\nExamples:"
  echo -e "  ./run-optimized-tests.sh command_registry.test.js"
  echo -e "  ./run-optimized-tests.sh 'test/standalone-*.test.js'"
  echo -e "  ./run-optimized-tests.sh all"
  exit 0
fi

# Disable Jest's watchman to prevent file watching issues
export JEST_WORKER_ID=1
export NODE_OPTIONS="--no-warnings"

if [ "$1" == "all" ]; then
  echo -e "${BLUE}Running all tests${NC}"
  npx jest --config=jest.unified.config.cjs
else
  echo -e "${BLUE}Running tests matching: $1${NC}"
  npx jest --config=jest.unified.config.cjs $1
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
else
  echo -e "\n${RED}Some tests failed.${NC}"
fi

exit $EXIT_CODE
