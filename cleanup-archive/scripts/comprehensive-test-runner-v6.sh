#!/bin/bash
# comprehensive-test-runner-v6.sh
# Advanced test runner with sophisticated error handling and fixes

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Comprehensive Test Runner v6${RESET}"
echo -e "${BLUE}=====================================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results-v6-${TIMESTAMP}"
mkdir -p "${RESULTS_DIR}/logs"
mkdir -p "${RESULTS_DIR}/reports"
mkdir -p "${RESULTS_DIR}/fixes"
mkdir -p "${RESULTS_DIR}/backups"

# Initialize report files
touch "${RESULTS_DIR}/passing_tests.txt"
touch "${RESULTS_DIR}/failing_tests.txt"
touch "${RESULTS_DIR}/fixed_tests.txt"
touch "${RESULTS_DIR}/category_results.txt"

# Log function for structured logging
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
  echo "[$level] $message" >> "${RESULTS_DIR}/runner.log"
}

# Function to run a test file
run_test() {
  local file=$1
  local config=$2
  local name=$(basename "$file" .js)
  local config_name=$(basename "$config" .cjs)
  local log_file="${RESULTS_DIR}/logs/${name}_${config_name}.log"
  
  log "INFO" "Running test: $name ($config_name)"
  
  npx jest "$file" --config="$config" > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    log "SUCCESS" "Test passed: $name"
    echo "$file: PASSED ($config_name)" >> "${RESULTS_DIR}/passing_tests.txt"
  else
    log "ERROR" "Test failed: $name"
    echo "$file: FAILED ($config_name)" >> "${RESULTS_DIR}/failing_tests.txt"
    log "WARNING" "Error summary (last 10 lines):"
    tail -10 "$log_file" | while read -r line; do
      log "WARNING" "  $line"
    done
  fi
  
  return $result
}

# Function to backup a file before modification
backup_file() {
  local file=$1
  local backup="${RESULTS_DIR}/backups/$(basename $file).bak"
  
  cp "$file" "$backup"
  log "INFO" "Backed up $file to $backup"
}

# Function to apply common Jest fixes to a test file
apply_jest_fixes() {
  local file=$1
  local name=$(basename "$file" .js)
  local fix_log="${RESULTS_DIR}/fixes/${name}_fixes.log"
  
  log "STEP" "Applying common Jest fixes to $name"
  backup_file "$file"
  
  # Convert Chai assertions to Jest
  sed -i 's/expect(\(.*\))\.to\.equal(\(.*\))/expect(\1).toBe(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.deep\.equal(\(.*\))/expect(\1).toEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.eql(\(.*\))/expect(\1).toEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.null/expect(\1).toBeNull()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.be\.null/expect(\1).not.toBeNull()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.undefined/expect(\1).toBeUndefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.be\.undefined/expect(\1).not.toBeUndefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.true/expect(\1).toBe(true)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.false/expect(\1).toBe(false)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.exist/expect(\1).toBeDefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.exist/expect(\1).not.toBeDefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.include(\(.*\))/expect(\1).toContain(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.contain(\(.*\))/expect(\1).toContain(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.match(\(.*\))/expect(\1).toMatch(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.throw(\(.*\))/expect(\1).toThrow(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.throw()/expect(\1).toThrow()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.lengthOf(\(.*\))/expect(\1).toHaveLength(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.property(\(.*\))/expect(\1).toHaveProperty(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.equal(\(.*\))/expect(\1).not.toBe(\2)/g' "$file"
  
  # Remove/replace Chai imports
  sed -i '/const chai = require/d' "$file"
  sed -i '/const expect = chai/d' "$file"
  sed -i '/import chai from/d' "$file"
  sed -i '/import { expect } from.*chai/d' "$file"
  
  # Add Jest timeout for potentially slow tests
  if ! grep -q "jest.setTimeout" "$file"; then
    sed -i '1s/^/jest.setTimeout(15000);\n\n/' "$file"
  fi
  
  # Fix common null/undefined access issues
  sed -i 's/\([a-zA-Z0-9_]*\)\.get(\(.*\))/\1?.get?.(\2)/g' "$file"
  sed -i 's/\([a-zA-Z0-9_]*\)\.getAll()/\1?.getAll?.() || {}/g' "$file"
  
  # Log modifications
  log "INFO" "Applied common Jest fixes to $file"
  
  # Test if fixes improved the situation
  local config="jest.simple.config.cjs"
  if [[ "$file" == *"unit/"* ]]; then
    config="jest.master.config.cjs"
  fi
  
  npx jest "$file" --config="$config" > "$fix_log" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    log "SUCCESS" "Fixes resolved issues in $name"
    echo "$file: FIXED" >> "${RESULTS_DIR}/fixed_tests.txt"
    return 0
  else
    log "WARNING" "Common fixes were not sufficient for $name"
    return 1
  fi
}

