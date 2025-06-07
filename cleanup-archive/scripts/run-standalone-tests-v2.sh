#!/bin/bash
# run-standalone-tests-v2.sh
# Script to run all standalone tests independently of the complex project structure

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Standalone Test Runner v2${RESET}"
echo -e "${BLUE}=================================${RESET}"

# Create results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="standalone-results-${TIMESTAMP}"
mkdir -p "$RESULTS_DIR"

# Function to run a standalone test
run_standalone_test() {
  local test_file=$1
  local test_name=$(basename "$test_file" .js)
  local log_file="${RESULTS_DIR}/${test_name}.log"
  
  echo -e "${CYAN}Running ${test_name}...${RESET}"
  
  echo "Running: npx jest '$test_file' --config=jest.simple.config.cjs"
  npx jest "$test_file" --config=jest.simple.config.cjs > "$log_file" 2>&1
  local result=$?
  echo "Result: $result"
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED: ${test_name}${RESET}"
    echo "$test_file" >> "${RESULTS_DIR}/passed.txt"
  else
    echo -e "${RED}✗ FAILED: ${test_name}${RESET}"
    echo "$test_file" >> "${RESULTS_DIR}/failed.txt"
    echo -e "${YELLOW}Last 10 lines of error:${RESET}"
    tail -10 "$log_file"
  fi
  
  return $result
}

# List of standalone tests
declare -a STANDALONE_TESTS=(
  "test/standalone-command-registry.test.js"
  "test/standalone-mcp.test.js"
)

# Run all standalone tests
echo -e "${YELLOW}Running all standalone tests...${RESET}"
echo

PASSED=0
FAILED=0
TOTAL=${#STANDALONE_TESTS[@]}

for test_file in "${STANDALONE_TESTS[@]}"; do
  if run_standalone_test "$test_file"; then
    PASSED=$((PASSED+1))
  else
    FAILED=$((FAILED+1))
  fi
  echo
done

# Generate summary report
cat > "${RESULTS_DIR}/summary.md" << EOF
# SwissKnife Standalone Test Results

Date: $(date)

## Summary
- Total Tests: $TOTAL
- Passed: $PASSED
- Failed: $FAILED
- Success Rate: $(( (PASSED * 100) / TOTAL ))%

## Passed Tests
$(cat "${RESULTS_DIR}/passed.txt" 2>/dev/null | sort | sed 's/^/- /')

## Failed Tests
$(cat "${RESULTS_DIR}/failed.txt" 2>/dev/null | sort | sed 's/^/- /')
EOF

# Final summary
echo -e "${BLUE}Test Summary:${RESET}"
echo -e "${GREEN}Passed: ${PASSED}/${TOTAL}${RESET}"
echo -e "${RED}Failed: ${FAILED}/${TOTAL}${RESET}"
echo
echo -e "${BLUE}Results saved to ${RESULTS_DIR}/summary.md${RESET}"

# Exit with failure if any test failed
[ $FAILED -eq 0 ]
