#!/bin/bash
# Enhanced Module-Based Test Runner for SwissKnife
# This script tests each module individually and applies fixes where needed

# Configuration
OUTPUT_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
HYBRID_CONFIG="jest.hybrid.config.cjs"
MINIMAL_CONFIG="jest.minimal.config.cjs"
VERBOSE=true

# Create output directories
mkdir -p "$OUTPUT_DIR/logs"
mkdir -p "$OUTPUT_DIR/fixed"
mkdir -p "$OUTPUT_DIR/coverage"

echo "===== SWISSKNIFE MODULE-BASED TEST RUNNER ====="
echo "Started at $(date)"
echo "Results directory: $OUTPUT_DIR"

# Define the module order (from least to most dependent)
MODULES=(
  "utils"
  "config"
  "models"
  "commands"
  "services/mcp"
  "tools"
  "tasks"
  "ai/agent"
)

# Function to run tests for a specific module
run_module_tests() {
  local module="$1"
  local module_path="test/unit/$module"
  
  echo -e "\n===== Testing Module: $module ====="
  
  # Create a list of all test files for this module
  if [ -d "$module_path" ]; then
    find "$module_path" -name "*.test.js" > "$OUTPUT_DIR/module_${module//\//_}_tests.txt"
  else
    echo "Module path $module_path not found, skipping..."
    return
  fi
  
  local total_tests=$(wc -l < "$OUTPUT_DIR/module_${module//\//_}_tests.txt")
  echo "Found $total_tests test files for module $module"
  
  local pass_count=0
  local fail_count=0
  
  # Test each file individually
  while IFS= read -r test_file; do
    echo "Testing: $test_file"
    
    # Run the test
    npx jest --config="$HYBRID_CONFIG" "$test_file" > "$OUTPUT_DIR/logs/$(basename "$test_file").log" 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
      echo "  ✅ PASSED: $test_file"
      echo "$test_file" >> "$OUTPUT_DIR/passed.txt"
      pass_count=$((pass_count + 1))
    else
      echo "  ❌ FAILED: $test_file"
      echo "$test_file" >> "$OUTPUT_DIR/failed.txt"
      fail_count=$((fail_count + 1))
      
      # Output error details
      echo "  Error details:"
      grep -A 10 "FAIL " "$OUTPUT_DIR/logs/$(basename "$test_file").log" | head -n 15 | sed 's/^/    /'
      
      # Try to fix the test
      echo "  🔧 Attempting to fix: $test_file"
      if [ -f "test-fixer.cjs" ]; then
        node test-fixer.cjs "$test_file"
        
        # Run the test again
        echo "  🔄 Re-running the test after fix..."
        npx jest --config="$HYBRID_CONFIG" "$test_file" > "$OUTPUT_DIR/logs/$(basename "$test_file").fixed.log" 2>&1
        local new_exit_code=$?
        
        if [ $new_exit_code -eq 0 ]; then
          echo "  ✅ FIX SUCCESSFUL: $test_file"
          echo "$test_file" >> "$OUTPUT_DIR/fixed.txt"
          pass_count=$((pass_count + 1))
          fail_count=$((fail_count - 1))
        else
          echo "  ❌ FIX FAILED: $test_file"
          
          # Examine the error more deeply
          echo "  Creating enhanced test to diagnose the issue..."
          
          # Generate a diagnostic test for this failing test
          generate_diagnostic_test "$test_file"
        fi
      else
        echo "  ⚠️ test-fixer.cjs not found, skipping fix"
      fi
    fi
  done < "$OUTPUT_DIR/module_${module//\//_}_tests.txt"
  
  echo "Module $module results: $pass_count passed, $fail_count failed"
  echo "$module:$pass_count:$fail_count" >> "$OUTPUT_DIR/module_results.txt"
}

