#!/bin/bash

# unified-test-solution.sh
# A comprehensive test solution that runs all tests in a targeted way

set -e
echo "🌟 SwissKnife Unified Test Solution 🌟"
echo "===================================="

# Create results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

# Function to run tests in a specific category
run_test_category() {
  local name=$1
  local config=$2
  local pattern=$3
  local description=$4
  
  echo -e "\n${BLUE}Running ${description} tests...${RESET}"
  
  # Create log file
  local log_file="$RESULTS_DIR/${name}.log"
  
  # Run tests
  if npx jest --config="$config" "$pattern" --verbose > "$log_file" 2>&1; then
    echo -e "${GREEN}✓ All ${description} tests passed!${RESET}"
    echo "$name: PASS" >> "$RESULTS_DIR/passing.txt"
    return 0
  else
    echo -e "${RED}✗ Some ${description} tests failed!${RESET}"
    echo "$name: FAIL" >> "$RESULTS_DIR/failing.txt"
    
    # Extract error information - using grep -E for extended regex matching
    grep -E -A 5 -B 2 "Error:|FAIL " "$log_file" > "$RESULTS_DIR/${name}-errors.txt" || true
    return 1
  fi
}

# Function to check which test is failing and why
analyze_test_failures() {
  local name=$1
  local log_file="$RESULTS_DIR/${name}.log"
  local analysis_file="$RESULTS_DIR/${name}-analysis.md"
  
  echo "## Test Failure Analysis for $name" > "$analysis_file"
  echo "Generated: $(date)" >> "$analysis_file"
  echo "" >> "$analysis_file"
  
  # Extract failing test names
  grep -E "✕|FAIL " "$log_file" > "$RESULTS_DIR/${name}-failing-tests.txt" || true
  
  # Count failing tests
  local failing_count=$(wc -l < "$RESULTS_DIR/${name}-failing-tests.txt" || echo 0)
  echo "### Found $failing_count failing tests:" >> "$analysis_file"
  echo "" >> "$analysis_file"
  echo "\`\`\`" >> "$analysis_file"
  cat "$RESULTS_DIR/${name}-failing-tests.txt" >> "$analysis_file" 2>/dev/null || echo "No specific tests identified" >> "$analysis_file"
  echo "\`\`\`" >> "$analysis_file"
  echo "" >> "$analysis_file"
  
  # Extract error messages
  echo "### Error details:" >> "$analysis_file"
  echo "" >> "$analysis_file"
  echo "\`\`\`" >> "$analysis_file"
  cat "$log_file" | grep -E "FAIL |Error:|expect|\.toEqual|\.toBe|\.toHaveLength|\.toContain|TypeError:" -A 5 >> "$analysis_file" || echo "No detailed error information found" >> "$analysis_file"
  echo "\`\`\`" >> "$analysis_file"
  
  echo -e "${YELLOW}Failure analysis written to $analysis_file${RESET}"
}

# Run all test categories
echo "🔍 Starting test execution..."

# Run utils tests - the focus areas from conversation
run_test_category "logging" "jest.master.config.cjs" "test/unit/utils/logging" "Logging" || analyze_test_failures "logging"
run_test_category "events" "jest.master.config.cjs" "test/unit/utils/events" "Events" || analyze_test_failures "events"
run_test_category "errors" "jest.master.config.cjs" "test/unit/utils/errors" "Error Handling" || analyze_test_failures "errors"
run_test_category "performance" "jest.master.config.cjs" "test/unit/utils/performance" "Performance" || analyze_test_failures "performance"
run_test_category "cache" "jest.master.config.cjs" "test/unit/utils/cache" "Cache" || analyze_test_failures "cache"

# Run integration tests
run_test_category "integration" "jest.master.config.cjs" "test/integration" "Integration" || analyze_test_failures "integration"

# Generate report
echo -e "\n${BLUE}Generating test report...${RESET}"

# Count results
PASSED=$(cat "$RESULTS_DIR/passing.txt" 2>/dev/null | wc -l || echo 0)
FAILED=$(cat "$RESULTS_DIR/failing.txt" 2>/dev/null | wc -l || echo 0)
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=0
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
fi

# Create report
cat > "$RESULTS_DIR/test-report.md" << EOF
# SwissKnife Unified Test Report

Generated: $(date)

## Summary
- Total Categories: $TOTAL
- Passing Categories: $PASSED
- Failing Categories: $FAILED
- Success Rate: ${SUCCESS_RATE}%

## Categories
EOF

# Add passing categories
if [ -f "$RESULTS_DIR/passing.txt" ]; then
  cat >> "$RESULTS_DIR/test-report.md" << EOF

### Passing Categories
\`\`\`
$(cat "$RESULTS_DIR/passing.txt" 2>/dev/null)
\`\`\`
EOF
fi

# Add failing categories with errors
if [ -f "$RESULTS_DIR/failing.txt" ]; then
  cat >> "$RESULTS_DIR/test-report.md" << EOF

### Failing Categories
\`\`\`
$(cat "$RESULTS_DIR/failing.txt" 2>/dev/null)
\`\`\`

## Error Details
EOF

  # Add error details for each failing category
  for category in $(cat "$RESULTS_DIR/failing.txt" | cut -d: -f1); do
    error_file="$RESULTS_DIR/${category}-errors.txt"
    analysis_file="$RESULTS_DIR/${category}-analysis.md"
    
    if [ -f "$error_file" ]; then
      cat >> "$RESULTS_DIR/test-report.md" << EOF

### ${category^} Errors
\`\`\`
$(cat "$error_file")
\`\`\`
EOF
    fi
    
    if [ -f "$analysis_file" ]; then
      cat "$analysis_file" >> "$RESULTS_DIR/test-report.md"
    fi
  done
fi

# Display results
echo -e "\n${BLUE}Test Results:${RESET}"
echo -e "Total Categories: ${CYAN}$TOTAL${RESET}"
echo -e "Passing Categories: ${GREEN}$PASSED${RESET}"
echo -e "Failing Categories: ${RED}$FAILED${RESET}"
echo -e "Success Rate: ${YELLOW}${SUCCESS_RATE}%${RESET}"

echo -e "\n${BLUE}Test report saved to: $RESULTS_DIR/test-report.md${RESET}"

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All test categories passed!${RESET}"
  exit 0
else
  echo -e "\n${YELLOW}Some test categories failed. See the report for details.${RESET}"
  exit 1
fi
