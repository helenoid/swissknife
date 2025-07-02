#!/bin/bash
# Comprehensive Test Runner for SwissKnife
# This script runs tests in batches and tracks results

# Configuration
OUTPUT_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
CONFIG_FILE="jest.config.cjs"
BATCH_SIZE=5
VERBOSE=true

# Create output directories
mkdir -p $OUTPUT_DIR/logs
mkdir -p $OUTPUT_DIR/fixed

echo "===== SWISSKNIFE TEST RUNNER ====="
echo "Started at $(date)"
echo "Results directory: $OUTPUT_DIR"

# Find all test files
echo "Finding test files..."
find test -name "*.test.js" -o -name "*.test.ts" | grep -v node_modules > $OUTPUT_DIR/all_tests.txt
TOTAL_TESTS=$(wc -l < $OUTPUT_DIR/all_tests.txt)

echo "Found $TOTAL_TESTS test files"

# First, run our reliable tests to confirm configuration works
echo "===== RUNNING ESSENTIAL TESTS ====="
ESSENTIAL_TESTS=(
  "test/super-minimal.test.js"
  "test/comprehensive-diagnostic.test.js"
  "test/unit/command-registry.test.js"
  "test/unit/services/mcp/fixed-mcp-registry.test.js"
)

for test in "${ESSENTIAL_TESTS[@]}"; do
  echo "Running $test..."
  npx jest --config=$CONFIG_FILE $test --verbose > $OUTPUT_DIR/logs/$(basename $test).log 2>&1
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ PASSED: $test"
    echo "$test" >> $OUTPUT_DIR/passed.txt
  else
    echo "❌ FAILED: $test"
    echo "$test" >> $OUTPUT_DIR/failed.txt
  fi
done

# Now run the remaining tests in batches
echo "===== RUNNING ALL TESTS ====="

# Filter out tests we've already run
grep -v -f <(printf "%s\n" "${ESSENTIAL_TESTS[@]}") $OUTPUT_DIR/all_tests.txt > $OUTPUT_DIR/remaining_tests.txt
REMAINING_TESTS=$(wc -l < $OUTPUT_DIR/remaining_tests.txt)
echo "Running remaining $REMAINING_TESTS tests in batches of $BATCH_SIZE"

# Split into batches
split -l $BATCH_SIZE $OUTPUT_DIR/remaining_tests.txt $OUTPUT_DIR/batch-

# Run each batch
for batch in $OUTPUT_DIR/batch-*; do
  echo "Running batch $(basename $batch)..."
  
  while IFS= read -r test; do
    echo "  Testing: $test"
    npx jest --config=$CONFIG_FILE $test --verbose > $OUTPUT_DIR/logs/$(basename $test).log 2>&1
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
      echo "  ✅ PASSED: $test"
      echo "$test" >> $OUTPUT_DIR/passed.txt
    else
      echo "  ❌ FAILED: $test"
      echo "$test" >> $OUTPUT_DIR/failed.txt
      
      # Output error details
      echo "  Error details:"
      ERROR_INFO=$(grep -A 10 "FAIL " $OUTPUT_DIR/logs/$(basename $test).log | head -n 20)
      echo "$ERROR_INFO" | sed 's/^/    /'
    fi
  done < "$batch"
done

# Create report
PASSED_COUNT=$([ -f $OUTPUT_DIR/passed.txt ] && wc -l < $OUTPUT_DIR/passed.txt || echo 0)
FAILED_COUNT=$([ -f $OUTPUT_DIR/failed.txt ] && wc -l < $OUTPUT_DIR/failed.txt || echo 0)

echo "===== TEST SUMMARY ====="
echo "Total tests found: $TOTAL_TESTS"
echo "Tests passed: $PASSED_COUNT"
echo "Tests failed: $FAILED_COUNT"

# Generate detailed report
cat > $OUTPUT_DIR/test-report.md << EOL
# SwissKnife Test Report
Generated: $(date)

## Summary
- Total tests: $TOTAL_TESTS
- Passed: $PASSED_COUNT
- Failed: $FAILED_COUNT

## Failed Tests
EOL

if [ -f $OUTPUT_DIR/failed.txt ]; then
  echo "Common failure patterns:" >> $OUTPUT_DIR/test-report.md
  echo "1. Module resolution issues" >> $OUTPUT_DIR/test-report.md
  echo "2. TypeScript in JavaScript files" >> $OUTPUT_DIR/test-report.md
  echo "3. Missing mock implementations" >> $OUTPUT_DIR/test-report.md
  echo "4. Import path errors" >> $OUTPUT_DIR/test-report.md
  echo "" >> $OUTPUT_DIR/test-report.md
  
  echo "Failed tests:" >> $OUTPUT_DIR/test-report.md
  while IFS= read -r test; do
    echo "- $test" >> $OUTPUT_DIR/test-report.md
    ERROR_SUMMARY=$(grep -A 3 "FAIL " $OUTPUT_DIR/logs/$(basename $test).log | grep -v "FAIL " | head -n 1)
    if [ ! -z "$ERROR_SUMMARY" ]; then
      echo "  - Error: $ERROR_SUMMARY" >> $OUTPUT_DIR/test-report.md
    fi
  done < $OUTPUT_DIR/failed.txt
fi

echo ""
echo "Test report available at $OUTPUT_DIR/test-report.md"

# Final test summary
echo ""
echo "Tests completed at $(date)"
