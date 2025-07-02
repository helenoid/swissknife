#!/usr/bin/env node
/**
 * Comprehensive error handling test executor for SwissKnife
 * This script runs all error handling tests to ensure full coverage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if colors are supported
const supportsColor = process.stdout.isTTY && process.env.TERM !== 'dumb';

const CYAN = supportsColor ? '\x1b[36m' : '';
const GREEN = supportsColor ? '\x1b[32m' : '';
const RED = supportsColor ? '\x1b[31m' : '';
const YELLOW = supportsColor ? '\x1b[33m' : '';
const RESET = supportsColor ? '\x1b[0m' : '';
const BOLD = supportsColor ? '\x1b[1m' : '';

function logHeader(message) {
  console.log(`\n${CYAN}${BOLD}=== ${message} ===${RESET}\n`);
}

function logSuccess(message) {
  console.log(`${GREEN}✓ ${message}${RESET}`);
}

function logError(message) {
  console.log(`${RED}✗ ${message}${RESET}`);
}

function logInfo(message) {
  console.log(`${YELLOW}${message}${RESET}`);
}

function runCommand(command, ignoreError = false) {
  try {
    console.log(`\n${YELLOW}> ${command}${RESET}\n`);
    
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    return { success: true, output };
  } catch (error) {
    if (!ignoreError) {
      logError(`Command failed: ${command}`);
      logError(`Error: ${error.message}`);
    }
    return { success: false, error };
  }
}

async function runTests() {
  let passedSuites = 0;
  let totalSuites = 0;
  
  logHeader('SWISSKNIFE ERROR HANDLING TEST SUITE');
  logInfo('Testing error handling system comprehensively');
  
  // 1. Run Jest-based TypeScript tests
  logHeader('Running TypeScript tests');
  totalSuites++;
  const tsResult = runCommand(
    'npx jest --config=jest-error-typescript.config.cjs test/unit/utils/errors/error-handling.test.ts',
    true
  );
  if (tsResult.success) {
    passedSuites++;
    logSuccess('TypeScript tests passed');
  }
  
  // 2. Run comprehensive JS tests
  logHeader('Running comprehensive JavaScript tests');
  totalSuites++;
  const jsResult = runCommand(
    'npx jest --config=jest-error-typescript.config.cjs test/unit/utils/errors/complete-error-handling.test.js',
    true
  );
  if (jsResult.success) {
    passedSuites++;
    logSuccess('Comprehensive JavaScript tests passed');
  }
  
  // 3. Run standalone tests
  logHeader('Running standalone ESM tests');
  totalSuites++;
  const esmResult = runCommand('node error-tests-complete.mjs', true);
  if (esmResult.success) {
    passedSuites++;
    logSuccess('Standalone ESM tests passed');
  }
  
  // 4. Run CommonJS tests (if they exist)
  if (fs.existsSync('error-tests-commonjs.js')) {
    logHeader('Running CommonJS tests');
    totalSuites++;
    const cjsResult = runCommand('node error-tests-commonjs.js', true);
    if (cjsResult.success) {
      passedSuites++;
      logSuccess('CommonJS tests passed');
    }
  }
  
  // 5. Run original error handling tests
  logHeader('Running original error handling tests');
  totalSuites++;
  const origResult = runCommand('npx jest --config=error-jest.config.cjs', true);
  if (origResult.success) {
    passedSuites++;
    logSuccess('Original error handling tests passed');
  }
  
  // Print summary
  logHeader('TEST SUMMARY');
  console.log(`Total test suites: ${totalSuites}`);
  console.log(`Passed: ${passedSuites}`);
  
  if (passedSuites === totalSuites) {
    logSuccess(BOLD + 'ALL ERROR HANDLING TESTS PASSED');
    console.log(`\n${GREEN}The error handling system is fully functional and well-tested.${RESET}`);
    console.log(`${GREEN}All components (AppError, ErrorManager) work correctly.${RESET}`);
    return 0; // Success exit code
  } else {
    logError(BOLD + `${totalSuites - passedSuites} TEST SUITES FAILED`);
    console.log(`\n${RED}Please review the test output above for details.${RESET}`);
    return 1; // Failure exit code
  }
}

// Run the tests
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
