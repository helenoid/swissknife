#!/bin/bash
# Test harness for running Jest with better error reporting

# Set variables
CONFIG_FILE="jest.config.cjs"
OUTPUT_DIR="jest-diagnostics-$(date +%Y%m%d_%H%M)"
OUTPUT_FILE="$OUTPUT_DIR/jest-diagnostics.log"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clear previous log
echo "Starting Jest diagnostic run at $(date)" > $OUTPUT_FILE

# Function to run a test and log results
run_test() {
  local test_path=$1
  local test_name=$(basename "$test_path")
  local test_output="$OUTPUT_DIR/${test_name}.log"
  
  echo "Running test: $test_path"
  echo "Test: $test_path" >> "$OUTPUT_FILE"
  
  NODE_OPTIONS="--trace-warnings --unhandled-rejections=strict" npx jest --config=$CONFIG_FILE "$test_path" --no-cache --detectOpenHandles --verbose > "$test_output" 2>&1
  
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "✅ PASSED: $test_path"
    echo "PASSED ($exit_code)" >> "$OUTPUT_FILE"
    echo "$test_path" >> "$OUTPUT_DIR/passed.txt"
  else
    echo "❌ FAILED: $test_path"
    echo "FAILED ($exit_code)" >> "$OUTPUT_FILE"
    echo "$test_path" >> "$OUTPUT_DIR/failed.txt"
    
    # Extract failure information
    grep -A 10 "FAIL" "$test_output" >> "$OUTPUT_DIR/failure-details.txt"
    echo "------------------------------------------" >> "$OUTPUT_DIR/failure-details.txt"
  fi
  
  echo "" >> "$OUTPUT_FILE"
  return $exit_code
}

# Get test files - focusing on high priority tests
echo "Gathering test files..."
find test/unit -name "*.test.js" -not -path "*/node_modules/*" | sort > "$OUTPUT_DIR/all-tests.txt"

# Run tests in batches
echo "Running tests in batches..."
BATCH_SIZE=5
TOTAL_TESTS=$(wc -l < "$OUTPUT_DIR/all-tests.txt")
CURRENT=0

while read -r test_file; do
  CURRENT=$((CURRENT + 1))
  echo "[$CURRENT/$TOTAL_TESTS] Testing: $test_file"
  run_test "$test_file"
done < "$OUTPUT_DIR/all-tests.txt"

# Summarize results
PASSED_COUNT=$([ -f "$OUTPUT_DIR/passed.txt" ] && wc -l < "$OUTPUT_DIR/passed.txt" || echo 0)
FAILED_COUNT=$([ -f "$OUTPUT_DIR/failed.txt" ] && wc -l < "$OUTPUT_DIR/failed.txt" || echo 0)

echo "Tests completed. Passed: $PASSED_COUNT, Failed: $FAILED_COUNT" >> "$OUTPUT_FILE"
echo "Tests completed. Passed: $PASSED_COUNT, Failed: $FAILED_COUNT"

# Print the output file to console
echo "==== Diagnostic Results ===="
cat $OUTPUT_FILE
echo "==========================="

# Print Node.js and npm version info
echo "Node.js version: $(node -v)" >> $OUTPUT_FILE
echo "npm version: $(npm -v)" >> $OUTPUT_FILE

echo "See full output in $OUTPUT_FILE"
