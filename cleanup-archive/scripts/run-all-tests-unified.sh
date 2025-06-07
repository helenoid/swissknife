#!/bin/bash
# Run all tests with the unified configuration

# Set colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}Running all tests with unified configuration${RESET}"
echo "This may take some time..."

# Run all tests
npx jest --config=jest.unified.config.cjs $@

RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${RESET}"
  exit 0
else
  echo -e "${RED}Some tests failed. See above for details.${RESET}"
  exit $RESULT
fi
