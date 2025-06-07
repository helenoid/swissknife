#!/bin/bash
# typescript-test-runner.sh
# Script to run TypeScript tests with proper configuration

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife TypeScript Test Runner${RESET}"
echo -e "${BLUE}===============================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="ts-test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/logs"

# Logging function
log() {
  local level=$1
  shift
  local message="$@"
  local color=$RESET
  
  case "$level" in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
    "STEP") color=$CYAN ;;
  esac
  
  echo -e "${color}[$level] $message${RESET}"
  echo "[$level] $message" >> "$RESULTS_DIR/ts-runner.log"
}

# Function to run a specific test or pattern with TypeScript configuration
run_ts_test() {
  local test_pattern=$1
  local description=$2
  local log_file="$RESULTS_DIR/logs/$(echo "$test_pattern" | tr '/' '-' | tr '*' 'x')_ts.log"
  
  log "STEP" "Running TS test '$test_pattern'"
  log "INFO" "Description: $description"
  
  # Run the test with TypeScript config
  npx jest "$test_pattern" --config="jest.typescript.config.cjs" > "$log_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    log "SUCCESS" "Test '$test_pattern' PASSED!"
    echo "$test_pattern: PASS" >> "$RESULTS_DIR/passing_ts_tests.txt"
    return 0
  else
    log "ERROR" "Test '$test_pattern' FAILED! See log: $log_file"
    echo "$test_pattern: FAIL" >> "$RESULTS_DIR/failing_ts_tests.txt"
    
    # Extract error info
    log "ERROR" "Error summary:"
    grep -A 5 -B 2 "Error:" "$log_file" | head -20 >> "$RESULTS_DIR/ts-runner.log"
    
    return 1
  fi
}

# Step 1: Ensure TypeScript setup file exists
log "STEP" "Checking TypeScript setup file"
if [ ! -f "test/setup-jest-typescript.js" ]; then
  log "ERROR" "TypeScript setup file missing. Please run master-test-runner.sh first."
  exit 1
fi

# Step 2: Run TypeScript Tests
log "STEP" "Running TypeScript tests"

# TypeScript test patterns to run
declare -a ts_tests=(
  "test/unit/**/*.test.ts:Core TypeScript tests"
  "test/unit/services/**/*.test.ts:Service TypeScript tests"
  "test/unit/ai/**/*.test.ts:AI TypeScript tests"
  "test/unit/models/**/*.test.ts:Model TypeScript tests"
  "test/unit/utils/**/*.test.ts:Utility TypeScript tests"
)

# Run each TypeScript test group
overall_status=0
for ts_test in "${ts_tests[@]}"; do
  IFS=':' read -r pattern description <<< "$ts_test"
  
  log "INFO" "Running TypeScript '$description'"
  run_ts_test "$pattern" "$description"
  
  if [ $? -ne 0 ]; then
    log "WARNING" "Some tests in group '$description' failed"
    overall_status=1
  else
    log "SUCCESS" "All tests in group '$description' passed"
  fi
done

# Step 3: Generate summary
log "STEP" "Generating TypeScript test summary"

# Count passed and failed tests
TS_PASSED=$(cat "$RESULTS_DIR/passing_ts_tests.txt" 2>/dev/null | wc -l || echo 0)
TS_FAILED=$(cat "$RESULTS_DIR/failing_ts_tests.txt" 2>/dev/null | wc -l || echo 0)
TS_TOTAL=$((TS_PASSED + TS_FAILED))

if [ $overall_status -eq 0 ]; then
  log "SUCCESS" "All TypeScript tests passed successfully!"
  echo -e "${GREEN}All TypeScript tests passed successfully!${RESET}"
else
  log "WARNING" "Some TypeScript tests failed."
  echo -e "${YELLOW}Some TypeScript tests failed.${RESET}"
fi

# Final summary
echo
echo -e "${BLUE}TypeScript Test Run Summary${RESET}"
echo -e "${BLUE}==========================${RESET}"
echo -e "Total Tests: ${CYAN}$TS_TOTAL${RESET}"
echo -e "Passed: ${GREEN}$TS_PASSED${RESET}"
echo -e "Failed: ${RED}$TS_FAILED${RESET}"
echo -e "Success Rate: ${CYAN}$(( (TS_PASSED * 100) / (TS_TOTAL == 0 ? 1 : TS_TOTAL) ))%${RESET}"

exit $overall_status
