#!/usr/bin/env node

/**
 * Enhanced TypeScript Test Runner (v2)
 * 
 * This script provides a comprehensive way to run TypeScript tests in the SwissKnife project,
 * handling both unit and integration tests. It addresses issues with ESM/CommonJS
 * compatibility and generates CommonJS versions of tests when needed.
 * 
 * The enhanced version adds:
 * - Automatic conversion of TypeScript tests to CommonJS format
 * - Support for both ESM and CommonJS module testing
 * - Better error handling and reporting
 * - More flexible test pattern matching
 * - Support for running both original TypeScript and converted CommonJS tests
 * 
 * Usage:
 *   node run-typescript-tests.cjs [options] [test-pattern]
 * 
 * Options:
 *   --no-convert    Skip auto-conversion of TS to CJS
 *   --no-ts         Skip running TypeScript tests directly
 *   --no-cjs        Skip running CommonJS versions of tests
 *   --bail          Stop on first test failure
 *   --coverage      Generate test coverage report
 *   --verbose       Show detailed output
 *   --watch         Watch mode for continuous testing
 * 
 * Examples:
 *   node run-typescript-tests.cjs                    # Run all TypeScript tests
 *   node run-typescript-tests.cjs graph              # Run all graph-related tests
 *   node run-typescript-tests.cjs test/unit/utils    # Run utils unit tests
 *   node run-typescript-tests.cjs --no-ts graph      # Run only CommonJS tests for graph
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

// Configuration files
const TS_CONFIG_FILE = path.join(process.cwd(), 'jest.typescript.config.cjs');
const SIMPLE_CONFIG_FILE = path.join(process.cwd(), 'jest.typescript.simple.config.cjs');

// Parse arguments
const args = process.argv.slice(2);
const testPatterns = args.filter(arg => !arg.startsWith('--'));
const options = args.filter(arg => arg.startsWith('--'));

// Default configuration
const config = {
  autoConvert: true,           // Automatically convert TS tests to CJS versions
  runTypeScriptTests: true,    // Run TypeScript tests directly
  runCommonJsTests: true,      // Run CommonJS versions of tests
  bail: false,                 // Stop on first failure
  coverage: false,             // Generate coverage report
  verbose: true,               // Verbose output
  watch: false,                // Watch mode
};

// Parse options
options.forEach(opt => {
  switch (opt) {
    case '--no-convert':
      config.autoConvert = false;
      break;
    case '--no-ts':
      config.runTypeScriptTests = false;
      break;
    case '--no-cjs':
      config.runCommonJsTests = false;
      break;
    case '--bail':
      config.bail = true;
      break;
    case '--coverage':
      config.coverage = true;
      break;
    case '--quiet':
      config.verbose = false;
      break;
    case '--watch':
      config.watch = true;
      break;
  }
});

// Default test pattern if none provided
if (testPatterns.length === 0) {
  testPatterns.push('test/integration/graph');
}

console.log(chalk.blue(`Running TypeScript tests for: ${testPatterns.join(', ')}`));

// Ensure config files are available
if (!fs.existsSync(SIMPLE_CONFIG_FILE)) {
  console.log(chalk.yellow(`Creating simplified TypeScript Jest configuration at ${SIMPLE_CONFIG_FILE}`));
  
  const configContent = `/**
 * Simplified TypeScript Jest configuration for SwissKnife
 * This configuration addresses ESM/CommonJS compatibility issues.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest', 
      {
        tsconfig: 'tsconfig.test.json',
        isolatedModules: true,
        diagnostics: false
      }
    ],
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: [
          ["@babel/preset-env", {
            targets: { node: "current" },
            modules: 'commonjs'
          }]
        ],
        plugins: [
          "@babel/plugin-transform-runtime"
        ]
      }
    ]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lodash-es$": "lodash"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol)/)"
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.js'],
  verbose: true
};`;

  fs.writeFileSync(CONFIG_FILE, configContent);
}

/**
 * Attempt to convert TypeScript test files to CommonJS
 * @param {string[]} patterns Test file patterns to convert
 */
