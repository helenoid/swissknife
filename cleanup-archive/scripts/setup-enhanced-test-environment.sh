#!/bin/bash

# Colors for better visibility in output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SwissKnife Test Fixer ===${NC}"
echo -e "${YELLOW}This tool fixes common test issues automatically${NC}"

# First, let's create our enhanced setup file that will be included in tests
echo -e "${BLUE}Creating enhanced setup files${NC}"

# Create a super-complete setup file that handles both ESM and CommonJS
cat > /home/barberb/swissknife/test/super-complete-setup.js << 'EOL'
/**
 * Super-complete Jest setup file that handles both ESM and CommonJS
 * This file ensures all necessary test helpers and matchers are available
 */

// Determine if we're in a CommonJS or ESM environment
const isCommonJS = typeof module !== 'undefined' && module.exports;

// Add all the expect matchers that might be missing
function enhanceExpect() {
  if (typeof expect !== 'undefined') {
    // Add arrayContaining if missing
    if (!expect.arrayContaining) {
      expect.arrayContaining = (array) => ({
        asymmetricMatch: (actual) => 
          Array.isArray(actual) && 
          array.every(item => actual.some(actualItem => 
            JSON.stringify(actualItem) === JSON.stringify(item))),
        toString: () => `ArrayContaining(${array})`
      });
    }
    
    // Add objectContaining if missing
    if (!expect.objectContaining) {
      expect.objectContaining = (object) => ({
        asymmetricMatch: (actual) => {
          if (typeof actual !== 'object' || actual === null) return false;
          return Object.entries(object).every(([key, value]) => 
            key in actual && JSON.stringify(actual[key]) === JSON.stringify(value));
        },
        toString: () => `ObjectContaining(${JSON.stringify(object)})`
      });
    }
    
    // Add stringMatching if missing
    if (!expect.stringMatching) {
      expect.stringMatching = (pattern) => ({
        asymmetricMatch: (actual) => {
          if (typeof actual !== 'string') return false;
          if (pattern instanceof RegExp) return pattern.test(actual);
          return actual.includes(String(pattern));
        },
        toString: () => `StringMatching(${pattern})`
      });
    }
    
    // Add any if missing
    if (!expect.any) {
      expect.any = (constructor) => ({
        asymmetricMatch: (actual) => 
          actual != null && (actual.constructor === constructor || actual instanceof constructor),
        toString: () => `Any(${constructor.name || 'unknown'})`
      });
    }
    
    // Add extend method if missing
    if (!expect.extend) {
      expect.extend = (matchers) => {
        Object.assign(expect, Object.entries(matchers).reduce((acc, [name, matcher]) => {
          acc[name] = (...args) => {
            return {
              toBe: (actual) => {
                const result = matcher(actual, ...args);
                if (!result.pass) throw new Error(result.message());
                return true;
              }
            };
          };
          return acc;
        }, {}));
      };
    }
  }
}

// Add all Jest globals that might be missing
function addMissingJestGlobals() {
  if (typeof global !== 'undefined') {
    if (!global.it) global.it = global.test || ((name, fn) => fn());
    if (!global.describe) global.describe = (name, fn) => fn();
    if (!global.beforeEach) global.beforeEach = (fn) => fn();
    if (!global.afterEach) global.afterEach = (fn) => fn();
    if (!global.beforeAll) global.beforeAll = (fn) => fn();
    if (!global.afterAll) global.afterAll = (fn) => fn();
    
    // Add skip, todo and only variants
    if (global.it && !global.it.skip) global.it.skip = (name, fn) => console.log(`Skipped test: ${name}`);
    if (global.it && !global.it.todo) global.it.todo = (name) => console.log(`Todo test: ${name}`);
    if (global.it && !global.it.only) global.it.only = global.it;
    if (global.describe && !global.describe.skip) global.describe.skip = (name, fn) => console.log(`Skipped suite: ${name}`);
    if (global.describe && !global.describe.only) global.describe.only = global.describe;
  }
}

// Setup mock functions if jest.fn is missing
function addMockFunctions() {
  if (typeof jest === 'undefined' || !jest.fn) {
    global.jest = global.jest || {};
    global.jest.fn = function mockFn(implementation) {
      const mockFunction = implementation || (() => {});
      mockFunction.mock = { calls: [], instances: [], results: [] };
      mockFunction.mockReturnValue = function(value) {
        mockFunction.mockImplementation(() => value);
        return mockFunction;
      };
      mockFunction.mockImplementation = function(newImplementation) {
        const oldImplementation = implementation;
        implementation = newImplementation;
        return mockFunction;
      };
      mockFunction.mockReset = function() {
        mockFunction.mock.calls = [];
        mockFunction.mock.instances = [];
        mockFunction.mock.results = [];
        implementation = () => {};
      };
      return mockFunction;
    };
    
    // Add other mock utilities
    if (!global.jest.spyOn) {
      global.jest.spyOn = function(object, methodName) {
        const originalMethod = object[methodName];
        const mockFn = jest.fn((...args) => originalMethod.apply(object, args));
        object[methodName] = mockFn;
        mockFn.mockRestore = () => {
          object[methodName] = originalMethod;
        };
        return mockFn;
      };
    }
  }
}

