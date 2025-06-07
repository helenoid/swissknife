# Improved Test Diagnostic Results
Run on: Wed May 21 04:36:20 PM PDT 2025

## Tests with super-minimal config
### test/basic.test.js (super-minimal config)
```
FAIL test/basic.test.js
  ✕ basic test (5 ms)
  ✕ async test (1 ms)
  Test group
    ✕ should pass
    ✕ should do math correctly

  ● basic test

    TypeError: Cannot read properties of undefined (reading 'equal')

       8 | // Very simple test
       9 | test('basic test', () => {
    > 10 |   expect(1 + 1).to.equal(2);
         |                   ^
      11 | });
      12 |
      13 | // Simple async test

      at Object.<anonymous> (test/basic.test.js:10:19)

  ● async test

    TypeError: Cannot read properties of undefined (reading 'equal')

      14 | test('async test', async () => {
      15 |   const result = await Promise.resolve('test');
    > 16 |   expect(result).to.equal('test');
         |                    ^
      17 | });
      18 |
      19 | // Simple describe block

      at Object.<anonymous> (test/basic.test.js:16:20)

  ● Test group › should pass

    TypeError: Cannot read properties of undefined (reading 'equal')

      20 | describe('Test group', () => {
      21 |   it('should pass', () => {
    > 22 |     expect(true).to.equal(true);
         |                    ^
      23 |   });
      24 |   
      25 |   it('should do math correctly', () => {

      at Object.<anonymous> (test/basic.test.js:22:20)

  ● Test group › should do math correctly

    TypeError: Cannot read properties of undefined (reading 'equal')

      24 |   
      25 |   it('should do math correctly', () => {
    > 26 |     expect(2 * 2).to.equal(4);
         |                     ^
      27 |   });
      28 | });
      29 |

      at Object.<anonymous> (test/basic.test.js:26:21)

Test Suites: 1 failed, 1 total
Tests:       4 failed, 4 total
Snapshots:   0 total
Time:        0.429 s
Ran all test suites matching test/basic.test.js.

❌ FAILED (exit code: 1)

```

### test/execution-service-isolated.test.js (super-minimal config)
```
FAIL test/execution-service-isolated.test.js
  ModelExecutionService (Isolated)
    ✕ should execute a model and return a response (6 ms)
    ✕ should handle streaming responses (2 ms)

  ● ModelExecutionService (Isolated) › should execute a model and return a response

    TypeError: Cannot read properties of undefined (reading 'include')

      39 |     
      40 |     expect(result).toBeDefined();
    > 41 |     expect(result.response).to.include('Hello, world!');
         |                               ^
      42 |     expect(result.usage).toHaveProperty('totalTokens');
      43 |     expect(result.timingMs).toBeDefined();
      44 |   });

      at Object.<anonymous> (test/execution-service-isolated.test.js:41:31)

  ● ModelExecutionService (Isolated) › should handle streaming responses

    TypeError: Cannot read properties of undefined (reading 'equal')

      82 |     
      83 |     expect(chunks).toHaveLength(2);
    > 84 |     expect(chunks[0].text).to.equal('Hello');
         |                              ^
      85 |     expect(chunks[1].text).to.equal(' world');
      86 |   });
      87 | });

      at Object.<anonymous> (test/execution-service-isolated.test.js:84:30)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        0.508 s
Ran all test suites matching test/execution-service-isolated.test.js.

❌ FAILED (exit code: 1)

```

