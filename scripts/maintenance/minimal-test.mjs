#!/usr/bin/env node

console.log('Starting minimal test...');

try {
  console.log('About to import fibonacci-heap...');
  const fibModule = await import('./src/tasks/scheduler/fibonacci-heap.js');
  console.log('Import successful:', Object.keys(fibModule));
  
  const { FibonacciHeap } = fibModule;
  console.log('FibonacciHeap constructor:', typeof FibonacciHeap);
  
  console.log('Creating heap instance...');
  const heap = new FibonacciHeap();
  console.log('Heap created successfully');
  
  console.log('Testing basic operations...');
  heap.insert(5, 'five');
  console.log('Insert successful');
  
  const min = heap.findMin();
  console.log('FindMin result:', min);
  
  console.log('✅ Minimal test passed!');
} catch (error) {
  console.error('❌ Error in minimal test:', error);
  process.exit(1);
}
