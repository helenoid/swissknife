/**
 * TypeScript-specific test setup file
 * 
 * Provides TypeScript-friendly Jest/Sinon integration with enhanced features for
 * handling TypeScript imports, path mapping, and compatibility with the SwissKnife project
 * 
 * This enhanced version improves ESM/CommonJS compatibility and provides better TypeScript
 * test support with automatic module resolution and import handling
 */

// Import the super complete setup
require('./super-complete-setup');

// Set up proper TypeScript path mapping 
const path = require('path');
const fs = require('fs');
const tsconfig = require('../tsconfig.jest.json');

// Setup module resolver for TypeScript @ imports
const moduleNameMapper = {};
if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  Object.keys(tsconfig.compilerOptions.paths).forEach(pathKey => {
    const pathPattern = pathKey.replace(/\*$/, '(.*)');
    const pathReplacement = tsconfig.compilerOptions.paths[pathKey][0].replace(/\*$/, '$1');
    const baseUrl = tsconfig.compilerOptions.baseUrl || '.';
    moduleNameMapper[`^${pathPattern}$`] = `<rootDir>/${path.join(baseUrl, pathReplacement)}`;
  });
}

// Create helper function to check if a file exists in both ESM and CommonJS formats
global.resolveModuleFilePath = (basePath, moduleName) => {
  const extensions = ['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx'];
  const directories = ['.', './src', './test', './test/mocks'];
  
  // Check if it's an npm module with direct path
  if (moduleName.includes('/') && !moduleName.startsWith('.') && !moduleName.startsWith('@')) {
    try {
      return require.resolve(moduleName);
    } catch (e) {
      // Not found, continue with other strategies
    }
  }
  
  // Try direct resolution first
  try {
    return require.resolve(moduleName);
  } catch (e) {
    // Not found, try with different extensions and paths
  }

  // For each directory, try each extension
  for (const dir of directories) {
    for (const ext of extensions) {
      const potentialPath = path.join(basePath, dir, `${moduleName}${ext}`);
      if (fs.existsSync(potentialPath)) {
        return potentialPath;
      }
      
      // Also try with .cjs.test and other variations for test files
      const testPotentialPath = path.join(basePath, dir, `${moduleName}.test${ext}`);
      if (fs.existsSync(testPotentialPath)) {
        return testPotentialPath;
      }
      
      // Check for .cjs.test.js pattern
      const cjsTestPath = path.join(basePath, dir, `${moduleName}.cjs.test.js`);
      if (fs.existsSync(cjsTestPath)) {
        return cjsTestPath;
      }
    }
  }
  
  // Could not resolve, return original
  return moduleName;
};

// Add special handling for TypeScript ESM modules
const chaiStub = require('./mocks/stubs/chai-jest-stub');
global.chai = chaiStub;

// Create a mock registry to store all registered mocks
global.mockRegistry = new Map();

// Set up jest.mock for ESM modules if needed
if (typeof jest !== 'undefined') {
  const originalMock = jest.mock;
  jest.mock = (modulePath, factory, options) => {
    // Add .js extension to relative import paths if needed for ESM compatibility
    if (modulePath.startsWith('.') && !modulePath.endsWith('.js') && 
        !modulePath.endsWith('.jsx') && !modulePath.endsWith('.ts') && 
        !modulePath.endsWith('.tsx')) {
      modulePath = `${modulePath}.js`;
    }
    
    // Store the mock in our registry for potential reuse
    global.mockRegistry.set(modulePath, { factory, options });
    
    return originalMock.call(jest, modulePath, factory, options);
  };
  
  // Enhanced version of jest.mock that works better with TypeScript
  global.mockTypeScriptModule = (modulePath, mockImplementation) => {
    // Resolve the module path based on TypeScript config
    const resolvedPath = Object.keys(moduleNameMapper).reduce((path, pattern) => {
      const regex = new RegExp(pattern.replace(/\$/g, '\\$'));
      if (regex.test(modulePath)) {
        return modulePath.replace(regex, moduleNameMapper[pattern].replace('<rootDir>', '.'));
      }
      return path;
    }, modulePath);
    
    // Register the mock
    jest.mock(resolvedPath, () => mockImplementation, { virtual: true });
    
    // Store in registry
    global.mockRegistry.set(resolvedPath, { 
      factory: () => mockImplementation, 
      options: { virtual: true } 
    });
    
    return mockImplementation;
  };
}

