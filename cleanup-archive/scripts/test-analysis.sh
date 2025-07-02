#!/bin/bash
# test-analysis.sh - Comprehensive test analysis and diagnosis

echo "=========================================="
echo "SwissKnife Test Analysis & Diagnosis"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Phase 1: Test File Inventory${NC}"
echo "--------------------------------------"

# Count test files by type
echo "Test file count by type:"
echo -n "JavaScript (.js): "
find test/unit -name "*.test.js" | wc -l
echo -n "TypeScript (.ts): "
find test/unit -name "*.test.ts" | wc -l
echo -n "JSX (.jsx): "
find test/unit -name "*.test.jsx" | wc -l
echo -n "TSX (.tsx): "
find test/unit -name "*.test.tsx" | wc -l

echo
echo -e "${BLUE}Phase 2: Test File Structure Analysis${NC}"
echo "--------------------------------------"

# Analyze test files for common issues
echo "Analyzing test files for common issues..."

# Check for import issues
echo
echo -e "${YELLOW}Files with potential import issues:${NC}"
grep -l "\.js\.js\|\.ts\.ts" test/unit/**/*.test.* 2>/dev/null | head -10

# Check for chai usage
echo
echo -e "${YELLOW}Files using Chai assertions:${NC}"
grep -l "expect.*to\." test/unit/**/*.test.* 2>/dev/null | head -10

# Check for jest mocking
echo
echo -e "${YELLOW}Files using Jest mocks:${NC}"
grep -l "jest\.mock\|jest\.fn" test/unit/**/*.test.* 2>/dev/null | head -10

echo
echo -e "${BLUE}Phase 3: Test Categories Analysis${NC}"
echo "--------------------------------------"

echo "Test files by category:"
echo -n "CLI tests: "
find test/unit/cli -name "*.test.*" | wc -l
echo -n "Worker tests: "
find test/unit/workers -name "*.test.*" | wc -l
echo -n "Utility tests: "
find test/unit/utils -name "*.test.*" | wc -l
echo -n "Model tests: "
find test/unit/models -name "*.test.*" | wc -l
echo -n "Command tests: "
find test/unit/commands -name "*.test.*" | wc -l
echo -n "Service tests: "
find test/unit/services -name "*.test.*" | wc -l

echo
echo -e "${BLUE}Phase 4: Configuration Analysis${NC}"
echo "--------------------------------------"

echo "Jest configuration files found:"
ls -1 jest*.config.* 2>/dev/null | head -10

echo
echo "Setup files found:"
ls -1 test/*setup* 2>/dev/null

echo
echo -e "${BLUE}Phase 5: Known Working Tests${NC}"
echo "--------------------------------------"

echo "Tests that should be working:"
echo "- test/unit/minimal.test.js"
echo "- test/unit/workers/basic-worker.test.js"
echo "- test/unit/workers/simple-worker-pool.test.js"
echo "- test/unit/cli/chat-simple.test.js"
echo "- test/unit/utils/logging/simple-manager.test.js"
echo "- test/unit/utils/errors/self-contained-fixed.test.js"
echo "- test/unit/utils/cache/manager.test.ts"

echo
echo -e "${GREEN}Analysis Complete!${NC}"
echo "Next steps:"
echo "1. Create diagnostic tests for each category"
echo "2. Fix import issues systematically"
echo "3. Standardize assertion styles"
echo "4. Run tests in batches by category"
