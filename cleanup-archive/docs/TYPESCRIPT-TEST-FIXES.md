# SwissKnife TypeScript Test Fixes

This document provides a comprehensive overview of the TypeScript test fixes implemented in the SwissKnife project. These fixes address issues with malformed imports, module format compatibility, and testing framework compatibility.

## Issues Addressed

### 1. Malformed Import Paths

Several TypeScript files contained malformed import paths with multiple `.js` extensions, such as:

```typescript
import { v4 as uuidv4 } from 'uuid.js.js.js.js.js';
import { EventEmitter } from 'events.js.js.js.js.js';
import { LogManager } from '../../utils/logging/manager.js.js.js.js.js.js.js.js.js.js';
```

These were corrected to proper import paths:

```typescript
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { LogManager } from '../../utils/logging/manager.js'; // .js extension for ESM compatibility
```

### 2. Module Format Compatibility (ESM vs. CommonJS)

The project contained a mix of ESM and CommonJS modules, which caused compatibility issues:

1. TypeScript files were set up as ESM modules
2. Jest was configured primarily for CommonJS
3. Some dependencies expected ESM while others expected CommonJS

### 3. Test Framework Migration (Chai to Jest)

Tests were originally written using Chai assertions but needed to work with Jest:

```typescript
// Chai syntax
expect(node.isRoot()).to.equal(true);

// Jest syntax
expect(node.isRoot()).toBe(true);
```

## Solution Approach

### Dual-Format Test Strategy

Rather than trying to force all tests into a single module format, we implemented:

1. **CommonJS Test Files**: Created `.cjs.test.js` files that work reliably with Jest
2. **Assertion Adapters**: Built compatibility layers between Chai and Jest assertions
3. **Mock Implementations**: Created CommonJS-compatible mocks for ESM modules

### Import Path Correction

1. Fixed malformed imports in source files
2. Created a utility script (`fix-malformed-imports.cjs`) to automatically fix other files

### Comprehensive Test Runners

1. `run-got-tests.cjs`: Focused runner for Graph-of-Thought components
2. `run-typescript-tests.cjs`: General-purpose TypeScript test runner

## Files Modified and Created

### Source Files Fixed

- `/home/barberb/swissknife/src/tasks/graph/node.ts`
- `/home/barberb/swissknife/src/tasks/graph/graph-of-thought.ts`
- `/home/barberb/swissknife/src/tasks/graph/manager.ts`
- Many files in `/src/utils/` (28 files, 73 imports fixed)
- Several files in `/src/tasks/` (3 files, 4 imports fixed)

### Test Files Created

- `/home/barberb/swissknife/test/integration/graph/got-node.cjs.test.js`
- `/home/barberb/swissknife/test/integration/graph/got-manager.cjs.test.js`
- `/home/barberb/swissknife/test/integration/graph/got-node.simple.test.ts`
- `/home/barberb/swissknife/test/unit/config/manager.cjs.test.js`
- `/home/barberb/swissknife/test/unit/models/registry.cjs.test.js`
- `/home/barberb/swissknife/test/unit/commands/registry.cjs.test.js`
- `/home/barberb/swissknife/test/unit/commands/help-generator.cjs.test.js`

### Mock Implementations

- `/home/barberb/swissknife/test/mocks/graph/got-node.mock.js`
- `/home/barberb/swissknife/test/mocks/graph/got-manager.mock.js`
- `/home/barberb/swissknife/test/mocks/config-manager.mock.cjs`
- `/home/barberb/swissknife/test/mocks/error-manager.mock.cjs`
- `/home/barberb/swissknife/test/mocks/stubs/chai-jest-stub.js`
- `/home/barberb/swissknife/test/mocks/stubs/chai-jest-stub.cjs`
- `/home/barberb/swissknife/test/mocks/stubs/chai-jest-stub.mjs`

### Utility Scripts

- `/home/barberb/swissknife/run-got-tests.cjs`
- `/home/barberb/swissknife/run-typescript-tests.cjs` (enhanced version)
- `/home/barberb/swissknife/fix-malformed-imports.cjs`
- `/home/barberb/swissknife/run-all-fixed-tests.cjs` (enhanced version)
- `/home/barberb/swissknife/typescript-test-converter.cjs` (new)

