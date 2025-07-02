#!/usr/bin/env node

/**
 * Run All Fixed Tests (Enhanced Version)
 * 
 * This script runs all the CommonJS test files we've created to fix failing TypeScript tests.
 * The enhanced version provides better command-line options and test filtering.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || {
  green: text => `\x1b[32m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  blue: text => `\x1b[34m${text}\x1b[0m`,
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  coverage: args.includes('--coverage'),
  verbose: !args.includes('--quiet'),
  ci: args.includes('--ci'),
  bail: args.includes('--bail'),
  testPattern: args.find(arg => !arg.startsWith('--')) || '',
  single: args.includes('--single'), // Run tests one by one
};

console.log(chalk.blue('=== SwissKnife Test Runner (Enhanced) ==='));

// Define all the test files we've created
const testFiles = [
  'test/integration/graph/got-node.cjs.test.js',
  'test/integration/graph/got-manager.cjs.test.js',
  'test/unit/config/manager.cjs.test.js',
  'test/unit/models/registry.cjs.test.js',
  'test/unit/commands/registry.cjs.test.js',
  'test/unit/commands/help-generator.cjs.test.js'
];

// Filter tests if pattern provided
const testsToRun = options.testPattern
  ? testFiles.filter(test => test.includes(options.testPattern))
  : testFiles;

if (testsToRun.length === 0) {
  console.log(chalk.yellow(`No tests match pattern: ${options.testPattern}`));
  process.exit(0);
}

// Results tracking
let allPassed = true;
const results = {};

// Run tests either individually or all at once
if (options.single) {
  console.log(chalk.blue(`Running ${testsToRun.length} tests individually...`));
  
  // Run each test file separately
  for (const testFile of testsToRun) {
    const relativePath = path.relative(process.cwd(), testFile);
    console.log(chalk.blue(`\n===== Running ${relativePath} =====\n`));
    
    try {
      // Build command with options
      let command = `npx jest ${testFile}`;
      if (options.coverage) command += ' --coverage';
      if (options.verbose) command += ' --verbose';
      if (options.ci) command += ' --ci';
      
      execSync(command, { stdio: 'inherit' });
      results[testFile] = 'PASS';
      console.log(chalk.green(`\n✓ ${relativePath} PASSED\n`));
    } catch (error) {
      results[testFile] = 'FAIL';
      allPassed = false;
      console.error(chalk.red(`\n✗ ${relativePath} FAILED\n`));
    }
  }
} else {
  // Run all tests together
  console.log(chalk.blue(`Running ${testsToRun.length} tests together...`));
  
  try {
    // Build command with all test files at once
    let command = `npx jest ${testsToRun.map(file => `"${file}"`).join(' ')}`;
    if (options.coverage) command += ' --coverage';
    if (options.verbose) command += ' --verbose';
    if (options.bail) command += ' --bail';
    if (options.ci) command += ' --ci';
    
    console.log(chalk.blue(`\nExecuting: ${command}\n`));
    execSync(command, { stdio: 'inherit' });
    
    // Mark all as passed
    testsToRun.forEach(testFile => {
      results[testFile] = 'PASS';
    });
    
    allPassed = true;
    console.log(chalk.green('\n✓ All tests passed!\n'));
  } catch (error) {
    console.error(chalk.red('\n✗ Some tests failed when run together\n'));
    console.log(chalk.yellow('Try running with --single to identify specific failing tests'));
    allPassed = false;
  }
}

// Print summary
console.log(chalk.blue('\n===== Test Results Summary =====\n'));
for (const [testFile, result] of Object.entries(results)) {
  const symbol = result === 'PASS' ? '✓' : '✗';
  const color = result === 'PASS' ? chalk.green : chalk.red;
  console.log(`${color(`${symbol} ${path.relative(process.cwd(), testFile)}: ${result}`)}`);
}

// Exit with appropriate code
if (allPassed) {
  console.log(chalk.green('\n✓ All tests passed successfully!\n'));
  process.exit(0);
} else {
  console.error(chalk.red('\n✗ Some tests failed.\n'));
  process.exit(1);
}
