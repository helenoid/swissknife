#!/usr/bin/env node

/**
 * Comprehensive Test Validation Runner
 * Tests core modules without Jest dependency issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 SwissKnife Comprehensive Test Validation');
console.log('==========================================');

async function validateImports() {
  console.log('\n📦 Testing Import Resolution...');
  
  const tests = [
    {
      name: 'FibonacciHeap Import',
      module: '../src/tasks/scheduler/fibonacci-heap.js',
      test: async () => {
        try {
          const { FibonacciHeap } = await import(path.resolve(__dirname, 'src/tasks/scheduler/fibonacci-heap.js'));
          return { success: true, message: 'FibonacciHeap imported successfully' };
        } catch (error) {
          return { success: false, message: `Import failed: ${error.message}` };
        }
      }
    },
    {
      name: 'EventBus Import',
      module: '../src/utils/events/event-bus.ts',
      test: async () => {
        try {
          const { EventBus } = await import(path.resolve(__dirname, 'src/utils/events/event-bus.ts'));
          return { success: true, message: 'EventBus imported successfully' };
        } catch (error) {
          return { success: false, message: `Import failed: ${error.message}` };
        }
      }
    },
    {
      name: 'Messages Utils Import',
      module: '../src/utils/messages.tsx',
      test: async () => {
        try {
          const module = await import(path.resolve(__dirname, 'src/utils/messages.tsx'));
          const functions = ['processUserInput', 'getUnresolvedToolUseIDs', 'createUserMessage', 'isNotEmptyMessage'];
          const missing = functions.filter(fn => typeof module[fn] !== 'function');
          if (missing.length > 0) {
            return { success: false, message: `Missing functions: ${missing.join(', ')}` };
          }
          return { success: true, message: 'All message functions available' };
        } catch (error) {
          return { success: false, message: `Import failed: ${error.message}` };
        }
      }
    },
    {
      name: 'CacheManager Import',
      module: '../src/utils/cache/manager.ts',
      test: async () => {
        try {
          const { CacheManager } = await import(path.resolve(__dirname, 'src/utils/cache/manager.ts'));
          return { success: true, message: 'CacheManager imported successfully' };
        } catch (error) {
          return { success: false, message: `Import failed: ${error.message}` };
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`  • ${test.name}... `);
    try {
      const result = await test.test();
      if (result.success) {
        console.log(`✅ ${result.message}`);
        passed++;
      } else {
        console.log(`❌ ${result.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test execution failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Import Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

async function testBasicFunctionality() {
  console.log('\n🔧 Testing Basic Functionality...');
  
  try {
    // Test FibonacciHeap
    console.log('  • Testing FibonacciHeap...');
    const { FibonacciHeap } = await import(path.resolve(__dirname, 'src/tasks/scheduler/fibonacci-heap.js'));
    const heap = new FibonacciHeap();
    heap.insert(5, 'five');
    heap.insert(3, 'three');
    heap.insert(8, 'eight');
    const min = heap.findMin();
    if (min === 'three') {
      console.log('    ✅ FibonacciHeap working correctly');
    } else {
      console.log('    ❌ FibonacciHeap not working correctly');
      return false;
    }

    // Test EventBus
    console.log('  • Testing EventBus...');
    const { EventBus } = await import(path.resolve(__dirname, 'src/utils/events/event-bus.ts'));
    const eventBus = new EventBus();
    let eventFired = false;
    eventBus.on('test', () => { eventFired = true; });
    eventBus.emit('test');
    if (eventFired) {
      console.log('    ✅ EventBus working correctly');
    } else {
      console.log('    ❌ EventBus not working correctly');
      return false;
    }

    // Test CacheManager
    console.log('  • Testing CacheManager...');
    const { CacheManager } = await import(path.resolve(__dirname, 'src/utils/cache/manager.ts'));
    const cache = new CacheManager({ maxSize: 10, ttl: 1000 });
    cache.set('test', 'value');
    const value = cache.get('test');
    if (value === 'value') {
      console.log('    ✅ CacheManager working correctly');
    } else {
      console.log('    ❌ CacheManager not working correctly');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`    ❌ Functionality test failed: ${error.message}`);
    console.log(`    Stack: ${error.stack}`);
    return false;
  }
}

async function runTypeScriptCompilation() {
  console.log('\n🏗️  Testing TypeScript Compilation...');
  
  return new Promise((resolve) => {
    const testFiles = [
      'test/fibonacci-sanity.test.ts',
      'test/isolated-eventbus.test.ts', 
      'test/messages.test.ts'
    ];
    
    let compiled = 0;
    let failed = 0;
    
    const checkFile = (file, index) => {
      console.log(`  • Checking ${file}...`);
      const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck', file], {
        stdio: 'pipe'
      });
      
      let output = '';
      tsc.stdout.on('data', (data) => output += data);
      tsc.stderr.on('data', (data) => output += data);
      
      tsc.on('close', (code) => {
        if (code === 0) {
          console.log(`    ✅ ${file} compiles successfully`);
          compiled++;
        } else {
          console.log(`    ❌ ${file} has compilation errors`);
          if (output.trim()) {
            console.log(`    Error output: ${output.trim().substring(0, 200)}...`);
          }
          failed++;
        }
        
        if (index === testFiles.length - 1) {
          console.log(`\n📊 TypeScript Tests: ${compiled} compiled, ${failed} failed`);
          resolve({ compiled, failed });
        }
      });
    };
    
    testFiles.forEach(checkFile);
  });
}

async function main() {
  try {
    const importResults = await validateImports();
    const functionalityWorking = await testBasicFunctionality();
    const compilationResults = await runTypeScriptCompilation();
    
    console.log('\n🎯 Final Summary');
    console.log('================');
    console.log(`📦 Import Resolution: ${importResults.passed}/${importResults.passed + importResults.failed} working`);
    console.log(`🔧 Basic Functionality: ${functionalityWorking ? 'Working' : 'Failed'}`);
    console.log(`🏗️  TypeScript Compilation: ${compilationResults.compiled}/${compilationResults.compiled + compilationResults.failed} files compile`);
    
    const allWorking = importResults.failed === 0 && functionalityWorking && compilationResults.failed === 0;
    console.log(`\n${allWorking ? '🎉' : '⚠️ '} Overall Status: ${allWorking ? 'All systems working!' : 'Some issues remain'}`);
    
    if (!allWorking) {
      console.log('\n🔧 Recommended next steps:');
      if (importResults.failed > 0) console.log('  • Fix remaining import path issues');
      if (!functionalityWorking) console.log('  • Debug core module functionality');  
      if (compilationResults.failed > 0) console.log('  • Fix TypeScript compilation errors');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();
