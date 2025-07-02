/**
 * Jest test for FibonacciHeap
 */

import { FibonacciHeap } from '@src/tasks/scheduler/fibonacci-heap.js';

describe('FibonacciHeap', () => {
  test('Basic insert and extract operations', () => {
    const heap = new FibonacciHeap<string>();
    
    // Insert elements
    heap.insert(5, 'five');
    heap.insert(3, 'three');
    heap.insert(8, 'eight');
    
    // Test findMin
    const minValue = heap.findMin();
    expect(minValue).toBe('three');
    
    // Test extractMin
    const extracted1 = heap.extractMin();
    expect(extracted1).toBe('three');
    
    // Verify order after extract
    const minAfterExtract1 = heap.findMin();
    expect(minAfterExtract1).toBe('five');
    
    // Extract another
    const extracted2 = heap.extractMin();
    expect(extracted2).toBe('five');
    
    // Verify final minimum
    const minAfterExtract2 = heap.findMin();
    expect(minAfterExtract2).toBe('eight');
    
    // Final extract
    const extracted3 = heap.extractMin();
    expect(extracted3).toBe('eight');
    
    // Verify empty
    const isEmpty = heap.isEmpty();
    expect(isEmpty).toBe(true);
  });

  test('Empty heap conditions', () => {
    const emptyHeap = new FibonacciHeap<string>();
    
    // Test isEmpty on new heap
    expect(emptyHeap.isEmpty()).toBe(true);
    
    // Test findMin on empty heap
    expect(emptyHeap.findMin()).toBeNull();
    
    // Test extractMin on empty heap
    expect(emptyHeap.extractMin()).toBeNull();
  });
});
