#!/bin/bash
# Comprehensive test diagnostic runner for SwissKnife
# This script will run tests for all major modules and report results

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

RESULTS_DIR="test-diagnostics"
mkdir -p $RESULTS_DIR
SUMMARY_FILE="$RESULTS_DIR/test-summary.md"
LOG_DIR="$RESULTS_DIR/logs"
mkdir -p $LOG_DIR

echo "# SwissKnife Test Diagnostics" > $SUMMARY_FILE
echo "Run on: $(date)" >> $SUMMARY_FILE
echo "" >> $SUMMARY_FILE
echo "## Test Results Summary" >> $SUMMARY_FILE
echo "" >> $SUMMARY_FILE
echo "| Module | Status | Details |" >> $SUMMARY_FILE
echo "|--------|--------|---------|" >> $SUMMARY_FILE

# Key test categories
declare -a TEST_CATEGORIES=(
  "basic:test/basic.test.js,test/super-minimal.test.js,test/minimal.test.js"
  "execution:test/execution-service-isolated.test.js,test/unit/models/execution/execution-service.test.js"
  "mcp:test/mcp-minimal.test.js,test/unit/mcp-server/mcp-server.test.js"
  "integration:test/simplified-execution-integration.test.js"
  "config:test/unit/config/config-manager.test.js"
)

run_test() {
  local test_file=$1
  local config_file=$2
  local log_file=$3
  
  echo -e "${YELLOW}Running test: $test_file with $config_file${RESET}"
  
  NODE_OPTIONS="--experimental-vm-modules" npx jest $test_file --config=$config_file > $log_file 2>&1
  
  return $?
}

# Run tests by category
for category_info in "${TEST_CATEGORIES[@]}"; do
  category_name=$(echo $category_info | cut -d':' -f1)
  category_tests=$(echo $category_info | cut -d':' -f2)
  
  echo -e "${BLUE}==== Testing Category: $category_name ====${RESET}"
  
  category_status="PASSED"
  category_details=""
  
  # Create category report file
  cat_report="$RESULTS_DIR/$category_name-report.md"
  echo "# $category_name Test Report" > $cat_report
  echo "" >> $cat_report
  
  # Process each test in the category
  IFS=',' read -ra TESTS <<< "$category_tests"
  for test in "${TESTS[@]}"; do
    if [ ! -f "$test" ]; then
      echo -e "${YELLOW}Warning: Test file $test does not exist, skipping${RESET}"
      continue
    fi
    
    # Try with different configs
    for config in "jest-super-minimal.config.cjs" "jest.unified.config.cjs" "jest-master.config.cjs"; do
      if [ ! -f "$config" ]; then
        continue
      fi
      
      log_file="$LOG_DIR/$(basename $test)-$(basename $config).log"
      
      echo -e "## Test: $test with $config" >> $cat_report
      echo -e "\`\`\`" >> $cat_report
      
      if run_test "$test" "$config" "$log_file"; then
        echo -e "${GREEN}✅ PASSED: $test with $config${RESET}"
        echo -e "Status: ✅ PASSED\n" >> $cat_report
        cat $log_file >> $cat_report
        # Test passed, break out of config loop
        break
      else
        echo -e "${RED}❌ FAILED: $test with $config${RESET}"
        echo -e "Status: ❌ FAILED\n" >> $cat_report
        cat $log_file >> $cat_report
        category_status="FAILED"
        category_details="$category_details [$test with $config]"
        
        # Create diagnostic test if we reach the last config and still failed
        if [ "$config" == "jest-master.config.cjs" ] || [ "$config" == "jest.unified.config.cjs" ]; then
          diag_file="${test%.*}-diagnostic.js"
          echo -e "${YELLOW}Creating diagnostic test: $diag_file${RESET}"
          
          cat <<EOT > $diag_file
/**
 * Diagnostic test for $test
 * Created on $(date)
 *
 * This test isolates functionality from $test to diagnose failures
 */

// Basic test to ensure test environment works
test('Diagnostic sanity check', () => {
  expect(1 + 1).toBe(2);
});

// Module loading test
test('Can load required modules', () => {
  try {
    // Try loading core Node.js modules
    const fs = require('fs');
    const path = require('path');
    expect(fs).toBeDefined();
    expect(path).toBeDefined();
    
    // Try basic ES module loading if appropriate
    try {
      // Attempt dynamic import (wrapped in try/catch since it might fail)
      import('fs').then(fs => {
        console.log('Dynamic import of fs succeeded');
      }).catch(err => {
        console.log('Dynamic import failed:', err.message);
      });
    } catch (err) {
      console.log('ES module syntax not supported in this context');
    }
  } catch (err) {
    console.error('Module loading error:', err);
    throw err;
  }
});

// Try to identify error source in original test
describe('Error source diagnosis', () => {
  it('checks for common test failures', () => {
    // Check environment
    expect(process.env.NODE_ENV).toBe('test');
    
    // Check Jest globals
    expect(jest).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });
});
EOT
        fi
      fi
      
      echo -e "\`\`\`" >> $cat_report
      echo "" >> $cat_report
    done
  done
  
  # Add to summary
  echo "| $category_name | $category_status | $category_details |" >> $SUMMARY_FILE
done

echo -e "${BLUE}Testing complete. Results saved to $RESULTS_DIR${RESET}"
echo -e "${BLUE}Summary: $SUMMARY_FILE${RESET}"
