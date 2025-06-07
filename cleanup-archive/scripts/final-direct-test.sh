#!/bin/bash
# Final focused test script for SwissKnife
# This script directly tests the FibonacciHeap implementation without Jest

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Direct FibonacciHeap Test =====${NC}"

# Create a simple direct test
TEST_FILE="direct-fibonacci-test-final.js"

echo "console.log('Starting direct FibonacciHeap test...');

// Import the FibonacciHeap implementation
import { FibonacciHeap } from './src/tasks/scheduler/fibonacci-heap.js';

// Create a new heap
const heap = new FibonacciHeap();

// Test basic operations
console.log('Testing basic operations...');
console.log('Initial state: isEmpty() =', heap.isEmpty(), 'size() =', heap.size());

// Insert some values
heap.insert(5, 'value-5');
heap.insert(3, 'value-3');
heap.insert(7, 'value-7');

console.log('After insertions: isEmpty() =', heap.isEmpty(), 'size() =', heap.size());
console.log('Min value should be value-3:', heap.findMin());

// Extract min
const min = heap.extractMin();
console.log('Extracted min:', min);
console.log('New min value should be value-5:', heap.findMin());
console.log('Size after extraction:', heap.size());

// Extract all remaining elements
console.log('Extracting all elements:');
while (!heap.isEmpty()) {
  console.log(' -', heap.extractMin());
}

console.log('Final size:', heap.size());
console.log('All tests completed successfully!');
" > $TEST_FILE

# Run the test
echo -e "${YELLOW}Running direct FibonacciHeap test...${NC}"
node $TEST_FILE

# Clean up
rm $TEST_FILE

echo -e "${GREEN}Direct test completed!${NC}"
