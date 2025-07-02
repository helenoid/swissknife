#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test modules individually with timeout
const testModules = [
  'test/unit/config/manager.test.js',
  'test/unit/utils/array.test.ts', 
  'test/unit/utils/json.test.js',
  'test/unit/utils/cache/manager.test.ts',
  'test/unit/utils/performance/monitor.test.ts',
  'test/unit/utils/events/event-bus.test.ts',
  'test/unit/utils/logging/manager.test.ts'
];

function runTest(testFile) {
  const fullPath = path.join(__dirname, testFile);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${testFile} - File not found`);
    return false;
  }
  
  try {
    console.log(`🧪 Testing ${testFile}...`);
    
    const result = execSync(
      `npx jest "${testFile}" --config=jest.config.cjs --forceExit --passWithNoTests`,
      { 
        timeout: 10000, // 10 second timeout
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );
    
    console.log(`✅ ${testFile} - PASSED`);
    console.log(result.substring(0, 200) + '...\n');
    return true;
    
  } catch (error) {
    console.log(`❌ ${testFile} - FAILED`);
    console.log(`Error: ${error.message.substring(0, 300)}...\n`);
    return false;
  }
}

console.log('🚀 Running individual test modules...\n');

let passed = 0;
let failed = 0;

for (const testModule of testModules) {
  if (runTest(testModule)) {
    passed++;
  } else {
    failed++;
  }
}

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed`);
