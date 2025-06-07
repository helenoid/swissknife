#!/bin/bash

echo "=== Test Assessment Report ==="
echo "Date: $(date)"
echo ""

echo "=== Total tests found ==="
npm test -- --listTests 2>/dev/null | wc -l

echo ""
echo "=== Running a sample of individual tests ==="

# Test a few specific tests to see which ones work
test_files=(
  "test/unit/utils/events/event-bus.test.ts"
  "test/unit/config/manager-fixed.test.ts"
  "test/simple-basic.test.ts"
)

for test_file in "${test_files[@]}"; do
  echo ""
  echo "Testing: $test_file"
  if [ -f "$test_file" ]; then
    timeout 30s npm test -- --testPathPattern="$(basename $test_file)" --maxWorkers=1 --forceExit --passWithNoTests 2>&1 | grep -E "(PASS|FAIL|Test Suites:|Tests:)" | tail -3
  else
    echo "  File not found"
  fi
done

echo ""
echo "=== Quick Jest configuration check ==="
echo "Jest config files found:"
find . -maxdepth 1 -name "jest*.config.*" -type f | head -5

echo ""
echo "=== Assessment complete ==="
