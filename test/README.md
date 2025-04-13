# SwissKnife Testing Framework

This document provides an overview of the testing framework created for the SwissKnife project, focusing on the Phase 1 implementation.

## Overview

The SwissKnife testing framework is designed to support comprehensive testing of all components in the system, from individual units to full end-to-end workflows. It provides mock implementations, fixtures, and utilities to make testing easier and more consistent.

## Directory Structure

```
/test
├── unit/                  # Unit tests for individual components
│   ├── commands/          # Command system tests
│   ├── config/            # Configuration system tests
│   ├── integration/       # Integration bridge tests
│   ├── models/            # Model system tests
│   ├── workers/           # Worker system tests
│   └── tasks/             # Task system tests
│
├── integration/           # Integration tests between components
│   ├── command-config/    # Command and config integration
│   ├── model-integration/ # Model provider integration
│   ├── worker-task/       # Worker and task integration
│   └── cli-service/       # CLI and service integration
│
├── e2e/                   # End-to-end workflow tests
│   ├── cli/               # CLI workflow tests
│   ├── task-execution/    # Complete task execution workflows
│   └── model-execution/   # Complete model execution workflows
│
├── mocks/                 # Mock implementations for testing
│   ├── bridges/           # Mock integration bridges
│   ├── services/          # Mock services
│   ├── models/            # Mock model providers
│   ├── workers/           # Mock worker threads
│   ├── config/            # Mock configuration
│   ├── tasks/             # Mock task system
│   └── graph/             # Mock Graph-of-Thought system
│
├── fixtures/              # Test data fixtures
│   ├── commands/          # Command test data
│   ├── config/            # Configuration test data
│   ├── tasks/             # Task test data
│   └── models/            # Model test data
│
├── utils/                 # Test utilities
│   ├── test-helpers.js    # Common test helper functions
│   ├── cli-runner.js      # CLI execution utilities
│   └── setup.js           # Test environment setup
│
└── examples/              # Example tests showcasing the framework
    ├── complex-workflow.test.js        # Example of a complex workflow test
    ├── worker-task-integration.test.js # Example of worker-task integration
    ├── cli-workflow-e2e.test.js        # Example of CLI end-to-end test
    └── graph/                          # Graph-of-Thought examples
        └── graph-of-thought.test.js    # Example of GoT system testing
```

## Key Components

### Mock Implementations

Mock implementations provide replacements for real system components, allowing isolated testing:

- **Bridges**: Mock implementations of integration bridges between components (`mock-bridge.js`, `specific-bridges.js`)
- **Models**: Mock implementations of models and providers (`mock-models.js`)
- **Workers**: Mock implementation of workers and worker pools (`mock-workers.js`)
- **Config**: Mock implementation of configuration system (`mock-config.js`)
- **Tasks**: Mock implementation of task system (`mock-tasks.js`)
- **Services**: Mock implementations of various services (`mock-services.js`)
- **Graph**: Mock implementation of Graph-of-Thought system (`mock-graph-of-thought.js`)

### Test Fixtures

Fixtures provide standardized test data for tests:

- **Commands**: Sample command definitions and execution contexts (`commands.js`)
- **Config**: Sample configuration data and schemas (`config.js`)
- **Tasks**: Sample task definitions and instances (`tasks.js`)
- **Models**: Sample models, providers, and responses (`models.js`)

### Test Utilities

Utilities provide helper functions for common testing operations:

- **Test Helpers**: Common test utilities like wait functions, mocking helpers (`test-helpers.js`)
- **CLI Runner**: Utility for running and testing CLI commands (`cli-runner.js`)
- **Setup**: Utilities for setting up test environments (`setup.js`)

### Example Tests

Example tests demonstrate how to use the framework for different testing scenarios:

- **Complex Workflow**: Testing a workflow involving multiple components
- **Worker-Task Integration**: Testing interaction between worker and task systems
- **CLI End-to-End**: Testing complete CLI workflows
- **Graph-of-Thought**: Testing the Graph-of-Thought reasoning system

## How to Use

### Setting Up a Test Environment

Use the `createTestEnvironment` function from `test/utils/setup.js` to create a complete test environment with all necessary mocks:

```javascript
const { createTestEnvironment, setupGlobalMocks } = require('../utils/setup');

// Create test environment with options
const env = createTestEnvironment({
  // Use custom configuration
  config: { 
    models: { default: 'gpt-4' } 
  },
  // Register specific providers
  providers: [sampleProviders.openai],
  // Configure task processing
  taskErrorRate: 0.2,
  taskProcessingTime: 100
});

// Optionally set up global mocks
const cleanup = setupGlobalMocks(env);

// When finished
if (cleanup) cleanup();
```

### Using Mock Components

Mock components can be used directly in tests:

```javascript
const { MockTaskManager } = require('../../mocks/tasks/mock-tasks');
const { MockWorkerPool } = require('../../mocks/workers/mock-workers');

// Create mock components
const taskManager = new MockTaskManager();
const workerPool = new MockWorkerPool({ size: 2 });

// Use the mocks in tests
await workerPool.initialize();
const taskId = await taskManager.createTask('echo', { message: 'Test' });
await taskManager.executeTask(taskId);

// Verify mock behavior
expect(taskManager.createCalls).toHaveLength(1);
expect(taskManager.executeCalls).toHaveLength(1);
```

### Using Test Fixtures

Fixtures provide standard test data:

```javascript
const { sampleCommands } = require('../../fixtures/commands/commands');
const { sampleConfigurations } = require('../../fixtures/config/config');

// Use sample command in tests
const command = sampleCommands.withOptions;
expect(command.options).toHaveLength(3);

// Use sample configuration in tests
const config = sampleConfigurations.basic;
expect(config.models.default).toBe('gpt-4');
```

### Using Test Utilities

Utilities provide helper functions for tests:

```javascript
const { wait, waitForCondition } = require('../../utils/test-helpers');
const { CLIRunner } = require('../../utils/cli-runner');

// Wait for async operations
await wait(100);

// Wait for a condition
const ready = await waitForCondition(() => service.isReady());

// Run CLI commands
const cliRunner = new CLIRunner();
const result = await cliRunner.run('help');
expect(result.exitCode).toBe(0);
```

## Testing Best Practices

1. **Use Mocks for Isolation**: Use mock implementations to isolate components during testing.
2. **Test at All Levels**: Write unit, integration, and end-to-end tests as appropriate.
3. **Use Fixtures for Consistency**: Use test fixtures for standardized test data.
4. **Make Tests Deterministic**: Avoid relying on external services or random behavior.
5. **Test Error Paths**: Test how components handle errors, not just the happy path.
6. **Keep Tests Fast**: Tests should run quickly, especially unit and integration tests.
7. **Use Clear Assertions**: Each test should have clear and specific assertions.
8. **Use Descriptive Names**: Test and describe blocks should clearly indicate what they test.

## Running Tests

Use the scripts in `package.json` to run tests:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

## Continuous Integration

Tests are automatically run on CI using GitHub Actions whenever code is pushed or a pull request is opened against the main branch. See `.github/workflows/test.yml` for details.