#!/bin/bash
# SwissKnife Error Handling Test Runner
# This script runs all error handling tests and generates a comprehensive report

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}   SwissKnife Error Handling Test Suite Runner           ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Run either the detailed test reporter or the quick verification
if [ "$1" = "--quick" ]; then
  echo -e "\n${YELLOW}Running quick verification test...${NC}\n"
  node quick-verify-errors.js
else
  echo -e "\n${YELLOW}Running comprehensive test suite with reporting...${NC}\n"
  # Execute the test report generator
  node generate-error-test-report.cjs
fi

# Check the exit code
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ All error handling tests passed successfully!${NC}"
  echo -e "${BLUE}See ERROR-HANDLING-TEST-REPORT.md for detailed information.${NC}"
else
  echo -e "\n${RED}❌ Some tests have failed. Please check the test report.${NC}"
  echo -e "${BLUE}See ERROR-HANDLING-TEST-REPORT.md for more information about the test suite.${NC}"
  exit 1
fi
