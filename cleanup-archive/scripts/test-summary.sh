#!/bin/bash -x
# Test summary script - runs all working tests and generates report

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Summary${RESET}"
echo "======================="

# Create a timestamp for the report
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="test-reports-${TIMESTAMP}"
mkdir -p "$REPORT_DIR"

# Create report files
SUMMARY_REPORT="${REPORT_DIR}/summary.md"
PASSING_TESTS="${REPORT_DIR}/passing-tests.txt"
FAILING_TESTS="${REPORT_DIR}/failing-tests.txt"
DETAILS_REPORT="${REPORT_DIR}/details.md"

# Initialize reports
echo "# SwissKnife Test Summary" > "$SUMMARY_REPORT"
echo "Generated: $(date)" >> "$SUMMARY_REPORT"
echo "" >> "$SUMMARY_REPORT"
echo "" > "$PASSING_TESTS"
echo "" > "$FAILING_TESTS"
echo "# SwissKnife Test Details" > "$DETAILS_REPORT"

# Function to run a test and record result
run_test() {
  local test_file=$1
  local description=$2
  
  echo -e "${YELLOW}Running: ${test_file}${RESET}"
  echo "## Test: ${test_file}" >> "$DETAILS_REPORT"
  echo "Description: ${description}" >> "$DETAILS_REPORT"
  
  npx jest "$test_file" --no-cache &> "${REPORT_DIR}/${test_file//\//_}.log"
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}PASSED: ${test_file}${RESET}"
    echo "${test_file}" >> "$PASSING_TESTS"
    echo "Status: ✅ PASSED" >> "$DETAILS_REPORT"
    PASS_COUNT=$((PASS_COUNT+1))
  else
    echo -e "${RED}FAILED: ${test_file}${RESET}"
    echo "${test_file}" >> "$FAILING_TESTS"
    echo "Status: ❌ FAILED" >> "$DETAILS_REPORT"
    echo '```' >> "$DETAILS_REPORT"
    tail -20 "${REPORT_DIR}/${test_file//\//_}.log" >> "$DETAILS_REPORT"
    echo '```' >> "$DETAILS_REPORT"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  
  echo "" >> "$DETAILS_REPORT"
  TOTAL_COUNT=$((TOTAL_COUNT+1))
}

# Function to run a standalone test with custom config
run_standalone_test() {
  local test_file=$1
  local description=$2
  
  echo -e "${YELLOW}Running: ${test_file} (standalone)${RESET}"
  echo "## Test: ${test_file}" >> "$DETAILS_REPORT"
  echo "Description: ${description}" >> "$DETAILS_REPORT"
  
  npx jest "$test_file" --config=jest.simple.config.cjs &> "${REPORT_DIR}/${test_file//\//_}.log"
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}PASSED: ${test_file}${RESET}"
    echo "${test_file}" >> "$PASSING_TESTS"
    echo "Status: ✅ PASSED (standalone)" >> "$DETAILS_REPORT"
    PASS_COUNT=$((PASS_COUNT+1))
  else
    echo -e "${RED}FAILED: ${test_file}${RESET}"
    echo "${test_file}" >> "$FAILING_TESTS"
    echo "Status: ❌ FAILED (standalone)" >> "$DETAILS_REPORT"
    echo '```' >> "$DETAILS_REPORT"
    tail -20 "${REPORT_DIR}/${test_file//\//_}.log" >> "$DETAILS_REPORT"
    echo '```' >> "$DETAILS_REPORT"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  
  echo "" >> "$DETAILS_REPORT"
  TOTAL_COUNT=$((TOTAL_COUNT+1))
}

# Initialize counters
TOTAL_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Run basic tests
echo -e "${CYAN}Running Basic Tests${RESET}"
echo "## Basic Tests" >> "$DETAILS_REPORT"
run_test "test/ultra-basic.test.js" "Ultra-basic test for Jest"
run_test "test/verify-env.test.js" "Environment verification test"
run_test "test/basic.test.js" "Basic Jest test"
run_test "test/fresh-minimal.test.js" "Fresh minimal test"
run_test "test/standalone.test.js" "Standalone test"

# Run standalone tests
echo -e "${CYAN}Running Standalone Tests${RESET}"
echo "## Standalone Tests" >> "$DETAILS_REPORT"
run_standalone_test "test/standalone-error.test.js" "Standalone error handling test"
run_standalone_test "test/standalone-logging.test.js" "Standalone logging test"
run_standalone_test "test/standalone-worker.test.js" "Standalone worker test"
run_standalone_test "test/standalone-commands.test.js" "Standalone command registry test"

# Generate summary
echo -e "${BLUE}Test Summary:${RESET}"
echo -e "${GREEN}Passing: ${PASS_COUNT}/${TOTAL_COUNT}${RESET}"
echo -e "${RED}Failing: ${FAIL_COUNT}/${TOTAL_COUNT}${RESET}"

# Add summary to report
echo "## Summary" >> "$SUMMARY_REPORT"
echo "- Total Tests: ${TOTAL_COUNT}" >> "$SUMMARY_REPORT"
echo "- Passing: ${PASS_COUNT}" >> "$SUMMARY_REPORT"
echo "- Failing: ${FAIL_COUNT}" >> "$SUMMARY_REPORT"
echo "- Success Rate: $(( (PASS_COUNT * 100) / TOTAL_COUNT ))%" >> "$SUMMARY_REPORT"

echo "" >> "$SUMMARY_REPORT"
echo "## Passing Tests" >> "$SUMMARY_REPORT"
cat "$PASSING_TESTS" | sort | while read test; do
  echo "- ${test}" >> "$SUMMARY_REPORT"
done

echo "" >> "$SUMMARY_REPORT"
echo "## Failing Tests" >> "$SUMMARY_REPORT"
cat "$FAILING_TESTS" | sort | while read test; do
  echo "- ${test}" >> "$SUMMARY_REPORT"
done

echo ""
echo "Reports generated in ${REPORT_DIR}/"
echo "- Summary: ${SUMMARY_REPORT}"
echo "- Details: ${DETAILS_REPORT}"
