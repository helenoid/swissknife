/**
 * Build Verification Tests
 * 
 * This script verifies that the build output is functional by running
 * some basic smoke tests on the built CLI application.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CLI_PATH = path.resolve(__dirname, '../cli.mjs');
const TIMEOUT = 10000; // 10 seconds
const TESTS = [
  {
    name: 'CLI Help',
    command: 'node cli.mjs --help',
    expectedExitCode: 0,
    expectedOutput: 'SwissKnife'
  },
  {
    name: 'CLI Version',
    command: 'node cli.mjs --version',
    expectedExitCode: 0,
    expectedOutput: /\d+\.\d+\.\d+/
  }
];

// Verify build exists
function verifyBuildExists() {
  console.log('Verifying build exists...');
  if (!fs.existsSync(CLI_PATH)) {
    console.error(`❌ Build not found at ${CLI_PATH}`);
    process.exit(1);
  }
  console.log('✅ Build found');
}

// Run verification tests
function runVerificationTests() {
  console.log('\nRunning verification tests...');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of TESTS) {
    process.stdout.write(`Running test: ${test.name}... `);
    
    try {
      const output = execSync(test.command, {
        cwd: path.dirname(CLI_PATH),
        timeout: TIMEOUT,
        encoding: 'utf8'
      });
      
      // Check output matches expected
      const outputMatches = test.expectedOutput instanceof RegExp
        ? test.expectedOutput.test(output)
        : output.includes(test.expectedOutput);
      
      if (outputMatches) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED - Output does not match expected pattern');
        console.log('  Expected: ', test.expectedOutput);
        console.log('  Actual: ', output.substring(0, 100) + (output.length > 100 ? '...' : ''));
        failedTests++;
      }
    } catch (error) {
      const exitCode = error.status || 1;
      
      if (exitCode === test.expectedExitCode) {
        console.log('✅ PASSED (with expected error)');
        passedTests++;
      } else {
        console.log(`❌ FAILED - Exit code ${exitCode} (expected ${test.expectedExitCode})`);
        console.log('  Error: ', error.message);
        failedTests++;
      }
    }
  }
  
  console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests > 0) {
    console.error('\n❌ Verification failed - some tests did not pass');
    process.exit(1);
  } else {
    console.log('\n✅ All verification tests passed!');
  }
}

// Main function
function main() {
  console.log('🧪 Running build verification tests');
  
  verifyBuildExists();
  runVerificationTests();
}

// Run main function
main();