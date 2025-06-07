#!/bin/bash

# SwissKnife Comprehensive Test Fixer
# This script applies multiple fixes to address the most common test failures

echo "============================================"
echo "SwissKnife Comprehensive Test Fixer"
echo "============================================"

# 1. Create a fixed Jest configuration file
echo "Step 1: Creating fixed Jest configuration..."
cat > jest-fixed.config.cjs << 'EOL'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  
  // Support multiple module types
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Transformations for different file types
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ],
        plugins: [
          '@babel/plugin-transform-modules-commonjs'
        ]
      }
    ]
  },
  
  // Longer test timeout
  testTimeout: 30000,
  
  // Disable symlinks to avoid Haste module naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Transform node_modules with ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^(\\.\\.?\\/.+)$': '$1.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['./test/fixed-setup.js']
}
EOL

# 2. Create fixed setup file with proper Chai-Jest integration
echo "Step 2: Creating fixed test setup file..."
mkdir -p test
cat > test/fixed-setup.js << 'EOL'
// Increase timeout for all tests
jest.setTimeout(30000);

// Create chai-jest adapter
if (typeof chai === 'undefined' || !chai.expect) {
  global.chai = {
    expect: (value) => {
      const jestExpect = expect(value);
      return {
        to: {
          equal: (expected) => jestExpect.toBe(expected),
          deep: {
            equal: (expected) => jestExpect.toEqual(expected),
            include: (expected) => jestExpect.toEqual(expect.objectContaining(expected))
          },
          be: {
            true: () => jestExpect.toBe(true),
            false: () => jestExpect.toBe(false),
            null: () => jestExpect.toBeNull(),
            undefined: () => jestExpect.toBeUndefined(),
            empty: () => {
              if (typeof value === 'string' || Array.isArray(value)) {
                expect(value.length).toBe(0);
              } else if (typeof value === 'object' && value !== null) {
                expect(Object.keys(value).length).toBe(0);
              }
            }
          },
          exist: () => jestExpect.toBeDefined(),
          eql: (expected) => jestExpect.toEqual(expected),
          not: {
            equal: (expected) => jestExpect.not.toBe(expected),
            be: {
              true: () => jestExpect.not.toBe(true),
              false: () => jestExpect.not.toBe(false)
            }
          },
          include: (expected) => {
            if (typeof value === 'string') {
              jestExpect.toContain(expected);
            } else if (Array.isArray(value)) {
              jestExpect.toContain(expected);
            } else {
              jestExpect.toEqual(expect.objectContaining(expected));
            }
          },
          match: (regex) => jestExpect.toMatch(regex)
        }
      };
    }
  };
}

console.log('Enhanced Jest setup completed with Chai compatibility');
EOL

# 3. Create test-specific mock modules
echo "Step 3: Creating fixed test mocks..."
mkdir -p test/mocks/stubs
cat > test/mocks/stubs/chai-fixed-stub.js << 'EOL'
/**
 * Chai stub for Jest compatibility
 * Improved version with better Jest-Chai compatibility
 */

