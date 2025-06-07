#!/bin/bash
# Comprehensive test script for SwissKnife with fixed configuration

# Set up colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Create results directory with timestamp
RESULTS_DIR="./test-results-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Create a summary file
SUMMARY_FILE="$RESULTS_DIR/summary.md"
LOG_FILE="$RESULTS_DIR/test_run.log"

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and log results
run_test() {
  local name=$1
  local test_path=$2
  local output_file="$RESULTS_DIR/$(basename $test_path).log"
  
  echo -e "${BLUE}Running: ${name}${NC}"
  echo "$ $cmd"
  echo ""
  
  start_time=$(date +%s)
  $cmd > "$output_file" 2>&1
  exit_code=$?
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (${duration}s)"
    echo "$name: PASSED ($duration seconds)" >> "$RESULTS_DIR/passing.txt"
  else
    echo -e "${RED}✗ FAILED${NC} (${duration}s)"
    echo "$name: FAILED ($duration seconds)" >> "$RESULTS_DIR/failing.txt"
    echo "  See log: $output_file"
  fi
  echo ""
  return $exit_code
}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}SwissKnife Comprehensive Test Suite${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Phase 1: Super minimal tests
echo -e "${YELLOW}Phase 1: Basic Tests${NC}"
run_test "Super Minimal Test" "npx jest test/super-minimal.test.js --verbose"

# Phase 2: Core utilities tests
echo -e "${YELLOW}Phase 2: Core Utility Tests${NC}"
run_test "Core Utils" "node run-diagnostic-tests.mjs --category utils"

# Phase 3: Model tests
echo -e "${YELLOW}Phase 3: Model Tests${NC}"
run_test "Models" "node run-diagnostic-tests.mjs --category models"

# Phase 4: Storage tests
echo -e "${YELLOW}Phase 4: Storage Tests${NC}"
run_test "Storage" "node run-diagnostic-tests.mjs --category storage"

# Phase 5: Task tests
echo -e "${YELLOW}Phase 5: Task Tests${NC}"
run_test "Tasks" "node run-diagnostic-tests.mjs --category tasks"

# Phase 6: Integration tests
echo -e "${YELLOW}Phase 6: Integration Tests${NC}"
run_test "Integration" "node run-diagnostic-tests.mjs --category integration"

# Generate summary
echo -e "${YELLOW}Generating Test Summary${NC}"
echo "# SwissKnife Test Summary" > "$RESULTS_DIR/summary.md"
echo "Generated: $(date)" >> "$RESULTS_DIR/summary.md"
echo "" >> "$RESULTS_DIR/summary.md"

echo "## Passing Tests" >> "$RESULTS_DIR/summary.md"
if [ -f "$RESULTS_DIR/passing.txt" ]; then
  cat "$RESULTS_DIR/passing.txt" | sed 's/^/- /' >> "$RESULTS_DIR/summary.md"
else
  echo "No passing tests found." >> "$RESULTS_DIR/summary.md" 
fi

echo "" >> "$RESULTS_DIR/summary.md"
echo "## Failing Tests" >> "$RESULTS_DIR/summary.md"
if [ -f "$RESULTS_DIR/failing.txt" ]; then
  cat "$RESULTS_DIR/failing.txt" | sed 's/^/- /' >> "$RESULTS_DIR/summary.md"
else
  echo "No failing tests found." >> "$RESULTS_DIR/summary.md"
fi

echo -e "${GREEN}Test run complete!${NC}"
echo "Summary available at: $RESULTS_DIR/summary.md"
