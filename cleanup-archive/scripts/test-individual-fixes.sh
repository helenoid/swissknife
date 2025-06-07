#!/bin/bash
# Script to test the individual fixes for FibonacciHeap and ModelSelector
# This script focuses on minimal changes needed to pass tests

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Testing Individual Fixes =====${NC}"

# Test FibonacciHeap
echo -e "${YELLOW}Testing FibonacciHeap...${NC}"
npx jest --config=jest.unified.config.cjs test/unit/tasks/fibonacci-heap.test.ts --no-cache --testTimeout=60000

# Test ModelSelector
echo -e "${YELLOW}Testing ModelSelector...${NC}"
npx jest --config=jest.unified.config.cjs test/model_selector.test.tsx --no-cache --testTimeout=60000
