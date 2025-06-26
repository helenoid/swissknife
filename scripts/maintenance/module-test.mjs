#!/usr/bin/env node

console.log('Testing module import step by step...');

async function testModuleImport() {
  try {
    console.log('Step 1: Creating module path...');
    const modulePath = new URL('./src/tasks/scheduler/fibonacci-heap.js', import.meta.url);
    console.log('Module path:', modulePath.href);
    
    console.log('Step 2: Attempting dynamic import...');
    const module = await import(modulePath);
    console.log('Step 3: Import successful, exports:', Object.keys(module));
    
    console.log('Step 4: Getting FibonacciHeap constructor...');
    const { FibonacciHeap } = module;
    console.log('Constructor type:', typeof FibonacciHeap);
    
    console.log('Step 5: Creating instance...');
    const heap = new FibonacciHeap();
    console.log('Instance created:', heap.constructor.name);
    
    console.log('✅ Module import test successful!');
    return true;
  } catch (error) {
    console.error('❌ Module import failed:', error);
    return false;
  }
}

// Run with timeout
const timeoutId = setTimeout(() => {
  console.error('❌ Module import timed out after 10 seconds');
  process.exit(1);
}, 10000);

testModuleImport().then((success) => {
  clearTimeout(timeoutId);
  process.exit(success ? 0 : 1);
}).catch((error) => {
  clearTimeout(timeoutId);
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
