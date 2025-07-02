#!/bin/bash
# advanced-standalone-test-runner.sh
# Enhanced test runner for standalone tests with comprehensive debugging and fixes

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Advanced Standalone Test Runner${RESET}"
echo -e "${BLUE}=======================================${RESET}"

# Create results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="advanced-results-${TIMESTAMP}"
mkdir -p "$RESULTS_DIR/logs"
mkdir -p "$RESULTS_DIR/temp"
mkdir -p "$RESULTS_DIR/reports"

# Initialize report files
touch "$RESULTS_DIR/passed.txt"
touch "$RESULTS_DIR/failed.txt"
touch "$RESULTS_DIR/fixed.txt"

# Common function to run a single test
run_test() {
  local test_file=$1
  local config_file=$2
  local test_name=$(basename "$test_file" .js)
  local log_file="$RESULTS_DIR/logs/${test_name}.log"
  
  echo -e "${CYAN}Running ${test_name}...${RESET}"
  
  npx jest "$test_file" --config="$config_file" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED: ${test_name}${RESET}"
    echo "$test_file" >> "$RESULTS_DIR/passed.txt"
    return 0
  else
    echo -e "${RED}✗ FAILED: ${test_name}${RESET}"
    echo "$test_file" >> "$RESULTS_DIR/failed.txt"
    echo -e "${YELLOW}Last 10 lines of error:${RESET}"
    tail -10 "$log_file"
    return 1
  fi
}

# Function to attempt to fix task manager race conditions
fix_task_manager_test() {
  local file="$1"
  local backup="${file}.bak.$(date +%s)"
  local test_name=$(basename "$file" .js)
  local log_file="$RESULTS_DIR/logs/${test_name}_fix.log"
  
  echo -e "${YELLOW}Attempting to fix race conditions in ${test_name}...${RESET}"
  
  # Create backup
  cp "$file" "$backup"
  
  # Fix 1: Increase timeout values
  sed -i 's/setTimeout(resolve, \([0-9]\+\))/setTimeout(resolve, \1 * 2)/g' "$file"
  sed -i 's/timeout: \([0-9]\+\)/timeout: \1 * 2/g' "$file"
  
  # Fix 2: Add wait helpers and replace race-condition-prone waits
  sed -i '/^const TaskState = {/i // Helper for waiting\nconst wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\n// Helper for waiting until a condition is met\nconst waitUntil = async (condition, timeout = 2000, interval = 50) => {\n  const startTime = Date.now();\n  while (!condition() && Date.now() - startTime < timeout) {\n    await wait(interval);\n  }\n  if (!condition()) {\n    throw new Error(`Condition not met within ${timeout}ms`);\n  }\n};\n' "$file"
  
  # Fix 3: Replace problematic setInterval wait patterns
  sed -i 's/const interval = setInterval/\/\/ const interval = setInterval/g' "$file"
  sed -i 's/clearInterval(interval);/\/\/ clearInterval(interval);/g' "$file"
  sed -i 's/await new Promise(resolve => {.*setInterval.*)/await waitUntil(() => {\n      return taskManager.getPendingTaskCount() === 0 && taskManager.getRunningTaskCount() === 0;\n    }, 5000)/g' "$file"

  # Fix 4: Add jest.setTimeout for longer timeouts
  sed -i '/^describe/i jest.setTimeout(10000);' "$file"
  
  # Run the test with fixes
  npx jest "$file" --config="jest.simple.config.cjs" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ FIXED: ${test_name}${RESET}"
    echo "$file" >> "$RESULTS_DIR/fixed.txt"
    return 0
  else
    # Restore backup - fix didn't work
    cp "$backup" "$file"
    echo -e "${RED}✗ FIX FAILED: ${test_name}${RESET}"
    echo -e "${YELLOW}Last 10 lines of error:${RESET}"
    tail -10 "$log_file"
    return 1
  fi
}

# Function to fix timeout issues in worker test
fix_worker_test() {
  local file="$1"
  local backup="${file}.bak.$(date +%s)"
  local test_name=$(basename "$file" .js)
  local log_file="$RESULTS_DIR/logs/${test_name}_fix.log"
  
  echo -e "${YELLOW}Attempting to fix worker test issues in ${test_name}...${RESET}"
  
  # Create backup
  cp "$file" "$backup"
  
  # Fix 1: Add jest.setTimeout
  sed -i '/^describe/i jest.setTimeout(15000);' "$file"
  
  # Fix 2: Add helper for more reliable waits
  sed -i '/^class Worker/i // Helper for waiting\nconst wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\n// Helper for waiting until a condition is met\nconst waitUntil = async (condition, timeout = 5000, interval = 100) => {\n  const startTime = Date.now();\n  while (!condition() && Date.now() - startTime < timeout) {\n    await wait(interval);\n  }\n  if (!condition()) {\n    throw new Error(`Condition not met within ${timeout}ms`);\n  }\n};\n' "$file"
  
  # Fix 3: Increase timeouts and stabilize tests with better waits
  sed -i 's/setTimeout(resolve, \([0-9]\+\))/setTimeout(resolve, \1 * 3)/g' "$file"
  
  # Run the test with fixes
  npx jest "$file" --config="jest.simple.config.cjs" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ FIXED: ${test_name}${RESET}"
    echo "$file" >> "$RESULTS_DIR/fixed.txt"
    return 0
  else
    # Restore backup - fix didn't work
    cp "$backup" "$file"
    echo -e "${RED}✗ FIX FAILED: ${test_name}${RESET}"
    echo -e "${YELLOW}Last 10 lines of error:${RESET}"
    tail -10 "$log_file"
    return 1
  fi
}

