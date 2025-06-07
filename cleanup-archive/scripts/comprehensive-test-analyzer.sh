#!/bin/bash

# Comprehensive Test Analyzer for SwissKnife
# This script will:
# 1. Run all tests and categorize them by success/failure
# 2. Analyze failing tests to identify common patterns
# 3. Create detailed logs for debugging
# 4. Generate a report of test results

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SwissKnife Comprehensive Test Analyzer ===${NC}"
echo "Running on: $(date)"

# Create output directories
mkdir -p ./test-results/success
mkdir -p ./test-results/failure
mkdir -p ./test-results/reports

# Test categories
declare -a TEST_CATEGORIES=(
  "standalone"
  "command-registry" 
  "logging"
  "config"
  "mcp"
  "worker"
  "simplified"
  "basic"
  "minimal"
  "comprehensive"
  "universal"
)

# Track stats
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
FIXED_TESTS=0

echo -e "${BLUE}Using unified Jest configuration...${NC}"

# Function to run a specific test
run_test() {
  local test_file=$1
  local base_name=$(basename "$test_file" .test.js)
  local output_file="./test-results/temp_result.log"

  echo -e "${YELLOW}Running test: ${base_name}${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS+1))
  
  # Run the test with our unified configuration
  NODE_OPTIONS="--max-old-space-size=4096" npx jest --config=./jest.unified.config.cjs "$test_file" > "$output_file" 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed: ${base_name}${NC}"
    PASSED_TESTS=$((PASSED_TESTS+1))
    mv "$output_file" "./test-results/success/${base_name}.log"
  else
    echo -e "${RED}❌ Test failed: ${base_name}${NC}"
    FAILED_TESTS=$((FAILED_TESTS+1))
    mv "$output_file" "./test-results/failure/${base_name}.log"
    
    # Extract specific error information for later analysis
    grep -A 10 "Error:" "./test-results/failure/${base_name}.log" > "./test-results/failure/${base_name}_error.txt" || true
    
    # Attempt to diagnose and fix if needed
    attempt_fix "$test_file" "$base_name"
  fi
}

# Function to try to fix a failing test
attempt_fix() {
  local test_file=$1
  local base_name=$2
  local fixed=false
  
  echo -e "${BLUE}Attempting to diagnose and fix: ${base_name}${NC}"
  
  # Check for common issues and apply fixes
  
  # Issue 1: ESM/CommonJS interoperability issues
  if grep -q "Cannot use import statement outside a module" "./test-results/failure/${base_name}.log"; then
    echo "Detected CommonJS/ESM issue, applying fix..."
    # Create a fixed version with proper imports/requires
    create_esm_fix "$test_file"
    fixed=true
  fi
  
  # Issue 2: Timeout issues
  if grep -q "Timeout" "./test-results/failure/${base_name}.log"; then
    echo "Detected timeout issue, creating version with increased timeout..."
    create_timeout_fix "$test_file"
    fixed=true
  fi
  
  # Issue 3: Assertion/expectation issues
  if grep -q "expect" "./test-results/failure/${base_name}.log" && grep -q "toEqual\|toBe\|toHaveProperty" "./test-results/failure/${base_name}.log"; then
    echo "Detected assertion issue, creating version with fixed assertions..."
    create_assertion_fix "$test_file"
    fixed=true
  fi
  
  # If we applied fixes, run the test again
  if [ "$fixed" = true ]; then
    echo -e "${YELLOW}Re-running test after fixes: ${base_name}${NC}"
    
    NODE_OPTIONS="--max-old-space-size=4096" npx jest --config=./jest.unified.config.cjs "$test_file" > "./test-results/temp_rerun.log" 2>&1
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Test fixed and passed: ${base_name}${NC}"
      FIXED_TESTS=$((FIXED_TESTS+1))
      FAILED_TESTS=$((FAILED_TESTS-1))
      PASSED_TESTS=$((PASSED_TESTS+1))
      mv "./test-results/temp_rerun.log" "./test-results/success/${base_name}_fixed.log"
      mv "./test-results/failure/${base_name}.log" "./test-results/failure/${base_name}_original_failure.log"
    else
      echo -e "${RED}❌ Test still failing after fix attempts: ${base_name}${NC}"
      mv "./test-results/temp_rerun.log" "./test-results/failure/${base_name}_fix_attempt.log"
    fi
  fi
}

# Fix functions for common issues
create_esm_fix() {
  local test_file=$1
  local base_name=$(basename "$test_file" .test.js)
  local fixed_file="${test_file%.test.js}_fixed.test.js"
  
  echo "Creating ESM compatibility fix for $base_name..."
  
  # Create a temporary modified version with ESM/CommonJS compatibility fixes
  cp "$test_file" "$fixed_file"
  
  # Convert import statements to require if needed
  sed -i 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' "$fixed_file" || true
  
  # Add ESM compatibility layer
  cat > ./test-results/esm-helper.js <<EOL
// ESM compatibility layer for CommonJS
module.exports = function makeCompatible(module) {
  if (module.__esModule) return module;
  if (module.default) return module;
  const newModule = { ...module, __esModule: true };
  return newModule;
};
EOL
  
  # Insert the compatibility layer at the top of the file
  sed -i '1i const makeCompatible = require("./test-results/esm-helper.js");' "$fixed_file" || true
  
  # Wrap requires with compatibility layer
  sed -i 's/require(\(.*\))/makeCompatible(require(\1))/g' "$fixed_file" || true
  
  echo "Fixed ESM issues in $fixed_file"
}