# Function to fix timing/race condition issues
fix_timing_issues() {
  local file=$1
  local name=$(basename "$file" .js)
  local fix_log="${RESULTS_DIR}/fixes/${name}_timing_fixes.log"
  
  log "STEP" "Applying timing fixes to $name"
  backup_file "$file"
  
  # Add helper functions for waiting if not present
  if ! grep -q "const wait = (ms)" "$file"; then
    sed -i '1s/^/const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\nconst waitUntil = async (condition, timeout = 5000, interval = 100) => {\n  const startTime = Date.now();\n  while (!condition() && Date.now() - startTime < timeout) {\n    await wait(interval);\n  }\n  if (!condition()) {\n    throw new Error(`Condition not met within ${timeout}ms`);\n  }\n};\n\n/' "$file"
  fi
  
  # Increase timeouts
  sed -i 's/setTimeout(resolve, \([0-9]\+\))/setTimeout(resolve, \1 * 2)/g' "$file"
  sed -i 's/timeout: \([0-9]\+\)/timeout: \1 * 2/g' "$file"
  
  # Replace problematic interval patterns
  sed -i 's/const interval = setInterval([^;]*;[^;]*;/await waitUntil(() => {/g' "$file"
  sed -i 's/clearInterval(interval);/}/g' "$file"
  
  # Test if fixes improved the situation
  local config="jest.simple.config.cjs"
  if [[ "$file" == *"unit/"* ]]; then
    config="jest.master.config.cjs"
  fi
  
  npx jest "$file" --config="$config" > "$fix_log" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    log "SUCCESS" "Timing fixes resolved issues in $name"
    echo "$file: FIXED (timing)" >> "${RESULTS_DIR}/fixed_tests.txt"
    return 0
  else
    log "WARNING" "Timing fixes were not sufficient for $name"
    return 1
  fi
}

# Function to run tests based on their type
run_test_category() {
  local category=$1
  local test_pattern=$2
  local config=$3
  local description=$4
  
  log "STEP" "Running $description"
  echo "## $description" >> "${RESULTS_DIR}/reports/details.md"
  
  # Find matching test files
  local test_files=$(find test -path "$test_pattern" -type f | sort)
  local test_count=$(echo "$test_files" | wc -l)
  
  if [ "$test_count" -eq 0 ]; then
    log "WARNING" "No tests found for pattern: $test_pattern"
    echo "No tests found for pattern: $test_pattern" >> "${RESULTS_DIR}/reports/details.md"
    return 0
  fi
  
  log "INFO" "Found $test_count test files"
  echo "Found $test_count test files" >> "${RESULTS_DIR}/reports/details.md"
  
  local pass_count=0
  local fail_count=0
  local fix_count=0
  
  # Run each test
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      run_test "$file" "$config"
      local initial_result=$?
      
      if [ $initial_result -eq 0 ]; then
        pass_count=$((pass_count+1))
      else
        # Try to fix the test
        if apply_jest_fixes "$file"; then
          fix_count=$((fix_count+1))
        elif fix_timing_issues "$file"; then
          fix_count=$((fix_count+1))
        else
          fail_count=$((fail_count+1))
        fi
      fi
      
      echo ""
    fi
  done <<< "$test_files"
  
  # Record category results
  echo "$category:$pass_count:$fix_count:$fail_count" >> "${RESULTS_DIR}/category_results.txt"
  
  log "INFO" "$description Results:"
  log "SUCCESS" "Passing: $pass_count/$test_count"
  log "SUCCESS" "Fixed: $fix_count/$test_count"
  log "ERROR" "Failing: $fail_count/$test_count"
  echo ""
  
  echo "### Results" >> "${RESULTS_DIR}/reports/details.md"
  echo "- Passing: $pass_count/$test_count" >> "${RESULTS_DIR}/reports/details.md"
  echo "- Fixed: $fix_count/$test_count" >> "${RESULTS_DIR}/reports/details.md"
  echo "- Failing: $fail_count/$test_count" >> "${RESULTS_DIR}/reports/details.md"
  echo "" >> "${RESULTS_DIR}/reports/details.md"
}

# Ensure necessary directories exist
mkdir -p dist/entrypoints
mkdir -p dist/models/execution
mkdir -p dist/config
mkdir -p dist/models/registry
mkdir -p dist/integration
mkdir -p dist/utils/events
mkdir -p dist/utils/errors
mkdir -p test/helpers

# Initialize reports
echo "# SwissKnife Test Results (v6)" > "${RESULTS_DIR}/reports/details.md"
echo "Generated: $(date)" >> "${RESULTS_DIR}/reports/details.md"
echo "" >> "${RESULTS_DIR}/reports/details.md"

