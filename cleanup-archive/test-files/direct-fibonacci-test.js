/**
 * Direct test for FibonacciHeap implementation without Jest
 * This validates the core functionality independently
 */

// Manually import FibonacciHeap
const fs = require('fs');
const path = require('path');

// Load the FibonacciHeap implementation
const fibHeapPath = path.resolve(__dirname, 'src/tasks/scheduler/fibonacci-heap.js');
const fibHeapContent = fs.readFileSync(fibHeapPath, 'utf8');

// Simple expect implementation for testing
function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      } else {
        console.log(`✓ Expected ${value} to be ${expected}`);
      }
    },
    toEqual: (expected) => {
      const valueStr = JSON.stringify(value);
      const expectedStr = JSON.stringify(expected);
      if (valueStr !== expectedStr) {
        throw new Error(`Expected ${valueStr} to equal ${expectedStr}`);
      } else {
        console.log(`✓ Expected ${valueStr} to equal ${expectedStr}`);
      }
    },
    toBeNull: () => {
      if (value !== null) {
        throw new Error(`Expected value to be null, but got ${value}`);
      } else {
        console.log(`✓ Expected value to be null`);
      }
    }
  };
}

// Load the module
const moduleObj = { exports: {} };
new Function('module', 'exports', 'require', fibHeapContent)(moduleObj, moduleObj.exports, require);
const { FibonacciHeap } = moduleObj.exports;

// Test the FibonacciHeap
console.log("===== Testing FibonacciHeap Directly =====");

// Create a new heap
const heap = new FibonacciHeap();

// Basic operations
console.log("\nTesting basic operations:");
expect(heap.isEmpty()).toBe(true);
expect(heap.size()).toBe(0);
expect(heap.findMin()).toBeNull();

// Insert operations
console.log("\nTesting insert operations:");
heap.insert(5, 'value-5');
expect(heap.isEmpty()).toBe(false);
expect(heap.size()).toBe(1);
expect(heap.findMin()).toBe('value-5');

heap.insert(3, 'value-3');
expect(heap.size()).toBe(2);
expect(heap.findMin()).toBe('value-3');

heap.insert(7, 'value-7');
expect(heap.size()).toBe(3);
expect(heap.findMin()).toBe('value-3');

// Extract min operation
console.log("\nTesting extract min operation:");
expect(heap.extractMin()).toBe('value-3');
expect(heap.size()).toBe(2);
expect(heap.findMin()).toBe('value-5');

expect(heap.extractMin()).toBe('value-5');
expect(heap.size()).toBe(1);
expect(heap.findMin()).toBe('value-7');

console.log("\nAll direct tests passed successfully!");
