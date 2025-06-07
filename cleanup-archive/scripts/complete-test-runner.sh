#!/bin/bash
# complete-test-runner.sh
# A complete test solution that runs all types of tests in sequence

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${MAGENTA}SwissKnife Complete Test Solution${RESET}"
echo -e "${MAGENTA}==============================${RESET}"

# Create timestamp for main results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MAIN_DIR="complete-tests-$TIMESTAMP"
mkdir -p "$MAIN_DIR"
mkdir -p "$MAIN_DIR/reports"

# Function to display section header
section() {
  echo
  echo -e "${BLUE}======================================================${RESET}"
  echo -e "${BLUE}  $1${RESET}"
  echo -e "${BLUE}======================================================${RESET}"
  echo
}

# Function to display subsection header
subsection() {
  echo
  echo -e "${CYAN}  $1${RESET}"
  echo -e "${CYAN}  --------------------------------------------------${RESET}"
}

# Function to run a specific test file or pattern with a given configuration
run_specific_test() {
  local test_pattern=$1
  local config_file=$2
  local description=$3
  local output_dir=$4
  
  mkdir -p "$output_dir"
  local log_file="$output_dir/$(echo "$test_pattern" | tr '/' '-' | tr '*' 'x').log"
  
  echo -e "  Running test: ${YELLOW}$test_pattern${RESET}"
  echo -e "  Config: ${YELLOW}$config_file${RESET}"
  echo -e "  Description: $description"
  
  npx jest "$test_pattern" --config="$config_file" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASSED!${RESET}"
    return 0
  else
    echo -e "  ${RED}✗ FAILED!${RESET}"
    echo -e "  ${RED}See log: $log_file${RESET}"
    return 1
  fi
}

# Step 1: Basic Environment Check
section "Step 1: Basic Environment Check"

# Run a simple test to verify the environment
subsection "Running minimal test"

mkdir -p "$MAIN_DIR/1-basic"
run_specific_test "test/unit/minimal.test.js" "jest.master.config.cjs" "Minimal test to verify environment" "$MAIN_DIR/1-basic"
BASIC_STATUS=$?

if [ $BASIC_STATUS -ne 0 ]; then
  echo -e "${RED}Basic environment check failed. Fix this first before proceeding.${RESET}"
  echo -e "${YELLOW}You can try running just the basic test with:${RESET}"
  echo -e "npx jest test/unit/minimal.test.js --config=jest.master.config.cjs"
  exit 1
fi

echo -e "${GREEN}Basic environment check passed!${RESET}"

# Step 2: Utility Tests
section "Step 2: Utility Tests"

# Create utility tests directory
mkdir -p "$MAIN_DIR/2-utils"

# Run error handling tests
subsection "Running error handling tests"
run_specific_test "test/unit/utils/errors/*.test.js" "jest.master.config.cjs" "Error handling tests" "$MAIN_DIR/2-utils"
ERRORS_STATUS=$?

# Run event bus tests
subsection "Running event system tests"
run_specific_test "test/unit/utils/events/*.test.js" "jest.master.config.cjs" "Event system tests" "$MAIN_DIR/2-utils"
EVENTS_STATUS=$?

# Run cache tests
subsection "Running cache system tests"
run_specific_test "test/unit/utils/cache/*.test.js" "jest.master.config.cjs" "Cache system tests" "$MAIN_DIR/2-utils"
CACHE_STATUS=$?

# Step 3: Core Module Tests
section "Step 3: Core Module Tests"

# Create module tests directory
mkdir -p "$MAIN_DIR/3-modules"

# Run model tests
subsection "Running model tests"
run_specific_test "test/unit/models/*.test.js" "jest.master.config.cjs" "Model tests" "$MAIN_DIR/3-modules"
MODELS_STATUS=$?

# Run command tests
subsection "Running command tests"
run_specific_test "test/unit/commands/*.test.js" "jest.master.config.cjs" "Command tests" "$MAIN_DIR/3-modules"
COMMANDS_STATUS=$?

# Run worker tests with special worker configuration
subsection "Running worker tests"
chmod +x worker-test-runner.sh
./worker-test-runner.sh
WORKER_STATUS=$?

if [ -d "worker-tests-"* ]; then
  # Copy the latest worker test results
  cp -r worker-tests-* "$MAIN_DIR/3-modules/worker-results"
fi

# Step 4: Feature Tests
section "Step 4: Feature Tests"

# Create feature tests directory
mkdir -p "$MAIN_DIR/4-features"

# Run AI tests
subsection "Running AI tests"
run_specific_test "test/unit/ai/*.test.js" "jest.master.config.cjs" "AI system tests" "$MAIN_DIR/4-features"
AI_STATUS=$?

