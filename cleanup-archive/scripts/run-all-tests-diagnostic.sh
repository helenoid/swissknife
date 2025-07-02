#!/bin/bash
# Master test runner script for SwissKnife
# This script will run all tests and report which ones pass and fail

# Set colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create results directory
RESULTS_DIR="test-results"
mkdir -p "$RESULTS_DIR"

# Generate timestamp for this run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUCCESS_LOG="$RESULTS_DIR/passing_tests_$TIMESTAMP.log"
FAILURE_LOG="$RESULTS_DIR/failing_tests_$TIMESTAMP.log"
SUMMARY_LOG="$RESULTS_DIR/test_summary_$TIMESTAMP.log"

echo -e "${BLUE}Running all tests with super-minimal configuration${RESET}"
echo "This may take some time..."

# Find all test files
TEST_FILES=$(find test -name "*.test.js" | sort)
TOTAL_TESTS=$(echo "$TEST_FILES" | wc -l)
PASSED=0
FAILED=0

echo "Found $TOTAL_TESTS test files"
echo ""

# Run each test individually
for TEST_FILE in $TEST_FILES; do
  echo -e "${YELLOW}Running test: ${TEST_FILE}${RESET}"
  
  # Run the test with our super-minimal config
  NODE_OPTIONS="--experimental-vm-modules" npx jest "$TEST_FILE" --config=jest-super-minimal.config.cjs --silent
  
  # Check the exit code
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED: ${TEST_FILE}${RESET}"
    echo "$TEST_FILE" >> "$SUCCESS_LOG"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED: ${TEST_FILE}${RESET}"
    echo "$TEST_FILE" >> "$FAILURE_LOG"
    FAILED=$((FAILED + 1))
  fi
  
  echo ""
done

# Generate summary
echo -e "${BLUE}Test Summary:${RESET}"
echo "Total tests: $TOTAL_TESTS"
echo -e "Passing: ${GREEN}$PASSED${RESET}"
echo -e "Failing: ${RED}$FAILED${RESET}"

# Write summary to file
echo "Test Summary for SwissKnife ($TIMESTAMP)" > "$SUMMARY_LOG"
echo "----------------------------------------" >> "$SUMMARY_LOG"
echo "Total tests: $TOTAL_TESTS" >> "$SUMMARY_LOG"
echo "Passing: $PASSED" >> "$SUMMARY_LOG"
echo "Failing: $FAILED" >> "$SUMMARY_LOG"
echo "" >> "$SUMMARY_LOG"
echo "Passing Tests:" >> "$SUMMARY_LOG"
cat "$SUCCESS_LOG" >> "$SUMMARY_LOG"
echo "" >> "$SUMMARY_LOG"
echo "Failing Tests:" >> "$SUMMARY_LOG"
cat "$FAILURE_LOG" >> "$SUMMARY_LOG"

echo -e "${YELLOW}Results saved to:${RESET}"
echo "- $SUCCESS_LOG"
echo "- $FAILURE_LOG"
echo "- $SUMMARY_LOG"

# Exit with status based on test results
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${RESET}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check the logs for details.${RESET}"
  exit 1
fi
