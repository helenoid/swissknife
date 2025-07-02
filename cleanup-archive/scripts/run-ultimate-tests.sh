#!/bin/bash
# Script to run tests with the ultimate test configuration

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
CONFIG_FILE="jest.ultimate.config.cjs"
VERBOSE=""
NODE_OPTIONS=""

# Parse parameters
TEST_PATH=""
for arg in "$@"; do
  case $arg in
    --config=*)
      CONFIG_FILE="${arg#*=}"
      ;;
    --verbose)
      VERBOSE="--verbose"
      ;;
    --esm)
      NODE_OPTIONS="--experimental-vm-modules"
      ;;
    --help)
      echo -e "${BLUE}SwissKnife Test Runner${NC}"
      echo "Usage: $0 [options] [test path]"
      echo
      echo "Options:"
      echo "  --config=<file>    Use specific Jest config file"
      echo "  --verbose          Run tests with verbose output"
      echo "  --esm              Run tests with ESM support"
      echo "  --help             Show this help message"
      echo
      echo "Examples:"
      echo "  $0 test/basic.test.js              Run a specific test"
      echo "  $0 --verbose test/unit/            Run all tests in a directory"
      echo "  $0 --esm test/esm-modules.test.js  Run ESM tests"
      exit 0
      ;;
    *)
      if [[ -z "$TEST_PATH" ]]; then
        TEST_PATH="$arg"
      fi
      ;;
  esac
done

# Set default test path if not provided
if [ -z "$TEST_PATH" ]; then
  echo -e "${YELLOW}No test path specified, running diagnostic test...${NC}"
  TEST_PATH="test/basic.test.js"
fi

echo -e "${BLUE}Running test: ${TEST_PATH}${NC}"
echo -e "${BLUE}Using config: ${CONFIG_FILE}${NC}"

# Run the test with the selected config
NODE_OPTIONS="$NODE_OPTIONS" npx jest --config="${CONFIG_FILE}" ${TEST_PATH} ${VERBOSE}

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Tests passed!${NC}"
else
  echo -e "${RED}❌ Tests failed.${NC}"
  echo -e "${YELLOW}Troubleshooting tips:${NC}"
  echo "1. Try running with --verbose for more details"
  echo "2. For ESM module issues, run with --esm option"
  echo "3. Check mock implementation compatibility"
fi

exit $EXIT_CODE
