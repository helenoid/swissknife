#!/bin/bash
# Focused test runner for SwissKnife
# This script runs key tests and identifies failures

RESULTS_DIR="focused-test-results"
CONFIG_FILE="jest.config.cjs"

# Create results directory
mkdir -p $RESULTS_DIR

echo "===== RUNNING KEY TESTS ====="

# Run comprehensive diagnostics first
echo "Running comprehensive diagnostics..."
npx jest --config=$CONFIG_FILE test/comprehensive-diagnostic.test.js --verbose
echo "Diagnostic status: $?"

# Run basic tests
echo "Running super minimal test..."
npx jest --config=$CONFIG_FILE test/super-minimal.test.js --verbose > $RESULTS_DIR/01-super-minimal.log 2>&1
echo "Status: $?"

echo "Running command registry test..."
npx jest --config=$CONFIG_FILE test/unit/command-registry.test.js --verbose > $RESULTS_DIR/02-command-registry.log 2>&1
echo "Status: $?"

echo "Running fibonacci heap test..."
npx jest --config=$CONFIG_FILE test/unit/phase3/fibonacci-heap.test.js --verbose > $RESULTS_DIR/03-fibonacci-heap.log 2>&1
echo "Status: $?"

echo "Running fixed MCP registry test..."
npx jest --config=$CONFIG_FILE test/unit/services/mcp/fixed-mcp-registry.test.js --verbose --no-cache > $RESULTS_DIR/04-fixed-mcp-registry.log 2>&1
MCP_STATUS=$?
echo "Fixed MCP test status: $MCP_STATUS"

# Update summary
if [ $MCP_STATUS -eq 0 ]; then
  echo "mcp-registry: PASSED (fixed)" | tee -a $RESULTS_DIR/summary.txt
else
  echo "mcp-registry: FAILED (fixed)" | tee -a $RESULTS_DIR/summary.txt
fi

# Generate a simple summary
echo "===== TEST SUMMARY ====="
echo "Test results:" > $RESULTS_DIR/summary.txt

for log_file in $RESULTS_DIR/*.log; do
  test_name=$(basename $log_file | cut -d'-' -f2- | cut -d'.' -f1)
  
  if grep -q "FAIL " $log_file; then
    echo "$test_name: FAILED" | tee -a $RESULTS_DIR/summary.txt
  elif grep -q "PASS " $log_file; then
    echo "$test_name: PASSED" | tee -a $RESULTS_DIR/summary.txt
  else
    echo "$test_name: UNKNOWN" | tee -a $RESULTS_DIR/summary.txt
  fi
done

echo ""
echo "Detailed logs available in $RESULTS_DIR directory"