### test/mcp-minimal.test.js (super-minimal config)
```
FAIL test/mcp-minimal.test.js
  ✕ MCP Server mock works (7 ms)
  ✕ MCP Server async operations work (1 ms)

  ● MCP Server mock works

    TypeError: Cannot read properties of undefined (reading 'exist')

      14 |   };
      15 |   
    > 16 |   expect(mockServer.start).to.exist;
         |                              ^
      17 |   expect(mockServer.stop).to.exist;
      18 | });
      19 |

      at Object.<anonymous> (test/mcp-minimal.test.js:16:30)

  ● MCP Server async operations work

    TypeError: Cannot read properties of undefined (reading 'deep')

      26 |   
      27 |   const result = await mockServer.start();
    > 28 |   expect(result).to.deep.equal({ port: 3000 });
         |                    ^
      29 | });
      30 |

      at Object.<anonymous> (test/mcp-minimal.test.js:28:20)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        0.519 s
Ran all test suites matching test/mcp-minimal.test.js.

❌ FAILED (exit code: 1)

```

### test/super-minimal.test.js (super-minimal config)
```
FAIL test/super-minimal.test.js
  ✕ 1 + 1 = 2 (3 ms)

  ● 1 + 1 = 2

    TypeError: Cannot read properties of undefined (reading 'equal')

      4 | // Super minimal test
      5 | test('1 + 1 = 2', () => {
    > 6 |   expect(1 + 1).to.equal(2);
        |                   ^
      7 | });
      8 |

      at Object.<anonymous> (test/super-minimal.test.js:6:19)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        0.425 s, estimated 1 s
Ran all test suites matching test/super-minimal.test.js.

❌ FAILED (exit code: 1)

```

## Tests with unified config
### test/basic.test.js (unified config)
```
FAIL test/basic.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.144 s
Ran all test suites matching test/basic.test.js.
(node:1887770) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

❌ FAILED (exit code: 1)

```

### test/execution-service-isolated.test.js (unified config)
```
FAIL test/execution-service-isolated.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.887 s
Ran all test suites matching test/execution-service-isolated.test.js.
(node:1888049) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

❌ FAILED (exit code: 1)

```

### test/mcp-minimal.test.js (unified config)
```
FAIL test/mcp-minimal.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.966 s, estimated 2 s
Ran all test suites matching test/mcp-minimal.test.js.
(node:1888370) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

❌ FAILED (exit code: 1)

```

### test/super-minimal.test.js (unified config)
```
FAIL test/super-minimal.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.954 s
Ran all test suites matching test/super-minimal.test.js.
(node:1888496) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

❌ FAILED (exit code: 1)

```

## Core Module Tests (unified config)
### test/unit/models/execution/execution-service.test.js (unified config)
```
FAIL test/unit/models/execution/execution-service.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1888868) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL dist/test/test/unit/models/execution/execution-service.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1888876) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL dist/test/unit/models/execution/execution-service.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1888867) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL dist-test/test/unit/models/execution/execution-service.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1888874) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 4 failed, 4 total
Tests:       0 total
Snapshots:   0 total
Time:        2.102 s
Ran all test suites matching test/unit/models/execution/execution-service.test.js.

❌ FAILED (exit code: 1)

```

### test/unit/models/registry/model-registry.test.js

❌ FILE NOT FOUND

### test/unit/config/configuration-manager.test.js

❌ FILE NOT FOUND

### test/unit/integration/registry/integration-registry.test.js

❌ FILE NOT FOUND

### test/unit/mcp-server/mcp-server.test.js (unified config)
```
FAIL dist/test/test/unit/mcp-server/mcp-server.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1889453) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL dist-test/test/unit/mcp-server/mcp-server.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1889466) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL test/unit/mcp-server/mcp-server.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1889458) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL dist/test/unit/mcp-server/mcp-server.test.js
  ● Test suite failed to run

    ReferenceError: require is not defined

       5 |
       6 | // Setup Chai stub for assertions
    >  7 | const chai = require('./mocks/stubs/chai-enhanced.js');
         |              ^
       8 |
       9 | // Save original Jest expect
      10 | const originalExpect = global.expect;

      at require (test/unified-setup.js:7:14)

(node:1889455) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 4 failed, 4 total
Tests:       0 total
Snapshots:   0 total
Time:        1.952 s
Ran all test suites matching test/unit/mcp-server/mcp-server.test.js.

❌ FAILED (exit code: 1)

```

