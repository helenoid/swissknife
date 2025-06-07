# SwissKnife Error Handling Test Failures

## Summary
- **Status**: ❌ FAILED
- **Date**: 2025-05-20 23:58:09
- **Test File**: `direct-error-tests.js`
- **Exit Code**: 1

## Troubleshooting Steps
1. Check that TypeScript definitions match JavaScript implementations
2. Ensure error handling is consistent between ESM and CommonJS modules
3. Verify mocks match the real implementations
4. Check for circular dependencies in error handling system

## Common Issues
- Module resolution issues between test and source files
- Jest configuration conflicts with ESM modules
- Missing mock implementations for dependencies

Please examine the test output above for specific test failures and stack traces.
