/**
 * Script to automatically convert Chai assertions to Jest assertions in test files
 * Usage: node fix-test-assertions.js <file-pattern>
 * Example: node fix-test-assertions.js "test/**/*.test.js"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get file pattern from command line args or use default
const filePattern = process.argv[2] || 'test/**/*.test.js';

// Common Chai to Jest assertion mappings
const assertionMappings = [
  // expect().to.equal() -> expect().toBe()
  { regex: /expect\((.*?)\)\.to\.equal\((.*?)\)/g, replace: 'expect($1).toBe($2)' },
  
  // expect().to.deep.equal() -> expect().toEqual()
  { regex: /expect\((.*?)\)\.to\.deep\.equal\((.*?)\)/g, replace: 'expect($1).toEqual($2)' },
  
  // expect().to.eql() -> expect().toEqual()
  { regex: /expect\((.*?)\)\.to\.eql\((.*?)\)/g, replace: 'expect($1).toEqual($2)' },
  
  // expect().to.be.null -> expect().toBeNull()
  { regex: /expect\((.*?)\)\.to\.be\.null/g, replace: 'expect($1).toBeNull()' },
  
  // expect().to.not.be.null -> expect().not.toBeNull()
  { regex: /expect\((.*?)\)\.to\.not\.be\.null/g, replace: 'expect($1).not.toBeNull()' },
  
  // expect().to.be.undefined -> expect().toBeUndefined()
  { regex: /expect\((.*?)\)\.to\.be\.undefined/g, replace: 'expect($1).toBeUndefined()' },
  
  // expect().to.not.be.undefined -> expect().not.toBeUndefined()
  { regex: /expect\((.*?)\)\.to\.not\.be\.undefined/g, replace: 'expect($1).not.toBeUndefined()' },
  
  // expect().to.be.true -> expect().toBe(true)
  { regex: /expect\((.*?)\)\.to\.be\.true/g, replace: 'expect($1).toBe(true)' },
  
  // expect().to.be.false -> expect().toBe(false)
  { regex: /expect\((.*?)\)\.to\.be\.false/g, replace: 'expect($1).toBe(false)' },
  
  // expect().to.exist -> expect().toBeDefined()
  { regex: /expect\((.*?)\)\.to\.exist/g, replace: 'expect($1).toBeDefined()' },
  
  // expect().to.not.exist -> expect().not.toBeDefined()
  { regex: /expect\((.*?)\)\.to\.not\.exist/g, replace: 'expect($1).not.toBeDefined()' },
  
  // expect().to.include() -> expect().toContain()
  { regex: /expect\((.*?)\)\.to\.include\((.*?)\)/g, replace: 'expect($1).toContain($2)' },
  
  // expect().to.contain() -> expect().toContain()
  { regex: /expect\((.*?)\)\.to\.contain\((.*?)\)/g, replace: 'expect($1).toContain($2)' },
  
  // expect().to.match() -> expect().toMatch()
  { regex: /expect\((.*?)\)\.to\.match\((.*?)\)/g, replace: 'expect($1).toMatch($2)' },
  
  // expect().to.throw() -> expect().toThrow()
  { regex: /expect\((.*?)\)\.to\.throw\((.*?)\)/g, replace: 'expect($1).toThrow($2)' },
  { regex: /expect\((.*?)\)\.to\.throw\(\)/g, replace: 'expect($1).toThrow()' },
  
  // expect().to.have.lengthOf() -> expect().toHaveLength()
  { regex: /expect\((.*?)\)\.to\.have\.lengthOf\((.*?)\)/g, replace: 'expect($1).toHaveLength($2)' },
  
  // expect().to.have.property() -> expect().toHaveProperty()
  { regex: /expect\((.*?)\)\.to\.have\.property\((.*?)\)/g, replace: 'expect($1).toHaveProperty($2)' },
  
  // expect().to.eventually.equal() -> await expect().toBe()
  { regex: /expect\((.*?)\)\.to\.eventually\.equal\((.*?)\)/g, replace: 'await expect($1).toBe($2)' },
  
  // expect().to.eventually.deep.equal() -> await expect().toEqual()
  { regex: /expect\((.*?)\)\.to\.eventually\.deep\.equal\((.*?)\)/g, replace: 'await expect($1).toEqual($2)' },

  // expect().to.not.equal() -> expect().not.toBe()
  { regex: /expect\((.*?)\)\.to\.not\.equal\((.*?)\)/g, replace: 'expect($1).not.toBe($2)' },

  // Remove Chai import statements
  { regex: /const chai = require\(['"]chai['"]\);?.*?\n/g, replace: '' },
  { regex: /const expect = chai\.expect;?.*?\n/g, replace: '' },
  { regex: /import chai from ['"]chai['"];?.*?\n/g, replace: '' },
  { regex: /import { expect } from ['"]chai['"];?.*?\n/g, replace: '' },
  
  // Remove Chai comment lines
  { regex: /\/\/ Chai assertions are provided by.*?\n/g, replace: '' }
];

// Find all test files matching the pattern
console.log(`Finding test files matching pattern: ${filePattern}`);
glob(filePattern, {}, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    process.exit(1);
  }
  
  console.log(`Found ${files.length} test files`);
  
  // Process each file
  files.forEach(file => {
    try {
      processFile(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  });
});

function processFile(file) {
  console.log(`Processing file: ${file}`);
  
  // Read the file content
  let content = fs.readFileSync(file, 'utf8');
  
  // Apply each assertion mapping
  assertionMappings.forEach(mapping => {
    content = content.replace(mapping.regex, mapping.replace);
  });
  
  // Check if the file was modified
  const originalContent = fs.readFileSync(file, 'utf8');
  if (content !== originalContent) {
    // Create a backup file
    const backupFile = `${file}.bak`;
    fs.writeFileSync(backupFile, originalContent, 'utf8');
    console.log(`  Created backup: ${backupFile}`);
    
    // Write the updated content
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  Updated file: ${file}`);
  } else {
    console.log(`  No changes needed for: ${file}`);
  }
}
