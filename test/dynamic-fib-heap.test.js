// Test for FibonacciHeap with proper ESM import handling

// Use the dynamic import instead of static import for better Jest compatibility
let FibonacciHeap;

// Set up the test environment
beforeAll(async () => {
  // Dynamic import of the module
  const module = await import('../src/tasks/scheduler/fibonacci-heap.js');
  FibonacciHeap = module.FibonacciHeap;
});

describe('FibonacciHeap', () => {
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
    expect(heap.isEmpty()).toBe(false);
    expect(heap.size()).toBe(1);
    expect(heap.findMin()).toBe('value-5');
    
    heap.insert(3, 'value-3');
    expect(heap.size()).toBe(2);
    expect(heap.findMin()).toBe('value-3');
  });
  
  test('should extract min correctly', () => {
    heap.insert(5, 'value-5');
    heap.insert(3, 'value-3');
    heap.insert(7, 'value-7');
    
    expect(heap.extractMin()).toBe('value-3');
    expect(heap.size()).toBe(2);
    expect(heap.findMin()).toBe('value-5');
  });
});
