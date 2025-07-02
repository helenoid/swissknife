#!/usr/bin/env node
/**
 * TypeScript Test Converter
 * 
 * This script automatically converts TypeScript test files to CommonJS versions,
 * fixing compatibility issues between ESM and CommonJS modules for testing with Jest.
 * 
 * It also converts Chai assertions to Jest assertions for better compatibility.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Load our TypeScript setup helpers
require('./test/typescript-setup.js');

// Configuration
const config = {
  // Default patterns for finding TypeScript test files
  patterns: [
    'test/unit/**/*.test.ts',
    'test/integration/**/*.test.ts',
    'test/e2e/**/*.test.ts',
  ],
  // Skip files that already have CJS versions
  skipIfCjsExists: true,
  // Convert Chai assertions to Jest automatically
  convertChaiToJest: true,
  // Babel transform options for TypeScript -> CommonJS conversion
  babelOptions: {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
      '@babel/preset-typescript'
    ],
    plugins: [
      '@babel/plugin-transform-modules-commonjs',
      '@babel/plugin-transform-runtime'
    ]
  }
};

/**
 * Find all TypeScript test files based on patterns
 * @param {string[]} patterns - Glob patterns for finding test files
 * @returns {string[]} - Array of file paths
 */
function findTestFiles(patterns) {
  let files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern);
    files = [...files, ...matches];
  });
  return files;
}

/**
 * Convert TypeScript test files to CommonJS versions
 * @param {string[]} files - List of TypeScript test files
 */
function convertTestFiles(files) {
  console.log(`Converting ${files.length} TypeScript test files to CommonJS...`);
  
  let convertedCount = 0;
  const errors = [];
  
  files.forEach(file => {
    try {
      const basename = path.basename(file, '.ts');
      const dirname = path.dirname(file);
      const outputFile = path.join(dirname, `${basename.replace('.test', '')}.cjs.test.js`);
      
      // Skip if CJS version already exists and we're configured to skip
      if (config.skipIfCjsExists && fs.existsSync(outputFile)) {
        console.log(`Skipping ${file} because ${outputFile} already exists`);
        return;
      }
      
      // Convert the file to CommonJS
      const success = global.createCjsTestFile(file, outputFile, config.babelOptions);
      
      if (success) {
        convertedCount++;
        console.log(`✓ Converted ${file} to ${outputFile}`);
        
        // Convert Chai assertions to Jest if configured
        if (config.convertChaiToJest) {
          const chaiSuccess = global.convertChaiToJest(outputFile);
          if (chaiSuccess) {
            console.log(`✓ Converted Chai to Jest in ${outputFile}`);
          }
        }
      }
    } catch (error) {
      console.error(`✗ Error converting ${file}: ${error.message}`);
      errors.push({ file, error: error.message });
    }
  });
  
  // Print summary
  console.log('\n===== SUMMARY =====');
  console.log(`Total files: ${files.length}`);
  console.log(`Successfully converted: ${convertedCount}`);
  console.log(`Failed: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n===== ERRORS =====');
    errors.forEach(({ file, error }) => {
      console.log(`${file}: ${error}`);
    });
  }
  
  return { convertedCount, errors };
}

// Parse command line arguments
const args = process.argv.slice(2);
const patterns = args.length > 0 ? args : config.patterns;

// Find and convert files
const files = findTestFiles(patterns);
convertTestFiles(files);

// Export for use in other scripts
module.exports = { findTestFiles, convertTestFiles };