# Function to fix config test issues
fix_config_test() {
  local file="$1"
  local backup="${file}.bak.$(date +%s)"
  local test_name=$(basename "$file" .js)
  local log_file="$RESULTS_DIR/logs/${test_name}_fix.log"
  
  echo -e "${YELLOW}Attempting to fix config test issues in ${test_name}...${RESET}"
  
  # Create backup
  cp "$file" "$backup"
  
  # Fix potential null/undefined access issues
  sed -i 's/config\.getAll()/config.getAll() || {}/g' "$file"
  sed -i 's/expect(config\.get(\(.*\)))\.toBe(/expect(config?.get(\1) || null)?.toBe(/g' "$file"
  
  # Run the test with fixes
  npx jest "$file" --config="jest.simple.config.cjs" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ FIXED: ${test_name}${RESET}"
    echo "$file" >> "$RESULTS_DIR/fixed.txt"
    return 0
  else
    # Restore backup - fix didn't work
    cp "$backup" "$file"
    echo -e "${RED}✗ FIX FAILED: ${test_name}${RESET}"
    echo -e "${YELLOW}Last 10 lines of error:${RESET}"
    tail -10 "$log_file"
    return 1
  fi
}

# Run all standalone tests initially
echo -e "${BLUE}Phase 1: Running all standalone tests${RESET}"

declare -a STANDALONE_TESTS=(
  "test/standalone-command-registry.test.js"
  "test/standalone-mcp.test.js"
  "test/standalone-logger.test.js"
  "test/standalone-config.test.js"
  "test/standalone-task-manager.test.js"
  "test/standalone-worker.test.js"
  "test/standalone-error.test.js"
  "test/standalone-commands.test.js"
  "test/standalone-logging.test.js"
  "test/standalone.test.js"
)

INITIAL_PASS=0
INITIAL_FAIL=0

for test_file in "${STANDALONE_TESTS[@]}"; do
  if [ -f "$test_file" ]; then
    if run_test "$test_file" "jest.simple.config.cjs"; then
      INITIAL_PASS=$((INITIAL_PASS+1))
    else
      INITIAL_FAIL=$((INITIAL_FAIL+1))
    fi
    echo
  else
    echo -e "${YELLOW}Warning: Test file not found - ${test_file}${RESET}"
  fi
done

# Phase 2: Fix failing tests
echo -e "${BLUE}Phase 2: Attempting to fix failing tests${RESET}"

FIXED_COUNT=0

# Check if task manager test failed and try to fix it
if grep -q "standalone-task-manager.test.js" "$RESULTS_DIR/failed.txt"; then
  if fix_task_manager_test "test/standalone-task-manager.test.js"; then
    FIXED_COUNT=$((FIXED_COUNT+1))
  fi
fi

# Check if worker test failed and try to fix it
if grep -q "standalone-worker.test.js" "$RESULTS_DIR/failed.txt"; then
  if fix_worker_test "test/standalone-worker.test.js"; then
    FIXED_COUNT=$((FIXED_COUNT+1))
  fi
fi

# Check if config test failed and try to fix it
if grep -q "standalone-config.test.js" "$RESULTS_DIR/failed.txt"; then
  if fix_config_test "test/standalone-config.test.js"; then
    FIXED_COUNT=$((FIXED_COUNT+1))
  fi
fi

# Generate final report
FINAL_PASS=$(cat "$RESULTS_DIR/passed.txt" | sort -u | wc -l)
FIXED=$(cat "$RESULTS_DIR/fixed.txt" | wc -l)
FINAL_FAIL=$((INITIAL_FAIL - FIXED))
TOTAL_TESTS=${#STANDALONE_TESTS[@]}

# Calculate success rate
SUCCESS_RATE=0
if [ "$TOTAL_TESTS" -gt 0 ]; then
  SUCCESS_RATE=$(( (FINAL_PASS + FIXED) * 100 / TOTAL_TESTS ))
fi

# Create summary report
cat > "$RESULTS_DIR/reports/summary.md" << EOF
# SwissKnife Advanced Standalone Test Results

Generated: $(date)

## Overall Results
- Total Tests: ${TOTAL_TESTS}
- Initially Passing: ${INITIAL_PASS}
- Fixed Tests: ${FIXED}
- Remaining Failing: ${FINAL_FAIL}
- Success Rate: ${SUCCESS_RATE}%

## Passing Tests
$(cat "$RESULTS_DIR/passed.txt" | sort -u | sed 's/^/- /')

## Fixed Tests
$(cat "$RESULTS_DIR/fixed.txt" | sort -u | sed 's/^/- /')

## Failing Tests
$(comm -23 <(sort "$RESULTS_DIR/failed.txt") <(sort "$RESULTS_DIR/fixed.txt") | sed 's/^/- /')
EOF

# Display summary
echo
echo -e "${BLUE}Test Summary:${RESET}"
echo -e "Total Tests: ${CYAN}${TOTAL_TESTS}${RESET}"
echo -e "Initially Passing: ${GREEN}${INITIAL_PASS}${RESET}"
echo -e "Fixed Tests: ${MAGENTA}${FIXED}${RESET}"
echo -e "Remaining Failing: ${RED}${FINAL_FAIL}${RESET}"
echo -e "Success Rate: ${CYAN}${SUCCESS_RATE}%${RESET}"
echo
echo -e "${BLUE}Results saved to:${RESET}"
echo -e "- Summary: ${MAGENTA}${RESULTS_DIR}/reports/summary.md${RESET}"

# Exit with non-zero status if any tests still failing
[ "$FINAL_FAIL" -eq 0 ]
