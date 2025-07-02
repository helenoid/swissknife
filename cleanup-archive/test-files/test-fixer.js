/**
 * SwissKnife Test Fixer
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
  console.error('Usage: node test-fixer.js path/to/test/file.js');
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

// Fix 1: Handle TypeScript interfaces in JS files
if (testFile.endsWith('.js') && /interface /.test(content)) {
  console.log('\nFix #1: Converting TypeScript interfaces to JSDoc...');
  const originalContent = updatedContent;
  updatedContent = updatedContent.replace(
    /interface ([a-zA-Z0-9_]+) \{([^}]+)\}/g,
    (match, name, properties) => {
      return `/**
 * @typedef {Object} ${name}
${properties.split('\n').map(line => {
  const propertyMatch = line.trim().match(/([a-zA-Z0-9_]+)(\??): ([a-zA-Z0-9_<>|]+);/);
  if (propertyMatch) {
    const [_, propName, optional, propType] = propertyMatch;
    return ` * @property {${propType}} ${propName}${optional ? ' [Optional]' : ''}`;
  }
  return '';
}).join('\n')}
 */`;
    }
  );
  
  if (originalContent !== updatedContent) {
    fixesApplied++;
    console.log('  ✓ TypeScript interfaces converted to JSDoc');
  } else {
    console.log('  ⚠️ No TypeScript interfaces found for conversion');
  }
}

// Fix 2: Add Jest globals import
if (!updatedContent.includes('require(\'@jest/globals\')') && !updatedContent.includes('from \'@jest/globals\'')) {
  console.log('\nFix #2: Adding Jest globals import...');
  
  // Check if using imports or requires
  const hasImports = /import .* from/.test(updatedContent);
  const hasRequires = /const .* = require\(/.test(updatedContent);
  
  if (hasImports) {
    updatedContent = `import { describe, it, test, expect, beforeEach, afterEach, jest } from '@jest/globals';\n\n${updatedContent}`;
    fixesApplied++;
    console.log('  ✓ Added Jest globals import statement');
  } else if (hasRequires || !hasImports) {
    updatedContent = `const { describe, it, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');\n\n${updatedContent}`;
    fixesApplied++;
    console.log('  ✓ Added Jest globals require statement');
  }
}

// Fix 3: Add mock implementations for common dependencies
const addMock = (modulePathPattern, mockImplementation) => {
  if (new RegExp(`Cannot find module.*${modulePathPattern.replace(/\//g, '\\/')}`, 'i').test(content) || 
      new RegExp(modulePathPattern.replace(/\//g, '\\/'), 'i').test(content)) {
    
    console.log(`\nFix: Adding mock for ${modulePathPattern}...`);
    
    // Check if mock is not already present
    if (!updatedContent.includes(`jest.mock`) || !updatedContent.includes(modulePathPattern)) {
      // Add mock after imports but before test code
      const lines = updatedContent.split('\n');
      const lastImportIndex = lines.findLastIndex(line => 
        line.startsWith('import ') || 
        line.startsWith('const ') && line.includes('require(')
      );
      
      const mockCode = `\n// Mock for ${modulePathPattern}\n${mockImplementation}\n`;
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, mockCode);
        updatedContent = lines.join('\n');
      } else {
        updatedContent = mockCode + updatedContent;
      }
      
      fixesApplied++;
      console.log(`  ✓ Added mock for ${modulePathPattern}`);
    } else {
      console.log(`  ⚠️ Mock for ${modulePathPattern} already exists`);
    }
  }
};

// Common mocks
addMock('utils/config', `jest.mock('../../../src/utils/config.js', () => ({
  getCurrentProjectConfig: jest.fn().mockResolvedValue({}),
  saveCurrentProjectConfig: jest.fn().mockResolvedValue(undefined),
  getGlobalConfig: jest.fn().mockResolvedValue({}),
  saveGlobalConfig: jest.fn().mockResolvedValue(undefined),
  getMcprcConfig: jest.fn().mockResolvedValue({})
}), { virtual: true });`);

addMock('utils/log', `jest.mock('../../../src/utils/log.js', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn()
}), { virtual: true });`);

addMock('models/registry', `jest.mock('../../../src/ai/models/registry', () => ({
  ModelRegistry: {
    getInstance: jest.fn().mockReturnValue({
      getModelProvider: jest.fn().mockReturnValue({
        generateResponse: jest.fn().mockResolvedValue({ content: 'mock response' })
      })
    })
  }
}), { virtual: true });`);

// Fix 4: Create test helper if needed
const testDir = path.dirname(testFile);
const helperPath = path.join(testDir, 'test-helper.js');
const relativePath = path.relative(testDir, path.join(process.cwd(), 'src'));

if (!fs.existsSync(helperPath)) {
  console.log('\nFix: Creating test helper module...');
  
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
  
  // Mock model registry
  createMockModule('${relativePath}/ai/models/registry.js', {
    ModelRegistry: {
      getInstance: jest.fn().mockReturnValue({
        getModelProvider: jest.fn().mockReturnValue({
          generateResponse: jest.fn().mockResolvedValue({ content: 'mock response' })
        })
      })
    }
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
    updatedContent = updatedContent.includes('require(\'@jest/globals\')') || updatedContent.includes('from \'@jest/globals\'') 
      ? updatedContent.replace(/((import|require).*;\n\n)/, `$1${helperRequire}`)
      : helperRequire + updatedContent;
      
    fixesApplied++;
    console.log('  ✓ Added import for test helper');
  }
}

// Fix 5: Fix module resolution issues
if (/Cannot find module/.test(content)) {
  console.log('\nFix: Addressing module resolution issues...');
  
  // Add setupPathFixes() call if not present but helper is imported
  if (updatedContent.includes('./test-helper') && !updatedContent.includes('setupPathFixes')) {
    updatedContent = updatedContent.replace(
      /require\(['"]\.\/test-helper['"]\);/,
      `require('./test-helper');\ntestHelper.setupPathFixes();\ntestHelper.setupCommonMocks();`
    );
    fixesApplied++;
    console.log('  ✓ Added path fixes and common mocks setup');
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
console.log(`npx jest --config=jest.config.cjs "${testFile}"`);
console.log('\nTo revert changes if needed:');
console.log(`mv "${backupFile}" "${testFile}"`);
