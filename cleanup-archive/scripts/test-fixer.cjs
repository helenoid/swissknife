/**
 * SwissKnife Test Fixer (CommonJS version)
 * 
 * This script analyzes and fixes common test failures in SwissKnife.
 * It applies fixes to test files based on common failure patterns.
 */

const fs = require('fs');
const path = require('path');

// Get test file from command line
const testFile = process.argv[2];
if (!testFile) {
  console.error('Please provide a test file path');
  console.error('Usage: node test-fixer.cjs path/to/test/file.js');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(testFile)) {
  console.error(`File not found: ${testFile}`);
  process.exit(1);
}

console.log(`\nFIXING TEST FILE: ${testFile}`);
console.log('='.repeat(60));

// Read test file content
const content = fs.readFileSync(testFile, 'utf8');

// Create backup
const backupFile = `${testFile}.bak`;
fs.writeFileSync(backupFile, content, 'utf8');
console.log(`Created backup at: ${backupFile}`);

// Common fixes to apply
let updatedContent = content;
let fixesApplied = 0;

// Fix 1: Add .js extension to imports
if (testFile.endsWith('.js') && (updatedContent.includes('import ') || updatedContent.includes('from '))) {
  console.log('\nFix #1: Adding .js extension to imports...');
  
  const originalContent = updatedContent;
  updatedContent = updatedContent.replace(
    /from\s+['"]([^'"./](?:(?!\.js['"]).)*)\.js?['"]/g,
    (match, p1) => `from '${p1}.js'`
  );
  
  updatedContent = updatedContent.replace(
    /from\s+['"]([^'"]*)([^'"./])['"]/g,
    (match, p1, p2) => {
      if (p1.includes('/node_modules/') || p1.startsWith('@')) {
        return match; // Don't modify node_modules imports
      }
      return `from '${p1}${p2}.js'`;
    }
  );
  
  if (originalContent !== updatedContent) {
    fixesApplied++;
    console.log('  ✓ Added .js extension to imports');
  } else {
    console.log('  ⚠️ No import statements found needing .js extension');
  }
}

// Fix 2: Convert ES Modules to CommonJS
if (!updatedContent.includes('require(') && updatedContent.includes('import ')) {
  console.log('\nFix #2: Converting ES Module imports to CommonJS requires...');
  
  const originalContent = updatedContent;
  
  // Replace simple imports
  updatedContent = updatedContent.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 
    (match, importName, modulePath) => `const ${importName} = require('${modulePath}');`
  );
  
  // Replace destructured imports
  updatedContent = updatedContent.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g, 
    (match, imports, modulePath) => {
      const cleanImports = imports.replace(/\s+as\s+/g, ': ').trim();
      return `const { ${cleanImports} } = require('${modulePath}');`;
    }
  );
  
  // Replace namespaced imports
  updatedContent = updatedContent.replace(
    /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 
    (match, importName, modulePath) => `const ${importName} = require('${modulePath}');`
  );
  
  if (originalContent !== updatedContent) {
    fixesApplied++;
    console.log('  ✓ Converted ES Module imports to CommonJS requires');
  } else {
    console.log('  ⚠️ No ES Module imports found to convert');
  }
}

// Fix 3: Add Jest globals import
if (!updatedContent.includes('require(\'@jest/globals\')') && !updatedContent.includes('from \'@jest/globals\'')) {
  console.log('\nFix #3: Adding Jest globals import...');
  
  updatedContent = `const { describe, it, test, expect, beforeEach, beforeAll, afterEach, afterAll, jest } = require('@jest/globals');\n\n${updatedContent}`;
  fixesApplied++;
  console.log('  ✓ Added Jest globals require statement');
}

// Fix 4: Create test helper if needed
const testDir = path.dirname(testFile);
const helperPath = path.join(testDir, 'test-helper.js');
const relativePath = path.relative(testDir, path.join(process.cwd(), 'src'));

if (!fs.existsSync(helperPath)) {
  console.log('\nFix #4: Creating test helper module...');
  
  fs.writeFileSync(helperPath, `/**
 * SwissKnife Test Helper for ${path.basename(testDir)}
 * 
 * Provides utilities for testing
 */

const path = require('path');
const { jest } = require('@jest/globals');

/**
 * Create a mock implementation for a module
 */
function createMockModule(modulePath, implementation) {
  jest.mock(modulePath, () => implementation, { virtual: true });
  return jest.requireMock(modulePath);
}

/**
 * Setup path fixing for tests
 */
function setupPathFixes() {
  // Add common module paths to NODE_PATH
  process.env.NODE_PATH = [
    path.join(process.cwd(), 'src'),
    path.join(process.cwd(), 'test'),
    process.env.NODE_PATH
  ].filter(Boolean).join(path.delimiter);
  
  // Force module path refresh
  require('module').Module._initPaths();
}

/**
 * Setup common mocks for SwissKnife tests
 */
function setupCommonMocks() {
  // Mock config utilities
  createMockModule('${relativePath}/utils/config.js', {
    getCurrentProjectConfig: jest.fn().mockResolvedValue({}),
    saveCurrentProjectConfig: jest.fn().mockResolvedValue(undefined),
    getGlobalConfig: jest.fn().mockResolvedValue({}),
    saveGlobalConfig: jest.fn().mockResolvedValue(undefined),
    getMcprcConfig: jest.fn().mockResolvedValue({})
  });
  
  // Mock logging utilities
  createMockModule('${relativePath}/utils/log.js', {
    logError: jest.fn(),
    logInfo: jest.fn(),
    logDebug: jest.fn(),
    logWarn: jest.fn()
  });
}

module.exports = {
  createMockModule,
  setupPathFixes,
  setupCommonMocks
};`, 'utf8');

  console.log(`  ✓ Created test helper at ${helperPath}`);
  
  // Add import for test helper
  if (!updatedContent.includes('test-helper')) {
    const helperRequire = `// Import test helper\nconst testHelper = require('./test-helper');\ntestHelper.setupPathFixes();\ntestHelper.setupCommonMocks();\n\n`;
    updatedContent = updatedContent.includes('require(\'@jest/globals\')') 
      ? updatedContent.replace(/((const.*require.*;\n)+\n)/, `$1${helperRequire}`)
      : helperRequire + updatedContent;
      
    fixesApplied++;
    console.log('  ✓ Added import for test helper');
  }
}

// Write updated content back to file if changes were made
if (fixesApplied > 0) {
  fs.writeFileSync(testFile, updatedContent, 'utf8');
  console.log(`\n✅ Applied ${fixesApplied} fixes to ${testFile}`);
  console.log('Run the test again to check if it passes now.');
} else {
  console.log('\n⚠️ No fixes were applied to the file.');
  console.log('The issue may require manual inspection.');
}

console.log('\nTo run the test:');
console.log(`npx jest --config=jest.hybrid.config.cjs "${testFile}"`);
console.log('\nTo revert changes if needed:');
console.log(`mv "${backupFile}" "${testFile}"`);
