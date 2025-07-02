#!/usr/bin/env node
/**
 * Direct Component Import Test Utility
 * This script helps test direct imports of ES modules without Jest
 * 
 * Usage: node test-direct-import.js <path-to-module>
 * Example: node test-direct-import.js ./src/tasks/scheduler/fibonacci-heap.js
 */

// Check command line arguments
if (process.argv.length < 3) {
  console.error('Usage: node test-direct-import.js <path-to-module>');
  process.exit(1);
}

const path = require('path');
const fs = require('fs');

// Get module path from command line
const modulePath = process.argv[2];
const absolutePath = path.resolve(process.cwd(), modulePath);

console.log(`Testing direct import of module: ${modulePath}`);
console.log(`Absolute path: ${absolutePath}`);

// Check if file exists
if (!fs.existsSync(absolutePath)) {
  console.error(`ERROR: File does not exist: ${absolutePath}`);
  process.exit(1);
}

// Check file type (ESM or CommonJS)
const fileContent = fs.readFileSync(absolutePath, 'utf8');
const hasExportDefault = fileContent.includes('export default');
const hasNamedExports = fileContent.includes('export ') && !fileContent.includes('export default');
const hasModuleExports = fileContent.includes('module.exports');

console.log('File analysis:');
console.log(`- Has default export: ${hasExportDefault}`);
console.log(`- Has named exports: ${hasNamedExports}`);
console.log(`- Has CommonJS exports: ${hasModuleExports}`);

// Try to import the module based on its type
console.log('\nAttempting to import module...');

// For CommonJS
if (hasModuleExports) {
  try {
    console.log('Importing as CommonJS module...');
    const module = require(absolutePath);
    console.log('Successfully imported module!');
    console.log('Exported members:', Object.keys(module));
    
    // Log more details
    for (const key of Object.keys(module)) {
      const type = typeof module[key];
      console.log(`- ${key}: ${type}`);
      
      if (type === 'function') {
        console.log(`  Function parameters: ${module[key].length}`);
      } else if (type === 'object' && module[key] !== null) {
        console.log(`  Object properties: ${Object.keys(module[key]).length}`);
      }
    }
  } catch (error) {
    console.error('Error importing CommonJS module:', error.message);
  }
} 
// For ESM, we need to use dynamic import
else {
  // Convert file path to URL format
  const fileUrl = `file://${absolutePath}`;
  console.log('Importing as ES module...');
  console.log('URL:', fileUrl);
  
  import(fileUrl)
    .then(module => {
      console.log('Successfully imported module!');
      console.log('Exported members:', Object.keys(module));
      
      // Log more details
      for (const key of Object.keys(module)) {
        const type = typeof module[key];
        console.log(`- ${key}: ${type}`);
        
        if (type === 'function') {
          console.log(`  Function parameters: ${module[key].length}`);
        } else if (type === 'object' && module[key] !== null) {
          console.log(`  Object properties: ${Object.keys(module[key]).length}`);
        }
      }
    })
    .catch(error => {
      console.error('Error importing ES module:', error.message);
    });
}

// Keep process alive for dynamic import
if (!hasModuleExports) {
  console.log('Waiting for ES module import to complete...');
}
