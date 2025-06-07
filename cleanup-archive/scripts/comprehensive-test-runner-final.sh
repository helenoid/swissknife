#!/bin/bash
# Comprehensive test runner script for SwissKnife tests
# This script runs all the fixers and then executes specific tests

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SwissKnife Comprehensive Test Runner  ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Create results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="comprehensive-test-results-${TIMESTAMP}"
mkdir -p "$TEST_RESULTS_DIR"

# Step 1: Apply all fixes
echo -e "${CYAN}Step 1: Applying all fixes${NC}"

# Apply common fixes first
echo -e "${YELLOW}Running common fixes...${NC}"
./apply-common-fixes.sh

# Fix duplicate JS extensions 
echo -e "${YELLOW}Fixing duplicate JS extensions...${NC}"
./fix-duplicate-extensions.sh

# Fix test assertions
echo -e "${YELLOW}Fixing test assertions...${NC}"
./fix-test-assertions.sh

# Run specific test fixers
echo -e "${YELLOW}Running specialized test fixers...${NC}"
./fix-fibonacci-heap-test.sh
./fix-model-selector-test-extended.sh
./fix-mcp-tests.sh

# Step 2: Run specific tests
echo -e "${CYAN}Step 2: Running tests individually${NC}"

run_test() {
    local test_path=$1
    local test_name=$(basename "$test_path")
    echo -e "${YELLOW}Running $test_name...${NC}"
    
    # Run the test and capture output
    TEST_LOG_FILE="$TEST_RESULTS_DIR/$test_name.log"
    npx jest --config=jest.unified.config.cjs "$test_path" --no-coverage > "$TEST_LOG_FILE" 2>&1
    local exit_code=$?
    
    # Check if test was successful
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        echo "PASS" >> "$TEST_RESULTS_DIR/summary.txt"
        echo "$test_name: PASS" >> "$TEST_RESULTS_DIR/summary.txt"
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        echo "FAIL" >> "$TEST_RESULTS_DIR/summary.txt"
        echo "$test_name: FAIL" >> "$TEST_RESULTS_DIR/summary.txt"
        
        # Extract error message
        echo "Error summary:" >> "$TEST_RESULTS_DIR/summary.txt"
        grep -A 10 "Error:" "$TEST_LOG_FILE" >> "$TEST_RESULTS_DIR/summary.txt" 2>/dev/null
        echo "---------------------------------" >> "$TEST_RESULTS_DIR/summary.txt"
    fi
    
    return $exit_code
}

# Run the key tests
echo -e "${YELLOW}Running key tests individually...${NC}"

# Model and registry tests
run_test "test/unit/models/registry.test.ts"

# Task tests
run_test "test/unit/tasks/fibonacci-heap.test.ts"
run_test "test/unit/tasks/dag.test.ts"

# Component tests
run_test "test/model_selector.test.tsx"

# Service tests
run_test "test/simplified-execution-service.test.js"
run_test "test/mcp-minimal.test.js"

# Storage tests
run_test "test/simple-storage.test.js"
run_test "test/simple-registry.test.js"

# Step 3: Run a single test with verbose output for diagnostic
echo -e "${CYAN}Step 3: Running diagnostic test with verbose output${NC}"

echo -e "${YELLOW}Running diagnostic test for fibonacci-heap...${NC}"
npx jest --config=jest.unified.config.cjs "test/unit/tasks/fibonacci-heap.test.ts" --verbose > "$TEST_RESULTS_DIR/fibonacci-heap-verbose.log" 2>&1

echo -e "${YELLOW}Running diagnostic test for model_selector...${NC}"
npx jest --config=jest.unified.config.cjs "test/model_selector.test.tsx" --verbose > "$TEST_RESULTS_DIR/model_selector-verbose.log" 2>&1

# Step 4: Generate final report
echo -e "${CYAN}Step 4: Generating test report${NC}"

echo "SWISSKNIFE TEST REPORT" > "$TEST_RESULTS_DIR/REPORT.md"
echo "======================" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "Date: $(date)" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "## Test Summary" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "| Test | Status |" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "|------|--------|" >> "$TEST_RESULTS_DIR/REPORT.md"

# Generate report table
for f in "$TEST_RESULTS_DIR"/*.log; do
    test_name=$(basename "$f" .log)
    if grep -q "PASS" "$f"; then
        echo "| $test_name | ✅ PASS |" >> "$TEST_RESULTS_DIR/REPORT.md"
    else
        echo "| $test_name | ❌ FAIL |" >> "$TEST_RESULTS_DIR/REPORT.md"
    fi
done

echo "" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "## Details" >> "$TEST_RESULTS_DIR/REPORT.md"
echo "" >> "$TEST_RESULTS_DIR/REPORT.md"

# Add details for each test
for f in "$TEST_RESULTS_DIR"/*.log; do
    test_name=$(basename "$f" .log)
    echo "### $test_name" >> "$TEST_RESULTS_DIR/REPORT.md"
    echo "" >> "$TEST_RESULTS_DIR/REPORT.md"
    echo '```' >> "$TEST_RESULTS_DIR/REPORT.md"
    grep -A 5 "PASS\|FAIL" "$f" >> "$TEST_RESULTS_DIR/REPORT.md" 2>/dev/null
    echo '```' >> "$TEST_RESULTS_DIR/REPORT.md"
    echo "" >> "$TEST_RESULTS_DIR/REPORT.md"
done

echo -e "${GREEN}Test run complete!${NC}"
echo "Results are in: $TEST_RESULTS_DIR"
echo "Report: $TEST_RESULTS_DIR/REPORT.md"