function convertTypeScriptToCjs(patterns) {
  if (!config.autoConvert) {
    console.log(chalk.yellow('Skipping TypeScript to CommonJS conversion (--no-convert)'));
    return;
  }
  
  console.log(chalk.blue('\n=== Converting TypeScript Tests to CommonJS ===\n'));
  
  try {
    // Check if we have a converter script
    const converterPath = path.join(__dirname, 'typescript-test-converter.cjs');
    if (!fs.existsSync(converterPath)) {
      console.log(chalk.yellow('TypeScript converter script not found, skipping conversion'));
      return;
    }
    
    // For each pattern, run the converter
    patterns.forEach(pattern => {
      try {
        console.log(chalk.blue(`Converting tests matching pattern: ${pattern}`));
        execSync(`node ${converterPath} ${pattern}`, { 
          stdio: config.verbose ? 'inherit' : 'pipe'
        });
      } catch (error) {
        console.error(chalk.red(`Error converting tests for pattern ${pattern}: ${error.message}`));
        // Continue with other patterns
      }
    });
  } catch (error) {
    console.error(chalk.red(`Error in TypeScript conversion: ${error.message}`));
  }
}

/**
 * Run TypeScript tests directly with ts-jest
 * @param {string[]} patterns Test file patterns
 * @returns {boolean} Success status
 */
function runTypeScriptTests(patterns) {
  if (!config.runTypeScriptTests) {
    console.log(chalk.yellow('Skipping TypeScript tests (--no-ts)'));
    return true;
  }
  
  console.log(chalk.blue('\n=== Running Original TypeScript Tests ===\n'));
  
  try {
    // Build the command
    let command = `npx jest --config=${TS_CONFIG_FILE}`;
    if (config.bail) command += ' --bail';
    if (config.coverage) command += ' --coverage';
    if (config.watch) command += ' --watch';
    if (config.verbose) command += ' --verbose';
    
    // Add test patterns
    if (patterns.length > 0) {
      command += ' ' + patterns.map(p => `"${p}"`).join(' ');
    }
    
    console.log(chalk.blue(`Running command: ${command}`));
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(chalk.red(`\n✗ TypeScript test execution failed: ${error.message}`));
    return false;
  }
}

/**
 * Run converted CommonJS tests with Jest
 * @param {string[]} patterns Test file patterns
 * @returns {boolean} Success status
 */
function runCommonJsTests(patterns) {
  if (!config.runCommonJsTests) {
    console.log(chalk.yellow('Skipping CommonJS tests (--no-cjs)'));
    return true;
  }
  
  console.log(chalk.blue('\n=== Running Converted CommonJS Tests ===\n'));
  
  try {
    // Convert patterns to target CJS tests
    const cjsPatterns = patterns.map(pattern => {
      // If it's a specific TypeScript file, convert to CJS pattern
      if (pattern.endsWith('.ts')) {
        return pattern.replace(/\.ts$/, '.cjs.test.js');
      }
      // If it's a specific test file
      if (pattern.endsWith('.test.ts')) {
        return pattern.replace(/\.test\.ts$/, '.cjs.test.js');
      }
      // Otherwise it's a directory pattern, make it match CJS tests
      return `${pattern}/**/*.cjs.test.js`;
    });
    
    // Build the command with standard Jest config
    let command = 'npx jest';
    if (config.bail) command += ' --bail';
    if (config.coverage) command += ' --coverage';
    if (config.watch) command += ' --watch';
    if (config.verbose) command += ' --verbose';
    
    // Add test patterns
    if (cjsPatterns.length > 0) {
      command += ' ' + cjsPatterns.map(p => `"${p}"`).join(' ');
    }
    
    console.log(chalk.blue(`Running command: ${command}`));
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(chalk.red(`\n✗ CommonJS test execution failed: ${error.message}`));
    return false;
  }
}

// Main execution flow
let tsSuccess = true;
let cjsSuccess = true;

// Step 1: Convert TS to CJS if needed
convertTypeScriptToCjs(testPatterns);

// Step 2: Run TypeScript tests
tsSuccess = runTypeScriptTests(testPatterns);

// Step 3: Run CommonJS tests
cjsSuccess = runCommonJsTests(testPatterns);

// Report final results
console.log(chalk.blue('\n=== Test Execution Summary ===\n'));

if (config.runTypeScriptTests) {
  console.log(chalk.blue('TypeScript Tests: ') + 
    (tsSuccess ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED')));
}

if (config.runCommonJsTests) {
  console.log(chalk.blue('CommonJS Tests: ') + 
    (cjsSuccess ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED')));
}

// Final result
if ((!config.runTypeScriptTests || tsSuccess) && 
    (!config.runCommonJsTests || cjsSuccess)) {
  console.log(chalk.green('\n=== All requested tests completed successfully! ===\n'));
  process.exit(0);
} else {
  console.log(chalk.red('\n=== Some test executions failed ===\n'));
  process.exit(1);
}
