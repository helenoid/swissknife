#!/bin/bash

# Phase3-specific test runner that focuses only on relevant tests
echo "🧪 Running SwissKnife Phase 3 Tests"
echo "========================================"

# Set environment variables
export NODE_ENV=test
export TEST_MODE=true
export DEBUG_TESTS=true

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Test configurations
FIXED_CONFIG=fixed.phase3.config.cjs

# Display environment info
echo -e "${BLUE}Node version:${NC} $(node --version)"
echo -e "${BLUE}NPM version:${NC} $(npm --version)"
echo -e "${BLUE}Working directory:${NC} $(pwd)"
echo ""

# Function to run tests with proper reporting
run_test() {
  TEST_PATH=$1
  TEST_NAME=$2
  
  echo -e "\n${YELLOW}=== Running $TEST_NAME ===${NC}"
  
  npx jest "$TEST_PATH" --config="$FIXED_CONFIG" --verbose
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $TEST_NAME passed!${NC}"
    return 0
  else
    echo -e "${RED}✗ $TEST_NAME failed!${NC}"
    return 1
  fi
}

# Create a results summary
RESULTS_FILE="phase3-test-results-$(date +%Y%m%d%H%M%S).txt"
touch $RESULTS_FILE
echo "Phase 3 Test Results $(date)" > $RESULTS_FILE
echo "=======================================" >> $RESULTS_FILE

# Run unit tests for Phase 3 components
if run_test "test/unit/phase3/components.test.js" "Phase 3 Components Unit Tests"; then
  echo "Unit tests: PASSED" >> $RESULTS_FILE
  UNIT_TESTS_PASSED=true
else
  echo "Unit tests: FAILED" >> $RESULTS_FILE
  UNIT_TESTS_PASSED=false
fi

# Run integration tests for Phase 3
if run_test "test/integration/phase3/integration.test.js" "Phase 3 Integration Tests"; then
  echo "Integration tests: PASSED" >> $RESULTS_FILE
  INTEGRATION_TESTS_PASSED=true
else
  echo "Integration tests: FAILED" >> $RESULTS_FILE
  INTEGRATION_TESTS_PASSED=false
fi

# Print summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo -e "Results saved to: $RESULTS_FILE"

cat $RESULTS_FILE

# Return proper exit code
if [ "$UNIT_TESTS_PASSED" = true ] && [ "$INTEGRATION_TESTS_PASSED" = true ]; then
  echo -e "\n${GREEN}All Phase 3 tests passed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}Some Phase 3 tests failed. Check the results file for details.${NC}"
  exit 1
fi
