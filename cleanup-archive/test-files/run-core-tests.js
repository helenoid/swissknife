#!/usr/bin/env node

/**
 * Enhanced Core Test Runner for SwissKnife
 * This script runs tests focusing on core functionality while excluding CLI and GUI components
 * 
 * Features:
 * - Configurable test directories and patterns
 * - Flexible test isolation with targeted runs 
 * - Detailed error reporting
 * - Support for different Jest configurations
 * - Test categorization to identify common failures
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Make fs.readdir and fs.stat promise-based
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

// Configuration
const TEST_DIRS = [
  'test/unit/utils',
  'test/unit/storage',
  'test/unit/models',
  'test/unit/ai',
  'test/unit/services',
  'test/unit/tasknet',
  'test/integration/storage',
  'test/integration/tasks',
  'test/integration/graph'
];

// Test categories for targeted runs
const TEST_CATEGORIES = {
  'critical': ['storage', 'models'],
  'utils': ['utils'],
  'services': ['services', 'ai', 'tasknet'],
  'integration': ['integration']
};

// Exclude patterns (CLI, UI components)
const EXCLUDE_PATTERNS = [
  'cli',
  'ux',
  'web_',
  'entrypoints',
];

// CLI arguments parsing
const args = process.argv.slice(2);
const options = {
  category: null,
  config: 'jest-core.config.cjs',
  verbose: false,
  failFast: false,
  watch: false,
  testNamePattern: null
};

// Parse command-line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--category' && i + 1 < args.length) {
    options.category = args[++i];
  } else if (arg === '--config' && i + 1 < args.length) {
    options.config = args[++i];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--fail-fast') {
    options.failFast = true;
  } else if (arg === '--watch') {
    options.watch = true;
  } else if (arg === '--testNamePattern' && i + 1 < args.length) {
    options.testNamePattern = args[++i];
  }
}

// Function to filter test files
function shouldRunTest(testPath) {
  // Skip excluded patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (testPath.includes(pattern)) {
      return false;
    }
  }
  
  // Filter by category if specified
  if (options.category && TEST_CATEGORIES[options.category]) {
    const categoryPatterns = TEST_CATEGORIES[options.category];
    return categoryPatterns.some(pattern => testPath.includes(pattern));
  }
  
  return true;
}

// Function to find all test files in a directory
async function findTestFiles(dir) {
  const results = [];
  
  if (!(await exists(dir))) {
    console.warn(`Directory does not exist: ${dir}`);
    return results;
  }
  
  const items = await readdir(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const itemStat = await stat(itemPath);
    
    if (itemStat.isDirectory()) {
      const subDirResults = await findTestFiles(itemPath);
      results.push(...subDirResults);
    } else if (item.endsWith('.test.js') || item.endsWith('.test.ts')) {
      if (shouldRunTest(itemPath)) {
        results.push(itemPath);
      }
    }
  }
  
  return results;
}

// Function to run tests in a directory
async function runTests(dir) {
  console.log(`\n📁 Finding tests in ${dir}...`);
  const testFiles = await findTestFiles(dir);
  
  if (testFiles.length === 0) {
    console.log(`No test files found in ${dir}`);
    return { success: true, total: 0, failed: 0 };
  }
  
  console.log(`Found ${testFiles.length} test files in ${dir}`);
  
  // Build Jest command arguments
  const jestArgs = [
    '--config', path.resolve(options.config),
    '--colors',
  ];
  
  if (options.verbose) {
    jestArgs.push('--verbose');
  }
  
  if (options.failFast) {
    jestArgs.push('--bail');
  }
  
  if (options.watch) {
    jestArgs.push('--watch');
  }
  
  if (options.testNamePattern) {
    jestArgs.push('--testNamePattern', options.testNamePattern);
  }
  
  // Add test files to run
  jestArgs.push(...testFiles);
  
  return new Promise((resolve) => {
    console.log(`\n🧪 Running tests with: jest ${jestArgs.join(' ')}`);
    
    const jest = spawn('node', ['./node_modules/.bin/jest', ...jestArgs], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    jest.on('close', (code) => {
      const success = code === 0;
      resolve({
        success,
        dir,
        code
      });
    });
  });
}

// Main function
async function main() {
  console.log('🚀 SwissKnife Core Test Runner');
  console.log('===============================');
  
  if (options.category) {
    console.log(`Running tests in category: ${options.category}`);
  }
  
  const results = [];
  const dirsToTest = options.category ? 
    TEST_DIRS.filter(dir => {
      return TEST_CATEGORIES[options.category].some(pattern => dir.includes(pattern));
    }) : 
    TEST_DIRS;
  
  // Run tests for each directory
  for (const dir of dirsToTest) {
    try {
      const result = await runTests(dir);
      results.push(result);
      
      if (!result.success && options.failFast) {
        console.log(`\n⛔ Tests failed in ${dir}, stopping due to --fail-fast option`);
        break;
      }
    } catch (error) {
      console.error(`\n💥 Error running tests in ${dir}:`, error);
      results.push({
        success: false,
        dir,
        error: error.message || String(error)
      });
      
      if (options.failFast) {
        break;
      }
    }
  }
  
  // Print summary
  console.log('\n📊 Test Run Summary');
  console.log('=================');
  
  let allSuccess = true;
  const failedDirs = [];
  
  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.dir}`);
    
    if (!result.success) {
      allSuccess = false;
      failedDirs.push(result.dir);
    }
  }
  
  console.log('\n🏁 Final Result:', allSuccess ? '✅ PASS' : '❌ FAIL');
  
  if (!allSuccess) {
    console.log('\nFailed test directories:');
    failedDirs.forEach(dir => console.log(` - ${dir}`));
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
