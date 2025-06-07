#!/bin/bash

# Fixed comprehensive error test script
# Runs all error handling tests with proper error handling

echo "=============================================================="
echo "SwissKnife Error Handling Tests"
echo "=============================================================="

# Make sure we're using proper Node.js options
export NODE_OPTIONS="--no-warnings --experimental-vm-modules"

# Test counters
declare -i passed=0
declare -i failed=0
declare -i total=0

# Function to run a test and capture the result
run_test() {
  local name=$1
  local command=$2
  
  echo -e "\n----- Running $name -----"
  echo "$ $command"
  
  # Run the command and capture output
  local output
  if output=$(eval "$command" 2>&1); then
    echo "✅ PASSED: $name"
    ((passed++))
    return 0
  else
    echo "❌ FAILED: $name"
    echo "Error output:"
    echo "$output"
    ((failed++))
    return 1
  fi
}

# Run the direct error tests
run_test "Direct Error Tests" "node direct-error-tests.js"
((total++))

# Run the complete error tests if they exist
if [ -f "error-tests-complete.mjs" ]; then
  run_test "Complete Error Tests" "node error-tests-complete.mjs"
  ((total++))
fi

# Generate final report
echo -e "\n=============================================================="
echo "SwissKnife Error Handling Test Results"
echo "=============================================================="
echo "Tests run: $total"
echo "Tests passed: $passed"
echo "Tests failed: $failed"

if [ $failed -eq 0 ] && [ $total -gt 0 ]; then
  echo -e "\n✅ All error handling tests passed!"
  
  # Create consolidated test report
  cat > ERROR-HANDLING-CONSOLIDATED-REPORT.md << EOF
# SwissKnife Error Handling Consolidated Test Report

## Summary
- **Status**: ✅ PASSED
- **Date**: $(date +"%Y-%m-%d %H:%M:%S")
- **Tests Run**: $total
- **Tests Passed**: $passed

## Error Handling Components
- **AppError**: Custom error class with enhanced context and serialization
- **ErrorManager**: Singleton error handling and management system
- **Circuit Breaker**: Fault tolerance pattern implementation
- **Retry Mechanism**: Automated retry with backoff strategy

## Implementation Details

### AppError Features:
- Error code for categorization and lookup
- Additional context data via data property
- Error cause chaining for traceability
- Category assignment for error grouping
- HTTP status code integration for API responses
- JSON serialization support

### ErrorManager Features:
- Singleton pattern implementation
- Registrable error handlers by error code
- Fallback handler for uncaught errors
- Error categorization and severity classification
- Formatted error output for logging
- Error reporting to external systems
- Retry operation with configurable options
- Circuit breaker pattern implementation

## Recommendations
1. Add internationalization support for error messages
2. Implement half-open circuit state with automatic recovery
3. Create domain-specific error subclasses
4. Add telemetry integration for error tracking

## Next Steps
- Integrate with monitoring system for alerts
- Add dashboard for error visibility
- Create error reporting service integration
- Add error rate limiting to prevent flooding
EOF

  echo -e "\n📝 Consolidated error handling test report has been created"
  exit 0
else
  echo -e "\n❌ Some error handling tests failed"
  exit 1
fi
