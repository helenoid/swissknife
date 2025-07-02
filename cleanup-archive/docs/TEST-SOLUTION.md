# SwissKnife Test Solution

This repository contains a comprehensive solution for running and fixing all tests in the SwissKnife project.

## Test Runners

We've created several test runners to address different test scenarios:

### 1. Master Test Runner

Run all JavaScript tests with proper configuration:

```bash
./master-test-runner.sh
```

### 2. TypeScript Test Runner

Run TypeScript tests with TypeScript-specific configuration:

```bash
./typescript-test-runner.sh
```

### 3. Worker Test Runner

Run worker thread system tests:

```bash
./worker-test-runner.sh
```

### 4. Worker Pool Test Runner

Run specific tests for the worker pool implementation:

```bash
./run-pool-test.sh
```

### 5. Complete Test Runner

Run all tests in a logical sequence with comprehensive reporting:

```bash
./complete-test-runner.sh
```

### 6. Unified Test Runner (Recommended)

This is a simplified but powerful test runner that can run all tests or specific test patterns:

```bash
# Run all tests
./unified-test-runner.sh

# Run specific tests
./unified-test-runner.sh "test/unit/utils/**/*.test.js"
```

### 7. Test Sweeper

Analyze and categorize tests to identify failing patterns:

```bash
# Run in sequential mode (test by test)
./test-sweeper.sh sequential

# Run by category
./test-sweeper.sh category

# Run specific pattern
./test-sweeper.sh sequential "workers|pool"
```

### 8. Auto Test Fixer

Automatically detect and fix common test issues:

```bash
# Analyze without fixing
./auto-test-fixer.sh analyze

# Fix issues
./auto-test-fixer.sh fix

# Fix specific pattern
./auto-test-fixer.sh fix "workers"

# Backup test files
./auto-test-fixer.sh backup

# Restore from backup
./auto-test-fixer.sh restore
```

### 9. Unified Test Solution

The most comprehensive approach that ties everything together:

```bash
./unified-test-solution.sh
```

## Test Configurations

We've created specialized Jest configurations for different test scenarios:

1. **jest.unified.config.cjs** - Main configuration addressing most common issues
2. **jest.master.config.cjs** - Standard JavaScript tests
3. **jest.typescript.config.cjs** - TypeScript-specific tests
4. **jest.workers.config.cjs** - Worker thread tests
5. **jest.pool.config.cjs** - Worker pool specific tests

## Setup Files

These setup files configure the Jest environment for different test types:

1. **test/setup-jest-master.js** - Standard setup
2. **test/setup-jest-typescript.js** - TypeScript setup
3. **test/setup-jest-workers.js** - Worker thread setup
4. **test/unified-setup.js** - Comprehensive setup for all tests

## Mock Implementations

We've created several mock implementations to support testing:

1. **test/mocks/workers/worker.js** - Mock Worker class for worker thread tests

## Common Issues Fixed

1. **Module Resolution** - Fixed .js extension issues in imports
2. **Worker Thread Mocking** - Created proper mocks for worker_threads module
3. **ESM/CommonJS Interoperability** - Fixed module system conflicts
4. **TypeScript Integration** - Fixed TypeScript compilation in tests
5. **Path Resolution** - Fixed hardcoded relative paths

## Troubleshooting Guide

### Worker Thread Tests

If worker thread tests are failing:

1. Ensure worker_threads module is properly mocked
2. Check that test/mocks/workers/worker.js exists and is properly implemented
3. Run `./auto-test-fixer.sh fix "workers"` to automatically fix common issues
4. Run `./run-pool-test.sh` to focus specifically on worker pool tests

### TypeScript Tests

If TypeScript tests are failing:

1. Check for TypeScript compilation errors
2. Verify that .js extensions are used in imports
3. Run `./auto-test-fixer.sh fix "typescript"` to fix common TypeScript test issues

### Error Handling Tests

If error handling tests are failing:

1. Check for proper error propagation
2. Verify that async/await is properly used in tests
3. Run error tests with `./unified-test-runner.sh "error"`

## Maintenance

### Adding New Tests

When adding new tests:

1. Follow the established patterns for imports (.js extensions)
2. Use appropriate mocking for external dependencies
3. Run `./auto-test-fixer.sh analyze` to check for common issues

### Updating Test Infrastructure

If you need to update the test infrastructure:

1. Modify the relevant Jest configuration files
2. Update setup files if needed
3. Test your changes with `./unified-test-solution.sh`
