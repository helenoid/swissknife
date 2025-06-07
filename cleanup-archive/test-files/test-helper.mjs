#!/usr/bin/env node

/**
 * Test helper utility
 * Provides guidance on fixing failing tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const options = args.slice(1);

/**
 * Print usage
 */
function printUsage() {
  console.log(`
SwissKnife Test Helper Utility
==============================

Commands:
  help           Show this help message
  run <file>     Run a specific test file with enhanced diagnostics
  fix <file>     Create a fixed version of a test file
  analyze <dir>  Analyze test failures in a directory
  doctor         Run test diagnostics on the entire project
  
Examples:
  node test-helper.mjs run test/unit/storage/storage.test.ts
  node test-helper.mjs fix test/unit/models/registry.test.ts
  node test-helper.mjs analyze test/unit/utils
  node test-helper.mjs doctor
`);
}

/**
 * Run a specific test file
 * @param {string} file Test file to run
 */
function runTest(file) {
  const fullPath = path.resolve(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Test file not found: ${fullPath}`);
    process.exit(1);
  }
  
  console.log(`Running test file: ${file}`);
  
  // Determine which config to use based on file extension
  const isTypeScript = file.endsWith('.ts') || file.endsWith('.tsx');
  const config = isTypeScript ? 'jest-enhanced.config.cjs' : 'jest-enhanced.config.cjs';
  
  const command = `npx jest --config ${config} --verbose ${file}`;
  console.log(`Executing: ${command}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ Test passed!`);
  } catch (error) {
    console.log(`\n❌ Test failed with exit code: ${error.status}`);
    console.log('\nSuggesting fixes...');
    suggestFixes(file);
  }
}

/**
 * Suggest fixes for a failing test
 * @param {string} file Test file to analyze
 */
function suggestFixes(file) {
  const fullPath = path.resolve(__dirname, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check for common issues
  const issues = [];
  
  // Check for import issues
  const importPattern = /import\s+(?:{[^}]*}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];
    
    // Check for .js extension in ESM imports
    if (importPath.includes('/') && !importPath.startsWith('@') && 
        !importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
      issues.push({
        type: 'import',
        line: getLineNumber(content, match.index),
        issue: `Missing file extension in import: ${importPath}`,
        suggestion: `Change to '${importPath}.js'`
      });
    }
    
    // Check if imported file exists
    if (importPath.startsWith('../') || importPath.startsWith('./')) {
      // For local imports, check if file exists
      const importedFile = path.resolve(path.dirname(fullPath), importPath);
      const possibleFiles = [
        importedFile,
        `${importedFile}.js`,
        `${importedFile}.ts`,
        `${importedFile}.jsx`,
        `${importedFile}.tsx`
      ];
      
      const fileExists = possibleFiles.some(file => fs.existsSync(file));
      
      if (!fileExists) {
        issues.push({
          type: 'import',
          line: getLineNumber(content, match.index),
          issue: `Import target does not exist: ${importPath}`,
          suggestion: `Check path or create this file`
        });
      }
    }
  }
  
  // Check for jest.mock usage
  const mockPattern = /jest\.mock\(['"]([^'"]+)['"]/g;
  
  while ((match = mockPattern.exec(content)) !== null) {
    const mockPath = match[1];
    
    // Check if mocked file exists
    if (mockPath.startsWith('../') || mockPath.startsWith('./')) {
      // For local mocks, check if file exists
      const mockedFile = path.resolve(path.dirname(fullPath), mockPath);
      const possibleFiles = [
        mockedFile,
        `${mockedFile}.js`,
        `${mockedFile}.ts`
      ];
      
      const fileExists = possibleFiles.some(file => fs.existsSync(file));
      
      if (!fileExists) {
        issues.push({
          type: 'mock',
          line: getLineNumber(content, match.index),
          issue: `Mock target does not exist: ${mockPath}`,
          suggestion: `Check path or create a mock implementation`
        });
      }
    }
  }
  
  // Print issues
  if (issues.length > 0) {
    console.log('\nPotential issues found:');
    issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. Issue at line ${issue.line}: ${issue.issue}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
    });
  } else {
    console.log('\nNo obvious issues found in the test file.');
    console.log('Consider checking:');
    console.log('1. Are the mocked implementations complete?');
    console.log('2. Are there timing issues with async operations?');
    console.log('3. Are the test assertions correct?');
  }
}

/**
 * Get line number for position in text
 * @param {string} text Text content
 * @param {number} position Position in text
 * @returns {number} Line number (1-based)
 */
function getLineNumber(text, position) {
  const lines = text.substring(0, position).split('\n');
  return lines.length;
}

/**
 * Create a fixed version of a test file
 * @param {string} file Test file to fix
 */
function fixTestFile(file) {
  const fullPath = path.resolve(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Test file not found: ${fullPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const fixedPath = `${fullPath}.fixed`;
  
  // Apply fixes
  let fixedContent = content;
  
  // Fix import extensions
  fixedContent = fixedContent.replace(
    /import\s+(?:{[^}]*}|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    (match, importPath) => {
      if (importPath.includes('/') && !importPath.startsWith('@') && 
          !importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
        return match.replace(importPath, `${importPath}.js`);
      }
      return match;
    }
  );
  
  // Fix jest.mock paths
  fixedContent = fixedContent.replace(
    /jest\.mock\(['"]([^'"]+)['"]/g,
    (match, mockPath) => {
      if (mockPath.includes('/') && !mockPath.endsWith('.js') && !mockPath.endsWith('.ts')) {
        return match.replace(mockPath, `${mockPath}.js`);
      }
      return match;
    }
  );
  
  // Write fixed file
  fs.writeFileSync(fixedPath, fixedContent);
  console.log(`Fixed file written to: ${fixedPath}`);
}

/**
 * Run main function based on command
 */
function main() {
  switch (command) {
    case 'help':
      printUsage();
      break;
    case 'run':
      if (options.length === 0) {
        console.error('Error: Missing test file parameter');
        printUsage();
        process.exit(1);
      }
      runTest(options[0]);
      break;
    case 'fix':
      if (options.length === 0) {
        console.error('Error: Missing test file parameter');
        printUsage();
        process.exit(1);
      }
      fixTestFile(options[0]);
      break;
    case 'analyze':
      if (options.length === 0) {
        console.error('Error: Missing directory parameter');
        printUsage();
        process.exit(1);
      }
      console.log('Analyze command not implemented yet');
      break;
    case 'doctor':
      console.log('Running full test diagnostics...');
      execSync('node run-diagnostic-tests.mjs --all', { stdio: 'inherit' });
      break;
    default:
      console.error(`Error: Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

// Run main function
main();
