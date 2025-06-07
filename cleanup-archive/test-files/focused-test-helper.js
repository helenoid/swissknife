// focused-test-helper.js - Helps diagnose and fix issues in individual test files

/**
 * This script can be run as a module to help diagnose issues with specific test files
 * Usage: 
 * - Import in a test file to add diagnostic capabilities
 * - Use directly in tests to verify imports and functionality
 */

const fs = require('fs');
const path = require('path');

// Verify if a module can be imported
function verifyImport(modulePath) {
  try {
    const resolvedPath = require.resolve(modulePath);
    console.log(`✓ Successfully resolved module: ${modulePath} -> ${resolvedPath}`);
    return { success: true, resolvedPath };
  } catch (error) {
    console.error(`✗ Failed to resolve module: ${modulePath}`);
    console.error(`  Error: ${error.message}`);
    return { success: false, error };
  }
}

// Check if a file exists at the given path
function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`✓ File exists: ${filePath}`);
  } else {
    console.error(`✗ File does not exist: ${filePath}`);
  }
  return exists;
}

// Get TypeScript configuration info
function getTsConfig() {
  try {
    const tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      console.log('✓ TypeScript configuration:', {
        compilerOptions: tsConfig.compilerOptions || {},
        include: tsConfig.include || [],
        exclude: tsConfig.exclude || []
      });
      return tsConfig;
    }
    console.error('✗ TypeScript configuration file not found');
    return null;
  } catch (error) {
    console.error('✗ Error reading TypeScript configuration:', error.message);
    return null;
  }
}

// Test if the FibonacciHeap implementation works
function testFibonacciHeap() {
  try {
    // First verify the import
    const { FibonacciHeap } = require('../src/tasks/scheduler/fibonacci-heap');
    console.log('✓ Successfully imported FibonacciHeap');
    
    // Basic functionality test
    const heap = new FibonacciHeap();
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    const min = heap.extractMin();
    if (min && min.value === 'value-3') {
      console.log('✓ FibonacciHeap works correctly');
      return true;
    } else {
      console.error('✗ FibonacciHeap did not return the expected minimum value');
      console.error(`  Expected: value-3, Got: ${min ? min.value : 'null'}`);
      return false;
    }
  } catch (error) {
    console.error('✗ Error testing FibonacciHeap:', error.message);
    return false;
  }
}

// Get Jest configuration
function getJestConfig() {
  try {
    // Try different Jest config files
    const configPaths = [
      'jest.config.js',
      'jest.config.cjs',
      'jest-fixed.config.js',
      'jest-fixed.config.cjs'
    ];
    
    for (const configPath of configPaths) {
      const fullPath = path.resolve(process.cwd(), configPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✓ Found Jest config: ${configPath}`);
        // Don't try to parse the config as it might have complex values
        return { exists: true, path: fullPath };
      }
    }
    
    console.error('✗ No Jest configuration file found');
    return { exists: false };
  } catch (error) {
    console.error('✗ Error checking Jest configuration:', error.message);
    return { exists: false, error };
  }
}

module.exports = {
  verifyImport,
  checkFileExists,
  getTsConfig,
  testFibonacciHeap,
  getJestConfig
};

// If run directly, execute diagnostic tests
if (require.main === module) {
  console.log('Running focused test helper diagnostics...');
  getTsConfig();
  getJestConfig();
  
  // Basic project structure checks
  checkFileExists(path.resolve(process.cwd(), 'src/tasks/scheduler/fibonacci-heap.ts'));
  checkFileExists(path.resolve(process.cwd(), 'src/ai/service.ts'));
  
  // Test some imports
  verifyImport('../src/tasks/scheduler/fibonacci-heap');
  
  console.log('Diagnostics complete!');
}
