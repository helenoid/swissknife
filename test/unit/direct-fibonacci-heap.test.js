// Simple direct Fibonacci Heap test
const { FibonacciHeap } = require('../../src/tasks/scheduler/fibonacci-heap');

describe('FibonacciHeap Basic Tests', () => {
  let heap;
  
  beforeEach(() => {
    heap = new FibonacciHeap();
  });
  
  test('should start empty', () => {
    expect(heap.isEmpty()).toBe(true);
    expect(heap.size()).toBe(0);
    expect(heap.findMin()).toBeNull();
  });
  
  test('should insert and find min correctly', () => {
    heap.insert(5, 'value-5');
    expect(heap.size()).toBe(1);
    expect(heap.findMin().value).toBe('value-5');
    
    heap.insert(3, 'value-3');
    expect(heap.size()).toBe(2);
    expect(heap.findMin().value).toBe('value-3');
  });
  
  test('should extract min correctly', () => {
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    const min1 = heap.extractMin();
    expect(min1.value).toBe('value-3');
    
    const min2 = heap.extractMin();
    expect(min2.value).toBe('value-5');
    
    const min3 = heap.extractMin();
    expect(min3.value).toBe('value-7');
    
    expect(heap.isEmpty()).toBe(true);
  });
});
