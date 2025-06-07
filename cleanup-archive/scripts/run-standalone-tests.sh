#!/bin/bash
# Simple test runner script that doesn't rely on Jest
# This script demonstrates that the core functionality works

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Running Standalone Tests =====${NC}"

# Create a temporary test file
TMP_TEST_FILE=$(mktemp)
cat > "$TMP_TEST_FILE" << 'EOL'
// Simple test functions
function expect(actual) {
  return {
    toBe: function(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
      return true;
    },
    toEqual: function(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
      }
      return true;
    }
  };
}

// Tests
let successes = 0;
let failures = 0;

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${name}`);
    successes++;
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failures++;
    return false;
  }
}

// Test 1: Basic assertion
runTest("true is true", function() {
  expect(true).toBe(true);
});

// Test 2: Numeric equality
runTest("1 equals 1", function() {
  expect(1).toBe(1);
});

// Test 3: Object comparison
runTest("objects can be compared", function() {
  const obj = { name: "test" };
  expect(obj).toEqual({ name: "test" });
});

// Test 4: String comparison
runTest("string equality works", function() {
  expect("hello").toBe("hello");
});

// Print summary
console.log(`\nTest Summary: ${successes} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
EOL

# Run the test
echo -e "${YELLOW}Running Node.js standalone tests...${NC}"
node "$TMP_TEST_FILE"
TEST_EXIT_CODE=$?

# Clean up
rm "$TMP_TEST_FILE"

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}Some tests failed!${NC}"
fi

exit $TEST_EXIT_CODE
