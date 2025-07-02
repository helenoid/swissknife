# SwissKnife Core Testing Strategy

This document outlines the strategy for testing the core functionality of the SwissKnife project while excluding CLI and GUI components.

## Test Organization

The SwissKnife codebase has the following test organization:

1. **Unit Tests**: `/test/unit/` - Tests for individual components
2. **Integration Tests**: `/test/integration/` - Tests for component interactions
3. **E2E Tests**: `/test/e2e/` - Tests for complete workflows
4. **Web Tests**: Various web-related test directories
5. **Phase-based Tests**: Tests organized by project phases (1-5)

## Core Testing Approach

To test the core functionality while excluding CLI and GUI components:

1. **Custom Jest Configuration**: We created `jest-core.config.cjs` that excludes CLI/GUI paths
2. **Targeted Test Execution**: We focus on specific directories that contain core functionality
3. **Custom Test Runner**: We created `run-core-tests.js` that runs tests in a sequential, controlled manner
4. **Mocks and Utilities**: Enhanced mock implementations for critical dependencies

## Test Configuration Details

The core test configuration (`jest-core.config.cjs`) excludes:

- `/test/unit/cli/` - CLI-specific components
- `/test/unit/ux/` - User interface components
- `/test/web_*/` - Web-related tests
- `/test/unit/entrypoints/` - CLI entry points

## Core Test Areas

Our testing strategy focuses on these core areas:

- **Storage System**: File storage, IPFS integration
- **Model System**: Model registration and execution
- **Task System**: Task definition and execution
- **AI Components**: AI agent functionality
- **Utilities**: Core utility functions

## Running the Tests

Execute the tests using our custom runner:

```bash
node run-core-tests.js
```

Or run specific core components:

```bash
npx jest test/unit/utils --config jest-core.config.cjs
npx jest test/unit/storage --config jest-core.config.cjs
```

## Notes and Limitations

- Some tests require specific environment setup and may fail
- Module resolution issues exist in some test files
- Mock implementations may need enhancement for full test coverage
- The phased approach (Phases 1-5) provides an alternative way to run tests
