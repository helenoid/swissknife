#!/usr/bin/env node

/**
 * Direct Test Runner - Runs TypeScript tests without Jest environment issues
 * This is a simplified test runner that can execute our test files directly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 SwissKnife Direct Test Runner');
console.log('================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function runTest(testFile) {
  console.log(`\n📋 Running: ${testFile}`);
  
  try {
    // Use tsx to run TypeScript files directly
    const result = execSync(`npx tsx ${testFile}`, { 
      encoding: 'utf8',
      timeout: 30000,
      stdio: 'pipe'
    });
    
    console.log(`✅ PASSED: ${testFile}`);
    passedTests++;
    
    if (result.trim()) {
      console.log(`   Output: ${result.trim()}`);
    }
    
  } catch (error) {
    console.log(`❌ FAILED: ${testFile}`);
    console.log(`   Error: ${error.message}`);
    if (error.stdout) {
      console.log(`   Stdout: ${error.stdout}`);
    }
    if (error.stderr) {
      console.log(`   Stderr: ${error.stderr}`);
    }
    failedTests.push({ file: testFile, error: error.message });
  }
  
  totalTests++;
}

// Find simple test files that can be run directly
const simpleTests = [
  'test/fibonacci-sanity.test.ts',
  'test/isolated-eventbus.test.ts',
  'test/messages.test.ts'
];

// Check if files exist and run them
for (const testFile of simpleTests) {
  if (fs.existsSync(testFile)) {
    runTest(testFile);
  } else {
    console.log(`⚠️  SKIPPED: ${testFile} (file not found)`);
  }
}

// Summary
console.log('\n📊 Test Results Summary');
console.log('=======================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests.length}`);

if (failedTests.length > 0) {
  console.log('\n❌ Failed Tests:');
  failedTests.forEach(test => {
    console.log(`  - ${test.file}: ${test.error}`);
  });
}

if (passedTests === totalTests && totalTests > 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed or no tests were run.');
  process.exit(1);
}
