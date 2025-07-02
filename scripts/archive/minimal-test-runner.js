#!/usr/bin/env node

/**
 * Minimal test runner to diagnose issues
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('=== Minimal Test Runner ===');
console.log('Working directory:', process.cwd());

// Test 1: Check if we can compile TypeScript files
console.log('\n1. Testing TypeScript compilation...');
try {
  execSync('npx tsc --version', { stdio: 'inherit' });
  console.log('✓ TypeScript is available');
} catch (error) {
  console.error('✗ TypeScript compilation failed:', error.message);
}

// Test 2: Check Jest installation
console.log('\n2. Testing Jest installation...');
try {
  execSync('npx jest --version', { stdio: 'inherit' });
  console.log('✓ Jest is available');
} catch (error) {
  console.error('✗ Jest installation issue:', error.message);
}

// Test 3: Try running a minimal Jest test
console.log('\n3. Testing minimal Jest execution...');
try {
  const result = execSync('npx jest test/basic-validation.test.ts --config=jest.simple.config.cjs --no-watch --runInBand --passWithNoTests', { 
    encoding: 'utf8',
    timeout: 15000
  });
  console.log('✓ Jest basic test result:\n', result);
} catch (error) {
  console.error('✗ Jest execution failed:', error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.log('STDERR:', error.stderr);
}

console.log('\n=== Test runner complete ===');
