#!/bin/bash
# Test Runner for SwissKnife Project
# This script helps run individual tests in isolated environments
# to identify and fix issues one by one.

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

echo -e "${BLUE}SwissKnife Test Runner${NC}"
echo "=========================="
echo ""

# Create results directory
RESULTS_DIR="./test-results"
mkdir -p "$RESULTS_DIR"

# Function to run a test and record the result
run_test() {
  local test_path=$1
  local config=${2:-"jest-fixed-modules.config.cjs"}
  local result_file="$RESULTS_DIR/$(basename $test_path | sed 's/\//_/g').result"
  
  echo -e "${YELLOW}Running test:${NC} $test_path"
  echo -e "${YELLOW}Using config:${NC} $config"
  echo ""
  
  npx jest "$test_path" --config="$config" --verbose > "$result_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED:${NC} $test_path"
    echo "$test_path: PASS" >> "$RESULTS_DIR/passing.txt"
    return 0
  else
    echo -e "${RED}❌ FAILED:${NC} $test_path"
    echo "$test_path: FAIL" >> "$RESULTS_DIR/failing.txt"
    
    # Extract error information 
    echo "Last few lines of error:"
    tail -10 "$result_file"
    echo ""
    echo "See full error log in: $result_file"
    return 1
  fi
}

# Function to run a category of tests
run_category() {
  local category=$1
  local config=${2:-"jest-fixed-modules.config.cjs"}
  
  echo -e "${BLUE}Running category:${NC} $category"
  echo "-------------------------"
  
  case "$category" in
    "super-minimal")
      run_test "test/super-minimal.test.js" "$config"
      ;;
    "fibonacci")
      run_test "test/unit/tasks/fibonacci-heap.test.ts" "$config"
      ;;
    "models")
      run_test "test/unit/models/registry.test.ts" "$config"
      ;;
    "storage")
      run_test "test/unit/storage/storage.test.ts" "$config"
      ;;
    "utils")
      run_test "test/unit/utils" "$config"
      ;;
    "all")
      run_test "test/super-minimal.test.js" "$config"
      run_test "test/unit/tasks/fibonacci-heap.test.ts" "$config"
      run_test "test/unit/models/registry.test.ts" "$config"
      run_test "test/unit/storage/storage.test.ts" "$config"
      ;;
    *)
      echo "Unknown category: $category"
      ;;
  esac
  
  echo ""
}

# Check command-line arguments
if [ $# -eq 0 ]; then
  echo "Usage: ./test-runner.sh <category> [config]"
  echo ""
  echo "Categories:"
  echo "  super-minimal - Run super minimal tests"
  echo "  fibonacci     - Run fibonacci heap tests"
  echo "  models        - Run model registry tests"
  echo "  storage       - Run storage tests"
  echo "  utils         - Run utility function tests"
  echo "  all           - Run all tests"
  echo ""
  echo "Configs:"
  echo "  jest-fixed-modules.config.cjs (default)"
  echo "  jest-ts.config.cjs"
  echo "  jest-unified.config.cjs"
  echo "  jest.config.cjs"
  exit 1
fi

# Run the specified category
run_category "$1" "${2:-jest-fixed-modules.config.cjs}"

# Generate a summary
echo -e "${BLUE}Test Summary${NC}"
echo "============"
echo ""

echo "Passing Tests:"
if [ -f "$RESULTS_DIR/passing.txt" ]; then
  cat "$RESULTS_DIR/passing.txt" | sort | uniq | sed 's/^/- /'
else
  echo "None"
fi

echo ""
echo "Failing Tests:"
if [ -f "$RESULTS_DIR/failing.txt" ]; then
  cat "$RESULTS_DIR/failing.txt" | sort | uniq | sed 's/^/- /'
else
  echo "None"
fi
