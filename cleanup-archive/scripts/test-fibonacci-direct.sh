#!/bin/bash
# Direct test for FibonacciHeap without using Jest
# This script tests the core functionality works

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Testing FibonacciHeap Directly =====${NC}"

# Create a temporary test file
TMP_TEST_FILE=$(mktemp)
cat > "$TMP_TEST_FILE" << 'EOL'
// Import the FibonacciHeap implementation
const fs = require('fs');
const path = require('path');

// Read the implementation file
const fibHeapPath = path.resolve(__dirname, 'src/tasks/scheduler/fibonacci-heap.js');
const fibHeapContent = fs.readFileSync(fibHeapPath, 'utf8');

// Create a module from the content
const fibHeapModule = new Function('module', 'exports', 'require', fibHeapContent);
const moduleObj = { exports: {} };
fibHeapModule(moduleObj, moduleObj.exports, require);
const { FibonacciHeap } = moduleObj.exports;

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
    },
    toBeNull: function() {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
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

// Test 1: Create empty heap
runTest("Empty heap has size 0", function() {
  const heap = new FibonacciHeap();
  expect(heap.size()).toBe(0);
  expect(heap.isEmpty()).toBe(true);
  expect(heap.findMin()).toBeNull();
});

// Test 2: Insert and find min
runTest("Insert and find min", function() {
  const heap = new FibonacciHeap();
  heap.insert(5, "value-5");
  expect(heap.size()).toBe(1);
  expect(heap.isEmpty()).toBe(false);
  expect(heap.findMin()).toBe("value-5");
  
  heap.insert(3, "value-3");
  expect(heap.size()).toBe(2);
  expect(heap.findMin()).toBe("value-3");
});

// Test 3: Extract min
runTest("Extract min returns values in order", function() {
  const heap = new FibonacciHeap();
  heap.insert(5, "value-5");
  heap.insert(3, "value-3");
  heap.insert(7, "value-7");
  
  expect(heap.extractMin()).toBe("value-3");
  expect(heap.extractMin()).toBe("value-5");
  expect(heap.extractMin()).toBe("value-7");
  expect(heap.isEmpty()).toBe(true);
});

// Print summary
console.log(`\nTest Summary: ${successes} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
EOL

# Run the test
echo -e "${YELLOW}Running direct FibonacciHeap tests...${NC}"
node "$TMP_TEST_FILE"
TEST_EXIT_CODE=$?

# Clean up
rm "$TMP_TEST_FILE"

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All FibonacciHeap tests passed successfully!${NC}"
else
  echo -e "${RED}Some FibonacciHeap tests failed!${NC}"
fi

exit $TEST_EXIT_CODE
