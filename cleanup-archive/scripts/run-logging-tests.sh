#!/bin/bash

# Logging Tests Runner
# This script runs all logging-related tests

echo "🔍 Running Logging System Tests"
echo "=============================="

# Set NODE_OPTIONS for memory management
export NODE_OPTIONS="--max-old-space-size=4096"

# Create directory for test reports
mkdir -p test-reports

# Function to run a test file with the provided config
run_test() {
  local test_file=$1
  local config=$2
  local test_name=$(basename "$test_file")
  
  echo "Running test: $test_name"
  npx jest --config "$config" "$test_file" --verbose
  
  return $?
}

# Run the integrated manager test
run_test "test/unit/utils/logging/integrated-manager.test.js" "jest.focused.config.cjs"
INTEGRATED_MANAGER_RESULT=$?

# Check results
echo ""
if [ $INTEGRATED_MANAGER_RESULT -eq 0 ]; then
  echo "✅ Integrated Manager Tests: PASSED"
else
  echo "❌ Integrated Manager Tests: FAILED (Exit code: $INTEGRATED_MANAGER_RESULT)"
fi

# Run the simple manager.test.js
run_test "test/unit/utils/logging/manager.simple.test.js" "jest.focused.config.cjs"
MANAGER_RESULT=$?

# Check results
echo ""
if [ $MANAGER_RESULT -eq 0 ]; then
  echo "✅ Simple Manager Tests: PASSED"
else
  echo "❌ Simple Manager Tests: FAILED (Exit code: $MANAGER_RESULT)"
fi

# Return overall status
if [ $SIMPLE_MANAGER_RESULT -eq 0 ] && [ $MANAGER_RESULT -eq 0 ]; then
  echo "🎉 All logging tests passed!"
  exit 0
else
  echo "⚠️ Some logging tests failed"
  exit 1
fi
