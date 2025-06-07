#!/bin/bash
# Master direct test script
# This script runs direct tests for key components without using Jest

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SwissKnife Direct Test Runner             ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Create test results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="direct-test-results-${TIMESTAMP}"
mkdir -p "$TEST_RESULTS_DIR"

# Function to run tests
run_component_test() {
    local component=$1
    local source_file=$2
    local test_name="test-${component}"
    local test_file="${TEST_RESULTS_DIR}/${test_name}.js"
    local log_file="${TEST_RESULTS_DIR}/${test_name}.log"
    
    echo -e "${CYAN}Testing ${component}...${NC}"
    
    # Create test file
    create_${component}_test "$test_file" "$source_file"
    
    # Run test
    echo "Running node $test_file > $log_file"
    node "$test_file" > "$log_file" 2>&1
    local exit_code=$?
    
    # Check result
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ ${component} tests passed${NC}"
    else
        echo -e "${RED}❌ ${component} tests failed${NC}"
        cat "$log_file"
    fi
    
    return $exit_code
}

# Create FibonacciHeap test
create_fibonacci_heap_test() {
    local test_file=$1
    local source_file=$2
    
    cat > "$test_file" << 'EOL'
// Test for FibonacciHeap
const fs = require('fs');
const path = require('path');

// Read the implementation file
const fibHeapPath = path.resolve(__dirname, '../src/tasks/scheduler/fibonacci-heap.js');
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
}

# Create DAG test
create_dag_test() {
    local test_file=$1
    local source_file=$2
    
    cat > "$test_file" << 'EOL'
// Test for DirectedAcyclicGraph
const fs = require('fs');
const path = require('path');

// Read the implementation file
const dagPath = path.resolve(__dirname, '../src/tasks/graph/dag.js');
const dagContent = fs.readFileSync(dagPath, 'utf8');

// Create a module from the content
const dagModule = new Function('module', 'exports', 'require', dagContent);
const moduleObj = { exports: {} };
dagModule(moduleObj, moduleObj.exports, require);
const { DirectedAcyclicGraph } = moduleObj.exports;

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
    },
    toContain: function(expected) {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${expected}`);
        }
      } else if (actual instanceof Set) {
        if (!actual.has(expected)) {
          throw new Error(`Expected Set ${Array.from(actual)} to contain ${expected}`);
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
      } else {
        throw new Error(`Cannot check if ${typeof actual} contains ${expected}`);
      }
      return true;
    },
    toBeDefined: function() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
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

// Test 1: Create empty DAG
runTest("Create empty DAG", function() {
  const dag = new DirectedAcyclicGraph();
  expect(dag.nodes.size).toBe(0);
});

// Test 2: Add nodes
runTest("Add nodes to DAG", function() {
  const dag = new DirectedAcyclicGraph();
  dag.addNode("A", { value: "Node A" });
  dag.addNode("B", { value: "Node B" });
  
  expect(dag.nodes.size).toBe(2);
  expect(dag.nodes.has("A")).toBe(true);
  expect(dag.nodes.has("B")).toBe(true);
});

// Test 3: Add edges
runTest("Add edges between nodes", function() {
  const dag = new DirectedAcyclicGraph();
  dag.addNode("A", { value: "Node A" });
  dag.addNode("B", { value: "Node B" });
  dag.addNode("C", { value: "Node C" });
  
  dag.addEdge("A", "B");
  dag.addEdge("B", "C");
  
  const nodeA = dag.nodes.get("A");
  const nodeB = dag.nodes.get("B");
  const nodeC = dag.nodes.get("C");
  
  expect(nodeA.successors.has("B")).toBe(true);
  expect(nodeB.predecessors.has("A")).toBe(true);
  expect(nodeB.successors.has("C")).toBe(true);
  expect(nodeC.predecessors.has("B")).toBe(true);
});

// Test 4: Get node data
runTest("Get node data", function() {
  const dag = new DirectedAcyclicGraph();
  dag.addNode("A", { value: "Node A" });
  
  const nodeData = dag.getNode("A");
  expect(nodeData).toEqual({ value: "Node A" });
});

// Test 5: Get successors and predecessors
runTest("Get successors and predecessors", function() {
  const dag = new DirectedAcyclicGraph();
  dag.addNode("A", {});
  dag.addNode("B", {});
  dag.addNode("C", {});
  
  dag.addEdge("A", "B");
  dag.addEdge("A", "C");
  
  const successors = dag.getSuccessors("A");
  expect(successors).toBeDefined();
  expect(successors.has("B")).toBe(true);
  expect(successors.has("C")).toBe(true);
  
  const predecessors = dag.getPredecessors("B");
  expect(predecessors).toBeDefined();
  expect(predecessors.has("A")).toBe(true);
});

// Print summary
console.log(`\nTest Summary: ${successes} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
EOL
}

# Run the tests
run_component_test "fibonacci_heap" "src/tasks/scheduler/fibonacci-heap.js"
FIBONACCI_RESULT=$?

run_component_test "dag" "src/tasks/graph/dag.js"
DAG_RESULT=$?

# Report overall results
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Test Results Summary                      ${NC}"
echo -e "${BLUE}=============================================${NC}"

if [ $FIBONACCI_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ FibonacciHeap: PASSED${NC}"
else
    echo -e "${RED}❌ FibonacciHeap: FAILED${NC}"
fi

if [ $DAG_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ DirectedAcyclicGraph: PASSED${NC}"
else
    echo -e "${RED}❌ DirectedAcyclicGraph: FAILED${NC}"
fi

# Overall result
if [ $FIBONACCI_RESULT -eq 0 ] && [ $DAG_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}All direct tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Check logs in ${TEST_RESULTS_DIR} for details.${NC}"
    exit 1
fi
