#!/usr/bin/env node

/**
 * Enhanced diagnostic test runner for SwissKnife
 * Runs tests with detailed diagnostic information and suggestions
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config 
const LOG_DIR = path.join(__dirname, 'test-logs');
const RESULTS_FILE = path.join(LOG_DIR, 'test-results.json');
const CATEGORIES = ['utils', 'models', 'storage', 'tasks', 'ai', 'services', 'integration'];
const TEST_DIRS = {
  'utils': ['test/unit/utils'],
  'models': ['test/unit/models'],
  'storage': ['test/unit/storage'],
  'tasks': ['test/unit/tasks'],
  'ai': ['test/unit/ai'],
  'services': ['test/unit/services'],
  'integration': ['test/integration']
};

// Command line options
const args = process.argv.slice(2);
const options = {
  category: args.includes('--all') ? null : (args.find((arg, i) => args[i-1] === '--category') || 'utils'),
  verbose: args.includes('--verbose'),
  failFast: args.includes('--fail-fast'),
  config: args.find((arg, i) => args[i-1] === '--config') || 'jest-unified.config.cjs',
  fix: args.includes('--fix'),
};

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Save test results
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    categories: {},
    totalTests: 0,
    passed: 0,
    failed: 0,
    pending: 0,
  },
  details: {}
};

/**
 * Runs tests for a specific category
 * @param {string} category Category name
 * @returns {Promise<{passed: boolean, tests: number, failures: number}>} Test results
 */
async function runCategoryTests(category) {
  console.log(`\n🧪 Running tests for category: ${category}`);

  const testDirs = TEST_DIRS[category];
  if (!testDirs) {
    console.error(`❌ Unknown category: ${category}`);
    return { passed: false, tests: 0, failures: 0, pending: 0, details: {} };
  }

  const testFiles = [];
  for (const dir of testDirs) {
    try {
      const files = await findTestFiles(dir);
      testFiles.push(...files);
    } catch (error) {
      console.error(`❌ Error finding test files in ${dir}:`, error.message);
    }
  }

  if (testFiles.length === 0) {
    console.log(`❓ No test files found in ${testDirs.join(', ')}`);
    return { passed: true, tests: 0, failures: 0, pending: 0, details: {} };
  }

  console.log(`📁 Found ${testFiles.length} test files for category ${category}`);

  // Create log file for this category
  const logFile = path.join(LOG_DIR, `${category}-tests.log`);
  const logStream = fs.createWriteStream(logFile);

  // Build command
  const jestArgs = [
    '--config', path.resolve(__dirname, options.config),
    '--colors',
    '--no-watchman',
  ];

  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  if (options.failFast) {
    jestArgs.push('--bail');
  }

  // Add test files
  jestArgs.push(...testFiles);

  // Log command
  const command = `npx jest ${jestArgs.join(' ')}`;
  console.log(`🚀 Running: ${command}`);
  logStream.write(`Command: ${command}\n\n`);

  // Run tests
  const details = {};
  return new Promise((resolve) => {
    const child = spawn('npx', ['jest', ...jestArgs], { 
      cwd: __dirname,
      env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
    });

    // Collect output
    let output = '';
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
      logStream.write(chunk);
    });

    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stderr.write(chunk);
      logStream.write(`[ERROR] ${chunk}`);
    });

    child.on('close', (code) => {
      logStream.end();
      console.log(`\n${category} tests exited with code ${code}`);
      
      // Parse results
      const passed = code === 0;

      // Extract test stats
      let tests = 0, failures = 0, pending = 0;
      const testMatch = output.match(/Tests:\s+(\d+) passed,\s+(\d+) failed,\s+(\d+) total/);
      if (testMatch) {
        const [, passCount, failCount, totalCount] = testMatch;
        tests = parseInt(totalCount, 10);
        failures = parseInt(failCount, 10);
        
        // Check for pending tests
        const pendingMatch = output.match(/(\d+) pending/);
        if (pendingMatch) {
          pending = parseInt(pendingMatch[1], 10);
        }
      }

      // Extract file-specific results
      const fileResults = extractTestFileResults(output);
      Object.assign(details, fileResults);

      resolve({
        passed,
        tests,
        failures,
        pending,
        details
      });
    });
  });
}

/**
 * Extract per-file test results from Jest output
 * @param {string} output Jest output
 * @returns {Object} Per-file results
 */
function extractTestFileResults(output) {
  const results = {};
  const failureBlocks = output.split('● ').slice(1); // Split on test failure markers
  
  for (const block of failureBlocks) {
    // Extract file path and error 
    const fileMatch = block.match(/\n\s+at\s+.*\(([^:)]+):\d+:\d+\)/);
    if (fileMatch) {
      const filePath = fileMatch[1];
      const errorLines = block.split('\n').slice(0, 10).join('\n'); // First 10 lines
      
      if (!results[filePath]) {
        results[filePath] = { errors: [] };
      }
      
      results[filePath].errors.push(errorLines.trim());
    }
  }
  
  return results;
}

