#!/bin/bash
# test-sweeper.sh
# Runs tests in sequence and identifies which ones pass and fail

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Sweeper${RESET}"
echo -e "${BLUE}=====================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-sweep-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/logs"
mkdir -p "$RESULTS_DIR/reports"

# Parse command line arguments
MODE="${1:-sequential}"
if [ "$MODE" = "help" ] || [ "$MODE" = "--help" ] || [ "$MODE" = "-h" ]; then
  echo -e "${CYAN}Usage:${RESET}"
  echo -e "  ./test-sweeper.sh [mode] [pattern]"
  echo -e ""
  echo -e "${CYAN}Modes:${RESET}"
  echo -e "  sequential - Run tests one by one (default)"
  echo -e "  category   - Run tests by category"
  echo -e "  parallel   - Run tests in parallel (use with caution)"
  echo -e ""
  echo -e "${CYAN}Pattern:${RESET}"
  echo -e "  Optional regex pattern to match test files"
  echo -e "  Example: ./test-sweeper.sh sequential \"error|event\""
  exit 0
fi

PATTERN="${2:-.*}"
echo -e "${YELLOW}Running in ${MODE} mode, pattern: ${PATTERN}${RESET}"

# Find all test files
echo -e "${BLUE}Finding test files...${RESET}"

TEST_FILES=$(find test -path "*/unit/*" -name "*.test.js" -o -path "*/unit/*" -name "*.test.ts" | grep -E "$PATTERN" | sort)
TEST_COUNT=$(echo "$TEST_FILES" | wc -l)

if [ "$TEST_COUNT" -eq 0 ]; then
  echo -e "${RED}No test files found matching the pattern: $PATTERN${RESET}"
  exit 1
fi

echo -e "${GREEN}Found ${TEST_COUNT} test files to run${RESET}"

