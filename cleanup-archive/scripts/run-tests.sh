#!/bin/bash

# Universal Test Runner Script for SwissKnife Project
# --------------------------------------------------

# Color definitions for better output
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Error counter
ERRORS=0
TOTAL=0
PASSED=0

# Help message
function show_help {
  echo -e "${BLUE}SwissKnife Universal Test Runner${NC}"
  echo "Usage: ./run-tests.sh [options] [test_pattern]"
  echo ""
  echo "Options:"
  echo "  -h, --help             Show this help message"
  echo "  -a, --all              Run all tests"
  echo "  -p, --phase <number>   Run specific phase tests (1-4)"
  echo "  -u, --unit             Run only unit tests"
  echo "  -i, --integration      Run only integration tests"
  echo "  -c, --component        Run only component tests"
  echo "  -d, --debug            Run with extra debug information"
  echo "  -v, --verbose          Run tests with verbose output"
  echo ""
  echo "Examples:"
  echo "  ./run-tests.sh -a                  Run all tests"
  echo "  ./run-tests.sh -p 3                Run Phase 3 tests"
  echo "  ./run-tests.sh -u -p 3             Run Phase 3 unit tests"
  echo "  ./run-tests.sh \"Fibonacci Heap\"    Run tests matching pattern"
}

# Log functions for consistent messaging
function log_info {
  echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warning {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error {
  echo -e "${RED}[ERROR]${NC} $1"
}

function log_header {
  echo -e "\n${CYAN}=======================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}=======================================${NC}"
}

# Function to run tests
function run_test {
  test_name=$1
  test_pattern=$2
  jest_options=$3
  
  log_info "Running test: ${test_name}"
  
  if [ -n "$DEBUG_MODE" ]; then
    echo "Command: npx jest \"$test_pattern\" --config=jest.consolidated.config.cjs $jest_options"
  fi
  
  ((TOTAL++))
  npx jest "$test_pattern" --config=jest.consolidated.config.cjs $jest_options
  
  if [ $? -eq 0 ]; then
    log_success "$test_name tests passed"
    ((PASSED++))
    return 0
  else
    log_error "$test_name tests failed"
    ((ERRORS++))
    return 1
  fi
}

# Default options
PHASE=""
TEST_TYPE=""
TEST_PATTERN=""
VERBOSE=""
DEBUG_MODE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    -h|--help)
      show_help
      exit 0
      ;;
    -a|--all)
      TEST_TYPE="all"
      shift
      ;;
    -p|--phase)
      PHASE="$2"
      shift
      shift
      ;;
    -u|--unit)
      TEST_TYPE="unit"
      shift
      ;;
    -i|--integration)
      TEST_TYPE="integration"
      shift
      ;;
    -c|--component)
      TEST_TYPE="component"
      shift
      ;;
    -d|--debug)
      DEBUG_MODE="true"
      shift
      ;;
    -v|--verbose)
      VERBOSE="--verbose"
      shift
      ;;
    *)
      TEST_PATTERN="$1"
      shift
      ;;
  esac
done

# Show current settings if debug mode is enabled
if [ -n "$DEBUG_MODE" ]; then
  log_info "Debug Information:"
  echo "PHASE: $PHASE"
  echo "TEST_TYPE: $TEST_TYPE"
  echo "TEST_PATTERN: $TEST_PATTERN"
  echo "VERBOSE: $VERBOSE"
fi

# Set additional Jest options
JEST_OPTIONS="$VERBOSE"
if [ -n "$TEST_PATTERN" ]; then
  JEST_OPTIONS="$JEST_OPTIONS -t \"$TEST_PATTERN\""
fi

# Default to running all tests if no specific options provided
if [ -z "$TEST_TYPE" ] && [ -z "$PHASE" ] && [ -z "$TEST_PATTERN" ]; then
  TEST_TYPE="all"
fi

# Run TypeScript type checking first
log_header "Type Checking"
npx tsc --project tsconfig.test.json --noEmit

if [ $? -ne 0 ]; then
  log_error "TypeScript type checking failed"
  ((ERRORS++))
else
  log_success "TypeScript type checking passed"
fi

# Run tests based on selected options
if [ "$TEST_TYPE" = "all" ] || [ -z "$TEST_TYPE" ]; then
  log_header "Running All Tests"
  
  # If phase is specified, run only tests for that phase
  if [ -n "$PHASE" ]; then
    log_info "Running Phase $PHASE tests"
    
    # Run unit tests for the specified phase
    run_test "Phase $PHASE Unit" "test/unit/phase$PHASE" "$JEST_OPTIONS"
    
    # Run integration tests for the specified phase
    run_test "Phase $PHASE Integration" "test/integration/phase$PHASE" "$JEST_OPTIONS"
  else
    # Run all unit tests
    run_test "All Unit Tests" "test/unit" "$JEST_OPTIONS"
    
    # Run all integration tests
    run_test "All Integration Tests" "test/integration" "$JEST_OPTIONS"
  fi
elif [ "$TEST_TYPE" = "unit" ]; then
  log_header "Running Unit Tests"
  
  if [ -n "$PHASE" ]; then
    # Run unit tests for the specified phase
    run_test "Phase $PHASE Unit" "test/unit/phase$PHASE" "$JEST_OPTIONS"
  else
    # Run all unit tests
    run_test "All Unit Tests" "test/unit" "$JEST_OPTIONS"
  fi
elif [ "$TEST_TYPE" = "integration" ]; then
  log_header "Running Integration Tests"
  
  if [ -n "$PHASE" ]; then
    # Run integration tests for the specified phase
    run_test "Phase $PHASE Integration" "test/integration/phase$PHASE" "$JEST_OPTIONS"
  else
    # Run all integration tests
    run_test "All Integration Tests" "test/integration" "$JEST_OPTIONS"
  fi
elif [ "$TEST_TYPE" = "component" ]; then
  log_header "Running Component Tests"
  
  if [ -n "$PHASE" ]; then
    # Run component tests for the specified phase
    run_test "Phase $PHASE Components" "test/unit/phase$PHASE/components" "$JEST_OPTIONS"
  else
    # Run all component tests across phases
    run_test "All Component Tests" "test/unit/phase*/components" "$JEST_OPTIONS"
  fi
fi

# Display test results summary
log_header "Test Summary"
echo -e "Total Tests: ${TOTAL}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${ERRORS}${NC}"

# Exit with appropriate status code
if [ $ERRORS -gt 0 ]; then
  exit 1
else
  exit 0
fi
