# SwissKnife Test Status Report
Generated on: Wed May 21 01:51:54 AM PDT 2025

## Summary

## Basic Tests
These tests validate our basic testing setup.

### Super Minimal Test: `test/super-minimal.test.js`
Using config: `jest-super-minimal.config.cjs`

```
jest-haste-map: Haste module naming collision: swissknife
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/package.json
    * <rootDir>/dist-test/package.json

jest-haste-map: Haste module naming collision: agwp2pdb
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/swissknife_old/swissknife/registry/orbitdb_kit/package.json
    * <rootDir>/swissknife_old/swissknife/worker/model_manager/orbit_kit_lib/package.json

(node:590609) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS test/super-minimal.test.js
  ✓ 1 + 1 = 2 (14 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.49 s
Ran all test suites matching test/super-minimal.test.js.
```

**Status: ✅ PASSED**

### Basic Test: `test/basic.test.js`
Using config: `jest.unified.config.cjs`

```
(node:591114) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS test/basic.test.js
  ✓ basic test (3 ms)
  ✓ async test
  Test group
    ✓ should pass
    ✓ should do math correctly (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.575 s
Ran all test suites matching test/basic.test.js.
```

**Status: ✅ PASSED**

## Unit Tests
These tests validate individual components.

## Basic Tests
These are simplified tests to verify the Jest setup.

### Super Minimal Test: `basic-error-test.mjs`
Using config: `jest.unified.config.cjs`

```
No tests found, exiting with code 1
Run with `--passWithNoTests` to exit with code 0
In /home/barberb/swissknife
  5689 files checked.
  testMatch: **/__tests__/**/*.?([mc])[jt]s?(x), **/?(*.)+(spec|test).?([mc])[jt]s?(x) - 549 matches
  testPathIgnorePatterns: /node_modules/ - 5689 matches
  testRegex:  - 0 matches
Pattern: basic-error-test.mjs - 0 matches
```

**Status: ❌ FAILED**

### Basic Test: `comprehensive-error-tests.mjs`
Using config: `jest.unified.config.cjs`

```
No tests found, exiting with code 1
Run with `--passWithNoTests` to exit with code 0
In /home/barberb/swissknife
  5689 files checked.
  testMatch: **/__tests__/**/*.?([mc])[jt]s?(x), **/?(*.)+(spec|test).?([mc])[jt]s?(x) - 549 matches
  testPathIgnorePatterns: /node_modules/ - 5689 matches
  testRegex:  - 0 matches
Pattern: comprehensive-error-tests.mjs - 0 matches
```

**Status: ❌ FAILED**

## Core Data Structure Tests
These test the fundamental data structures used by the task system.

### FibonacciHeap: `test/unit/tasks/fibonacci-heap.test.ts`
Using config: `jest.unified.config.cjs`

```
FAIL test/unit/tasks/fibonacci-heap.test.ts
  ● Test suite failed to run

    Must use import to load ES Module: /home/barberb/swissknife/src/tasks/scheduler/fibonacci-heap.js

      3 |  */
      4 |
    > 5 | import { FibonacciHeap, FibHeapNode } from '../../../src/tasks/scheduler/fibonacci-heap';
        | ^
      6 |
      7 | describe('FibonacciHeap', () => {
      8 |   let heap: FibonacciHeap<string>;

      at Runtime.requireModule (node_modules/jest-runtime/build/index.js:803:21)
      at Object.require (test/unit/tasks/fibonacci-heap.test.ts:5:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.836 s
Ran all test suites matching test/unit/tasks/fibonacci-heap.test.ts.
(node:592620) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

**Status: ❌ FAILED**

### DirectedAcyclicGraph: `test/unit/tasks/dag.test.ts`
Using config: `jest.unified.config.cjs`

```
FAIL test/unit/tasks/dag.test.ts
  ● Test suite failed to run

    Must use import to load ES Module: /home/barberb/swissknife/src/tasks/graph/dag.js

       9 | }));
      10 |
    > 11 | import { DirectedAcyclicGraph } from '@/tasks/graph/dag.js'; // Use alias
         | ^
      12 |
      13 | // Define a simple node type for testing
      14 | type TestNode = { id: string; value: number };

      at Runtime.requireModule (node_modules/jest-runtime/build/index.js:803:21)
      at Object.require (test/unit/tasks/dag.test.ts:11:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        2.134 s
Ran all test suites matching test/unit/tasks/dag.test.ts.
(node:593211) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

**Status: ❌ FAILED**

### Simplified Execution Service: `test/simplified-execution-service.test.js`
Using config: `jest.unified.config.cjs`

```
FAIL test/simplified-execution-service.test.js
  ● Test suite failed to run

    ReferenceError: jest is not defined

      4 |
      5 | // Create simple mock for ModelExecutionService
    > 6 | const mockExecuteModel = jest.fn().mockResolvedValue({
        |                          ^
      7 |   response: 'Mock response',
      8 |   usage: { 
      9 |     promptTokens: 10, 

      at jest (test/simplified-execution-service.test.js:6:26)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        2.83 s
Ran all test suites matching test/simplified-execution-service.test.js.
(node:593997) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

**Status: ❌ FAILED**

### Execution Service (Isolated): `test/execution-service-isolated.test.js`
Using config: `jest.unified.config.cjs`

```
FAIL test/execution-service-isolated.test.js
  ● Test suite failed to run

    ReferenceError: jest is not defined

      15 |
      16 |   const mockRegistry = {
    > 17 |     getModel: jest.fn().mockReturnValue(mockModel),
         |               ^
      18 |     getDefaultModel: jest.fn().mockReturnValue(mockModel)
      19 |   };
      20 |

      at jest (test/execution-service-isolated.test.js:17:15)
      at describe (test/execution-service-isolated.test.js:6:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        2.157 s
Ran all test suites matching test/execution-service-isolated.test.js.
(node:594566) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

**Status: ❌ FAILED**

### MCP Server (Minimal): `test/mcp-minimal.test.js`
Using config: `jest.unified.config.cjs`

```
(node:594950) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL test/mcp-minimal.test.js
  ✕ MCP Server mock works (6 ms)
  ✕ MCP Server async operations work (2 ms)

  ● MCP Server mock works

    ReferenceError: jest is not defined

       7 | test('MCP Server mock works', () => {
       8 |   const mockServer = {
    >  9 |     start: jest.fn().mockResolvedValue({ port: 3000 }),
         |            ^
      10 |     stop: jest.fn().mockResolvedValue(true)
      11 |   };
      12 |   

      at Object.jest (test/mcp-minimal.test.js:9:12)

  ● MCP Server async operations work

    ReferenceError: jest is not defined

      18 | test('MCP Server async operations work', async () => {
      19 |   const mockServer = {
    > 20 |     start: jest.fn().mockResolvedValue({ port: 3000 }),
         |            ^
      21 |     stop: jest.fn().mockResolvedValue(true)
      22 |   };
      23 |   

      at Object.jest (test/mcp-minimal.test.js:20:12)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        2.42 s
Ran all test suites matching test/mcp-minimal.test.js.
```

**Status: ❌ FAILED**

## Test Diagnostics
These tests help diagnose specific issues.

## Test Summary

| Test | Status |
|------|--------|
| Super Minimal Test | ❌ FAILED |
| Basic Test | ❌ FAILED |
| FibonacciHeap | ❌ FAILED |
| DirectedAcyclicGraph | ❌ FAILED |
| Simplified Execution Service | ❌ FAILED |
| Execution Service (Isolated) | ❌ FAILED |
| MCP Server (Minimal) | ❌ FAILED |
