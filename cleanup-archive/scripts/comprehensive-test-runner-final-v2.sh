#!/bin/bash

# Comprehensive test runner for SwissKnife project
# This script runs tests systematically across different modules

set -e

echo "=== SwissKnife Comprehensive Test Runner ==="
echo "Running all fixed and working tests..."

cd /home/barberb/swissknife

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
PASSED_SUITES=0
FAILED_SUITES=0
TOTAL_TESTS=0

run_test_suite() {
    local test_path="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Path: $test_path"
    
    if timeout 30 npx jest "$test_path" --config=jest-fixed.config.cjs --silent --forceExit >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED_SUITES++))
        
        # Get test count by running again with minimal output
        local test_output=$(timeout 30 npx jest "$test_path" --config=jest-fixed.config.cjs --silent --forceExit 2>/dev/null | tail -5)
        local test_count=$(echo "$test_output" | grep -o '[0-9]* passed' | head -1 | cut -d' ' -f1 || echo "0")
        if [[ "$test_count" =~ ^[0-9]+$ ]] && [[ "$test_count" -gt 0 ]]; then
            TOTAL_TESTS=$((TOTAL_TESTS + test_count))
            echo "  → $test_count tests passed"
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED_SUITES++))
    fi
}

echo -e "\n=== CORE UTILITY MODULES ==="

# Successfully fixed tests
run_test_suite "test/unit/utils/logging/simple-manager.test.js" "Logging Manager"
run_test_suite "test/unit/utils/errors/error-handling.test.ts" "Error Handling System"
run_test_suite "test/unit/utils/errors/self-contained-fixed.test.js" "Error Handling (Self-contained)"
run_test_suite "test/unit/utils/cache/manager.test.ts" "Cache Manager"

echo -e "\n=== ADDITIONAL UTILITY MODULES ==="

# Test other utility modules
run_test_suite "test/unit/utils/events/event-bus.test.ts" "Event Bus"
run_test_suite "test/unit/config/manager.test.js" "Configuration Manager"

echo -e "\n=== CLI MODULES ==="

# Test CLI modules
run_test_suite "test/unit/cli/chat.test.ts" "CLI Chat Command"
run_test_suite "test/unit/cli/releaseCommand.test.ts" "CLI Release Command"

echo -e "\n=== WORKER MODULES ==="

# Test worker modules
run_test_suite "test/unit/workers/pool.test.ts" "Worker Pool"
run_test_suite "test/unit/workers/worker-pool.test.ts" "Worker Pool (Alternative)"

echo -e "\n=== ALGORITHM MODULES ==="

# Test algorithm implementations
run_test_suite "test/unit/phase3/fibonacci-heap.test.js" "Fibonacci Heap Algorithm"

echo -e "\n=== PACKAGE/RELEASE MODULES ==="

# Test packaging and release modules
run_test_suite "test/unit/release/packager.test.ts" "Release Packager"

echo -e "\n=== SUMMARY ==="
echo "Test Suites Passed: $PASSED_SUITES"
echo "Test Suites Failed: $FAILED_SUITES"
echo "Total Test Suites: $((PASSED_SUITES + FAILED_SUITES))"
echo "Total Tests Passed: $TOTAL_TESTS"

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TEST SUITES PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some test suites failed. See details above.${NC}"
    exit 1
fi
