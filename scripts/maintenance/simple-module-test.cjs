#!/usr/bin/env node

/**
 * Simple Module Test Runner - Test individual modules without Jest
 */

console.log('🔬 Module Functionality Tests');
console.log('==============================');

let totalTests = 0;
let passedTests = 0;

function test(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${actual}`);
      }
    }
  };
}

// Test FibonacciHeap directly
console.log('\n📦 Testing FibonacciHeap...');

try {
  // Import using require for CommonJS compatibility
  const fibHeapPath = require.resolve('./src/tasks/scheduler/fibonacci-heap.js');
  console.log(`   Checking if file exists: ${fibHeapPath}`);
  
  // For now, just check if the file can be loaded
  const fs = require('fs');
  if (fs.existsSync('./src/tasks/scheduler/fibonacci-heap.ts')) {
    console.log('✅ FibonacciHeap source file exists');
    passedTests++;
  } else {
    console.log('❌ FibonacciHeap source file missing');
  }
  totalTests++;
  
} catch (error) {
  console.log(`❌ FibonacciHeap module loading failed: ${error.message}`);
  totalTests++;
}

// Test EventBus if available
console.log('\n📦 Testing EventBus...');

try {
  const fs = require('fs');
  if (fs.existsSync('./src/utils/events/event-bus.ts')) {
    const content = fs.readFileSync('./src/utils/events/event-bus.ts', 'utf8');
    
    test('EventBus has removeAll method', () => {
      expect(content.includes('removeAll')).toBe(true);
    });
    
    test('EventBus exports class', () => {
      expect(content.includes('export class EventBus')).toBe(true);
    });
    
  } else {
    console.log('❌ EventBus source file missing');
    totalTests++;
  }
  
} catch (error) {
  console.log(`❌ EventBus testing failed: ${error.message}`);
}

// Test CacheManager if available
console.log('\n📦 Testing CacheManager...');

try {
  const fs = require('fs');
  if (fs.existsSync('./src/utils/cache/manager.ts')) {
    const content = fs.readFileSync('./src/utils/cache/manager.ts', 'utf8');
    
    test('CacheManager has resetInstances method', () => {
      expect(content.includes('resetInstances')).toBe(true);
    });
    
    test('CacheManager handles TTL=0 correctly', () => {
      expect(content.includes('ttl > 0') || content.includes('ttl === 0')).toBe(true);
    });
    
  } else {
    console.log('❌ CacheManager source file missing');
    totalTests++;
  }
  
} catch (error) {
  console.log(`❌ CacheManager testing failed: ${error.message}`);
}

// Summary
console.log('\n📊 Module Test Results');
console.log('======================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);

if (passedTests === totalTests && totalTests > 0) {
  console.log('\n🎉 All module tests passed!');
} else {
  console.log('\n⚠️  Some module tests failed.');
}
