#!/bin/bash

# Colors for better visibility in output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SwissKnife Test Analysis Tool ===${NC}"
echo -e "${YELLOW}This tool analyzes test failures and categorizes them by error type${NC}"

# Create output directory if it doesn't exist
REPORT_DIR="test-analysis"
mkdir -p "$REPORT_DIR"

# Initialize categorized error files
ERROR_TYPES=(
  "expect_extend_missing"
  "module_not_found"
  "property_undefined"
  "timeout_errors"
  "type_errors"
  "other_errors"
)

# Initialize files
for type in "${ERROR_TYPES[@]}"; do
  echo -e "# Tests with ${type//_/ } errors\n" > "$REPORT_DIR/${type}.md"
done

# Find all test files
TEST_FILES=$(find ./test -type f -name "*.test.js" | sort)
TOTAL_TESTS=$(echo "$TEST_FILES" | wc -l)
COUNTER=0
PASSED=0
FAILED=0

echo -e "${YELLOW}Found $TOTAL_TESTS test files to analyze${NC}"

# Process each test file
for test_file in $TEST_FILES; do
  COUNTER=$((COUNTER + 1))
  filename=$(basename "$test_file")
  echo -e "${BLUE}[$COUNTER/$TOTAL_TESTS] Testing:${NC} $filename"

  # Run the test and capture output
  TEST_OUTPUT=$(NODE_OPTIONS="--no-warnings" npx jest "$test_file" --config=jest.unified.config.cjs 2>&1)
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo -e "- ✅ \`$filename\`" >> "$REPORT_DIR/passing_tests.md"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
    
    # Categorize error
    if echo "$TEST_OUTPUT" | grep -q "Cannot read properties of undefined (reading 'extend')"; then
      echo -e "- ❌ \`$filename\`: Missing expect.extend" >> "$REPORT_DIR/expect_extend_missing.md"
      echo "$TEST_OUTPUT" > "$REPORT_DIR/details/${filename%.test.js}_error.log"
    elif echo "$TEST_OUTPUT" | grep -q "Cannot find module"; then
      echo -e "- ❌ \`$filename\`: Module not found error" >> "$REPORT_DIR/module_not_found.md" 
      echo "$TEST_OUTPUT" > "$REPORT_DIR/details/${filename%.test.js}_error.log"
      # Extract the missing module
      MISSING_MODULE=$(echo "$TEST_OUTPUT" | grep "Cannot find module" | head -1 | sed -E "s/.*Cannot find module '([^']+)'.*/\1/")
      echo "  - Missing module: $MISSING_MODULE" >> "$REPORT_DIR/module_not_found.md"
    elif echo "$TEST_OUTPUT" | grep -q "Cannot read properties of undefined"; then
      echo -e "- ❌ \`$filename\`: Property of undefined error" >> "$REPORT_DIR/property_undefined.md"
      echo "$TEST_OUTPUT" > "$REPORT_DIR/details/${filename%.test.js}_error.log"
    elif echo "$TEST_OUTPUT" | grep -q "Timeout"; then
      echo -e "- ❌ \`$filename\`: Test timeout" >> "$REPORT_DIR/timeout_errors.md"
      echo "$TEST_OUTPUT" > "$REPORT_DIR/details/${filename%.test.js}_error.log"
    elif echo "$TEST_OUTPUT" | grep -q "TypeError"; then
      echo -e "- ❌ \`$filename\`: Type error" >> "$REPORT_DIR/type_errors.md"
      echo "$TEST_OUTPUT" > "$REPORT_DIR/details/${filename%.test.js}_error.log"
    else
      echo -e "- ❌ \`$filename\`: Other error" >> "$REPORT_DIR/other_errors.md"
      echo "$TEST_OUTPUT" > "$REPORT_DIR/details/${filename%.test.js}_error.log"
    fi
  fi
done

# Create summary report
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Total: $TOTAL_TESTS${NC}"

# Create summary file
echo "# SwissKnife Test Analysis Report" > "$REPORT_DIR/summary.md"
echo "Generated on: $(date)" >> "$REPORT_DIR/summary.md"
echo "" >> "$REPORT_DIR/summary.md"
echo "## Summary" >> "$REPORT_DIR/summary.md"
echo "- **Total Tests:** $TOTAL_TESTS" >> "$REPORT_DIR/summary.md"
echo "- **Passed:** $PASSED" >> "$REPORT_DIR/summary.md"
echo "- **Failed:** $FAILED" >> "$REPORT_DIR/summary.md"

echo -e "${YELLOW}Analysis complete! Reports generated in the $REPORT_DIR directory${NC}"