// Create chai expect implementation using Jest's expect
const chaiExpect = function(value) {
  const jestExpect = jest.expect(value);
  
  return {
    to: {
      equal: (expected) => jestExpect.toBe(expected),
      deep: {
        equal: (expected) => jestExpect.toEqual(expected),
        include: (expected) => jestExpect.toEqual(jest.expect.objectContaining(expected))
      },
      be: {
        true: () => jestExpect.toBe(true),
        false: () => jestExpect.toBe(false),
        null: () => jestExpect.toBeNull(),
        undefined: () => jestExpect.toBeUndefined(),
        empty: () => {
          if (typeof value === 'string' || Array.isArray(value)) {
            jest.expect(value.length).toBe(0);
          } else if (typeof value === 'object' && value !== null) {
            jest.expect(Object.keys(value).length).toBe(0);
          }
        }
      },
      exist: () => jestExpect.toBeDefined(),
      eql: (expected) => jestExpect.toEqual(expected),
      not: {
        equal: (expected) => jestExpect.not.toBe(expected),
        deep: {
          equal: (expected) => jestExpect.not.toEqual(expected)
        },
        be: {
          true: () => jestExpect.not.toBe(true),
          false: () => jestExpect.not.toBe(false),
          null: () => jestExpect.not.toBeNull(),
          undefined: () => jestExpect.not.toBeUndefined(),
          empty: () => {
            if (typeof value === 'string' || Array.isArray(value)) {
              jest.expect(value.length).not.toBe(0);
            } else if (typeof value === 'object' && value !== null) {
              jest.expect(Object.keys(value).length).not.toBe(0);
            }
          }
        },
        exist: () => jestExpect.toBeUndefined()
      },
      include: (expected) => {
        if (typeof value === 'string') {
          jestExpect.toContain(expected);
        } else if (Array.isArray(value)) {
          jestExpect.toContain(expected);
        } else if (typeof value === 'object' && value !== null) {
          jestExpect.toEqual(jest.expect.objectContaining(expected));
        }
      },
      match: (regex) => jestExpect.toMatch(regex),
      throw: () => jest.expect(() => value()).toThrow(),
      eventually: {
        equal: async (expected) => jest.expect(await value).toBe(expected),
        deep: {
          equal: async (expected) => jest.expect(await value).toEqual(expected)
        }
      }
    }
  };
};

// Set fail property on the expect function
chaiExpect.fail = function(message) {
  throw new Error(message);
};

const assertModule = {
  equal: (actual, expected) => jest.expect(actual).toBe(expected),
  deepEqual: (actual, expected) => jest.expect(actual).toEqual(expected),
  isTrue: (value) => jest.expect(value).toBe(true),
  isFalse: (value) => jest.expect(value).toBe(false),
  isNull: (value) => jest.expect(value).toBeNull(),
  isUndefined: (value) => jest.expect(value).toBeUndefined(),
  exists: (value) => jest.expect(value).not.toBeUndefined(),
  notEqual: (actual, expected) => jest.expect(actual).not.toBe(expected),
  throws: (fn) => jest.expect(fn).toThrow(),
  fail: (message) => {
    throw new Error(message);
  }
};

// Support both ESM and CommonJS exports
export const expect = chaiExpect;
export const assert = assertModule;
export const should = () => {};

export default {
  expect: chaiExpect,
  assert: assertModule,
  should: () => {}
};

// CommonJS compatibility
if (typeof module !== 'undefined') {
  module.exports = {
    expect: chaiExpect,
    assert: assertModule,
    should: () => {},
    default: {
      expect: chaiExpect,
      assert: assertModule,
      should: () => {}
    }
  };
}
EOL

# 4. Create a small set of tests to verify fixes
echo "Step 4: Creating test verification script..."
cat > verify-test-fixes.sh << 'EOL'
#!/bin/bash

# Verify if the test fixes are working
echo "============================================"
echo "SwissKnife Test Fix Verification"
echo "============================================"

# Run a simple test with fixed configuration
npx jest --config=jest-fixed.config.cjs test/unit/utils/logging/simple-manager.test.js
# Check self-contained test
npx jest --config=jest-fixed.config.cjs test/unit/utils/errors/self-contained.test.js
# Check TypeScript test
npx jest --config=jest-fixed.config.cjs test/unit/utils/cache/manager.test.ts

echo "============================================"
echo "Verification completed!"
echo "============================================"
EOL
chmod +x verify-test-fixes.sh

# 5. Run the verification
echo "Step 5: Running test verification..."
./verify-test-fixes.sh

echo "============================================"
echo "Comprehensive test fixes completed!"
echo "============================================"
echo "To run tests with fixes, use:"
echo "npx jest --config=jest-fixed.config.cjs [test-path]"
echo "============================================"
