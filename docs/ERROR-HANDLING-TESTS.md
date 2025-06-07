# SwissKnife Error Handling Test Suite

This directory contains comprehensive tests for the SwissKnife error handling system. The tests are designed to verify the correct implementation and functionality of the `AppError` class and `ErrorManager` across different module systems and usage patterns.

## Quick Start

To run all error handling tests:

```bash
# Run comprehensive tests with detailed reporting
./test-error-handling.sh

# Run quick verification only
./test-error-handling.sh --quick
```

## Test Components

The error handling test suite includes several components:

1. **TypeScript Tests** (`test/unit/utils/errors/error-handling.test.ts`)
   - Tests the TypeScript implementation of the error handling system
   - Verifies type safety, interface compliance, and TypeScript-specific features

2. **JavaScript Tests** (`test/unit/utils/errors/complete-error-handling.test.js`)
   - Comprehensive tests for JavaScript usage of the error handling system
   - Tests error creation, handling, serialization, and recovery mechanisms

3. **ESM Module Tests** (`error-tests-complete.mjs`)
   - Tests compatibility with ECMAScript modules
   - Ensures the error handling system works in modern ESM environments

4. **Original Error Tests** (`error-handling-tests.js`)
   - Legacy test suite to ensure backward compatibility
   - Provides additional coverage of edge cases

5. **Quick Verification** (`quick-verify-errors.js`)
   - Fast verification script to check basic functionality
   - Useful for quick sanity checks during development

## Test Reports

After running the full test suite, a detailed report is generated in `ERROR-HANDLING-TEST-REPORT.md`. This report includes:

- Overall test statistics (pass/fail rates)
- Coverage metrics for each test suite
- Detailed failure information (if any)
- Performance metrics (execution time)

## Test Infrastructure

### Configuration Files

- **`jest-error-typescript.config.cjs`**: Jest configuration for TypeScript error handling tests
- **`error-jest.config.cjs`**: Jest configuration for JavaScript error tests
- **`babel.config.cjs`**: Babel configuration for transpiling TypeScript/ESM

### Test Utilities

- **`run-error-tests.cjs`**: Main test runner for executing multiple test suites
- **`generate-error-test-report.cjs`**: Test reporter for generating detailed reports
- **`test-error-handling.sh`**: Shell script for running tests with proper output formatting

### Mock Implementations

- **`test/mocks/errors/app-error.js`**: Mock implementation of the AppError class
- **`test/mocks/errors/manager.js`**: Mock implementation of the ErrorManager

## Adding New Tests

When adding new tests:

1. Place TypeScript tests in `test/unit/utils/errors/` with a `.test.ts` extension
2. Place JavaScript tests in `test/unit/utils/errors/` with a `.test.js` extension
3. Add the new test to the test suites in `generate-error-test-report.cjs`
4. Update test documentation in this README

## Error System Structure

The tests cover the following components of the error handling system:

1. **AppError Class**: 
   - Custom error class with additional properties (code, data, category, statusCode, cause)
   - Serialization via toJSON for reporting and logging
   - Error chaining with the cause property

2. **ErrorManager**:
   - Singleton instance for application-wide error handling
   - Registration of error handlers based on error codes
   - Default and fallback error handling
   - Error categorization and severity determination
   - Formatting for consistent error messages
   - Error reporting to monitoring systems
   - Recovery mechanisms (retry, circuit breaker)

## Troubleshooting

If tests fail:

1. Check the detailed error report in `ERROR-HANDLING-TEST-REPORT.md`
2. Verify that all dependencies are installed correctly
3. Check that the error handling system is properly imported in test files
4. Ensure the mock implementations match the actual implementation interfaces