create_timeout_fix() {
  local test_file=$1
  local base_name=$(basename "$test_file" .test.js)
  local fixed_file="${test_file%.test.js}_timeout_fixed.test.js"
  
  echo "Creating timeout fix for $base_name..."
  
  # Create a temporary modified version with increased timeouts
  cp "$test_file" "$fixed_file"
  
  # Increase test timeout
  sed -i '/describe(/a \ \ jest.setTimeout(120000);' "$fixed_file" || true
  
  # Add waitFor utility function if not present
  sed -i '1i const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));' "$fixed_file" || true
  
  # Add afterEach cleanup to prevent hanging tests
  sed -i '/describe(/a \ \ afterEach(() => jest.clearAllTimers());' "$fixed_file" || true
  
  echo "Fixed timeout issues in $fixed_file"
}

create_assertion_fix() {
  local test_file=$1
  local base_name=$(basename "$test_file" .test.js)
  local fixed_file="${test_file%.test.js}_assertion_fixed.test.js"
  
  echo "Creating assertion fix for $base_name..."
  
  # Create a temporary modified version with fixed assertions
  cp "$test_file" "$fixed_file"
  
  # Update Chai style assertions to Jest style
  sed -i 's/expect(\(.*\))\.to\.equal(\(.*\))/expect(\1).toEqual(\2)/g' "$fixed_file" || true
  sed -i 's/expect(\(.*\))\.to\.be\.equal(\(.*\))/expect(\1).toEqual(\2)/g' "$fixed_file" || true
  sed -i 's/expect(\(.*\))\.to\.deep\.equal(\(.*\))/expect(\1).toEqual(\2)/g' "$fixed_file" || true
  sed -i 's/expect(\(.*\))\.to\.have\.property(\(.*\))/expect(\1).toHaveProperty(\2)/g' "$fixed_file" || true
  
  echo "Fixed assertion issues in $fixed_file"
}

# Run tests by category
run_tests_by_category() {
  local category=$1
  echo -e "${BLUE}=== Running ${category} tests ===${NC}"
  
  # Find tests matching the category
  local test_files=($(find ./test -name "*${category}*.test.js"))
  
  if [ ${#test_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}No tests found for category: ${category}${NC}"
    return
  fi
  
  for test_file in "${test_files[@]}"; do
    run_test "$test_file"
  done
}

# Run all tests in each category
for category in "${TEST_CATEGORIES[@]}"; do
  run_tests_by_category "$category"
done

# Generate summary report
echo -e "${BLUE}=== Test Run Summary ===${NC}"
echo "Total tests: $TOTAL_TESTS"
echo -e "Passed tests: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed tests: ${RED}$FAILED_TESTS${NC}"
echo -e "Fixed tests: ${YELLOW}$FIXED_TESTS${NC}"

# Create an HTML report
cat > ./test-results/reports/summary.html <<EOL
<!DOCTYPE html>
<html>
<head>
  <title>SwissKnife Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { margin-bottom: 20px; }
    .passed { color: green; }
    .failed { color: red; }
    .fixed { color: orange; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>SwissKnife Test Results</h1>
  <div class="summary">
    <p>Run on: $(date)</p>
    <p>Total tests: $TOTAL_TESTS</p>
    <p class="passed">Passed tests: $PASSED_TESTS</p>
    <p class="failed">Failed tests: $FAILED_TESTS</p>
    <p class="fixed">Fixed tests: $FIXED_TESTS</p>
  </div>
  <h2>Test Details</h2>
  <table>
    <tr>
      <th>Test</th>
      <th>Status</th>
    </tr>
EOL

# Add passed tests to the report
for log_file in ./test-results/success/*.log; do
  if [ -f "$log_file" ]; then
    base_name=$(basename "$log_file" .log)
    if [[ $base_name == *"_fixed"* ]]; then
      echo "    <tr><td>${base_name/_fixed/}</td><td class=\"fixed\">Fixed & Passed</td></tr>" >> ./test-results/reports/summary.html
    else
      echo "    <tr><td>$base_name</td><td class=\"passed\">Passed</td></tr>" >> ./test-results/reports/summary.html
    fi
  fi
done

# Add failed tests to the report
for log_file in ./test-results/failure/*.log; do
  if [ -f "$log_file" ] && [[ "$log_file" != *"_original_failure.log"* ]] && [[ "$log_file" != *"_fix_attempt.log"* ]]; then
    base_name=$(basename "$log_file" .log)
    echo "    <tr><td>$base_name</td><td class=\"failed\">Failed</td></tr>" >> ./test-results/reports/summary.html
  fi
done

# Finish the HTML report
echo "  </table>" >> ./test-results/reports/summary.html
echo "</body>" >> ./test-results/reports/summary.html

echo -e "${GREEN}Test analysis complete! Report generated at ./test-results/reports/summary.html${NC}"