/**
 * Find all test files in a directory
 * @param {string} dir Directory to search
 * @returns {Promise<string[]>} List of test files
 */
async function findTestFiles(dir) {
  try {
    const fullDir = path.resolve(__dirname, dir);
    if (!fs.existsSync(fullDir)) {
      console.log(`Directory not found: ${fullDir}`);
      return [];
    }
    
    const files = await findFilesRecursive(fullDir, file => 
      file.match(/\.test\.(js|jsx|ts|tsx)$/) && !file.includes('node_modules')
    );
    
    return files;
  } catch (err) {
    console.error(`Error finding test files:`, err);
    return [];
  }
}

/**
 * Find files recursively in a directory
 * @param {string} dir Directory to search
 * @param {Function} filter Filter function
 * @returns {Promise<string[]>} List of files
 */
async function findFilesRecursive(dir, filter) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  const files = entries
    .filter(entry => !entry.isDirectory() && filter(entry.name))
    .map(entry => path.join(dir, entry.name));
    
  const folders = entries.filter(entry => entry.isDirectory());
  
  for (const folder of folders) {
    const subFiles = await findFilesRecursive(path.join(dir, folder.name), filter);
    files.push(...subFiles);
  }
  
  return files;
}

/**
 * Generate test report
 * @param {Object} results Test results
 */
function generateReport(results) {
  // Calculate totals
  const totalTests = Object.values(results.summary.categories).reduce((sum, cat) => sum + cat.tests, 0);
  const totalPassed = Object.values(results.summary.categories).reduce((sum, cat) => sum + cat.passed, 0);
  const totalFailed = Object.values(results.summary.categories).reduce((sum, cat) => sum + cat.failures, 0);
  const totalPending = Object.values(results.summary.categories).reduce((sum, cat) => sum + cat.pending, 0);
  
  results.summary.totalTests = totalTests;
  results.summary.passed = totalPassed;
  results.summary.failed = totalFailed;
  results.summary.pending = totalPending;
  
  // Save JSON results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  
  // Generate markdown report
  const reportFile = path.join(LOG_DIR, 'test-report.md');
  const reportContent = [
    '# SwissKnife Test Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total Tests: ${totalTests}`,
    `- Passed: ${totalPassed}`,
    `- Failed: ${totalFailed}`,
    `- Pending: ${totalPending}`,
    '',
    '## Results by Category',
    ''
  ];
  
  for (const category of Object.keys(results.summary.categories)) {
    const cat = results.summary.categories[category];
    reportContent.push(`### ${category.toUpperCase()}`);
    reportContent.push('');
    reportContent.push(`- Tests: ${cat.tests}`);
    reportContent.push(`- Passed: ${cat.tests - cat.failures - cat.pending}`);
    reportContent.push(`- Failed: ${cat.failures}`);
    reportContent.push(`- Pending: ${cat.pending}`);
    reportContent.push(`- Status: ${cat.passed ? '✅ PASSED' : '❌ FAILED'}`);
    reportContent.push('');
  }
  
  // Add detailed failure analysis
  reportContent.push('## Failure Analysis');
  reportContent.push('');
  
  const failedFiles = Object.entries(results.details)
    .filter(([_, fileDetails]) => fileDetails.errors?.length > 0);
  
  if (failedFiles.length === 0) {
    reportContent.push('No test failures found.');
  } else {
    for (const [filePath, fileDetails] of failedFiles) {
      reportContent.push(`### ${path.relative(__dirname, filePath)}`);
      reportContent.push('');
      reportContent.push('```');
      reportContent.push(fileDetails.errors.join('\n\n'));
      reportContent.push('```');
      reportContent.push('');
    }
  }
  
  // Save report
  fs.writeFileSync(reportFile, reportContent.join('\n'));
  console.log(`\n📊 Test report saved to ${reportFile}`);
}

/**
 * Main function to run tests
 */
async function runTests() {
  console.log('🚀 SwissKnife Enhanced Test Diagnostics');
  console.log('=======================================');
  
  // Run specific category or all categories
  const categoriesToRun = options.category ? [options.category] : CATEGORIES;
  
  for (const category of categoriesToRun) {
    const categoryResults = await runCategoryTests(category);
    
    // Store results
    results.summary.categories[category] = {
      passed: categoryResults.passed,
      tests: categoryResults.tests,
      failures: categoryResults.failures,
      pending: categoryResults.pending
    };
    
    // Store details
    Object.assign(results.details, categoryResults.details);
    
    console.log(`\n📊 ${category} Results: ${categoryResults.tests} tests, ${categoryResults.failures} failures, ${categoryResults.pending} pending`);
  }
  
  // Generate report
  generateReport(results);
  
  // Final summary
  console.log('\n📝 Final Results:');
  for (const [category, result] of Object.entries(results.summary.categories)) {
    console.log(`${result.passed ? '✅' : '❌'} ${category}: ${result.tests} tests, ${result.failures} failures`);
  }
  
  // Check for any failures
  const anyFailures = Object.values(results.summary.categories).some(cat => !cat.passed);
  if (anyFailures) {
    console.log('\n❗ Some tests failed. See test logs for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