// Apply the module name mapper to Jest's config if needed
if (typeof jest !== 'undefined' && Object.keys(moduleNameMapper).length > 0) {
  try {
    jest.config = jest.config || {};
    jest.config.moduleNameMapper = { ...jest.config.moduleNameMapper, ...moduleNameMapper };
  } catch (e) {
    console.warn('Could not set moduleNameMapper in Jest runtime config', e);
  }
}

// Add proper sinon support
let sinon;
try {
  sinon = require('sinon');
  
  // Add sinon-chai style assertions directly to chai
  if (global.expect) {
    // Add sinon spy/stub assertions to Jest's expect
    expect.extend({
      toHaveBeenCalledOnceWith(...args) {
        const spy = this.actual;
        const pass = spy.calledOnce && spy.calledWith(...args);
        return {
          pass,
          message: () => pass
            ? `Expected spy not to have been called once with ${args}`
            : `Expected spy to have been called once with ${args}`
        };
      },
      
      toHaveBeenCalledWithMatch(...args) {
        const spy = this.actual;
        const pass = spy.calledWithMatch(...args);
        return {
          pass,
          message: () => pass
            ? `Expected spy not to have been called with match ${args}`
            : `Expected spy to have been called with match ${args}`
        };
      }
    });
    
    // Handle sinon spies correctly
    const originalExpect = global.expect;
    global.expect = (actual) => {
      // If it's a sinon spy, handle its special assertions
      if (actual && typeof actual === 'function' && actual.called !== undefined) {
        return {
          toHaveBeenCalled: () => {
            if (!actual.called) {
              throw new Error(`Expected spy to have been called, but it was not called`);
            }
            return true;
          },
          toHaveBeenCalledTimes: (count) => {
            if (actual.callCount !== count) {
              throw new Error(`Expected spy to have been called ${count} times, but it was called ${actual.callCount} times`);
            }
            return true;
          },
          toHaveBeenCalledWith: (...args) => {
            if (!actual.calledWith(...args)) {
              throw new Error(`Expected spy to have been called with ${JSON.stringify(args)}, but it was not`);
            }
            return true;
          },
          // Add other assertion methods as needed
          toBe: originalExpect(actual).toBe,
          toEqual: originalExpect(actual).toEqual,
        };
      }
      
      // Otherwise use the original expect
      return originalExpect(actual);
    };
    
    // Copy all the properties from the original expect
    Object.assign(global.expect, originalExpect);
  }
  
  // Make sinon globally available
  global.sinon = sinon;
} catch (e) {
  console.warn('Sinon not available, skipping Sinon setup:', e.message);
}

// Additional TypeScript test helpers
global.mockImport = (modulePath, mockImplementation) => {
  jest.mock(modulePath, () => mockImplementation, { virtual: true });
};

