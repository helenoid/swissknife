#!/usr/bin/env node

/**
 * Fix Malformed Import Paths in TypeScript Files
 * 
 * This script scans TypeScript files and fixes malformed import paths
 * with multiple .js extensions (e.g., 'uuid.js.js.js.js.js').
 * 
 * Usage:
 *   node fix-malformed-imports.cjs [directory-path]
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Get target directory from command line args or use src
const targetDir = process.argv[2] || path.join(process.cwd(), 'src');
console.log(`${colors.blue}Scanning directory: ${targetDir}${colors.reset}`);

// Regular expression to match malformed imports with multiple .js extensions
// This matches:
// 1. import statements
// 2. from 'package.js.js...' or from "./path/to/file.js.js..."
const importRegex = /from\s+['"]([@\w\/-]+)(\.js\.js[\.js]*)['"]/g;

// Function to find all .ts files in a directory recursively
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix malformed imports in a file
function fixImportsInFile(filePath) {
  console.log(`${colors.cyan}Checking file: ${filePath}${colors.reset}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  let modifiedContent = content.replace(importRegex, (match, packageName, extensions) => {
    fixCount++;
    // Replace with single .js extension if it's a relative import, otherwise no extension
    const isRelativeImport = packageName.startsWith('./') || packageName.startsWith('../');
    return `from '${packageName}${isRelativeImport ? '.js' : ''}'`;
  });
  
  if (fixCount > 0) {
    console.log(`${colors.green}  Fixed ${fixCount} malformed imports${colors.reset}`);
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    return fixCount;
  }
  
  return 0;
}

// Main execution
try {
  // Find all TypeScript files
  console.log(`${colors.blue}Finding TypeScript files...${colors.reset}`);
  const tsFiles = findTsFiles(targetDir);
  console.log(`${colors.blue}Found ${tsFiles.length} TypeScript files${colors.reset}`);
  
  // Fix imports in each file
  let totalFixCount = 0;
  let fixedFiles = 0;
  
  tsFiles.forEach(file => {
    const fileFixCount = fixImportsInFile(file);
    if (fileFixCount > 0) {
      fixedFiles++;
      totalFixCount += fileFixCount;
    }
  });
  
  // Report results
  console.log(`\n${colors.green}=== Import Fix Summary ===${colors.reset}`);
  console.log(`${colors.green}Files scanned: ${tsFiles.length}${colors.reset}`);
  console.log(`${colors.green}Files fixed: ${fixedFiles}${colors.reset}`);
  console.log(`${colors.green}Total imports fixed: ${totalFixCount}${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}
