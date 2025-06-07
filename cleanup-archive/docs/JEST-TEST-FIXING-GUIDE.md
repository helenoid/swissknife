# SwissKnife Jest Test Fixing Guide

This document explains the strategies and fixes implemented to resolve Jest test failures in the SwissKnife project.

## Key Issues and Solutions

### 1. ESM vs CommonJS Compatibility

**Problem**: SwissKnife uses ES modules (`"type": "module"` in package.json), but Jest and some libraries expect CommonJS.

**Solutions**:
- Created a unified Jest configuration (`jest.unified.config.cjs`) that transforms modules properly
- Added appropriate Babel configuration for transforming between module formats
- Used appropriate `moduleNameMapper` to handle extensions and path mappings
- Created direct test scripts that bypass Jest for core component validation

### 2. Missing .js Extensions in Imports

**Problem**: ES modules require explicit file extensions in imports, but many imports in the codebase were missing them.

**Solutions**:
- Created a script to automatically add `.js` extensions to imports
- Created a script to fix redundant duplicate `.js` extensions (like `.js.js`, `.js.js.js.js`)
- Modified the module resolution in Jest config to handle missing extensions
- Fixed import statements in all test files

### 3. TypeScript/JavaScript Interoperability

**Problem**: TypeScript tests trying to use JavaScript implementations and vice versa, causing compatibility issues.

**Solutions**:
- Fixed FibonacciHeap implementation to avoid const assignment issues
- Added missing accessor methods to the DAG implementation
- Properly configured TypeScript transformation in Jest
- Created type declarations for test compatibility

### 4. React Component Testing

**Problem**: Testing React components (like ModelSelector) requires proper mocking of React hooks and components.

**Solutions**:
- Created a completely updated test for ModelSelector with proper React mocking
- Mocked React hooks like useState, useEffect, etc.
- Mocked Ink components for proper rendering

### 5. MCP SDK Integration

**Problem**: Tests using the Model Context Protocol SDK failed due to complex dependencies.

**Solutions**:
- Created a mock implementation of the MCP SDK
- Fixed import paths in MCP-related tests
- Simplified MCP test to focus on core functionality

### 6. Chai/Jest Assertion Incompatibility

**Problem**: Many tests use Chai assertions, which conflict with Jest's built-in assertion system.

**Solutions**:
- Created a Jest-compatible Chai stub (`chai-simple.js`)
- Created an enhanced Chai compatibility layer (`chai-enhanced.js`) with more complete assertion support
- Updated test assertions to be compatible with both systems
- Added global setup in unified-setup.js to create consistent testing environment

## Scripts Provided

1. **`apply-common-fixes.sh`**: Applies common fixes like adding .js extensions and fixing implementation issues
2. **`fix-duplicate-extensions.sh`**: Fixes redundant .js extensions in imports (e.g., .js.js -> .js)
3. **`fix-test-assertions.sh`**: Fixes test assertions to use a consistent style
4. **`fix-model-selector-test.sh`**: Specifically fixes the ModelSelector component test
5. **`fix-mcp-tests.sh`**: Fixes MCP-related tests
6. **`fix-and-run-tests.sh`**: Master script that runs all fixers and then runs the tests
7. **`run-direct-tests.sh`**: Directly tests core components without Jest
8. **`test-fibonacci-direct.sh`**: Directly tests FibonacciHeap in isolation
9. **`run-master-tests.sh`**: New comprehensive test runner with detailed reporting

## Unified Jest Configuration

The `jest.unified.config.cjs` file is a comprehensive Jest configuration that addresses all the issues:

- Properly transforms TypeScript and JavaScript files
- Handles ES module extensions
- Configures proper module resolution
- Sets appropriate timeouts for tests
- Integrates with the unified test setup

## Chai Compatibility Layer

For tests using Chai assertions, we've created two compatibility layers:

1. **`chai-simple.js`**: A basic implementation for simple assertions
2. **`chai-enhanced.js`**: A more complete implementation with support for complex assertions

The enhanced version supports:
- `expect().to.equal()`
- `expect().to.deep.equal()`
- `expect().to.be.true/false/null/undefined`
- `expect().to.exist`
- `expect().to.include()`
- `expect().to.throw()`
- `expect().to.be.a(type)`
- Additional `assert` functions

## Direct Testing Approach

For critical components, we've created direct test scripts that don't rely on Jest:

```bash
./run-direct-tests.sh  # Tests multiple components
./test-fibonacci-direct.sh  # Tests FibonacciHeap specifically
```

These scripts:
- Load the implementation directly using Node.js
- Test the core functionality without Jest dependencies
- Validate that the implementations work correctly
- Help isolate Jest-specific issues from implementation bugs

## How to Run Tests

After applying the fixes, you can run tests using the unified configuration:

```bash
npx jest --config=jest.unified.config.cjs test/path/to/test --no-coverage
```

Or use the provided scripts:

```bash
./fix-and-run-tests.sh  # Apply fixes and run tests
./run-master-tests.sh   # Run tests with comprehensive reporting
```

## Adding New Tests

When adding new tests, keep these guidelines in mind:

1. Always use `.js` extensions in import statements
2. Ensure proper mocking of dependencies
3. Follow the examples in fixed tests for proper assertion style
4. Use the enhanced Chai compatibility layer for complex assertions

## Troubleshooting Common Issues

- **Missing extension errors**: Use the apply-common-fixes.sh script to add .js extensions
- **React hook errors**: Ensure React is properly mocked in component tests
- **Module not found errors**: Check the import paths and make sure they have the correct extensions
- **TypeScript errors**: Ensure the types are compatible with the implementation
- **Assertion errors**: Check if you're using Chai assertions and make sure the enhanced compatibility layer is being used
- **Timeout errors**: Increase the test timeout in the Jest configuration if necessary
