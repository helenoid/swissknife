#!/bin/bash

# Comprehensive Error Handling Test Suite Runner
# This script runs all error handling tests to ensure the error handling system is working properly

echo "=============================================================="
echo "SwissKnife Error Handling Comprehensive Test Suite"
echo "=============================================================="

# Set node options
export NODE_OPTIONS="--no-warnings --experimental-vm-modules"

# Start with a clean slate
rm -f ERROR-HANDLING-TEST-REPORT.md

# Keep track of test results
total_tests=0
passed_tests=0
failed_tests=0

echo "Running direct error tests..."
node direct-error-tests.js
if [ $? -eq 0 ]; then
  echo "✅ Direct error tests passed"
  ((passed_tests++))
else
  echo "❌ Direct error tests failed"
  ((failed_tests++))
fi
((total_tests++))

echo -e "\nRunning error-tests-complete.mjs..."
node error-tests-complete.mjs
if [ $? -eq 0 ]; then
  echo "✅ Complete error tests passed"
  ((passed_tests++))
else
  echo "❌ Complete error tests failed"
  ((failed_tests++))
fi
((total_tests++))

echo -e "\nRunning CommonJS error tests..."
if [ -f "error-tests-commonjs.cjs" ]; then
  node error-tests-commonjs.cjs
  if [ $? -eq 0 ]; then
    echo "✅ CommonJS error tests passed"
    ((passed_tests++))
  else
    echo "❌ CommonJS error tests failed"
    ((failed_tests++))
  fi
  ((total_tests++))
else
  echo "ℹ️ CommonJS error tests not found, skipping"
fi

echo -e "\nRunning TypeScript error tests..."
if [ -f "error-handling-direct-test.ts" ]; then
  ts-node error-handling-direct-test.ts
  if [ $? -eq 0 ]; then
    echo "✅ TypeScript error tests passed"
    ((passed_tests++))
  else
    echo "❌ TypeScript error tests failed"
    ((failed_tests++))
  fi
  ((total_tests++))
else
  echo "ℹ️ TypeScript error tests not found, skipping"
fi

# Generate final report
echo -e "\n=============================================================="
echo "SwissKnife Error Handling Test Results"
echo "=============================================================="
echo "Tests run: $total_tests"
echo "Tests passed: $passed_tests"
echo "Tests failed: $failed_tests"

if [ $failed_tests -eq 0 ]; then
  echo -e "\n✅ All error handling tests passed!"
  
  # Create consolidated test report
  cat > ERROR-HANDLING-CONSOLIDATED-REPORT.md << EOF
# SwissKnife Error Handling Consolidated Test Report

## Summary
- **Status**: ✅ PASSED
- **Date**: $(date +"%Y-%m-%d %H:%M:%S")
- **Tests Run**: $total_tests
- **Tests Passed**: $passed_tests

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
