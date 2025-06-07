/**
 * Mock implementation of FibonacciHeapScheduler
 */

export class FibonacciHeapScheduler {
  constructor() {
    this.heap = [];
    this.priorities = new Map();
  }
  
  insert(id, priority) {
    this.heap.push(id);
    this.priorities.set(id, priority);
    this.heap.sort((a, b) => this.priorities.get(a) - this.priorities.get(b));
    return this;
  }
  
  extractMin() {
    if (this.heap.length === 0) return null;
    return this.heap.shift();
  }
  
  size() {
    return this.heap.length;
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
  
  decreaseKey(id, newPriority) {
    if (this.priorities.has(id)) {
      this.priorities.set(id, newPriority);
      // Re-sort the heap
      this.heap.sort((a, b) => this.priorities.get(a) - this.priorities.get(b));
    }
    return this;
  }
}

export default FibonacciHeapScheduler;
