/**
 * Unit Test for the FibonacciHeap implementation 
 * Demonstrates a working Jest test environment
 */

import { FibonacciHeap } from '../src/tasks/scheduler/fibonacci-heap.js';

// Use global test functions (Jest globals or our custom runner)
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect(actual: any): any;
}

describe('FibonacciHeap Sanity Test', () => {
  // Basic insert and extract test
  it('should insert items and extract min correctly', () => {
    const heap = new FibonacciHeap<string>();
    
    heap.insert(5, 'five');
    heap.insert(3, 'three');
    heap.insert(8, 'eight');
    
    expect(heap.findMin()).toBe('three');
    expect(heap.extractMin()).toBe('three');
    expect(heap.findMin()).toBe('five');
    expect(heap.extractMin()).toBe('five');
    expect(heap.findMin()).toBe('eight');
    expect(heap.extractMin()).toBe('eight');
    expect(heap.isEmpty()).toBe(true);
  });
  
  it('should handle empty heap conditions', () => {
    const heap = new FibonacciHeap<string>();
    
    expect(heap.isEmpty()).toBe(true);
    expect(heap.findMin()).toBeNull();
    expect(heap.extractMin()).toBeNull();
  });
});
