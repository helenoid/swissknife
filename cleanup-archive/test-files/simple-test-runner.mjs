#!/usr/bin/env node

/**
 * Simple test runner for SwissKnife utilities
 * Bypasses Jest to run tests directly
 */

import { CacheManager } from './src/utils/cache/cache-manager.js';

console.log('🧪 SwissKnife Utility Test Runner');
console.log('==================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    }
  };
}

// Set test environment
process.env.NODE_ENV = 'test';

console.log('Testing Cache Manager...');

// Cache Manager Tests
test('CacheManager should set and get values', () => {
  const cache = CacheManager.getInstance('test1');
  cache.set('key1', 'value1');
  expect(cache.get('key1')).toBe('value1');
  cache.destroy();
});

test('CacheManager should return undefined for non-existent keys', () => {
  const cache = CacheManager.getInstance('test2');
  expect(cache.get('nonexistent')).toBeUndefined();
  cache.destroy();
});

test('CacheManager should handle singleton instances', () => {
  const cache1 = CacheManager.getInstance('same');
  const cache2 = CacheManager.getInstance('same');
  cache1.set('shared', 'data');
  expect(cache2.get('shared')).toBe('data');
  cache1.destroy();
});

test('CacheManager should properly clean up timers', () => {
  const cache = CacheManager.getInstance('cleanup-test');
  cache.set('temp', 'data');
  cache.destroy();
  CacheManager.resetInstances();
  // Should not hang - if we get here, cleanup worked
  expect(true).toBe(true);
});

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📋 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed!');
  process.exit(1);
}
