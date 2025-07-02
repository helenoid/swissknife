#!/bin/bash
# consolidated-test-runner.sh
# Comprehensive test runner for SwissKnife

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Consolidated Test Runner${RESET}"
echo -e "${BLUE}=================================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results-${TIMESTAMP}"
mkdir -p "${RESULTS_DIR}/logs"
mkdir -p "${RESULTS_DIR}/reports"

# Function to run a test file
run_test() {
  local file=$1
  local config=$2
  local name=$(basename "$file" .js)
  local config_name=$(basename "$config" .cjs)
  local log_file="${RESULTS_DIR}/logs/${name}_${config_name}.log"
  
  echo -e "${YELLOW}Running: ${file} (${config_name})${RESET}"
  
  npx jest "$file" --config="$config" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED: ${name} (${config_name})${RESET}"
    echo "$file: PASSED ($config_name)" >> "${RESULTS_DIR}/passing_tests.txt"
  else
    echo -e "${RED}✗ FAILED: ${name} (${config_name})${RESET}"
    echo "$file: FAILED ($config_name)" >> "${RESULTS_DIR}/failing_tests.txt"
    echo -e "${YELLOW}Last 10 lines of error:${RESET}"
    tail -10 "$log_file"
  fi
  
  return $result
}

# Function to run tests based on their type
run_test_category() {
  local category=$1
  local test_pattern=$2
  local config=$3
  local description=$4
  
  echo -e "${CYAN}Running ${description}...${RESET}"
  echo "## ${description}" >> "${RESULTS_DIR}/reports/details.md"
  
  # Find matching test files
  local test_files=$(find test -path "${test_pattern}" -type f | sort)
  local test_count=$(echo "$test_files" | wc -l)
  
  if [ "$test_count" -eq 0 ]; then
    echo -e "${YELLOW}No tests found for pattern: ${test_pattern}${RESET}"
    echo "No tests found for pattern: ${test_pattern}" >> "${RESULTS_DIR}/reports/details.md"
    return 0
  fi
  
  echo -e "${MAGENTA}Found ${test_count} test files${RESET}"
  echo "Found ${test_count} test files" >> "${RESULTS_DIR}/reports/details.md"
  
  local pass_count=0
  local fail_count=0
  
  # Run each test
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      run_test "$file" "$config"
      
      if [ $? -eq 0 ]; then
        pass_count=$((pass_count+1))
      else
        fail_count=$((fail_count+1))
      fi
      
      echo ""
    fi
  done <<< "$test_files"
  
  # Record category results
  echo "${category}:${pass_count}:${fail_count}" >> "${RESULTS_DIR}/category_results.txt"
  
  echo -e "${BLUE}${description} Results:${RESET}"
  echo -e "${GREEN}Passing: ${pass_count}/${test_count}${RESET}"
  echo -e "${RED}Failing: ${fail_count}/${test_count}${RESET}"
  echo ""
  
  echo "### Results" >> "${RESULTS_DIR}/reports/details.md"
  echo "- Passing: ${pass_count}/${test_count}" >> "${RESULTS_DIR}/reports/details.md"
  echo "- Failing: ${fail_count}/${test_count}" >> "${RESULTS_DIR}/reports/details.md"
  echo "" >> "${RESULTS_DIR}/reports/details.md"
}

# Initialize reports
echo "# SwissKnife Test Results" > "${RESULTS_DIR}/reports/details.md"
echo "Generated: $(date)" >> "${RESULTS_DIR}/reports/details.md"
echo "" >> "${RESULTS_DIR}/reports/details.md"

# Create empty results files
touch "${RESULTS_DIR}/passing_tests.txt"
touch "${RESULTS_DIR}/failing_tests.txt"
touch "${RESULTS_DIR}/category_results.txt"

# Run test categories
run_test_category "simplified" "test/simplified*.test.js" "jest.simple.config.cjs" "Simplified Tests"
run_test_category "standalone" "test/standalone*.test.js" "jest.simple.config.cjs" "Standalone Tests"
run_test_category "basic" "test/{ultra-basic,verify-env,basic}.test.js" "jest.simple.config.cjs" "Basic Tests"
run_test_category "minimal-mcp" "test/mcp-minimal*.test.js" "jest.simple.config.cjs" "Minimal MCP Tests"
run_test_category "diagnostic" "test/diagnostic*.test.js" "jest.simple.config.cjs" "Diagnostic Tests"
run_test_category "utils" "test/unit/utils/**/*.test.js" "jest.optimized.config.cjs" "Utility Tests"
run_test_category "models" "test/unit/models/**/*.test.js" "jest.optimized.config.cjs" "Model Tests"
run_test_category "services" "test/unit/services/**/*.test.js" "jest.optimized.config.cjs" "Service Tests"
run_test_category "mcp" "test/unit/mcp-server/**/*.test.js" "jest.optimized.config.cjs" "MCP Server Tests"

# Generate summary report
TOTAL_PASS=$(cat "${RESULTS_DIR}/passing_tests.txt" | wc -l)
TOTAL_FAIL=$(cat "${RESULTS_DIR}/failing_tests.txt" | wc -l)
TOTAL_TESTS=$((TOTAL_PASS + TOTAL_FAIL))

# Calculate success rate
SUCCESS_RATE=0
if [ "$TOTAL_TESTS" -gt 0 ]; then
  SUCCESS_RATE=$((TOTAL_PASS * 100 / TOTAL_TESTS))
fi

# Create summary report
cat > "${RESULTS_DIR}/reports/summary.md" << EOF
# SwissKnife Test Summary

Generated: $(date)

## Overall Results
- Total Tests: ${TOTAL_TESTS}
- Passing: ${TOTAL_PASS}
- Failing: ${TOTAL_FAIL}
- Success Rate: ${SUCCESS_RATE}%

## Results by Category
EOF

# Add category results
while IFS=":" read -r category pass fail; do
  total=$((pass + fail))
  rate=0
  if [ "$total" -gt 0 ]; then
    rate=$((pass * 100 / total))
  fi
  echo "- ${category}: ${pass}/${total} (${rate}%)" >> "${RESULTS_DIR}/reports/summary.md"
done < "${RESULTS_DIR}/category_results.txt"

# Add passed/failed test lists
cat >> "${RESULTS_DIR}/reports/summary.md" << EOF

## Passed Tests
$(cat "${RESULTS_DIR}/passing_tests.txt" | sort | sed 's/^/- /')

## Failed Tests
$(cat "${RESULTS_DIR}/failing_tests.txt" | sort | sed 's/^/- /')
EOF

# Display summary
echo -e "${BLUE}Test Summary:${RESET}"
echo -e "Total Tests: ${CYAN}${TOTAL_TESTS}${RESET}"
echo -e "Passing: ${GREEN}${TOTAL_PASS}${RESET}"
echo -e "Failing: ${RED}${TOTAL_FAIL}${RESET}"
echo -e "Success Rate: ${CYAN}${SUCCESS_RATE}%${RESET}"
echo
echo -e "${BLUE}Results saved to:${RESET}"
echo -e "- Summary: ${MAGENTA}${RESULTS_DIR}/reports/summary.md${RESET}"
echo -e "- Details: ${MAGENTA}${RESULTS_DIR}/reports/details.md${RESET}"

# Exit with non-zero status if any tests failed
[ "$TOTAL_FAIL" -eq 0 ]
