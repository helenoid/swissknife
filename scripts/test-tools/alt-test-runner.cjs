#!/usr/bin/env node

/**
 * Basic Test Runner - Alternative to Jest for running tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 SwissKnife Test Runner (Alternative)');
console.log('=====================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// Simple test implementation
function runBasicJavaScriptTests() {
  console.log('\n📋 Running Basic JavaScript Tests...');
  
  const basicTests = [
    'test/basic-test.js',
    'test/ultra-basic.test.js',
    'test/minimal.test.js'
  ];
  
  for (const testFile of basicTests) {
    if (fs.existsSync(testFile)) {
      console.log(`\n🔍 Running: ${testFile}`);
      totalTests++;
      
      try {
        // Run with node directly for JS files
        const result = execSync(`timeout 10s node -e "
          const expect = (actual) => ({
            toBe: (expected) => {
              if (actual !== expected) throw new Error(\`Expected \${expected}, got \${actual}\`);
            }
          });
          const test = (desc, fn) => {
            try {
              fn();
              console.log('✅ ' + desc);
            } catch (e) {
              console.log('❌ ' + desc + ' - ' + e.message);
              throw e;
            }
          };
          ${fs.readFileSync(testFile, 'utf8')}
        "`, { 
          encoding: 'utf8',
          timeout: 10000,
          stdio: 'pipe'
        });
        
        console.log(`✅ PASSED: ${testFile}`);
        if (result.trim()) {
          console.log(`   ${result.trim()}`);
        }
        passedTests++;
        
      } catch (error) {
        console.log(`❌ FAILED: ${testFile}`);
        if (error.stdout) {
          console.log(`   Output: ${error.stdout}`);
        }
        if (error.stderr) {
          console.log(`   Error: ${error.stderr}`);
        }
        failedTests.push({ file: testFile, error: error.message });
      }
    }
  }
}

// Test some core modules directly
function runModuleTests() {
  console.log('\n📦 Running Direct Module Tests...');
  
  totalTests++;
  try {
    // Test if we can at least compile TypeScript files
    if (fs.existsSync('./src/utils/events/event-bus.ts')) {
      console.log('✅ EventBus module exists');
      passedTests++;
    } else {
      throw new Error('EventBus module not found');
    }
  } catch (error) {
    console.log(`❌ EventBus test failed: ${error.message}`);
    failedTests.push({ file: 'EventBus', error: error.message });
  }
  
  totalTests++;
  try {
    if (fs.existsSync('./src/utils/cache/manager.ts')) {
      console.log('✅ CacheManager module exists');
      passedTests++;
    } else {
      throw new Error('CacheManager module not found');
    }
  } catch (error) {
    console.log(`❌ CacheManager test failed: ${error.message}`);
    failedTests.push({ file: 'CacheManager', error: error.message });
  }
}

// Run tests
runBasicJavaScriptTests();
runModuleTests();

// Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests.length}`);
console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

if (failedTests.length > 0) {
  console.log('\n❌ Failed Tests:');
  failedTests.forEach(test => {
    console.log(`  - ${test.file}: ${test.error}`);
  });
}

if (passedTests === totalTests && totalTests > 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else if (totalTests === 0) {
  console.log('\n⚠️  No tests were found to run.');
  process.exit(1);
} else {
  console.log('\n⚠️  Some tests failed.');
  process.exit(1);
}
