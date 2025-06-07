#!/bin/bash
# complete-test-runner-v4.sh - A comprehensive script to run fixed tests

set -e
cd /home/barberb/swissknife

echo "============================================"
echo "SwissKnife Complete Test Runner v4.0"
echo "============================================"

# Create test results directory
TEST_RESULTS_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEST_RESULTS_DIR"

# Test specific files with appropriate configurations
run_test() {
  local test_file=$1
  local config=${2:-"jest.unified.config.cjs"}
  local test_name=$(basename "$test_file" .test.tsx)
  test_name=$(basename "$test_name" .test.ts)
  test_name=$(basename "$test_name" .test.js)
  
  echo "Testing: $test_file with config: $config"
  
  NODE_OPTIONS=--experimental-vm-modules npx jest "$test_file" \
    --config="$config" \
    --detectOpenHandles \
    --forceExit \
    --no-cache \
    > "$TEST_RESULTS_DIR/${test_name}-output.log" 2>&1 || true
  
  # Check if test passed
  if grep -q "PASS" "$TEST_RESULTS_DIR/${test_name}-output.log"; then
    echo "✅ PASS: $test_file"
    echo "$test_file" >> "$TEST_RESULTS_DIR/passed.txt"
  elif grep -q "FAIL" "$TEST_RESULTS_DIR/${test_name}-output.log"; then
    echo "❌ FAIL: $test_file"
    echo "$test_file" >> "$TEST_RESULTS_DIR/failed.txt"
  else
    echo "⚠️ ERROR: $test_file"
    echo "$test_file" >> "$TEST_RESULTS_DIR/error.txt"
  fi
}

# Run React/TypeScript component tests
echo "Running React component tests..."
run_test "test/model_selector.test.tsx" "jest.react.config.cjs"

# Run FibonacciHeap test
echo "Running FibonacciHeap test..."
run_test "test/unit/tasks/fibonacci-heap.test.ts" 

# Run models registry test
echo "Running registry test..."
run_test "test/unit/models/registry.test.ts"

# Run storage test
echo "Running storage test..."
run_test "test/simple-storage.test.js"

# Run basic tests
echo "Running basic tests..."
run_test "test/basic.test.js"
run_test "test/ultra-minimal.test.js"

# Generate report
echo "Generating test report..."
cat > "$TEST_RESULTS_DIR/test-report.md" << EOF
# SwissKnife Test Report - $(date)

## Summary
- Total tests: $(find "$TEST_RESULTS_DIR" -name "*-output.log" | wc -l)
- Passed: $([ -f "$TEST_RESULTS_DIR/passed.txt" ] && wc -l < "$TEST_RESULTS_DIR/passed.txt" || echo "0")
- Failed: $([ -f "$TEST_RESULTS_DIR/failed.txt" ] && wc -l < "$TEST_RESULTS_DIR/failed.txt" || echo "0")
- Errors: $([ -f "$TEST_RESULTS_DIR/error.txt" ] && wc -l < "$TEST_RESULTS_DIR/error.txt" || echo "0")

## Test Results
$(if [ -f "$TEST_RESULTS_DIR/passed.txt" ]; then
  echo "### Passed Tests"
  cat "$TEST_RESULTS_DIR/passed.txt" | sed 's/^/- /'
fi)

$(if [ -f "$TEST_RESULTS_DIR/failed.txt" ]; then
  echo "### Failed Tests"
  cat "$TEST_RESULTS_DIR/failed.txt" | sed 's/^/- /'
fi)

$(if [ -f "$TEST_RESULTS_DIR/error.txt" ]; then
  echo "### Tests with Errors"
  cat "$TEST_RESULTS_DIR/error.txt" | sed 's/^/- /'
fi)

## Common Issues Found
1. Import path issues (multiple .js extensions, incorrect paths)
2. ESM/CommonJS compatibility problems
3. Jest/Chai assertion style mismatches
4. Missing TypeScript type definitions
5. Mock implementation issues

## Next Steps
1. Fix remaining failing tests one by one
2. Add explicit type annotations to reduce TypeScript errors
3. Create proper mock implementations for complex dependencies
4. Standardize test setup across the codebase
5. Implement continuous integration testing
EOF

echo "Test results saved to: $TEST_RESULTS_DIR"
cat "$TEST_RESULTS_DIR/test-report.md"

echo "============================================"
echo "Test execution completed!"
echo "============================================"