### Helper Modules

- `/home/barberb/swissknife/test/utils/chai-jest-adapter.ts` (enhanced version)
- `/home/barberb/swissknife/test/utils/chai-jest-adapter-simplified.ts` (new)
- `/home/barberb/swissknife/jest.typescript.simple.config.cjs`
- `/home/barberb/swissknife/jest.typescript.config.cjs` (enhanced version)
- `/home/barberb/swissknife/test/typescript-setup.js` (enhanced version)

## Running Tests

### Graph-of-Thought Tests

To run tests for the Graph-of-Thought components:

```bash
node run-got-tests.cjs
```

### All TypeScript Tests

To run all TypeScript tests or specific test patterns with enhanced options:

```bash
# Run all TypeScript tests (both original TS and converted CJS versions)
node run-typescript-tests.cjs

# Run specific test patterns
node run-typescript-tests.cjs graph        # Run all graph tests
node run-typescript-tests.cjs test/unit    # Run all unit tests

# Run with enhanced options
node run-typescript-tests.cjs --no-ts      # Skip TypeScript tests, run only CommonJS versions
node run-typescript-tests.cjs --no-cjs     # Skip CommonJS tests, run only TypeScript versions
node run-typescript-tests.cjs --no-convert # Skip auto-conversion of TS to CJS
node run-typescript-tests.cjs --coverage   # Generate code coverage report
node run-typescript-tests.cjs --bail       # Stop on first failure
node run-typescript-tests.cjs --watch      # Watch mode for continuous testing
```

### All Fixed Tests

To run all the fixed CommonJS test files:

```bash
# Run all fixed tests
node run-all-fixed-tests.cjs

# Run specific test patterns
node run-all-fixed-tests.cjs graph        # Run all fixed graph tests

# Run with enhanced options
node run-all-fixed-tests.cjs --coverage   # Generate code coverage report
node run-all-fixed-tests.cjs --single     # Run each test file individually for better diagnostics
node run-all-fixed-tests.cjs --bail       # Stop on first failure
node run-all-fixed-tests.cjs --ci         # CI mode (less verbose)
```

### Converting TypeScript Tests to CommonJS

To convert TypeScript tests to CommonJS versions automatically:

```bash
# Convert all TypeScript tests
node typescript-test-converter.cjs

# Convert specific test patterns
node typescript-test-converter.cjs test/unit/models
```

### Fixing Malformed Imports

To fix malformed imports in TypeScript files:

```bash
# Fix imports in src directory (default)
node fix-malformed-imports.cjs

# Fix imports in a specific directory
node fix-malformed-imports.cjs ./src/tasks
```

## Technical Details

### Module Resolution Strategy

Our approach uses a hybrid strategy for handling module formats:

1. **Source Files**: Maintain as ESM modules, using `.js` extensions in imports for Node.js ESM compatibility
2. **Test Files**: Create CommonJS versions with `.cjs.test.js` extension for Jest compatibility
3. **Configuration**: Use `jest.typescript.simple.config.cjs` to configure Jest for TypeScript tests

### Enhanced Chai-to-Jest Assertion Adapter

We've created two versions of the Chai-to-Jest adapter:

1. **TypeScript Version** (`chai-jest-adapter.ts`): Full TypeScript support with type definitions
2. **CommonJS Version** (`chai-jest-stub.cjs`): Direct plug-in replacement for CommonJS tests

The adapters wrap Jest assertions with a Chai-like interface:

```typescript
// Using our adapter
chai.expect(value).to.equal(expected);      // Calls expect(value).toBe(expected)
chai.expect(value).to.be.true;              // Calls expect(value).toBe(true)
chai.expect(value).to.have.property('id');  // Calls expect(value).toHaveProperty('id')
chai.expect(array).to.have.lengthOf(3);     // Calls expect(array.length).toBe(3)
chai.expect(spy).to.have.been.calledOnce;   // Calls expect(spy.callCount).toBe(1)
```

