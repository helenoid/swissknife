// Direct TypeScript Test Runner using tsx
// This bypasses Jest and runs tests directly

import { FibonacciHeap } from '../src/tasks/scheduler/fibonacci-heap.js';

console.log('=== Direct TypeScript Test Runner ===');
console.log('Testing FibonacciHeap implementation...\n');

// Simple test framework
let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(description: string, testFn: () => void) {
  testCount++;
  try {
    testFn();
    console.log(`✓ ${description}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  Error: ${error.message}`);
    failCount++;
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected ${actual} to be undefined`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    }
  };
}

// Run FibonacciHeap tests
console.log('--- Basic Operations ---');

test('should start empty', () => {
  const heap = new FibonacciHeap<string>();
  expect(heap.isEmpty()).toBe(true);
  expect(heap.size()).toBe(0);
  expect(heap.findMin()).toBeNull();
});

test('should insert and find min correctly', () => {
  const heap = new FibonacciHeap<string>();
  heap.insert(5, 'value-5');
  expect(heap.isEmpty()).toBe(false);
  expect(heap.size()).toBe(1);
  const min1 = heap.findMin();
  expect(min1).toBe('value-5');
  
  heap.insert(3, 'value-3');
  expect(heap.size()).toBe(2);
  const min2 = heap.findMin();
  expect(min2).toBe('value-3');
});

test('should maintain heap property with multiple inserts', () => {
  const heap = new FibonacciHeap<string>();
  heap.insert(10, 'value-10');
  heap.insert(5, 'value-5');
  heap.insert(15, 'value-15');
  heap.insert(2, 'value-2');
  heap.insert(8, 'value-8');
  
  expect(heap.size()).toBe(5);
  expect(heap.findMin()).toBe('value-2');
});

test('should extract min correctly', () => {
  const heap = new FibonacciHeap<string>();
  heap.insert(10, 'value-10');
  heap.insert(5, 'value-5');
  heap.insert(15, 'value-15');
  heap.insert(2, 'value-2');
  
  const min = heap.extractMin();
  expect(min).toBe('value-2');
  expect(heap.size()).toBe(3);
  expect(heap.findMin()).toBe('value-5');
});

test('should handle decreaseKey operation', () => {
  const heap = new FibonacciHeap<string>();
  const node1 = heap.insert(10, 'value-10');
  const node2 = heap.insert(20, 'value-20');
  const node3 = heap.insert(5, 'value-5');
  
  expect(heap.findMin()).toBe('value-5');
  
  heap.decreaseKey(node2, 1);
  expect(heap.findMin()).toBe('value-20');
});

console.log('\n=== Test Results ===');
console.log(`Total tests: ${testCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Success rate: ${((passCount / testCount) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}