// Run all the enhancements
enhanceExpect();
addMissingJestGlobals();
addMockFunctions();

// Export helper functions for both CommonJS and ESM
const setupHelpers = {
  enhanceExpect,
  addMissingJestGlobals,
  addMockFunctions
};

// Handle exports for CommonJS
if (isCommonJS) {
  module.exports = setupHelpers;
}

// Handle exports for ESM
export default setupHelpers;
export const { enhanceExpect, addMissingJestGlobals, addMockFunctions } = setupHelpers;
EOL

# Create a unified test utils file that works in both ESM and CommonJS
cat > /home/barberb/swissknife/test/helpers/universal-testUtils.js << 'EOL'
/**
 * Universal test utilities that work in both ESM and CommonJS
 */

// Mock environment variables
function mockEnv(envVars = {}) {
  const originalEnv = {...process.env};
  
  // Save original env values
  const originals = {};
  Object.keys(envVars).forEach(key => {
    originals[key] = process.env[key];
    process.env[key] = envVars[key];
  });
  
  // Return restore function
  return function restoreEnv() {
    Object.keys(envVars).forEach(key => {
      if (originals[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originals[key];
      }
    });
  };
}

// Create mock readable stream
function createMockReadableStream(chunks = []) {
  const EventEmitter = require('events');
  const stream = new EventEmitter();
  
  stream.read = jest.fn(() => chunks.shift() || null);
  stream.pipe = jest.fn().mockReturnValue(stream);
  stream.setEncoding = jest.fn().mockReturnValue(stream);
  stream.destroy = jest.fn();
  
  return stream;
}

// Wait for a specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait until condition is true or timeout
async function waitUntil(condition, options = {}) {
  const { timeout = 5000, interval = 100 } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await wait(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

// Mock required modules
function mockModules(moduleMocks = {}) {
  const originalModules = {};
  
  Object.keys(moduleMocks).forEach(modulePath => {
    try {
      jest.doMock(modulePath, () => moduleMocks[modulePath]);
      originalModules[modulePath] = require(modulePath);
    } catch (err) {
      console.warn(`Could not mock module: ${modulePath}`, err);
    }
  });
  
  return function restoreModules() {
    Object.keys(moduleMocks).forEach(modulePath => {
      jest.resetModules();
      jest.dontMock(modulePath);
    });
  };
}

// Create unified testing utilities
const testUtils = {
  mockEnv,
  createMockReadableStream,
  wait,
  waitUntil,
  mockModules
};

// Support both CommonJS and ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testUtils;
}

export default testUtils;
export const { 
  mockEnv, 
  createMockReadableStream, 
  wait, 
  waitUntil, 
  mockModules 
} = testUtils;
EOL

# Update the unified Jest configuration to use our new setup file
echo -e "${BLUE}Updating unified Jest configuration${NC}"

cat > /home/barberb/swissknife/jest.unified.config.cjs << 'EOL'
/** @type {import('jest').Config} */

const config = {
  // The root of the project
  rootDir: '.',
  
  // Test environment
  testEnvironment: 'node',
  
  // Test regex patterns
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',

  // File extensions to consider
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Explicitly transform JSX/TSX/JS/TS files with babel-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Use new super-complete setup file
  setupFilesAfterEnv: ['<rootDir>/test/super-complete-setup.js'],
  
  // Module name mapper to handle various module formats and aliases
  moduleNameMapper: {
    // Handle chai imports
    '^chai$': '<rootDir>/test/mocks/stubs/chai-enhanced.js',
    
    // Handle React and Ink imports for components
    '^react$': '<rootDir>/node_modules/react',
    '^ink$': '<rootDir>/node_modules/ink',
    
    // Handle lodash-es imports
    '^lodash-es$': 'lodash',
    
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Handle helpers and utilities
    '^../helpers/testUtils$': '<rootDir>/test/helpers/universal-testUtils.js',
    '^./helpers/testUtils$': '<rootDir>/test/helpers/universal-testUtils.js',
    '^test/helpers/testUtils$': '<rootDir>/test/helpers/universal-testUtils.js'
  },
  
  // Handling for ESM modules
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mjs'],
  
  // Increase the test timeout to handle potentially slow tests
  testTimeout: 30000,
  
  // Use verbose output for detailed test results
  verbose: true,
  
  // Collect coverage reports
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  
  // Use default coverage reporters
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // Global test settings
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // Test runner settings
  testRunner: 'jest-circus/runner',
  
  // Additional runner options for handling async tests better
  testRunnerOptions: {
    asyncTimeout: 30000,
  },
};

module.exports = config;
EOL

# Create an enhanced chai-enhanced.js stub for tests that use chai
mkdir -p /home/barberb/swissknife/test/mocks/stubs
cat > /home/barberb/swissknife/test/mocks/stubs/chai-enhanced.js << 'EOL'
/**
 * Enhanced Chai stub that provides compatibility with Jest
 */

// Create chai-like assertion methods that actually use Jest under the hood
const expect = global.expect;

const chai = {
  expect: (actual) => {
    return {
      to: {
        equal: (expected) => expect(actual).toEqual(expected),
        deep: {
          equal: (expected) => expect(actual).toEqual(expected),
          include: (expected) => {
            if (Array.isArray(actual)) {
              expect(actual).toEqual(expect.arrayContaining([expected]));
            } else if (typeof actual === 'object' && actual !== null) {
              expect(actual).toEqual(expect.objectContaining(expected));
            } else {
              throw new Error('Cannot deep include on non-object types');
            }
          }
        },
        be: {
          a: (type) => {
            if (type === 'string') expect(typeof actual).toBe('string');
            else if (type === 'number') expect(typeof actual).toBe('number');
            else if (type === 'boolean') expect(typeof actual).toBe('boolean');
            else if (type === 'function') expect(typeof actual).toBe('function');
            else if (type === 'object') expect(typeof actual).toBe('object');
            else if (type === 'array') expect(Array.isArray(actual)).toBe(true);
            else expect(actual).toBeInstanceOf(type);
          },
          an: function(type) { this.a(type); },
          true: () => expect(actual).toBe(true),
          false: () => expect(actual).toBe(false),
          null: () => expect(actual).toBeNull(),
          undefined: () => expect(actual).toBeUndefined()
        },
        have: {
          property: (prop, value) => {
            expect(actual).toHaveProperty(prop);
            if (arguments.length > 1) {
              expect(actual[prop]).toEqual(value);
            }
          },
          length: (length) => expect(actual.length).toBe(length)
        },
        include: (expected) => {
          if (typeof actual === 'string') {
            expect(actual).toContain(expected);
          } else if (Array.isArray(actual)) {
            expect(actual).toContain(expected);
          } else if (typeof actual === 'object' && actual !== null) {
            expect(actual).toEqual(expect.objectContaining(expected));
          } else {
            throw new Error('Cannot include on this type');
          }
        },
        throw: () => expect(actual).toThrow()
      }
    };
  },
  
  // Add chai assert API
  assert: {
    equal: (actual, expected) => expect(actual).toEqual(expected),
    strictEqual: (actual, expected) => expect(actual).toBe(expected),
    deepEqual: (actual, expected) => expect(actual).toEqual(expected),
    isTrue: (actual) => expect(actual).toBe(true),
    isFalse: (actual) => expect(actual).toBe(false),
    isNull: (actual) => expect(actual).toBeNull(),
    isUndefined: (actual) => expect(actual).toBeUndefined(),
    isDefined: (actual) => expect(actual).not.toBeUndefined(),
    throws: (fn) => expect(fn).toThrow()
  }
};

// Handle CommonJS exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = chai;
}

// Handle ESM exports
export default chai;
export const { expect: chaiExpect, assert } = chai;
EOL

# Create a test script to run tests with our enhanced configuration
cat > /home/barberb/swissknife/run-optimized-tests.sh << 'EOL'
#!/bin/bash

# Colors for better visibility in output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SwissKnife Optimized Test Runner ===${NC}"
echo -e "${YELLOW}Running tests with enhanced configuration${NC}"

if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage:${NC}"
  echo -e "  ./run-optimized-tests.sh <test-file-pattern>"
  echo -e "  ./run-optimized-tests.sh all"
  echo -e "\nExamples:"
  echo -e "  ./run-optimized-tests.sh command_registry.test.js"
  echo -e "  ./run-optimized-tests.sh 'test/standalone-*.test.js'"
  echo -e "  ./run-optimized-tests.sh all"
  exit 0
fi

# Disable Jest's watchman to prevent file watching issues
export JEST_WORKER_ID=1
export NODE_OPTIONS="--no-warnings"

if [ "$1" == "all" ]; then
  echo -e "${BLUE}Running all tests${NC}"
  npx jest --config=jest.unified.config.cjs
else
  echo -e "${BLUE}Running tests matching: $1${NC}"
  npx jest --config=jest.unified.config.cjs $1
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
else
  echo -e "\n${RED}Some tests failed.${NC}"
fi

exit $EXIT_CODE
EOL

chmod +x /home/barberb/swissknife/run-optimized-tests.sh

echo -e "${GREEN}Successfully created enhanced test setup files${NC}"
echo -e "${GREEN}Created optimized test runner script${NC}"
echo -e "\n${BLUE}To run tests, use:${NC}"
echo -e "  ./run-optimized-tests.sh <test-file-pattern>"
echo -e "  ./run-optimized-tests.sh all"
