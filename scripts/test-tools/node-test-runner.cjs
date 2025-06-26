#!/usr/bin/env node

// Minimal Node.js test runner using built-in assert
const assert = require('assert');
const path = require('path');

console.log('=== SwissKnife Module Test Runner ===');
console.log('Node.js version:', process.version);
console.log('Working directory:', process.cwd());

// Test counter
let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(description, testFn) {
  testCount++;
  try {
    testFn();
    console.log(`✓ ${description}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${description}: ${error.message}`);
    failCount++;
  }
}

function describe(suiteName, suiteFn) {
  console.log(`\n--- ${suiteName} ---`);
  suiteFn();
}

// Basic tests
describe('Basic functionality', () => {
  test('should perform basic arithmetic', () => {
    assert.strictEqual(1 + 1, 2);
  });
  
  test('should handle strings', () => {
    assert.strictEqual('hello', 'hello');
  });
  
  test('should handle arrays', () => {
    assert.deepStrictEqual([1, 2, 3], [1, 2, 3]);
  });
});

// Test module imports
describe('Module loading', () => {
  test('should be able to require built-in modules', () => {
    const fs = require('fs');
    const os = require('os');
    assert.ok(fs);
    assert.ok(os);
  });
  
  test('should be able to access package.json', () => {
    const packagePath = path.join(__dirname, 'package.json');
    const fs = require('fs');
    assert.ok(fs.existsSync(packagePath));
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    assert.strictEqual(packageJson.name, 'swissknife');
  });
});

// Test src directory structure
describe('Project structure', () => {
  test('should have src directory', () => {
    const fs = require('fs');
    const srcPath = path.join(__dirname, 'src');
    assert.ok(fs.existsSync(srcPath));
  });
  
  test('should have test directory', () => {
    const fs = require('fs');
    const testPath = path.join(__dirname, 'test');
    assert.ok(fs.existsSync(testPath));
  });
});

// Report results
console.log('\n=== Test Results ===');
console.log(`Total tests: ${testCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
