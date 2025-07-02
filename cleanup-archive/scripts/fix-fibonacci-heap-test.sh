#!/bin/bash
# Script to fix the FibonacciHeap test issues
# This script fixes import paths and other issues in the FibonacciHeap test

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Fixing FibonacciHeap Test =====${NC}"

# Fix import path in fibonacci-heap.test.ts
FIBONACCI_HEAP_TEST="./test/unit/tasks/fibonacci-heap.test.ts"
if [ -f "$FIBONACCI_HEAP_TEST" ]; then
  echo "Fixing import path in $FIBONACCI_HEAP_TEST"
  
  # Replace the relative import with the correct absolute path
  sed -i 's/import { FibonacciHeap, FibHeapNode } from '\''\.\.\/\.js'\'';/import { FibonacciHeap, FibHeapNode } from '\''\.\.\/\.\.\/\.\.\/src\/tasks\/scheduler\/fibonacci-heap\.js'\'';/' "$FIBONACCI_HEAP_TEST"
  
  # Fix any chai assertion styles if they still use .to.be
  sed -i 's/expect(\(.*\))\.to\.be\.true;/expect(\1).toBe(true);/g' "$FIBONACCI_HEAP_TEST"
  sed -i 's/expect(\(.*\))\.to\.be\.false;/expect(\1).toBe(false);/g' "$FIBONACCI_HEAP_TEST"
  sed -i 's/expect(\(.*\))\.to\.be\.null;/expect(\1).toBeNull();/g' "$FIBONACCI_HEAP_TEST"
  sed -i 's/expect(\(.*\))\.to\.equal(\(.*\));/expect(\1).toBe(\2);/g' "$FIBONACCI_HEAP_TEST"
  
  echo -e "${GREEN}Fixed FibonacciHeap test successfully${NC}"
else
  echo -e "${RED}Could not find FibonacciHeap test file${NC}"
fi

# Fix export of FibHeapNode in fibonacci-heap.js
FIBONACCI_HEAP_FILE="./src/tasks/scheduler/fibonacci-heap.js"
if [ -f "$FIBONACCI_HEAP_FILE" ]; then
  echo "Adding FibHeapNode export to $FIBONACCI_HEAP_FILE"
  
  # Add export for FibHeapNode if it doesn't exist
  if ! grep -q "export { .* as FibHeapNode }" "$FIBONACCI_HEAP_FILE"; then
    # Add the export after the createNode function
    sed -i '/function createNode/a\
export { createNode as FibHeapNode };' "$FIBONACCI_HEAP_FILE"
  fi
  
  echo -e "${GREEN}Fixed FibonacciHeap implementation exports${NC}"
else
  echo -e "${RED}Could not find FibonacciHeap implementation file${NC}"
fi

echo -e "${GREEN}FibonacciHeap test fixes applied successfully!${NC}"
