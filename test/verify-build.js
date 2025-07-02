// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Build Verification Script (Smoke Tests)
 *
 * This script runs basic smoke tests against the compiled CLI output (e.g., `dist/cli.mjs`)
 * to verify its basic functionality after the build process. It checks if the CLI
 * can be executed and responds correctly to essential flags like --help and --version.
 *
 * This is typically run in CI after the build step and before running more extensive E2E tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---

// Determine the path to the built CLI entry point.
// Adjust this path based on your project's build output structure.
const BUILD_DIR = path.resolve(__dirname, '../dist'); // Assuming build output is in 'dist/'
const CLI_ENTRY_POINT = 'cli.mjs'; // Assuming the main executable script
const CLI_PATH = path.join(BUILD_DIR, CLI_ENTRY_POINT);

// Command execution timeout
const TIMEOUT_MS = 15000; // 15 seconds (increased slightly)

// Define the smoke tests to run
const SMOKE_TESTS = [
  {
    name: 'CLI --help flag',
    command: `node ${CLI_ENTRY_POINT} --help`, // Command relative to BUILD_DIR
    expectedExitCode: 0,
    expectedOutput: /Usage: swissknife \[command]/i, // Expect usage information
    description: 'Verifies the CLI responds to the --help flag without errors.'
  },
  {
    name: 'CLI --version flag',
    command: `node ${CLI_ENTRY_POINT} --version`, // Command relative to BUILD_DIR
    expectedExitCode: 0,
    expectedOutput: /\d+\.\d+\.\d+/, // Expect semantic version format
    description: 'Verifies the CLI responds to the --version flag and outputs a version number.'
  },
  // Add more basic smoke tests here if needed, e.g.,
  // {
  //   name: 'CLI basic command (e.g., config list)',
  //   command: `node ${CLI_ENTRY_POINT} config list`,
  //   expectedExitCode: 0,
  //   expectedOutput: /Current Configuration:/i, // Check for expected output section
  //   description: 'Verifies a basic command executes without crashing.'
  // }
];

// --- Helper Functions ---

/**
 * Verifies that the expected CLI build artifact exists.
 */
function verifyBuildExists() {
  console.log(`Verifying build artifact exists at: ${CLI_PATH}`);
  if (!fs.existsSync(CLI_PATH)) {
    console.error(`❌ Build verification failed: CLI entry point not found at ${CLI_PATH}`);
    console.error('   Ensure the project has been built successfully before running verification.');
    process.exit(1); // Exit with failure code
  }
  console.log('✅ Build artifact found.');
}

/**
 * Runs the defined smoke tests against the built CLI.
 */
function runVerificationTests() {
  console.log('\nRunning build verification smoke tests...');

  let passedCount = 0;
  let failedCount = 0;

  SMOKE_TESTS.forEach((test, index) => {
    console.log(`\n[Test ${index + 1}/${SMOKE_TESTS.length}] ${test.name}`);
    console.log(`  Command: ${test.command}`);
    console.log(`  Description: ${test.description}`);

    let output = '';
    let error = null;
    let exitCode = 0;

    try {
      // Execute the command within the build directory
      output = execSync(test.command, {
        cwd: BUILD_DIR, // Execute from the build directory
        timeout: TIMEOUT_MS,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'] // Capture stdout and stderr
      });
      console.log('  Status: Execution Succeeded (Exit Code 0)');
    } catch (e) {
      error = e;
      exitCode = e.status || 1; // Get exit code from error object
      console.warn(`  Status: Execution Failed (Exit Code ${exitCode})`);
      output = e.stdout + e.stderr; // Combine outputs on error
    }

    // --- Assertions ---
    let testPassed = true;

    // 1. Check Exit Code
    if (exitCode !== test.expectedExitCode) {
      console.error(`  ❌ FAILED: Expected exit code ${test.expectedExitCode}, but got ${exitCode}.`);
      if (error) {
        console.error(`     Error: ${error.message.split('\n')[0]}`); // Show first line of error
      }
      testPassed = false;
    } else {
      console.log(`  ✅ PASSED: Exit code matched (${exitCode}).`);
    }

    // 2. Check Expected Output (only if exit code matched or was expected non-zero)
    if (testPassed || exitCode === test.expectedExitCode) {
        const outputMatches = test.expectedOutput instanceof RegExp
        ? test.expectedOutput.test(output)
        : output.includes(test.expectedOutput);

        if (!outputMatches) {
            console.error('  ❌ FAILED: Output does not contain expected content.');
            const expectedStr = test.expectedOutput instanceof RegExp
                ? test.expectedOutput.toString()
                : `"${test.expectedOutput}"`;
            console.error(`     Expected to include: ${expectedStr}`);
            // Log snippet of actual output for comparison
            const outputSnippet = (output || '').substring(0, 200).replace(/\n/g, '\\n');
            console.error(`     Actual Output (start): "${outputSnippet}${output.length > 200 ? '...' : ''}"`);
            testPassed = false;
        } else {
            console.log('  ✅ PASSED: Output contains expected content.');
        }
    }


    // --- Update Counts ---
    if (testPassed) {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  // --- Summary ---
  console.log(`\n--- Build Verification Summary ---`);
  console.log(`Total Tests: ${SMOKE_TESTS.length}`);
  console.log(chalk.green(`Passed:      ${passedCount}`));
  console.log(failedCount > 0 ? chalk.red(`Failed:      ${failedCount}`) : `Failed:      ${failedCount}`);
  console.log(`--------------------------------`);

  if (failedCount > 0) {
    console.error('\n❌ Build verification failed.');
    process.exit(1); // Exit with failure code
  } else {
    console.log('\n✅ Build verification passed successfully!');
  }
}

// --- Main Execution ---
// Using chalk for better visibility - requires adding 'chalk' as a dev dependency
let chalk;
try {
    chalk = require('chalk');
} catch (e) {
    // Fallback if chalk is not installed
    console.warn("Optional dependency 'chalk' not found. Output will not be colored.");
    chalk = { green: (t) => t, red: (t) => t, bold: (t) => t };
}

function main() {
  console.log(chalk.bold('\n🧪 Running Build Verification Script 🧪'));
  verifyBuildExists();
  runVerificationTests();
}

// Execute main function
main();