The adapter supports a comprehensive set of Chai assertions:

```typescript
// Boolean assertions
chai.expect(value).to.be.true;
chai.expect(value).to.be.false;
chai.expect(value).to.be.null;
chai.expect(value).to.be.undefined;
chai.expect(value).to.be.empty;

// Type assertions
chai.expect(value).to.be.a('string');
chai.expect(value).to.be.an('object');

// Equality/content assertions
chai.expect(value).to.equal(expected);
chai.expect(value).to.deep.equal(expected);
chai.expect(array).to.include(item);
chai.expect(string).to.contain(substring);

// Property assertions
chai.expect(object).to.have.property('name');
chai.expect(object).to.have.property('name', 'value');
chai.expect(object).to.have.keys(['name', 'id']);

// Length assertions
chai.expect(array).to.have.length(3);
chai.expect(array).to.have.lengthOf(3);

// Function/error assertions
chai.expect(fn).to.throw();
chai.expect(promise).to.be.fulfilled();
chai.expect(promise).to.be.rejected();

// Sinon.js assertions
chai.expect(spy).to.have.been.called;
chai.expect(spy).to.have.been.calledOnce;
chai.expect(spy).to.have.been.calledWith(arg1, arg2);
```

This approach allows tests to be gradually migrated from Chai to Jest without a complete rewrite.

## Advanced Techniques

### Automatic Module Resolution

The enhanced TypeScript setup includes a `resolveModuleFilePath` helper that automatically handles module resolution across CommonJS and ESM:

```javascript
// Automatically resolve the correct module path regardless of format
const modulePath = resolveModuleFilePath(basePath, 'some-module');
```

This helper tries multiple extensions and paths, including:
- `.js`, `.cjs`, `.mjs`, `.ts`, `.tsx`, `.jsx`
- Regular paths, test paths, and CommonJS test paths

### Test File Auto-Conversion

The `typescript-test-converter.cjs` script automatically:
1. Reads TypeScript test files
2. Transforms them to CommonJS format
3. Converts Chai assertions to Jest assertions
4. Adds CommonJS headers and documentation

Example conversion:

```typescript
// Original TypeScript test
import { expect } from 'chai';
import { GraphNode } from '../../../src/tasks/graph/node';

describe('GraphNode', () => {
  it('should create a node correctly', () => {
    const node = new GraphNode('test');
    expect(node.getId()).to.equal('test');
    expect(node.isRoot()).to.be.true;
  });
});
```

↓ Converted to ↓

```javascript
/**
 * CommonJS version of TypeScript test file
 * Auto-generated from: got-node.test.ts
 */

const { GraphNode } = require('../../../src/tasks/graph/node');

describe('GraphNode', () => {
  it('should create a node correctly', () => {
    const node = new GraphNode('test');
    expect(node.getId()).toBe('test');
    expect(node.isRoot()).toBe(true);
  });
});
```

## Future Recommendations

1. **Standardize Module Format**: Choose either ESM or CommonJS for the entire codebase
2. **Update TypeScript Configuration**: Set `moduleResolution` consistently
3. **Migration Plan**: Gradually migrate all Chai assertions to native Jest assertions
4. **CI Integration**: Add these test runners to CI workflows to prevent regression
5. **Automate Test Conversion**: Integrate TypeScript test conversion into the build pipeline
6. **Test Framework Standardization**: Adopt a single testing pattern for all new tests
7. **Module Resolution Documentation**: Create clear guidelines for import syntax in different module types
8. **Automated Import Scanning**: Implement pre-commit hooks to prevent malformed imports

## Conclusion

This comprehensive fix addresses the immediate issues with TypeScript tests while providing a robust path forward for testing in the SwissKnife project. The dual-format approach allows for incremental migration while maintaining compatibility with existing code.

The enhancements to the TypeScript test infrastructure provide:

1. Better compatibility between ESM and CommonJS modules
2. Automated tools for test conversion and maintenance
3. Comprehensive Chai-to-Jest transition support
4. Flexible test running options for different scenarios

These improvements significantly enhance the testability and maintainability of the SwissKnife project.
