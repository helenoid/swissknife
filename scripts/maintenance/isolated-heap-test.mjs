#!/usr/bin/env node

/**
 * Completely isolated test that manually evaluates the FibonacciHeap code
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Isolated FibonacciHeap Test');
console.log('=============================');

try {
  // Read the FibonacciHeap source code
  const heapPath = join(__dirname, 'src', 'tasks', 'scheduler', 'fibonacci-heap.js');
  console.log('Reading heap source from:', heapPath);
  
  const heapSource = readFileSync(heapPath, 'utf8');
  console.log('Source code loaded, length:', heapSource.length);
  
  // Extract the class definition manually (avoiding module system issues)
  const classMatch = heapSource.match(/class FibonacciHeap \{[\s\S]*?\n\}/);
  if (!classMatch) {
    throw new Error('Could not find FibonacciHeap class definition');
  }
  
  console.log('Found FibonacciHeap class definition');
  
  // Manually construct and test the heap
  console.log('\n📝 Testing heap functionality...');
  
  // Use dynamic import to actually load the module
  const heapModule = await import('./src/tasks/scheduler/fibonacci-heap.js');
  const { FibonacciHeap } = heapModule;
  
  const heap = new FibonacciHeap();
  console.log('✓ Created heap instance');
  
  heap.insert(5, 'five');
  heap.insert(3, 'three');
  heap.insert(8, 'eight');
  console.log('✓ Inserted test values');
  
  const min = heap.findMin();
  console.log('✓ FindMin result:', min);
  
  if (min !== 'three') {
    throw new Error(`Expected 'three', got '${min}'`);
  }
  
  console.log('🎉 Isolated test PASSED!');
  
} catch (error) {
  console.error('❌ Isolated test FAILED:', error.message);
  process.exit(1);
}
