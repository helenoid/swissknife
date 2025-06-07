#!/bin/bash
# Final test runner for SwissKnife
# This script runs all the fixed tests and generates a comprehensive report

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SwissKnife Final Test Runner  ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Create results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="final-test-results-${TIMESTAMP}"
mkdir -p "$TEST_RESULTS_DIR"

# Create a table for the report
echo "# SwissKnife Test Report" > "$TEST_RESULTS_DIR/final-report.md"
echo "Generated: $(date)" >> "$TEST_RESULTS_DIR/final-report.md"
echo "" >> "$TEST_RESULTS_DIR/final-report.md"
echo "## Test Results" >> "$TEST_RESULTS_DIR/final-report.md"
echo "" >> "$TEST_RESULTS_DIR/final-report.md"
echo "| Test | Status | Duration | Notes |" >> "$TEST_RESULTS_DIR/final-report.md"
echo "|------|--------|----------|-------|" >> "$TEST_RESULTS_DIR/final-report.md"

# Function to run a test and update the report
run_test() {
    local test_path=$1
    local test_name=$(basename "$test_path")
    local test_dir=$(dirname "$test_path")
    echo -e "${YELLOW}Running $test_name...${NC}"
    
    # Create log file
    local log_file="$TEST_RESULTS_DIR/${test_name}.log"
    
    # Run the test and time it
    START_TIME=$(date +%s)
    npx jest --config=jest.unified.config.cjs "$test_path" --no-cache > "$log_file" 2>&1
    local exit_code=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Add to report
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name passed (${DURATION}s)${NC}"
        echo "| $test_path | ✅ PASS | ${DURATION}s | |" >> "$TEST_RESULTS_DIR/final-report.md"
    else
        echo -e "${RED}❌ $test_name failed (${DURATION}s)${NC}"
        # Extract error message
        local error_msg=$(grep -A 3 "Error:" "$log_file" | head -n 1 | sed 's/.*Error: //')
        echo "| $test_path | ❌ FAIL | ${DURATION}s | $error_msg |" >> "$TEST_RESULTS_DIR/final-report.md"
    fi
    
    return $exit_code
}

# Run all fixed tests
echo -e "${CYAN}Running fixed tests...${NC}"

# List of tests to run
TESTS=(
    "test/unit/tasks/fibonacci-heap.test.ts"
    "test/model_selector.test.tsx"
    "test/unit/models/registry.test.ts"
    "test/simplified-execution-service.test.js"
    "test/mcp-minimal.test.js"
    "test/simple-storage.test.js"
    "test/simple-registry.test.js"
)

# Run each test
PASSED=0
FAILED=0
for test_path in "${TESTS[@]}"; do
    run_test "$test_path"
    if [ $? -eq 0 ]; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

# Add summary to report
echo "" >> "$TEST_RESULTS_DIR/final-report.md"
echo "## Summary" >> "$TEST_RESULTS_DIR/final-report.md"
echo "" >> "$TEST_RESULTS_DIR/final-report.md"
echo "- Total tests: $((PASSED + FAILED))" >> "$TEST_RESULTS_DIR/final-report.md"
echo "- Passed: $PASSED" >> "$TEST_RESULTS_DIR/final-report.md"
echo "- Failed: $FAILED" >> "$TEST_RESULTS_DIR/final-report.md"
echo "" >> "$TEST_RESULTS_DIR/final-report.md"

# Add main issues section
echo "## Main Issues Fixed" >> "$TEST_RESULTS_DIR/final-report.md"
echo "" >> "$TEST_RESULTS_DIR/final-report.md"
echo "1. **Module Resolution**: Fixed paths in imports to correctly use .js extensions" >> "$TEST_RESULTS_DIR/final-report.md"
echo "2. **TypeScript/JavaScript Compatibility**: Ensured proper exports and implementations" >> "$TEST_RESULTS_DIR/final-report.md"
echo "3. **React/Ink Component Testing**: Created comprehensive mocks for UI components" >> "$TEST_RESULTS_DIR/final-report.md"
echo "4. **Assertion Styles**: Standardized assertions between Chai and Jest styles" >> "$TEST_RESULTS_DIR/final-report.md"
echo "5. **ESM/CommonJS Compatibility**: Created a unified Jest configuration" >> "$TEST_RESULTS_DIR/final-report.md"
echo "" >> "$TEST_RESULTS_DIR/final-report.md"

# Print summary
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Test Summary  ${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "See $TEST_RESULTS_DIR/final-report.md for details"

# Create a final fix script that combines all fixes
FINAL_FIX_SCRIPT="$TEST_RESULTS_DIR/apply-all-fixes.sh"
echo "#!/bin/bash" > "$FINAL_FIX_SCRIPT"
echo "# Master script to apply all fixes" >> "$FINAL_FIX_SCRIPT"
echo "" >> "$FINAL_FIX_SCRIPT"
echo "# Apply common fixes" >> "$FINAL_FIX_SCRIPT"
echo "./apply-common-fixes.sh" >> "$FINAL_FIX_SCRIPT"
echo "" >> "$FINAL_FIX_SCRIPT"
echo "# Fix duplicate extensions" >> "$FINAL_FIX_SCRIPT"
echo "./fix-duplicate-extensions.sh" >> "$FINAL_FIX_SCRIPT"
echo "" >> "$FINAL_FIX_SCRIPT"
echo "# Fix specific components" >> "$FINAL_FIX_SCRIPT"
echo "./final-fibonacci-heap-fix.sh" >> "$FINAL_FIX_SCRIPT"
echo "./final-model-selector-fix.sh" >> "$FINAL_FIX_SCRIPT"
echo "" >> "$FINAL_FIX_SCRIPT"
echo "# Run tests" >> "$FINAL_FIX_SCRIPT"
echo "./final-test-runner.sh" >> "$FINAL_FIX_SCRIPT"
echo "" >> "$FINAL_FIX_SCRIPT"

chmod +x "$FINAL_FIX_SCRIPT"
echo -e "${GREEN}Created master fix script: $FINAL_FIX_SCRIPT${NC}"
