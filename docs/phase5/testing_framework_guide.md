# SwissKnife Testing Framework

This document provides comprehensive information about the SwissKnife testing framework, including how to run tests, extend existing tests, and create new tests.

## Table of Contents

- [Overview](#overview)
- [Testing Structure](#testing-structure)
- [Running Tests](#running-tests)
  - [Running All Tests](#running-all-tests)
  - [Running Phase-Specific Tests](#running-phase-specific-tests)
  - [Running Individual Test Files](#running-individual-test-files)
- [Writing Tests](#writing-tests)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Benchmark Tests](#benchmark-tests)
- [Test Mocking](#test-mocking)
- [Code Coverage](#code-coverage)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

## Overview

The SwissKnife testing framework is built on Jest and organized by project phase and test type. The framework covers:

- **Unit tests**: Test individual components in isolation
- **Integration tests**: Test interactions between components
- **End-to-End tests**: Test complete workflows from the user's perspective
- **Benchmark tests**: Measure performance of critical components

## Testing Structure

```
test/
├── unit/                   # Unit tests
│   ├── phase1/             # Phase 1 component tests
│   ├── phase2/             # Phase 2 component tests
│   ├── phase3/             # Phase 3 component tests
│   ├── phase4/             # Phase 4 component tests
│   ├── performance/        # Phase 5 performance tests
│   ├── release/            # Phase 5 release tests
│   ├── testing/            # Phase 5 testing tools
│   ├── documentation/      # Phase 5 documentation tools
│   └── ux/                 # Phase 5 UX enhancements
├── integration/            # Integration tests
│   ├── phase1/             # Phase 1 integration tests
│   ├── phase2/             # Phase 2 integration tests
│   ├── phase3/             # Phase 3 integration tests
│   ├── phase4/             # Phase 4 integration tests
│   └── phase5.test.ts      # Phase 5 integration tests
├── e2e/                    # End-to-end tests
│   ├── cli/                # CLI-specific E2E tests
│   ├── cli-workflows/      # CLI workflow E2E tests
│   ├── task-execution/     # Task execution E2E tests
│   └── all-phases.test.js  # Complete E2E tests for all phases
├── benchmark/              # Benchmark tests
│   ├── phase1.benchmark.ts # Phase 1 benchmarks
│   ├── phase2.benchmark.ts # Phase 2 benchmarks
│   ├── phase3.benchmark.ts # Phase 3 benchmarks
│   ├── phase4.benchmark.ts # Phase 4 benchmarks
│   └── phase5.benchmark.ts # Phase 5 benchmarks
├── mocks/                  # Mock implementations
├── fixtures/               # Test fixtures
└── utils/                  # Test utilities
```

## Running Tests

### Running All Tests

To run all tests in the project:

```bash
npm test
```

To run all phase-specific tests:

```bash
npm run test:all-phases
```

### Running Phase-Specific Tests

Run tests for a specific phase:

```bash
npm run test:phase1  # Run all Phase 1 tests
npm run test:phase2  # Run all Phase 2 tests
npm run test:phase3  # Run all Phase 3 tests
npm run test:phase4  # Run all Phase 4 tests
npm run test:phase5  # Run all Phase 5 tests
```

### Running Tests by Type

Run tests by their type:

```bash
npm run test:unit        # Run all unit tests
npm run test:integration # Run all integration tests
npm run test:e2e         # Run all end-to-end tests
npm run test:benchmark   # Run all benchmark tests
```

### Running Individual Test Files

Run individual test files using Jest directly:

```bash
npx jest path/to/test/file.test.ts
```

For example:

```bash
npx jest test/unit/phase1/components.test.ts
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual components in isolation. Create them in the appropriate phase directory:

```typescript
// Example unit test for a Phase 1 component
// test/unit/phase1/config-manager.test.ts

describe('ConfigurationManager', () => {
  let configManager;
  
  beforeEach(() => {
    configManager = new ConfigurationManager({ inMemory: true });
  });
  
  test('should store and retrieve a configuration value', () => {
    configManager.set('test.key', 'test-value');
    expect(configManager.get('test.key')).toBe('test-value');
  });
  
  // More tests...
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly:

```typescript
// Example integration test for Phase 2
// test/integration/phase2/agent-task.test.ts

describe('AI Agent and Task System Integration', () => {
  let agent;
  let taskSystem;
  
  beforeEach(async () => {
    agent = new AIAgent({ /* config */ });
    taskSystem = new TaskSystem({ /* config */ });
    
    await agent.initialize();
    await taskSystem.initialize();
  });
  
  test('should create a task from agent output', async () => {
    const agentOutput = await agent.generateText('Test prompt');
    const task = await taskSystem.createTask({
      type: 'process',
      input: { content: agentOutput }
    });
    
    expect(task.id).toBeDefined();
    expect(task.input.content).toBe(agentOutput);
  });
  
  // More tests...
});
```

### End-to-End Tests

E2E tests validate the application from a user's perspective:

```javascript
// Example E2E test for CLI
// test/e2e/cli/phase1-commands.test.js

describe('SwissKnife CLI - Phase 1 E2E Tests', () => {
  test('should display help information', async () => {
    const { stdout, code } = await runCLI(['--help']);
    
    expect(code).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Commands:');
  });
  
  // More tests...
});
```

### Benchmark Tests

Benchmark tests measure the performance of key components:

```typescript
// Example benchmark test
// test/benchmark/phase1.benchmark.ts

test('get() performance', async () => {
  const results = await benchmark(() => {
    configManager.get('test.string');
    configManager.get('test.number');
    configManager.get('test.boolean');
    configManager.get('test.object');
    configManager.get('test.array');
  });
  
  console.log('ConfigurationManager.get() performance:', results);
  expect(results.avg).toBeLessThan(5); // Should be under 5ms
});
```

## Test Mocking

SwissKnife uses Jest's mocking capabilities to isolate components. Mock implementations are kept in the `test/mocks` directory:

```typescript
// Example mock for a scheduler
// test/mocks/scheduler/enhanced-fibonacci-heap.js

module.exports = {
  FibonacciHeapScheduler: class MockFibonacciHeapScheduler {
    constructor(options = {}) {
      this.tasks = new Map();
      this.maxPriority = options.maxPriority || 10;
      this.defaultPriority = options.defaultPriority || 5;
    }
    
    add(taskId, priority = this.defaultPriority) {
      this.tasks.set(taskId, { id: taskId, priority });
      return taskId;
    }
    
    extractNext() {
      // Return highest priority task
      if (this.tasks.size === 0) return null;
      
      let highestPriority = 0;
      let highestTask = null;
      
      for (const [id, task] of this.tasks.entries()) {
        if (task.priority > highestPriority) {
          highestPriority = task.priority;
          highestTask = { id, ...task };
        }
      }
      
      if (highestTask) {
        this.tasks.delete(highestTask.id);
      }
      
      return highestTask;
    }
    
    // Additional methods...
  }
};
```

## Code Coverage

To generate a code coverage report:

```bash
npm run test:coverage
```

This will create a coverage report in the `coverage/` directory. You can view the HTML report by opening `coverage/lcov-report/index.html` in your browser.

## Continuous Integration

All tests are automatically run in the CI/CD pipeline after each commit or pull request. The configuration is defined in `.github/workflows/test.yml`.

## Best Practices

1. **Test Organization**: Organize tests by phase and type for better maintainability
2. **Isolation**: Each test should be independent and not rely on state from other tests
3. **Mocking**: Use mocks for external dependencies to isolate the component under test
4. **Coverage**: Aim for high test coverage, especially for critical components
5. **Documentation**: Document complex test setups and any non-obvious testing strategies
6. **Performance**: Keep tests fast to enable quick feedback cycles
7. **Fixtures**: Use test fixtures for complex test data setups
8. **Readability**: Write clear test descriptions that explain what is being tested
9. **Maintainability**: Refactor tests when necessary to keep them maintainable
10. **Extension**: When adding new components, add corresponding tests in all relevant categories
