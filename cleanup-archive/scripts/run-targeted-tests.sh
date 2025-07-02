#!/bin/bash

# SwissKnife Test Runner - Focuses on running and fixing specific test categories
# This script runs tests from different categories to identify patterns in failures

echo "============================================"
echo "SwissKnife Targeted Test Runner"
echo "============================================"

# Create a unique timestamp for the test run
timestamp=$(date +%Y%m%d_%H%M%S)
results_dir="test-results-${timestamp}"
mkdir -p "$results_dir"

# Create a modern Jest config for running tests
cat > jest-modern.config.js << 'EOL'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
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
          '@babel/plugin-transform-modules-commonjs',
          '@babel/plugin-transform-runtime'
        ]
      }
    ]
  },
  testTimeout: 30000,
  verbose: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(lodash-es|@modelcontextprotocol)/)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['./test-modern-setup.js']
}
EOL

# Create a setup file with increased timeouts and chai-jest adapter
cat > test-modern-setup.js << 'EOL'
// Increased timeouts for all tests
jest.setTimeout(30000);

// Chai-Jest adapter
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
          undefined: () => jestExpect.toBeUndefined()
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
        eql: (expected) => jestExpect.toEqual(expected)
      }
    };
  }
};

console.log('Modern test setup completed with chai-jest adapter');
EOL

# Categories of tests to run
core_tests=(
  "test/unit/utils/logging/simple-manager.test.js"
  "test/unit/utils/cache/manager.test.ts"
  "test/unit/utils/errors/self-contained.test.js"
)

# Function to run tests and collect results
run_test() {
  local test_path=$1
  local test_name=$(basename "$test_path")
  local log_file="${results_dir}/${test_name%.test.*}-output.log"
  
  echo "Running ${test_path}..."
  npx jest --config=jest-modern.config.js "$test_path" > "$log_file" 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ PASS: $test_path"
    return 0
  else
    echo "❌ FAIL: $test_path - See $log_file for details"
    return 1
  fi
}

# Run core utility tests
echo "Running core utility tests..."
for test in "${core_tests[@]}"; do
  run_test "$test"
done

# Generate report
cat > "${results_dir}/report.md" << EOL
# SwissKnife Test Report - $(date)

## Summary
Tests were run with a modern Jest configuration to identify patterns in test failures.

## Core Utility Tests
EOL

for test in "${core_tests[@]}"; do
  if grep -q "PASS" "${results_dir}/$(basename "$test" .test.*)-output.log" 2>/dev/null; then
    echo "- ✅ PASS: $test" >> "${results_dir}/report.md"
  else
    echo "- ❌ FAIL: $test" >> "${results_dir}/report.md"
  fi
done

echo "============================================"
echo "Test running completed!"
echo "Results saved to: $results_dir"
echo "============================================"

cat "${results_dir}/report.md"
