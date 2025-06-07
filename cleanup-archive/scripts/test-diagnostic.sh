#!/bin/bash
# Script to identify and run tests that work in the SwissKnife project

echo "🧪 SwissKnife Test Diagnostic Tool 🧪"
echo "===================================="
echo ""

# Define test directories in priority order
TEST_CATEGORIES=(
  "super-minimal"
  "fibonacci"
  "utils"
  "storage"
  "models"
  "integration"
)

# Create results directory
RESULTS_DIR="./test-results"
mkdir -p "$RESULTS_DIR"

# Function to run a test and record the result
run_test() {
  local test_path=$1
  local result_file="$RESULTS_DIR/$(basename $test_path).result"
  
  echo "Running test: $test_path"
  npx jest "$test_path" --verbose > "$result_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "✅ PASSED: $test_path"
    echo "$test_path: PASS" >> "$RESULTS_DIR/passing.txt"
  else
    echo "❌ FAILED: $test_path"
    echo "$test_path: FAIL" >> "$RESULTS_DIR/failing.txt"
  fi
  
  return $exit_code
}

echo "Running super-minimal tests..."
run_test "test/super-minimal.test.js"

echo "Running fibonacci heap tests..."
run_test "test/unit/tasks/fibonacci-heap.test.ts"

echo "Generating test summary..."
echo "# Test Results Summary" > "$RESULTS_DIR/summary.md"
echo "Generated: $(date)" >> "$RESULTS_DIR/summary.md"
echo "" >> "$RESULTS_DIR/summary.md"

echo "## Passing Tests" >> "$RESULTS_DIR/summary.md"
if [ -f "$RESULTS_DIR/passing.txt" ]; then
  cat "$RESULTS_DIR/passing.txt" | sed 's/^/- /' >> "$RESULTS_DIR/summary.md"
else
  echo "No passing tests found." >> "$RESULTS_DIR/summary.md"
fi

echo "" >> "$RESULTS_DIR/summary.md"
echo "## Failing Tests" >> "$RESULTS_DIR/summary.md"
if [ -f "$RESULTS_DIR/failing.txt" ]; then
  cat "$RESULTS_DIR/failing.txt" | sed 's/^/- /' >> "$RESULTS_DIR/summary.md"
else
  echo "No failing tests found." >> "$RESULTS_DIR/summary.md"
fi

echo "" >> "$RESULTS_DIR/summary.md"
echo "## Common Failure Reasons" >> "$RESULTS_DIR/summary.md"
echo "1. Module resolution issues with mixed ESM/CommonJS" >> "$RESULTS_DIR/summary.md"
echo "2. Path resolution problems with .js/.ts extensions" >> "$RESULTS_DIR/summary.md"
echo "3. Mock implementation mismatches" >> "$RESULTS_DIR/summary.md"
echo "4. Jest configuration incompatibilities" >> "$RESULTS_DIR/summary.md"

echo "Test diagnostic complete. Results saved to $RESULTS_DIR/summary.md"
