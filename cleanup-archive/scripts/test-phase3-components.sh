#!/bin/bash

# Phase 3 Components Test Script
echo "Testing Phase 3 Components"
echo "=========================="

# Set colors for better output
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

# Error counter
ERRORS=0

# Test each component individually
test_component() {
  component=$1
  testfile=$2
  echo -e "${YELLOW}Testing $component...${NC}"
  
  npx jest "$testfile" --config=fixed.phase3.config.cjs -t "$component" --verbose
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $component tests passed${NC}"
    echo ""
    return 0
  else
    echo -e "${RED}✗ $component tests failed${NC}"
    echo ""
    ((ERRORS++))
    return 1
  fi
}

# Unit Test Components
echo -e "${BLUE}Running Unit Tests${NC}"
echo "------------------"
test_component "Fibonacci Heap Scheduler" "test/unit/phase3/components.test.js"
test_component "Graph of Thought" "test/unit/phase3/components.test.js"
test_component "Merkle Clock Coordination" "test/unit/phase3/components.test.js"
test_component "Task Decomposition & Synthesis" "test/unit/phase3/components.test.js"

# Integration Test Scenarios
echo -e "${BLUE}Running Integration Tests${NC}"
echo "----------------------"
test_component "Task Decomposition, Scheduling, and Synthesis Workflow" "test/integration/phase3/integration.test.js"
test_component "Merkle Clock Coordination with Task Processing" "test/integration/phase3/integration.test.js"

# Summary
echo -e "${BLUE}Test Summary${NC}"
echo "------------"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}All Phase 3 component tests passed!${NC}"
  exit 0
else
  echo -e "${RED}$ERRORS component tests failed.${NC}"
  exit 1
fi