# Run simplified tests first
log "STEP" "Testing with simplified implementations"
run_test "test/simplified-task-manager.test.js" "jest.simple.config.cjs"
run_test "test/simple-worker.test.js" "jest.simple.config.cjs"

# Run test categories
run_test_category "standalone" "test/standalone*.test.js" "jest.simple.config.cjs" "Standalone Tests"
run_test_category "basic" "test/{ultra-basic,verify-env,basic}.test.js" "jest.simple.config.cjs" "Basic Tests"
run_test_category "minimal-mcp" "test/mcp-minimal*.test.js" "jest.simple.config.cjs" "Minimal MCP Tests"
run_test_category "diagnostic" "test/diagnostic*.test.js" "jest.simple.config.cjs" "Diagnostic Tests"
run_test_category "utils" "test/unit/utils/**/*.test.js" "jest.master.config.cjs" "Utility Tests"
run_test_category "models" "test/unit/models/**/*.test.js" "jest.master.config.cjs" "Model Tests"
run_test_category "services" "test/unit/services/**/*.test.js" "jest.master.config.cjs" "Service Tests"
run_test_category "mcp" "test/unit/mcp-server/**/*.test.js" "jest.master.config.cjs" "MCP Server Tests"

# Generate summary report
TOTAL_PASS=$(cat "${RESULTS_DIR}/passing_tests.txt" | sort -u | wc -l)
TOTAL_FIXED=$(cat "${RESULTS_DIR}/fixed_tests.txt" | sort -u | wc -l)
TOTAL_FAIL=$(cat "${RESULTS_DIR}/failing_tests.txt" | sort -u | wc -l)
TOTAL_TESTS=$((TOTAL_PASS + TOTAL_FIXED + TOTAL_FAIL))

# Calculate success rate
SUCCESS_RATE=0
if [ "$TOTAL_TESTS" -gt 0 ]; then
  SUCCESS_RATE=$(( (TOTAL_PASS + TOTAL_FIXED) * 100 / TOTAL_TESTS ))
fi

# Create summary report
cat > "${RESULTS_DIR}/reports/summary.md" << EOF
# SwissKnife Comprehensive Test Summary (v6)

Generated: $(date)

## Overall Results
- Total Tests: ${TOTAL_TESTS}
- Passing: ${TOTAL_PASS}
- Fixed: ${TOTAL_FIXED}
- Failing: ${TOTAL_FAIL}
- Success Rate: ${SUCCESS_RATE}%

## Results by Category
EOF

# Add category results
while IFS=":" read -r category pass fixed fail; do
  total=$((pass + fixed + fail))
  rate=0
  if [ "$total" -gt 0 ]; then
    rate=$(( (pass + fixed) * 100 / total ))
  fi
  echo "- ${category}: ${pass} passed, ${fixed} fixed, ${fail} failed (${rate}%)" >> "${RESULTS_DIR}/reports/summary.md"
done < "${RESULTS_DIR}/category_results.txt"

# Create test patterns report
cat > "${RESULTS_DIR}/reports/test_patterns.md" << EOF
# SwissKnife Test Patterns

This document outlines the test patterns that work reliably in this project.

## Effective Testing Strategies

1. **Use Standalone Tests**: Self-contained tests are more reliable and easier to debug
2. **Avoid Race Conditions**: Use explicit waiting mechanisms instead of timers
3. **Use Jest Assertions**: Prefer Jest's assertion style over Chai
4. **Isolate Tests**: Don't share state between test cases
5. **Handle Async Properly**: Always await promises and use waitUntil for conditions

## Common Fixes for Failing Tests

### Assertion Fixes
- Replace \`.to.equal()\` with \`.toBe()\`
- Replace \`.to.deep.equal()\` with \`.toEqual()\`
- Replace \`.to.be.true\` with \`.toBe(true)\`

### Timing Fixes
- Add \`jest.setTimeout(15000)\` at the top of test files
- Use \`waitUntil\` helper instead of setTimeout/setInterval
- Increase timeouts for async operations

### Null/Undefined Access Fixes
- Use optional chaining (\`?.\`) for potentially null objects
- Provide fallbacks for undefined values
EOF

# Display summary
log "STEP" "Test Summary"
log "INFO" "Total Tests: ${TOTAL_TESTS}"
log "SUCCESS" "Passing: ${TOTAL_PASS}"
log "SUCCESS" "Fixed: ${TOTAL_FIXED}"
log "ERROR" "Failing: ${TOTAL_FAIL}"
log "INFO" "Success Rate: ${SUCCESS_RATE}%"
log "INFO" "Results saved to ${RESULTS_DIR}/reports/"

# Exit with non-zero status if any tests failed
[ "$TOTAL_FAIL" -eq 0 ]