# Run MCP server tests
subsection "Running MCP server tests"
run_specific_test "test/unit/mcp-server/*.test.js" "jest.master.config.cjs" "MCP server tests" "$MAIN_DIR/4-features"
MCP_STATUS=$?

# Run task system tests
subsection "Running task system tests"
run_specific_test "test/unit/tasks/*.test.js" "jest.master.config.cjs" "Task system tests" "$MAIN_DIR/4-features"
TASKS_STATUS=$?

# Step 5: TypeScript Tests
section "Step 5: TypeScript Tests"

# Run TypeScript tests using the typescript runner
subsection "Running TypeScript tests"
chmod +x typescript-test-runner.sh
./typescript-test-runner.sh
TS_STATUS=$?

if [ -d "ts-test-results-"* ]; then
  # Copy the latest TypeScript test results
  cp -r ts-test-results-* "$MAIN_DIR/5-typescript"
fi

# Step 6: Integration Tests
section "Step 6: Integration Tests"

# Create integration tests directory
mkdir -p "$MAIN_DIR/6-integration"

# Run integration tests
subsection "Running integration tests"
run_specific_test "test/unit/integration/*.test.js" "jest.master.config.cjs" "Integration tests" "$MAIN_DIR/6-integration"
INTEGRATION_STATUS=$?

# Step 7: Generate Report
section "Step 7: Generating Test Report"

# Function to format status for report
format_status() {
  local status=$1
  if [ $status -eq 0 ]; then
    echo "✅ PASSED"
  else
    echo "❌ FAILED"
  fi
}

# Create the report
cat > "$MAIN_DIR/reports/test-summary.md" << EOF
# SwissKnife Test Summary

Generated: $(date)

## Test Results

| Test Category | Status | Notes |
|---------------|--------|-------|
| Basic Environment | $(format_status $BASIC_STATUS) | Verifies the testing environment is properly set up |
| Error Handling | $(format_status $ERRORS_STATUS) | Tests for error management system |
| Event System | $(format_status $EVENTS_STATUS) | Tests for event bus and event handling |
| Cache System | $(format_status $CACHE_STATUS) | Tests for caching mechanisms |
| Models | $(format_status $MODELS_STATUS) | Tests for data models and repository patterns |
| Commands | $(format_status $COMMANDS_STATUS) | Tests for command handling system |
| Worker System | $(format_status $WORKER_STATUS) | Tests for multi-threading worker pool |
| AI System | $(format_status $AI_STATUS) | Tests for AI integration components |
| MCP Server | $(format_status $MCP_STATUS) | Tests for Model Context Protocol server |
| Task System | $(format_status $TASKS_STATUS) | Tests for task scheduling and execution |
| TypeScript | $(format_status $TS_STATUS) | TypeScript-specific tests |
| Integration | $(format_status $INTEGRATION_STATUS) | End-to-end integration tests |

## Overall Status

EOF

# Calculate overall status
OVERALL_STATUS=0
if [ $BASIC_STATUS -ne 0 ] || [ $ERRORS_STATUS -ne 0 ] || [ $EVENTS_STATUS -ne 0 ] || [ $CACHE_STATUS -ne 0 ] || \
   [ $MODELS_STATUS -ne 0 ] || [ $COMMANDS_STATUS -ne 0 ] || [ $WORKER_STATUS -ne 0 ] || [ $AI_STATUS -ne 0 ] || \
   [ $MCP_STATUS -ne 0 ] || [ $TASKS_STATUS -ne 0 ] || [ $TS_STATUS -ne 0 ] || [ $INTEGRATION_STATUS -ne 0 ]; then
  OVERALL_STATUS=1
  echo "Some tests failed. See detailed logs for more information." >> "$MAIN_DIR/reports/test-summary.md"
else
  echo "All tests passed successfully!" >> "$MAIN_DIR/reports/test-summary.md"
fi

# Create a summary of passing and failing tests
if [ $OVERALL_STATUS -eq 0 ]; then
  echo -e "\n${GREEN}All tests have passed!${RESET}"
else
  echo -e "\n${YELLOW}Test Summary:${RESET}"
  echo -e "Basic Environment: $([ $BASIC_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Error Handling: $([ $ERRORS_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Event System: $([ $EVENTS_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Cache System: $([ $CACHE_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Models: $([ $MODELS_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Commands: $([ $COMMANDS_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Worker System: $([ $WORKER_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "AI System: $([ $AI_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "MCP Server: $([ $MCP_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Task System: $([ $TASKS_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "TypeScript: $([ $TS_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
  echo -e "Integration: $([ $INTEGRATION_STATUS -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
fi

echo -e "\n${BLUE}Test report saved to: $MAIN_DIR/reports/test-summary.md${RESET}"
echo -e "${BLUE}All test logs and results are in: $MAIN_DIR${RESET}"

exit $OVERALL_STATUS