// Helper for converting TypeScript tests to CommonJS
global.createCjsTestFile = (inputFile, outputFile, transformOptions = {}) => {
  console.log(`Creating CommonJS version of: ${inputFile} -> ${outputFile}`);
  
  try {
    const fs = require('fs');
    const babel = require('@babel/core');
    
    // Default transform options for TypeScript -> CommonJS
    const options = {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-runtime'
      ],
      ...transformOptions
    };
    
    // Read the TypeScript file
    const source = fs.readFileSync(inputFile, 'utf-8');
    
    // Transform with Babel
    const result = babel.transformSync(source, options);
    
    if (!result || !result.code) {
      throw new Error(`Failed to transform ${inputFile}`);
    }
    
    // Add CommonJS header with note
    const cjsCode = `/**
 * CommonJS version of TypeScript test file
 * Auto-generated from: ${path.basename(inputFile)}
 * 
 * This file fixes compatibility issues between ESM and CommonJS modules
 * for testing with Jest.
 */

${result.code}`;
    
    // Write the output file
    fs.writeFileSync(outputFile, cjsCode, 'utf-8');
    console.log(`Successfully created CommonJS test file: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`Error creating CommonJS test file: ${error.message}`);
    return false;
  }
};

// Helper to convert Chai assertions to Jest assertions in a test file
global.convertChaiToJest = (inputFile, outputFile = null) => {
  console.log(`Converting Chai assertions to Jest in: ${inputFile}`);
  
  try {
    const fs = require('fs');
    outputFile = outputFile || inputFile;
    
    // Read the test file
    const source = fs.readFileSync(inputFile, 'utf-8');
    
    // Define replacement patterns for common Chai assertions
    const replacements = [
      // expect(x).to.equal(y) -> expect(x).toBe(y)
      { pattern: /expect\s*\((.*?)\)\.to\.equal\((.*?)\)/g, replacement: 'expect($1).toBe($2)' },
      
      // expect(x).to.deep.equal(y) -> expect(x).toEqual(y)
      { pattern: /expect\s*\((.*?)\)\.to\.deep\.equal\((.*?)\)/g, replacement: 'expect($1).toEqual($2)' },
      
      // expect(x).to.be.true -> expect(x).toBe(true)
      { pattern: /expect\s*\((.*?)\)\.to\.be\.true/g, replacement: 'expect($1).toBe(true)' },
      
      // expect(x).to.be.false -> expect(x).toBe(false)
      { pattern: /expect\s*\((.*?)\)\.to\.be\.false/g, replacement: 'expect($1).toBe(false)' },
      
      // expect(x).to.be.null -> expect(x).toBeNull()
      { pattern: /expect\s*\((.*?)\)\.to\.be\.null/g, replacement: 'expect($1).toBeNull()' },
      
      // expect(x).to.be.undefined -> expect(x).toBeUndefined()
      { pattern: /expect\s*\((.*?)\)\.to\.be\.undefined/g, replacement: 'expect($1).toBeUndefined()' },
      
      // expect(x).to.have.lengthOf(y) -> expect(x).toHaveLength(y)
      { pattern: /expect\s*\((.*?)\)\.to\.have\.lengthOf\((.*?)\)/g, replacement: 'expect($1).toHaveLength($2)' },
      
      // expect(x).to.include(y) -> expect(x).toContain(y)
      { pattern: /expect\s*\((.*?)\)\.to\.include\((.*?)\)/g, replacement: 'expect($1).toContain($2)' },
      
      // expect(x).to.contain(y) -> expect(x).toContain(y)
      { pattern: /expect\s*\((.*?)\)\.to\.contain\((.*?)\)/g, replacement: 'expect($1).toContain($2)' },
      
      // expect(x).to.be.a('string') -> expect(typeof x).toBe('string')
      { pattern: /expect\s*\((.*?)\)\.to\.be\.a\('string'\)/g, replacement: 'expect(typeof $1).toBe(\'string\')' },
      
      // expect(x).to.be.an('object') -> expect(typeof x).toBe('object')
      { pattern: /expect\s*\((.*?)\)\.to\.be\.an\('object'\)/g, replacement: 'expect(typeof $1).toBe(\'object\')' },
      
      // expect(x).to.throw() -> expect(() => x).toThrow()
      { pattern: /expect\s*\((.*?)\)\.to\.throw\(\)/g, replacement: 'expect(() => $1).toThrow()' },
      
      // expect(x).to.have.been.calledOnce -> expect(x).toHaveBeenCalledTimes(1)
      { pattern: /expect\s*\((.*?)\)\.to\.have\.been\.calledOnce/g, replacement: 'expect($1).toHaveBeenCalledTimes(1)' },
      
      // expect(x).to.have.been.calledWith(y) -> expect(x).toHaveBeenCalledWith(y)
      { pattern: /expect\s*\((.*?)\)\.to\.have\.been\.calledWith\((.*?)\)/g, replacement: 'expect($1).toHaveBeenCalledWith($2)' },
    ];
    
    // Apply all replacements
    let converted = source;
    replacements.forEach(({ pattern, replacement }) => {
      converted = converted.replace(pattern, replacement);
    });
    
    // Write the output file
    fs.writeFileSync(outputFile, converted, 'utf-8');
    console.log(`Successfully converted Chai to Jest in: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`Error converting Chai to Jest: ${error.message}`);
    return false;
  }
};

// Export helpers
module.exports = {
  sinon,
  createCjsTestFile: global.createCjsTestFile,
  convertChaiToJest: global.convertChaiToJest,
  mockTypeScriptModule: global.mockTypeScriptModule,
  resolveModuleFilePath: global.resolveModuleFilePath,
  mockRegistry: global.mockRegistry
};