# Function to run a single test file
run_test_file() {
  local file=$1
  local log_file="$RESULTS_DIR/logs/$(echo "$file" | tr '/' '-').log"
  
  echo -e "  Running test: ${YELLOW}$file${RESET}"
  npx jest "$file" --config=jest.unified.config.cjs > "$log_file" 2>&1
  local test_status=$?
  
  if [ $test_status -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASSED!${RESET}"
    echo "$file" >> "$RESULTS_DIR/passing.txt"
    return 0
  else
    echo -e "  ${RED}✗ FAILED!${RESET}"
    echo "$file" >> "$RESULTS_DIR/failing.txt"
    
    # Extract error information
    echo "=== $file ===" >> "$RESULTS_DIR/errors.txt"
    grep -A 5 -B 2 "Error:" "$log_file" | head -20 >> "$RESULTS_DIR/errors.txt"
    echo -e "\n\n" >> "$RESULTS_DIR/errors.txt"
    
    return 1
  fi
}

# Function to run tests by category
run_category() {
  local category=$1
  local pattern=$2
  local description=$3
  local output_file="$RESULTS_DIR/logs/category-$category.log"
  
  echo -e "\n${CYAN}Running $description tests...${RESET}"
  npx jest "$pattern" --config=jest.unified.config.cjs > "$output_file" 2>&1
  local test_status=$?
  
  if [ $test_status -eq 0 ]; then
    echo -e "${GREEN}✓ All $description tests passed!${RESET}"
    echo "$category: PASS" >> "$RESULTS_DIR/categories-passing.txt"
    return 0
  else
    echo -e "${RED}✗ Some $description tests failed!${RESET}"
    echo "$category: FAIL" >> "$RESULTS_DIR/categories-failing.txt"
    
    # Extract error information
    echo "=== $description ===" >> "$RESULTS_DIR/category-errors.txt"
    grep -A 5 -B 2 "Error:" "$output_file" | head -20 >> "$RESULTS_DIR/category-errors.txt"
    echo -e "\n\n" >> "$RESULTS_DIR/category-errors.txt"
    
    return 1
  fi
}

if [ "$MODE" = "sequential" ]; then
  # Run tests one by one
  PASSED=0
  FAILED=0
  current=0
  
  echo -e "\n${BLUE}Running tests sequentially...${RESET}"
  echo "$TEST_FILES" | while read -r file; do
    if [ -z "$file" ]; then continue; fi
    
    current=$((current + 1))
    echo -e "\n${CYAN}[$current/$TEST_COUNT] Testing: $file${RESET}"
    
    run_test_file "$file"
    if [ $? -eq 0 ]; then
      PASSED=$((PASSED + 1))
    else
      FAILED=$((FAILED + 1))
    fi
  done
  
elif [ "$MODE" = "category" ]; then
  # Define test categories
  declare -A categories=(
    ["utils-errors"]="test/unit/utils/errors"
    ["utils-events"]="test/unit/utils/events"
    ["utils-cache"]="test/unit/utils/cache"
    ["models"]="test/unit/models"
    ["commands"]="test/unit/commands"
    ["workers"]="test/unit/workers"
    ["ai"]="test/unit/ai"
    ["mcp"]="test/unit/mcp-server"
    ["tasks"]="test/unit/tasks"
    ["services"]="test/unit/services"
    ["integration"]="test/unit/integration"
  )
  
  PASSED=0
  FAILED=0
  
  # Run tests by category
  for category in "${!categories[@]}"; do
    pattern="${categories[$category]}"
    description=$(echo $category | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g') # Capitalize words
    
    run_category "$category" "$pattern" "$description"
    if [ $? -eq 0 ]; then
      PASSED=$((PASSED + 1))
    else
      FAILED=$((FAILED + 1))
    fi
  done
  
else
  # Run tests in parallel (with limited concurrency)
  echo -e "\n${BLUE}Running tests in parallel...${RESET}"
  echo -e "${YELLOW}Warning: Parallel execution may cause test interference!${RESET}"
  
  MAX_PARALLEL=${MAX_PARALLEL:-4}
  echo -e "Using max parallel jobs: ${MAX_PARALLEL}"
  
  # Use GNU Parallel if available
  if command -v parallel &> /dev/null; then
    echo "$TEST_FILES" | parallel --jobs $MAX_PARALLEL --joblog "$RESULTS_DIR/parallel.log" "echo -e \"\\n${CYAN}Testing: {}${RESET}\" && npx jest {} --config=jest.unified.config.cjs > \"$RESULTS_DIR/logs/\$(echo {} | tr '/' '-').log\" 2>&1 && echo -e \"  ${GREEN}✓ PASSED: {}${RESET}\" && echo {} >> \"$RESULTS_DIR/passing.txt\" || (echo -e \"  ${RED}✗ FAILED: {}${RESET}\" && echo {} >> \"$RESULTS_DIR/failing.txt\")"
  else
    echo -e "${YELLOW}GNU Parallel not found, falling back to xargs${RESET}"
    echo "$TEST_FILES" | xargs -P $MAX_PARALLEL -I{} bash -c "echo -e \"\\n${CYAN}Testing: {}${RESET}\" && npx jest {} --config=jest.unified.config.cjs > \"$RESULTS_DIR/logs/\$(echo {} | tr '/' '-').log\" 2>&1 && echo -e \"  ${GREEN}✓ PASSED: {}${RESET}\" && echo {} >> \"$RESULTS_DIR/passing.txt\" || (echo -e \"  ${RED}✗ FAILED: {}${RESET}\" && echo {} >> \"$RESULTS_DIR/failing.txt\")"
  fi
fi

# Generate report
echo -e "\n${BLUE}Generating test report...${RESET}"

# Count results
PASSED=$(cat "$RESULTS_DIR/passing.txt" 2>/dev/null | wc -l || echo 0)
FAILED=$(cat "$RESULTS_DIR/failing.txt" 2>/dev/null | wc -l || echo 0)
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=0
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
fi

# Create the report
cat > "$RESULTS_DIR/reports/test-report.md" << EOF
# SwissKnife Test Sweep Report

Generated: $(date)

## Summary
- Total Tests: $TOTAL
- Passed: $PASSED
- Failed: $FAILED
- Success Rate: ${SUCCESS_RATE}%

## Test Mode
- Mode: $MODE
- Pattern: $PATTERN
EOF

if [ "$MODE" = "category" ]; then
  # Add category results
  cat >> "$RESULTS_DIR/reports/test-report.md" << EOF

## Category Results
| Category | Status |
|----------|--------|
EOF

  # Sort categories alphabetically
  for category in $(echo "${!categories[@]}" | tr ' ' '\n' | sort); do
    status="⛔ FAILED"
    if grep -q "^$category: PASS$" "$RESULTS_DIR/categories-passing.txt" 2>/dev/null; then
      status="✅ PASSED"
    fi
    description=$(echo $category | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
    echo "| $description | $status |" >> "$RESULTS_DIR/reports/test-report.md"
  done
fi

# Add failing tests to the report if any
if [ $FAILED -gt 0 ]; then
  cat >> "$RESULTS_DIR/reports/test-report.md" << EOF

## Failed Tests
\`\`\`
$(cat "$RESULTS_DIR/failing.txt" 2>/dev/null | sort)
\`\`\`

## Error Summary
\`\`\`
$(cat "$RESULTS_DIR/errors.txt" 2>/dev/null || cat "$RESULTS_DIR/category-errors.txt" 2>/dev/null)
\`\`\`
EOF
fi

# Add recommendations
cat >> "$RESULTS_DIR/reports/test-report.md" << EOF

## Recommendations

Based on the test results, here are some recommendations:

1. Address the most common error patterns first
2. Fix test setup issues (mocks, environment)
3. Fix import/module resolution issues
4. Address specific test failures
EOF

# Display results
echo -e "\n${BLUE}Test Results:${RESET}"
echo -e "Total Tests: ${CYAN}$TOTAL${RESET}"
echo -e "Passed: ${GREEN}$PASSED${RESET}"
echo -e "Failed: ${RED}$FAILED${RESET}"
echo -e "Success Rate: ${YELLOW}${SUCCESS_RATE}%${RESET}"

echo -e "\n${BLUE}Test report saved to: $RESULTS_DIR/reports/test-report.md${RESET}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${RESET}"
  exit 0
else
  echo -e "\n${YELLOW}Some tests failed. See the report for details.${RESET}"
  exit 1
fi
