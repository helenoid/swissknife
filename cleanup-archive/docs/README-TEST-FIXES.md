# SwissKnife Test Fixes

## Overview

This project addresses critical issues in the SwissKnife TypeScript test suite, focusing on fixing:
1. Malformed imports in TypeScript files
2. ESM/CommonJS compatibility issues
3. Chai-to-Jest assertion conversion

The enhanced version adds:
1. Automated test conversion between TypeScript and CommonJS
2. Comprehensive assertion adapters with full TypeScript support
3. Flexible test runners with multiple configuration options
4. Better module resolution across ESM and CommonJS boundaries

## Issues Resolved

### Malformed Imports

We identified and fixed numerous malformed imports across the codebase:
- `uuid.js.js.js.js.js` → `uuid`
- `events.js.js.js.js.js` → `events`
- And many more in `/src/tasks` and `/src/utils` directories

Total fixed:
- 4 imports in 3 files in `src/tasks`
- 73 imports in 28 files in `src/utils`

### Module Format Compatibility

- Created CommonJS-compatible test files (.cjs.test.js)
- Created ESM-compatible component mocks
- Set up proper Jest configuration for both formats

### Test Framework Compatibility

- Created assertion adapters to convert Chai syntax to Jest
- Added TypeScript definitions for better IDE support

## Test Files Created

1. `/home/barberb/swissknife/test/integration/graph/got-node.cjs.test.js`
2. `/home/barberb/swissknife/test/integration/graph/got-manager.cjs.test.js`
3. `/home/barberb/swissknife/test/mocks/graph/got-node.mock.js`
4. `/home/barberb/swissknife/test/mocks/graph/got-manager.mock.js`

## Utility Scripts

1. `/home/barberb/swissknife/run-got-tests.cjs` - Run Graph-of-Thought specific tests
2. `/home/barberb/swissknife/run-typescript-tests.cjs` - Enhanced TypeScript test runner
3. `/home/barberb/swissknife/fix-malformed-imports.cjs` - Fix malformed imports in TypeScript files
4. `/home/barberb/swissknife/typescript-test-converter.cjs` - Convert TypeScript tests to CommonJS
5. `/home/barberb/swissknife/run-all-fixed-tests.cjs` - Run all fixed CommonJS tests

## How to Run Tests

### All Fixed Tests

```bash
# Run all fixed CommonJS tests
node run-all-fixed-tests.cjs

# Run specific fixed tests
node run-all-fixed-tests.cjs graph

# Run tests individually for better diagnostics
node run-all-fixed-tests.cjs --single

# Generate coverage report
node run-all-fixed-tests.cjs --coverage
```

### Graph-of-Thought Tests

```bash
# Run all Graph-of-Thought tests
node run-got-tests.cjs
```

### TypeScript Tests (Enhanced Options)

```bash
# Run all TypeScript tests (including auto-conversion to CommonJS)
node run-typescript-tests.cjs

# Run specific test patterns
node run-typescript-tests.cjs test/integration/graph
node run-typescript-tests.cjs test/unit

# Advanced options
node run-typescript-tests.cjs --no-ts       # Skip original TypeScript tests
node run-typescript-tests.cjs --no-cjs      # Skip CommonJS tests
node run-typescript-tests.cjs --coverage    # Generate coverage report
node run-typescript-tests.cjs --bail        # Stop on first failure
node run-typescript-tests.cjs --watch       # Watch mode
```

### Convert TypeScript to CommonJS

```bash
# Convert all TypeScript tests to CommonJS format
node typescript-test-converter.cjs

# Convert specific test patterns
node typescript-test-converter.cjs test/unit/models
```

### Fix Malformed Imports

```bash
# Fix imports in a specific directory
node fix-malformed-imports.cjs src/path/to/directory

# Example: Fix imports in src/utils
node fix-malformed-imports.cjs src/utils
```

## Status Summary

✅ **Fixed Source Files**:
- `/src/tasks/graph/node.ts`
- `/src/tasks/graph/graph-of-thought.ts`
- `/src/tasks/graph/manager.ts`
- Many files in `/src/utils/` (28 files, 73 imports fixed)
- Several files in `/src/tasks/` (3 files, 4 imports fixed)

✅ **Fixed Test Files**:
- `/test/integration/graph/got-node.cjs.test.js`
- `/test/integration/graph/got-manager.cjs.test.js`
- `/test/unit/config/manager.cjs.test.js`
- `/test/unit/models/registry.cjs.test.js`
- `/test/unit/commands/registry.cjs.test.js`
- `/test/unit/commands/help-generator.cjs.test.js`

✅ **Enhanced Tools**:
- Improved TypeScript test runner with multiple options
- Chai to Jest assertion adapter with comprehensive support
- Automatic TypeScript to CommonJS test converter
- Better ESM/CommonJS compatibility layer
- `/src/tasks/graph/manager.ts`
- 28 files in `/src/utils`
- 3 files in `/src/tasks`

✅ **Working Tests**:
- `got-node.cjs.test.js`
- `got-manager.cjs.test.js`

✅ **Automated Tools**:
- Import fixer script
- TypeScript test runner
- Focused Graph-of-Thought test runner

## Next Steps

1. **Apply Import Fixes**: Run the `fix-malformed-imports.cjs` script on the remaining directories:
   ```bash
   node fix-malformed-imports.cjs src/models
   node fix-malformed-imports.cjs src/storage
   # etc.
   ```

2. **Convert More Tests**: Apply the same pattern to other TypeScript tests:
   - Create `.cjs.test.js` versions of critical tests
   - Create mock implementations where needed

3. **Update Configuration**: Standardize TypeScript configuration for better ESM/CommonJS compatibility:
   - Update `tsconfig.json`
   - Update `jest.config.cjs`

4. **CI Integration**: Add these test runners to CI workflows

## Documentation

For more detailed information, refer to:

1. [TYPESCRIPT-TEST-FIXES.md](/home/barberb/swissknife/TYPESCRIPT-TEST-FIXES.md) - Comprehensive technical documentation
2. [GOT-TEST-FIXES.md](/home/barberb/swissknife/GOT-TEST-FIXES.md) - Graph-of-Thought specific fixes
