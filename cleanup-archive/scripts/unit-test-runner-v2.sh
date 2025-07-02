#!/bin/bash
# SwissKnife Unit Test Runner v2
# Runs all unit tests and applies fixes where possible

# Output directory
OUTPUT_DIR="test-run-$(date +%Y%m%d_%H%M)"
mkdir -p "$OUTPUT_DIR/logs"
mkdir -p "$OUTPUT_DIR/fixed"

# Config file
CONFIG_FILE="jest.config.cjs"

echo "===== SWISSKNIFE UNIT TEST RUNNER V2 ====="
echo "Started: $(date)"
echo "Output directory: $OUTPUT_DIR"

# Find all unit test files
echo "Finding test files..."
find test/unit -name "*.test.js" | grep -v node_modules | sort > "$OUTPUT_DIR/all-tests.txt"
TOTAL_TESTS=$(wc -l < "$OUTPUT_DIR/all-tests.txt")

echo "Found $TOTAL_TESTS test files"
echo ""

# Create batches of tests for faster execution
BATCH_SIZE=5
BATCHES=$(( (TOTAL_TESTS + BATCH_SIZE - 1) / BATCH_SIZE ))
echo "Will process tests in $BATCHES batches of up to $BATCH_SIZE tests each"

# Split tests into batches
split -l $BATCH_SIZE "$OUTPUT_DIR/all-tests.txt" "$OUTPUT_DIR/batch-" --numeric-suffixes=1 --additional-suffix=".txt"

# Run each batch
for batch in $(seq -f "%02g" 1 $BATCHES); do
  BATCH_FILE="$OUTPUT_DIR/batch-$batch.txt"
  if [ -f "$BATCH_FILE" ]; then
    echo ""
    echo "===== PROCESSING BATCH $batch/$BATCHES ====="
    
    # Run each test in the batch
    while read -r test_file; do
      echo "Testing: $test_file"
      log_file="$OUTPUT_DIR/logs/$(basename "$test_file").log"
      
      # Run the test
      npx jest --config="$CONFIG_FILE" "$test_file" --no-cache > "$log_file" 2>&1
      EXIT_CODE=$?
      
      if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ PASSED: $test_file"
        echo "$test_file" >> "$OUTPUT_DIR/passed.txt"
      else
        echo "❌ FAILED: $test_file"
        echo "$test_file" >> "$OUTPUT_DIR/failed.txt"
        
        # Try to fix the test if test-fixer.sh exists
        if [ -f "./test-fixer.sh" ]; then
          echo "Attempting to fix: $test_file"
          ./test-fixer.sh --fix-all "$test_file" > "$OUTPUT_DIR/fixed/$(basename "$test_file")-fix.log" 2>&1
          
          # Try running it again
          echo "Re-running fixed test: $test_file"
          npx jest --config="$CONFIG_FILE" "$test_file" --no-cache > "$OUTPUT_DIR/fixed/$(basename "$test_file")-rerun.log" 2>&1
          FIX_EXIT_CODE=$?
          
          if [ $FIX_EXIT_CODE -eq 0 ]; then
            echo "🔧 FIXED: $test_file"
            echo "$test_file" >> "$OUTPUT_DIR/fixed.txt"
          else
            echo "⚠️ FIX FAILED: $test_file"
          fi
        fi
      fi
    done < "$BATCH_FILE"
  fi
done

# Generate summary
PASSED_COUNT=$([ -f "$OUTPUT_DIR/passed.txt" ] && wc -l < "$OUTPUT_DIR/passed.txt" || echo 0)
FAILED_COUNT=$([ -f "$OUTPUT_DIR/failed.txt" ] && wc -l < "$OUTPUT_DIR/failed.txt" || echo 0)
FIXED_COUNT=$([ -f "$OUTPUT_DIR/fixed.txt" ] && wc -l < "$OUTPUT_DIR/fixed.txt" || echo 0)

echo ""
echo "===== SUMMARY ====="
echo "Total tests: $TOTAL_TESTS"
echo "Passed: $PASSED_COUNT"
echo "Failed: $FAILED_COUNT"
echo "Fixed: $FIXED_COUNT"

# Generate a markdown summary
cat > "$OUTPUT_DIR/summary.md" << EOL
# SwissKnife Test Run Summary
Run date: $(date)

## Results
- Total tests: $TOTAL_TESTS
- Passed: $PASSED_COUNT
- Failed: $FAILED_COUNT
- Fixed: $FIXED_COUNT

## Failed Tests
$([ -f "$OUTPUT_DIR/failed.txt" ] && cat "$OUTPUT_DIR/failed.txt" | sed 's/^/- `/' | sed 's/$/`/' || echo "No failed tests")

## Successfully Fixed Tests
$([ -f "$OUTPUT_DIR/fixed.txt" ] && cat "$OUTPUT_DIR/fixed.txt" | sed 's/^/- `/' | sed 's/$/`/' || echo "No fixed tests")
EOL

echo "Detailed results available in: $OUTPUT_DIR"
echo "Summary: $OUTPUT_DIR/summary.md"
