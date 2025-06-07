#!/bin/bash
# unified-test-runner.sh
# A simplified but powerful test runner that uses the unified configuration

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Unified Test Runner${RESET}"
echo -e "${BLUE}============================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="unified-tests-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/logs"
mkdir -p "$RESULTS_DIR/reports"

# Parse command line arguments
TEST_PATTERN="$1"
if [ -z "$TEST_PATTERN" ]; then
  TEST_PATTERN="test/unit/**/*.test.(js|ts)"
  echo -e "${YELLOW}No test pattern specified. Running all tests.${RESET}"
else
  echo -e "${YELLOW}Running tests matching: $TEST_PATTERN${RESET}"
fi

# Function to report progress
report_progress() {
  local current=$1
  local total=$2
  local percent=$(( (current * 100) / total ))
  local bar_length=40
  local filled_length=$(( (bar_length * percent) / 100 ))
  local empty_length=$(( bar_length - filled_length ))
  
  local bar=""
  for ((i=0; i<filled_length; i++)); do
    bar="${bar}█"
  done
  
  for ((i=0; i<empty_length; i++)); do
    bar="${bar}░"
  done
  
  echo -ne "\r${CYAN}Progress: [${bar}] ${percent}% (${current}/${total})${RESET}"
}

# Step 1: Find all test files that match the pattern
echo -e "${BLUE}Finding test files...${RESET}"
TEST_FILES=$(find test -name "*.test.js" -o -name "*.test.ts" | grep -E "$TEST_PATTERN" || echo "")
TEST_COUNT=$(echo "$TEST_FILES" | wc -l)

if [ -z "$TEST_FILES" ]; then
  echo -e "${RED}No test files found matching the pattern: $TEST_PATTERN${RESET}"
  exit 1
fi

echo -e "${GREEN}Found $TEST_COUNT test files to run${RESET}"

# Step 2: Setup test environment
echo -e "${BLUE}Setting up test environment...${RESET}"

# Make sure we have the universal setup file
if [ ! -f "test/setup-jest-universal.js" ]; then
  echo -e "${RED}Universal setup file not found. Please create it first.${RESET}"
  exit 1
fi

# Step 3: Run the tests
echo -e "${BLUE}Running tests...${RESET}"

PASSED=0
FAILED=0
CURRENT=0

echo "$TEST_FILES" | while read -r file; do
  if [ -z "$file" ]; then continue; fi
  
  # Update progress
  CURRENT=$((CURRENT + 1))
  report_progress $CURRENT $TEST_COUNT
  
  # Create log file name
  log_file="$RESULTS_DIR/logs/$(echo "$file" | tr '/' '-').log"
  
  # Run the test
  npx jest "$file" --config=jest.unified.config.cjs > "$log_file" 2>&1
  test_status=$?
  
  # Record result
  if [ $test_status -eq 0 ]; then
    echo "$file: PASS" >> "$RESULTS_DIR/passing.txt"
    PASSED=$((PASSED + 1))
  else
    echo "$file: FAIL" >> "$RESULTS_DIR/failing.txt"
    FAILED=$((FAILED + 1))
    
    # Extract error summary
    echo "==== Error in $file ====" >> "$RESULTS_DIR/error-summary.txt"
    grep -A 5 -B 2 "Error:" "$log_file" | head -20 >> "$RESULTS_DIR/error-summary.txt"
    echo -e "\n\n" >> "$RESULTS_DIR/error-summary.txt"
  fi
done

echo

# Step 4: Generate report
echo -e "${BLUE}Generating test report...${RESET}"

# Count the results (we recount because of the subshell above)
PASSED=$(cat "$RESULTS_DIR/passing.txt" 2>/dev/null | wc -l || echo 0)
FAILED=$(cat "$RESULTS_DIR/failing.txt" 2>/dev/null | wc -l || echo 0)
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(( (PASSED * 100) / (TOTAL == 0 ? 1 : TOTAL) ))

# Create the report
cat > "$RESULTS_DIR/reports/test-report.md" << EOF
# SwissKnife Test Report

Generated: $(date)

## Summary
- Total Tests: $TOTAL
- Passed: $PASSED
- Failed: $FAILED
- Success Rate: ${SUCCESS_RATE}%

EOF

# Add failing tests to the report if any
if [ $FAILED -gt 0 ]; then
  cat >> "$RESULTS_DIR/reports/test-report.md" << EOF
## Failed Tests
\`\`\`
$(cat "$RESULTS_DIR/failing.txt" 2>/dev/null)
\`\`\`

## Error Summary
\`\`\`
$(cat "$RESULTS_DIR/error-summary.txt" 2>/dev/null)
\`\`\`
EOF
fi

# Step 5: Display results
echo -e "${BLUE}Test Results:${RESET}"
echo -e "Total Tests: ${CYAN}$TOTAL${RESET}"
echo -e "Passed: ${GREEN}$PASSED${RESET}"
echo -e "Failed: ${RED}$FAILED${RESET}"
echo -e "Success Rate: ${YELLOW}${SUCCESS_RATE}%${RESET}"
echo

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${RESET}"
  exit_code=0
else
  echo -e "${RED}Some tests failed. See report for details: $RESULTS_DIR/reports/test-report.md${RESET}"
  exit_code=1
fi

exit $exit_code
