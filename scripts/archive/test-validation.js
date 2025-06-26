#!/usr/bin/env node

// Simple test validation script
console.log('=== SwissKnife Test Validation ===');
console.log('Checking test environment...');

const fs = require('fs');
const path = require('path');

// Check if our test files exist
const testFiles = [
  'test/unit/models/execution-service-fixed.test.ts',
  'test/unit/commands/help-generator-fixed.test.ts',
  'test/unit/commands/cli/command-parser-fixed.test.ts'
];

console.log('\nChecking test files:');
testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
  }
});

// Check Jest config
const jestConfig = path.join(__dirname, 'jest.hybrid.config.cjs');
if (fs.existsSync(jestConfig)) {
  console.log(`✅ Jest config found`);
} else {
  console.log(`❌ Jest config missing`);
}

console.log('\n=== Test Environment Ready ===');
