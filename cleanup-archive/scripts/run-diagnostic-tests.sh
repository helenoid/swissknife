#!/bin/bash
# A test runner that creates a detailed test report for diagnostic purposes

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Store output in a report file
REPORT_FILE="test-reports/detailed-test-report.md"
mkdir -p test-reports

echo "# SwissKnife Test Report" > $REPORT_FILE
echo "Generated: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Function to run a test and log results
run_test() {
  local test_file="$1"
  local config_file="$2"
  local label="$3"
  
  echo -e "${BLUE}Running test: ${test_file}${RESET}"
  
  echo "## ${label}" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "Test File: \`${test_file}\`" >> $REPORT_FILE
  echo "Config: \`${config_file}\`" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  # Print test file content
  echo "### Test File Content" >> $REPORT_FILE
  echo "```javascript" >> $REPORT_FILE
  cat "$test_file" >> $REPORT_FILE
  echo "```" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  # Run the test and capture output and return code
  echo "### Test Output" >> $REPORT_FILE
  echo "```" >> $REPORT_FILE
  
  npx jest "$test_file" --config="$config_file" > >(tee -a /tmp/test_output) 2>&1
  local result=$?
  
  cat /tmp/test_output >> $REPORT_FILE
  rm -f /tmp/test_output
  
  echo "```" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  # Report result
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ PASS: ${test_file}${RESET}"
    echo "**Status: ✅ PASSED**" >> $REPORT_FILE
  else
    echo -e "${RED}✗ FAIL: ${test_file}${RESET}"
    echo "**Status: ❌ FAILED**" >> $REPORT_FILE
  fi
  echo "" >> $REPORT_FILE
  
  return $result
}

# Create a fresh, minimal test file that should definitely work
echo -e "${YELLOW}Creating a fresh minimal test file...${RESET}"

cat > test/fresh-minimal.test.js << 'EOF'
/**
 * Fresh minimal test that should definitely work
 */

// Import Jest's expect
const expect = require('expect');

// Basic tests
test('basic addition', () => {
  expect(1 + 1).toBe(2);
});

test('basic string comparison', () => {
  expect('hello').toBe('hello');
});

// Group of tests
describe('Math operations', () => {
  test('multiplication works', () => {
    expect(2 * 3).toBe(6);
  });
  
  test('subtraction works', () => {
    expect(5 - 2).toBe(3); 
  });
});
EOF

echo -e "${YELLOW}Creating a copy of the working basic.test.js file...${RESET}"
cp test/basic.test.js test/basic-copy.test.js

# Run tests
echo -e "${YELLOW}Running tests to diagnose issues...${RESET}"

# Working test - baseline
run_test "test/basic.test.js" "jest-super-minimal.config.cjs" "Basic Working Test"

# Fresh minimal test
run_test "test/fresh-minimal.test.js" "jest-super-minimal.config.cjs" "Fresh Minimal Test"

# Copy of working test
run_test "test/basic-copy.test.js" "jest-super-minimal.config.cjs" "Copy of Working Test"

echo -e "${GREEN}Tests complete. Report saved to: ${REPORT_FILE}${RESET}"
echo "Check this report to understand why some tests are passing and others are failing."
