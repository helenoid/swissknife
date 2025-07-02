#!/bin/bash
# Master test runner for SwissKnife
# This script runs all tests and provides a comprehensive report

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SwissKnife Master Test Runner             ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Create test results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="test-master-results-${TIMESTAMP}"
mkdir -p "$TEST_RESULTS_DIR"

# Define common test files to run (ordered by complexity)
declare -a TEST_FILES=(
  "test/standalone-test.js"
  "test/ultra-minimal-fixed.test.js"
  "test/minimal.test.js"
  "test/unit/tasks/fibonacci-heap.test.ts"
  "test/model_selector.test.tsx"
  "test/mcp-minimal.test.js"
)

# Function to run a single test and report results
run_test() {
  local test_path=$1
  local test_name=$(basename "$test_path")
  echo -e "${YELLOW}Running $test_name...${NC}"
  
  # Run the test and capture output and exit code
  npx jest --config=jest.unified.config.cjs --testMatch="**/$test_name" --no-cache > "$TEST_RESULTS_DIR/$test_name.log" 2>&1
  local exit_code=$?
  
  # Check if test was successful
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ PASS: $test_name${NC}"
    echo "PASS" > "$TEST_RESULTS_DIR/$test_name.status"
  else
    echo -e "${RED}✗ FAIL: $test_name${NC}"
    echo "FAIL" > "$TEST_RESULTS_DIR/$test_name.status"
    # Extract error messages for reporting
    grep -A5 "● " "$TEST_RESULTS_DIR/$test_name.log" | grep -v "^--$" > "$TEST_RESULTS_DIR/$test_name.errors" || true
  fi
  
  return $exit_code
}

# First, apply all fixes
echo -e "${CYAN}Applying all common fixes...${NC}"
./apply-common-fixes.sh

echo -e "${CYAN}Fixing duplicate JS extensions...${NC}"
./fix-duplicate-extensions.sh

echo -e "${CYAN}Fixing test assertions...${NC}"
./fix-test-assertions.sh

echo -e "${CYAN}Fixing ModelSelector test...${NC}"
./fix-model-selector-test.sh

echo -e "${CYAN}Fixing MCP-related tests...${NC}"
./fix-mcp-tests.sh

# Run specific test files
echo -e "\n${CYAN}Running specific test files...${NC}"
for test_file in "${TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    run_test "$test_file"
  else
    echo -e "${RED}File not found: $test_file${NC}"
  fi
done

# Generate summary report
echo -e "\n${BLUE}============ Test Summary ============${NC}"
passed=0
failed=0

for test_file in "${TEST_FILES[@]}"; do
  test_name=$(basename "$test_file")
  if [ -f "$TEST_RESULTS_DIR/$test_name.status" ]; then
    status=$(cat "$TEST_RESULTS_DIR/$test_name.status")
    if [ "$status" == "PASS" ]; then
      echo -e "${GREEN}✓ PASS: $test_name${NC}"
      ((passed++))
    else
      echo -e "${RED}✗ FAIL: $test_name${NC}"
      if [ -f "$TEST_RESULTS_DIR/$test_name.errors" ]; then
        echo -e "${YELLOW}Errors:${NC}"
        cat "$TEST_RESULTS_DIR/$test_name.errors" | sed 's/^/    /'
      fi
      ((failed++))
    fi
  fi
done

# Final statistics
total=$((passed + failed))
echo -e "\n${BLUE}============ Statistics ============${NC}"
echo -e "Total tests: $total"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"

# Create summary file
echo "Test Summary for $TIMESTAMP" > "$TEST_RESULTS_DIR/summary.txt"
echo "Total: $total, Passed: $passed, Failed: $failed" >> "$TEST_RESULTS_DIR/summary.txt"

echo -e "\n${BLUE}Test results saved to: ${NC}$TEST_RESULTS_DIR"

# Exit with proper code
if [ $failed -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check the logs for details.${NC}"
  exit 1
fi
