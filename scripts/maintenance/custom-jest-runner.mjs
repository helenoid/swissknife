#!/usr/bin/env node

/**
 * Custom Jest-like test runner for ES modules
 */

// Mock Jest globals
global.describe = (name, fn) => {
  console.log(`\n📝 ${name}`);
  return fn();
};

global.it = (name, fn) => {
  try {
    console.log(`  ✓ ${name}`);
    const result = fn();
    if (result instanceof Promise) {
      return result.catch(error => {
        console.log(`  ❌ ${name}: ${error.message}`);
        throw error;
      });
    }
    return result;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    throw error;
  }
};

global.expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}`);
    }
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  },
  toBeNull: () => {
    if (actual !== null) {
      throw new Error(`Expected null but got ${actual}`);
    }
  },
  toThrow: (expectedError) => {
    if (typeof actual !== 'function') {
      throw new Error('Expected a function that throws');
    }
    try {
      actual();
      throw new Error('Expected function to throw an error');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(`Expected error containing "${expectedError}" but got "${error.message}"`);
      }
    }
  }
});

console.log('🧪 Custom Jest-like Test Runner');
console.log('=================================');

async function runTest(testFile) {
  try {
    console.log(`\n📂 Running: ${testFile}`);
    const testModule = await import(`./${testFile}`);
    console.log('✅ Test completed successfully');
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Run the fibonacci test
runTest('test/fibonacci-sanity.test.ts').then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Runner error:', error);
  process.exit(1);
});
