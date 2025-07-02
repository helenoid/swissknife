#!/bin/bash

# Systematic Test Fixer and Runner
# This script identifies working tests and fixes failing ones systematically

echo "=== Systematic Test Fixing ==="
echo "Starting at: $(date)"
echo ""

# Step 1: List of tests we know work
WORKING_TESTS=(
  "test/unit/utils/events/event-bus.test.ts"
)

# Step 2: Run working tests to confirm baseline
echo "=== Running confirmed working tests ==="
for test in "${WORKING_TESTS[@]}"; do
  echo "Running: $test"
  npm test -- --testPathPattern="$(basename "$test")" --maxWorkers=1 --forceExit --silent 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "  ✓ PASSED"
  else
    echo "  ✗ FAILED (previously working test now broken)"
  fi
done

echo ""
echo "=== Identifying and fixing common issues ==="

# Step 3: Fix common import issues
echo "Fixing corrupted imports with repeated .js extensions..."
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "\.js\.js" 2>/dev/null | while read file; do
  echo "  Fixing: $file"
  sed -i 's/\.js\.js\.js[^'\'']*\.js/\.js/g' "$file" 2>/dev/null
  sed -i 's/\.js\.js[^'\'']*\.js//g' "$file" 2>/dev/null
done

# Step 4: Test a few more tests to see if fixes helped
SAMPLE_TESTS=(
  "test/unit/config/manager-fixed.test.ts"
  "test/simple-basic.test.ts"
)

echo ""
echo "=== Testing additional tests after fixes ==="
for test in "${SAMPLE_TESTS[@]}"; do
  if [ -f "$test" ]; then
    echo "Testing: $test"
    timeout 30s npm test -- --testPathPattern="$(basename "$test")" --maxWorkers=1 --forceExit --silent 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "  ✓ PASSED"
    else
      echo "  ✗ FAILED"
    fi
  else
    echo "  - File not found: $test"
  fi
done

echo ""
echo "=== Test fixing session complete at: $(date) ==="
