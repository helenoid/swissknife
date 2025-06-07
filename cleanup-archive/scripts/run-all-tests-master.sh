#!/bin/bash
# run-all-tests-master.sh
# Master script to run all tests in the SwissKnife project

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${MAGENTA}SwissKnife Complete Test Suite${RESET}"
echo -e "${MAGENTA}============================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MAIN_RESULTS_DIR="all-tests-$TIMESTAMP"
mkdir -p "$MAIN_RESULTS_DIR"
mkdir -p "$MAIN_RESULTS_DIR/reports"

# Make test runner scripts executable if they're not already
chmod +x master-test-runner.sh
chmod +x typescript-test-runner.sh

# Step 1: Run JavaScript tests
echo -e "\n${BLUE}Step 1: Running JavaScript Tests${RESET}"
echo -e "${BLUE}=============================${RESET}"

./master-test-runner.sh
JS_STATUS=$?

# Copy JavaScript test results
cp -r test-results-* "$MAIN_RESULTS_DIR/js-results"

# Step 2: Run TypeScript tests
echo -e "\n${BLUE}Step 2: Running TypeScript Tests${RESET}"
echo -e "${BLUE}=============================${RESET}"

./typescript-test-runner.sh
TS_STATUS=$?

# Copy TypeScript test results
cp -r ts-test-results-* "$MAIN_RESULTS_DIR/ts-results"

# Step 3: Generate combined report
echo -e "\n${BLUE}Step 3: Generating Combined Test Report${RESET}"
echo -e "${BLUE}===================================${RESET}"

# Count JS passed and failed tests
JS_PASSED=$(cat "$MAIN_RESULTS_DIR"/js-results/passing_tests.txt 2>/dev/null | wc -l || echo 0)
JS_FAILED=$(cat "$MAIN_RESULTS_DIR"/js-results/failing_tests.txt 2>/dev/null | wc -l || echo 0)
JS_TOTAL=$((JS_PASSED + JS_FAILED))

# Count TS passed and failed tests
TS_PASSED=$(cat "$MAIN_RESULTS_DIR"/ts-results/passing_ts_tests.txt 2>/dev/null | wc -l || echo 0)
TS_FAILED=$(cat "$MAIN_RESULTS_DIR"/ts-results/failing_ts_tests.txt 2>/dev/null | wc -l || echo 0)
TS_TOTAL=$((TS_PASSED + TS_FAILED))

# Calculate totals
TOTAL_PASSED=$((JS_PASSED + TS_PASSED))
TOTAL_FAILED=$((JS_FAILED + TS_FAILED))
TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))

# Calculate success rates
if [ $JS_TOTAL -gt 0 ]; then
  JS_SUCCESS_RATE=$(( (JS_PASSED * 100) / JS_TOTAL ))
else
  JS_SUCCESS_RATE=0
fi

if [ $TS_TOTAL -gt 0 ]; then
  TS_SUCCESS_RATE=$(( (TS_PASSED * 100) / TS_TOTAL ))
else
  TS_SUCCESS_RATE=0
fi

if [ $TOTAL_TESTS -gt 0 ]; then
  TOTAL_SUCCESS_RATE=$(( (TOTAL_PASSED * 100) / TOTAL_TESTS ))
else
  TOTAL_SUCCESS_RATE=0
fi

# Generate the combined report
cat > "$MAIN_RESULTS_DIR/reports/combined-test-report.md" << EOF
# SwissKnife Combined Test Report

Generated: $(date)

## Overall Summary
- **Total Tests:** $TOTAL_TESTS
- **Passed:** $TOTAL_PASSED
- **Failed:** $TOTAL_FAILED
- **Success Rate:** ${TOTAL_SUCCESS_RATE}%

## JavaScript Tests
- **Total:** $JS_TOTAL
- **Passed:** $JS_PASSED
- **Failed:** $JS_FAILED
- **Success Rate:** ${JS_SUCCESS_RATE}%

## TypeScript Tests
- **Total:** $TS_TOTAL
- **Passed:** $TS_PASSED
- **Failed:** $TS_FAILED
- **Success Rate:** ${TS_SUCCESS_RATE}%

## Detailed Results

### JavaScript Test Groups
EOF

# Copy JS test group details
if [ -f "$MAIN_RESULTS_DIR/js-results/reports/test-report.md" ]; then
  # Extract test group section from the JS report
  sed -n '/^## Test Groups/,/^##/p' "$MAIN_RESULTS_DIR/js-results/reports/test-report.md" | sed '/^##/d' >> "$MAIN_RESULTS_DIR/reports/combined-test-report.md"
fi

# Add failing tests sections if needed
if [ $TOTAL_FAILED -gt 0 ]; then
  cat >> "$MAIN_RESULTS_DIR/reports/combined-test-report.md" << EOF

## Failed Tests
EOF

  if [ $JS_FAILED -gt 0 ]; then
    cat >> "$MAIN_RESULTS_DIR/reports/combined-test-report.md" << EOF

### JavaScript Failed Tests
\`\`\`
$(cat "$MAIN_RESULTS_DIR/js-results/failing_tests.txt" 2>/dev/null || echo "No detailed failures available")
\`\`\`
EOF
  fi

  if [ $TS_FAILED -gt 0 ]; then
    cat >> "$MAIN_RESULTS_DIR/reports/combined-test-report.md" << EOF

### TypeScript Failed Tests
\`\`\`
$(cat "$MAIN_RESULTS_DIR/ts-results/failing_ts_tests.txt" 2>/dev/null || echo "No detailed failures available")
\`\`\`
EOF
  fi
fi

echo -e "${GREEN}Combined test report generated: $MAIN_RESULTS_DIR/reports/combined-test-report.md${RESET}"

# Final summary
echo -e "\n${MAGENTA}Complete Test Suite Results${RESET}"
echo -e "${MAGENTA}==========================${RESET}"
echo -e "JavaScript Tests: ${CYAN}$JS_TOTAL${RESET} (${GREEN}$JS_PASSED passed${RESET}, ${RED}$JS_FAILED failed${RESET}, ${YELLOW}${JS_SUCCESS_RATE}% success${RESET})"
echo -e "TypeScript Tests: ${CYAN}$TS_TOTAL${RESET} (${GREEN}$TS_PASSED passed${RESET}, ${RED}$TS_FAILED failed${RESET}, ${YELLOW}${TS_SUCCESS_RATE}% success${RESET})"
echo -e "Overall: ${CYAN}$TOTAL_TESTS${RESET} (${GREEN}$TOTAL_PASSED passed${RESET}, ${RED}$TOTAL_FAILED failed${RESET}, ${YELLOW}${TOTAL_SUCCESS_RATE}% success${RESET})"

# Determine overall status
OVERALL_STATUS=0
if [ $JS_STATUS -ne 0 ] || [ $TS_STATUS -ne 0 ]; then
  OVERALL_STATUS=1
  echo -e "\n${YELLOW}Some tests failed. See the detailed report for more information.${RESET}"
else
  echo -e "\n${GREEN}All tests passed successfully!${RESET}"
fi

echo -e "Combined Report: ${BLUE}$MAIN_RESULTS_DIR/reports/combined-test-report.md${RESET}"

exit $OVERALL_STATUS
