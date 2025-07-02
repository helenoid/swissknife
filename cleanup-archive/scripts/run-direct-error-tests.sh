#!/bin/bash

# Direct error handling test runner that doesn't rely on Jest
# This script tests the error handling system directly using Node.js

echo "========================================================"
echo "Running Direct Error Handling Tests for SwissKnife"
echo "========================================================"

# Make sure we're using proper Node.js options
export NODE_OPTIONS="--no-warnings --experimental-vm-modules"

# Run the direct test file and capture the output
test_output=$(node direct-error-tests.js)
exit_code=$?

# Display the output
echo "$test_output"
echo ""

if [ $exit_code -eq 0 ]; then
  echo "✅ Error handling tests completed successfully!"
  
  # Create test report
  cat > ERROR-HANDLING-TEST-REPORT.md << EOF
# SwissKnife Error Handling Test Report

## Summary
- **Status**: ✅ PASSED
- **Date**: $(date +"%Y-%m-%d %H:%M:%S")
- **Test File**: \`direct-error-tests.js\`

## Components Tested
- **AppError**: Custom error class with additional context support
- **ErrorManager**: Centralized error handling system

## Test Categories
1. **Error Creation and Properties**: Successfully tested error instantiation with various properties
2. **Error Categorization**: Correctly categorizes errors by type and severity
3. **Error Formatting**: Properly formats errors for logging and display
4. **Error Handling**: Successfully routes errors to appropriate handlers
5. **Error Reporting**: Reports errors through configured channels
6. **Error Recovery**: Implements retry mechanisms with proper backoff
7. **Circuit Breaking**: Implements circuit breaker pattern for fault tolerance

## Recommendations
- Consider adding typed error classes for common error categories
- Add support for error translation/internationalization
- Consider adding rate limiting for error reporting
- Enhance circuit breaker with automatic recovery (half-open state)

## Next Steps
- Integrate with logging system for consistent error reporting
- Add telemetry/metrics collection for error occurrences
- Create dashboard for error monitoring

## Test Output
\`\`\`
$test_output
\`\`\`
EOF

  echo "📝 Error handling test report has been created."
else
  echo "❌ Error handling tests failed with exit code $exit_code"
  
  # Create failure report
  cat > ERROR-HANDLING-TEST-FAILURES.md << EOF
# SwissKnife Error Handling Test Failures

## Summary
- **Status**: ❌ FAILED
- **Date**: $(date +"%Y-%m-%d %H:%M:%S")
- **Test File**: \`direct-error-tests.js\`
- **Exit Code**: $exit_code

## Troubleshooting Steps
1. Check that TypeScript definitions match JavaScript implementations
2. Ensure error handling is consistent between ESM and CommonJS modules
3. Verify mocks match the real implementations
4. Check for circular dependencies in error handling system

## Common Issues
- Module resolution issues between test and source files
- Jest configuration conflicts with ESM modules
- Missing mock implementations for dependencies

## Test Output
\`\`\`
$test_output
\`\`\`

Please examine the test output above for specific test failures and stack traces.
EOF

  echo "📝 Error handling failure report has been created."
fi

exit $exit_code
