/**
 * CommonJS module test file
 */

const { FibonacciHeap } = require('../src/tasks/scheduler/fibonacci-heap');

describe('FibonacciHeap CJS', () => {
  let heap;
  
  beforeEach(() => {
    heap = new FibonacciHeap();
  });
  
  test('should insert and extract min', () => {
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    expect(heap.findMin()).toBe('value-3');
    expect(heap.extractMin()).toBe('value-3');
    expect(heap.findMin()).toBe('value-5');
  });
});
