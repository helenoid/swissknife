#!/bin/bash
# Master script to fix and run SwissKnife tests
# This script runs all the fixers and then runs the tests

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SwissKnife Test Fixer and Runner - Master  ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Step 1: Apply common fixes
echo -e "${CYAN}Step 1: Applying common fixes to imports and implementations${NC}"
./apply-common-fixes.sh

# Step 2: Fix duplicate JS extensions
echo -e "${CYAN}Step 2: Fixing duplicate JS extensions in imports${NC}"
./fix-duplicate-extensions.sh

# Step 3: Fix test assertions
echo -e "${CYAN}Step 3: Fixing test assertion compatibility${NC}"
./fix-test-assertions.sh

# Step 4: Fix ModelSelector test
echo -e "${CYAN}Step 4: Fixing ModelSelector test${NC}"
./fix-model-selector-test.sh

# Step 5: Fix MCP tests
echo -e "${CYAN}Step 5: Fixing MCP-related tests${NC}"
./fix-mcp-tests.sh

# Step 5: Run the tests
echo -e "${CYAN}Step 5: Running the fixed tests${NC}"

# Create test results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="test-results-${TIMESTAMP}"
mkdir -p "$TEST_RESULTS_DIR"

run_test() {
    local test_path=$1
    local test_name=$(basename "$test_path")
    echo -e "${YELLOW}Running $test_name...${NC}"
    
    # Run the test and capture output and exit code
    npx jest --config=jest.unified.config.cjs "$test_path" --no-coverage > "$TEST_RESULTS_DIR/$test_name.log" 2>&1
    local exit_code=$?
    
    # Check if test was successful
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        echo "See $TEST_RESULTS_DIR/$test_name.log for details"
    fi
    
    return $exit_code
}

# Run basic data structure tests
echo -e "${YELLOW}Running data structure tests...${NC}"
run_test "test/unit/tasks/fibonacci-heap.test.ts"
run_test "test/unit/tasks/dag.test.ts"

# Run component tests
echo -e "${YELLOW}Running UI component tests...${NC}"
run_test "test/model_selector.test.tsx"

# Run service tests
echo -e "${YELLOW}Running service tests...${NC}"
run_test "test/simplified-execution-service.test.js"

# Run MCP tests
echo -e "${YELLOW}Running MCP tests...${NC}"
run_test "test/mcp-minimal.test.js"

# Run storage tests
echo -e "${YELLOW}Running storage tests...${NC}"
run_test "test/simple-storage.test.js"

# Run registry tests
echo -e "${YELLOW}Running registry tests...${NC}"
run_test "test/simple-registry.test.js"

echo -e "${GREEN}All tests executed - check $TEST_RESULTS_DIR for results${NC}"
echo "Test summary:"
echo "----------------------------------------"
grep -r --include="*.log" "PASS\|FAIL" "$TEST_RESULTS_DIR" | sort
echo "----------------------------------------"
echo -e "${BLUE}You can run more tests with:${NC}"
echo "npx jest --config=jest.unified.config.cjs test/path/to/test --no-coverage"
