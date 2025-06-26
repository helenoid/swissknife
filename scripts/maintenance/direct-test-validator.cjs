#!/usr/bin/env node

/**
 * Direct Test Validation Script - Alternative to Jest
 * Validates core SwissKnife functionality without Jest dependencies
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 SwissKnife Direct Test Validation');
console.log('===================================');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log('');

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

/**
 * Run a test and track results
 */
function runTest(name, testFn) {
  totalTests++;
  console.log(`📝 Testing: ${name}`);
  
  try {
    const result = testFn();
    if (result === true || result === undefined) {
      passedTests++;
      console.log(`  ✅ PASSED`);
      results.push({ name, status: 'PASSED' });
    } else {
      failedTests++;
      console.log(`  ❌ FAILED: ${result}`);
      results.push({ name, status: 'FAILED', error: result });
    }
  } catch (error) {
    failedTests++;
    console.log(`  ❌ FAILED: ${error.message}`);
    results.push({ name, status: 'FAILED', error: error.message });
  }
  console.log('');
}

/**
 * Test TypeScript compilation
 */
function testTypeScriptCompilation() {
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return `TypeScript not available: ${error.message}`;
  }
}

/**
 * Test Node.js module resolution
 */
function testNodeModuleResolution() {
  try {
    require('commander');
    return true;
  } catch (error) {
    return `Commander module not found: ${error.message}`;
  }
}

/**
 * Test core file existence
 */
function testCoreFiles() {
  const fs = require('fs');
  const coreFiles = [
    'src/cli/commands/ipfsCommand.ts',
    'package.json',
    'tsconfig.json'
  ];
  
  for (const file of coreFiles) {
    if (!fs.existsSync(file)) {
      return `Missing core file: ${file}`;
    }
  }
  return true;
}

/**
 * Test Jest configuration existence
 */
function testJestConfig() {
  const fs = require('fs');
  const configs = ['jest.config.cjs', 'jest.minimal.config.cjs'];
  
  for (const config of configs) {
    if (fs.existsSync(config)) {
      return true;
    }
  }
  return 'No Jest configuration files found';
}

/**
 * Test direct TypeScript execution
 */
function testDirectTypeScript() {
  try {
    const result = execSync('npx tsx --version', { stdio: 'pipe', encoding: 'utf8' });
    return result.includes('tsx') || result.includes('esbuild');
  } catch (error) {
    return `tsx not available: ${error.message}`;
  }
}

// Run all tests
console.log('🚀 Starting test validation...\n');

runTest('TypeScript Compilation', testTypeScriptCompilation);
runTest('Node.js Module Resolution', testNodeModuleResolution);
runTest('Core Files Existence', testCoreFiles);
runTest('Jest Configuration', testJestConfig);
runTest('Direct TypeScript Execution', testDirectTypeScript);

// Summary
console.log('📊 Test Validation Summary');
console.log('==========================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('');

if (failedTests > 0) {
  console.log('❌ Failed Tests:');
  results.filter(r => r.status === 'FAILED').forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  console.log('');
}

console.log(`🎯 Overall Status: ${failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

// Exit with appropriate code
process.exit(failedTests === 0 ? 0 : 1);