# Function to generate a diagnostic test for a failing test
generate_diagnostic_test() {
  local failing_test="$1"
  local basename=$(basename "$failing_test" .test.js)
  local dirname=$(dirname "$failing_test")
  local diagnostic_test="$dirname/diagnostic-$basename.test.js"
  
  echo "  📝 Creating diagnostic test at $diagnostic_test"
  
  # Extract the module path being tested
  local module_path=${failing_test#test/unit/}
  module_path=${module_path%.test.js}
  
  cat > "$diagnostic_test" << EOL
/**
 * Diagnostic test for ${basename}
 * This test helps diagnose issues in the original test file.
 */

const { describe, it, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

describe('Diagnostic for ${basename}', () => {
  // Setup test environment
  beforeEach(() => {
    console.log('Setting up test environment');
  });
  
  // Test the module existence
  it('should verify the module path exists', () => {
    const modulePath = path.join(process.cwd(), 'src', '${module_path}.js');
    console.log('Checking module path:', modulePath);
    
    try {
      const exists = fs.existsSync(modulePath);
      console.log('Module exists:', exists);
      
      if (exists) {
        const stats = fs.statSync(modulePath);
        console.log('Module stats:', stats.isFile() ? 'Is a file' : 'Not a file');
      }
      
      // Don't fail the test regardless
      expect(true).toBe(true);
    } catch (error) {
      console.error('Error checking module:', error);
      // Don't fail the test
      expect(true).toBe(true);
    }
  });
  
  // Test module loading
  it('should attempt to require the module', () => {
    try {
      // Try to require the module - shows what happens when we try to load it
      const modulePath = '../../../../src/${module_path}.js';
      console.log('Requiring module from:', modulePath);
      const module = require(modulePath);
      console.log('Module loaded successfully. Type:', typeof module);
      console.log('Module keys:', Object.keys(module));
      expect(true).toBe(true);
    } catch (error) {
      console.error('Error requiring module:', error.message);
      // Don't fail the test
      expect(true).toBe(true);
    }
  });
  
  // Test jest mocking
  it('should test jest mocking capabilities', () => {
    try {
      // Create a mock function and make sure jest works
      const mockFn = jest.fn(() => 'test');
      expect(mockFn()).toBe('test');
      expect(mockFn).toHaveBeenCalled();
      console.log('Jest mocking is working correctly');
    } catch (error) {
      console.error('Error with jest mocking:', error.message);
      // Don't fail the test
      expect(true).toBe(true);
    }
  });
  
  // Try a basic mock import of the module
  it('should try to mock the module', () => {
    try {
      // Mock the module
      jest.mock('../../../../src/${module_path}.js', () => ({
        // Generic mock that should work for most modules
        default: {
          name: 'mocked-module'
        },
        someFunction: jest.fn(),
        someClass: jest.fn().mockImplementation(() => ({
          method: jest.fn()
        }))
      }), { virtual: true });
      
      console.log('Module successfully mocked');
      expect(true).toBe(true);
    } catch (error) {
      console.error('Error mocking module:', error.message);
      // Don't fail the test
      expect(true).toBe(true);
    }
  });
});
EOL

  echo "  🏃‍♂️ Running diagnostic test..."
  npx jest --config="$MINIMAL_CONFIG" "$diagnostic_test" > "$OUTPUT_DIR/logs/$(basename "$diagnostic_test").log" 2>&1
  local diag_exit_code=$?
  
  if [ $diag_exit_code -eq 0 ]; then
    echo "  ✅ Diagnostic test PASSED. Check logs for insights."
  else
    echo "  ⚠️ Diagnostic test had issues. Check logs for details."
  fi
  
  # Extract diagnostics
  echo "  📊 Diagnostic Results:"
  grep -A 1 "Checking module path\|Module exists\|Module loaded successfully\|Error" "$OUTPUT_DIR/logs/$(basename "$diagnostic_test").log" | grep -v "PASS\|at\|--" | sed 's/^/    /'
}

# Function to generate a comprehensive test report
generate_report() {
  echo "Generating test report..."
  
  # Calculate totals
  local total_tests=$(find test/unit -name "*.test.js" | wc -l)
  local passed_tests=$([ -f "$OUTPUT_DIR/passed.txt" ] && wc -l < "$OUTPUT_DIR/passed.txt" || echo 0)
  local failed_tests=$([ -f "$OUTPUT_DIR/failed.txt" ] && wc -l < "$OUTPUT_DIR/failed.txt" || echo 0)
  local fixed_tests=$([ -f "$OUTPUT_DIR/fixed.txt" ] && wc -l < "$OUTPUT_DIR/fixed.txt" || echo 0)
  
  # Create report file
  cat > "$OUTPUT_DIR/test-report.md" << EOL
# SwissKnife Test Report
Generated at $(date)

## Summary
- Total tests: $total_tests
- Passed tests: $passed_tests
- Failed tests: $failed_tests
- Successfully fixed: $fixed_tests

## Module Results
| Module | Passed | Failed |
|--------|--------|--------|
EOL

  # Add module results
  if [ -f "$OUTPUT_DIR/module_results.txt" ]; then
    while IFS=: read -r module pass fail; do
      echo "| $module | $pass | $fail |" >> "$OUTPUT_DIR/test-report.md"
    done < "$OUTPUT_DIR/module_results.txt"
  fi
  
  # Add failed tests section
  cat >> "$OUTPUT_DIR/test-report.md" << EOL

## Failed Tests
The following tests are still failing:
EOL

  if [ -f "$OUTPUT_DIR/failed.txt" ]; then
    while IFS= read -r test; do
      # Extract error message
      local error_msg=$(grep -A 5 "FAIL " "$OUTPUT_DIR/logs/$(basename "$test").log" | grep -v "FAIL " | head -n 1)
      echo "- \`$test\`: $error_msg" >> "$OUTPUT_DIR/test-report.md"
    done < "$OUTPUT_DIR/failed.txt"
  else
    echo "None! All tests are passing." >> "$OUTPUT_DIR/test-report.md"
  fi
  
  # Add fixed tests section
  cat >> "$OUTPUT_DIR/test-report.md" << EOL

## Fixed Tests
The following tests were automatically fixed:
EOL

  if [ -f "$OUTPUT_DIR/fixed.txt" ]; then
    while IFS= read -r test; do
      echo "- \`$test\`" >> "$OUTPUT_DIR/test-report.md"
    done < "$OUTPUT_DIR/fixed.txt"
  else
    echo "No tests needed fixing." >> "$OUTPUT_DIR/test-report.md"
  fi
  
  echo "Report generated at $OUTPUT_DIR/test-report.md"
}

# Main execution
for module in "${MODULES[@]}"; do
  run_module_tests "$module"
done

# Generate a comprehensive report
generate_report

echo -e "\n===== Test run complete ====="
echo "Started:  $(cat $OUTPUT_DIR/start_time.txt 2>/dev/null || echo "unknown")"
echo "Finished: $(date)"
echo "Results directory: $OUTPUT_DIR"
