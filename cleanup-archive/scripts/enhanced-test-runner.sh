#!/bin/bash
# Enhanced test runner for SwissKnife project

# Set up colors for better readability
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/passing"
mkdir -p "$RESULTS_DIR/failing"

echo -e "${BLUE}Enhanced Test Runner for SwissKnife${RESET}"
echo "========================================="
echo "Results will be saved to: $RESULTS_DIR"

# Run tests for a single file and report results
run_test() {
  local test_file=$1
  local config=$2
  local output_file="$RESULTS_DIR/$(basename $test_file | tr '/' '_' | sed 's/\./-/g').log"
  
  echo -e "\n${YELLOW}Running test: $test_file${RESET}"
  
  # Run the test and capture output
  npx jest "$test_file" --config="$config" --no-cache > "$output_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: $test_file${RESET}"
    echo "$test_file" >> "$RESULTS_DIR/passing/passing_tests.txt"
    cp "$output_file" "$RESULTS_DIR/passing/"
    return 0
  else
    echo -e "${RED}❌ FAILED: $test_file${RESET}"
    echo "$test_file" >> "$RESULTS_DIR/failing/failing_tests.txt"
    cp "$output_file" "$RESULTS_DIR/failing/"
    
    # Extract key error information
    echo -e "${YELLOW}Error Summary:${RESET}"
    
    # Common Jest errors to look for
    grep -A 3 -B 1 "Error:" "$output_file" | head -20
    grep -A 3 -B 1 "FAIL " "$output_file" | head -10
    
    return $exit_code
  fi
}

# Check if Jest is working with a minimal test
echo -e "\n${BLUE}Step 1: Verifying Jest functionality${RESET}"
cat > "./test-minimal.js" << 'EOF'
test('Minimal test', () => {
  expect(true).toBe(true);
});
