#!/bin/bash
# Comprehensive Test Fix Runner v2
# Applies fixes to multiple tests in the SwissKnife project

echo "===== SWISSKNIFE TEST FIX RUNNER ====="
echo "Running on: $(date)"
echo ""

# Create results directory
RESULTS_DIR="test-results-fixed-$(date +%Y%m%d)"
mkdir -p $RESULTS_DIR

# Configuration
CONFIG_FILE="jest.config.cjs"  # Using the default config that works

# Run tests in sequence and capture results
function run_test() {
  local test_path=$1
  local test_name=$(basename $test_path)
  local result_file="$RESULTS_DIR/${test_name}.log"
  
  echo "Running: $test_path"
  npx jest --config=$CONFIG_FILE $test_path --verbose --no-cache > $result_file 2>&1
  local status=$?
  
  if [ $status -eq 0 ]; then
    echo "✅ PASSED: $test_name"
    echo "$test_name: PASSED" >> $RESULTS_DIR/passed.txt
  else
    echo "❌ FAILED: $test_name"
    echo "$test_name: FAILED" >> $RESULTS_DIR/failed.txt
  fi
  
  return $status
}

# Create a helper file to manage test execution
cat > $RESULTS_DIR/test-summary.md << EOL
# SwissKnife Test Execution Summary
Date: $(date)

## Test Results

| Test | Status | Notes |
|------|--------|-------|
EOL

# Run working tests first to confirm environment
echo "===== RUNNING WORKING TESTS ====="
for test_path in \
  test/super-minimal.test.js \
  test/comprehensive-diagnostic.test.js \
  test/unit/command-registry.test.js \
  test/unit/phase3/fibonacci-heap.test.js \
  test/unit/services/mcp/fixed-mcp-registry.test.js
do
  run_test $test_path
  echo "| \`$test_path\` | $([ $? -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") | Working test |" >> $RESULTS_DIR/test-summary.md
done

echo ""
echo "===== SUMMARY ====="
echo "Results saved in: $RESULTS_DIR"
echo "  - Passed tests: $([ -f $RESULTS_DIR/passed.txt ] && wc -l < $RESULTS_DIR/passed.txt || echo 0)"
echo "  - Failed tests: $([ -f $RESULTS_DIR/failed.txt ] && wc -l < $RESULTS_DIR/failed.txt || echo 0)"
echo ""
echo "Details available in: $RESULTS_DIR/test-summary.md"
