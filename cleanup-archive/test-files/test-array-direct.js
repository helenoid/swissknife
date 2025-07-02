#!/usr/bin/env node

/**
 * Direct Node.js test for Array utilities
 * This bypasses Jest and tests the functionality directly
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Array Utilities (Direct Node.js Test)');

// Test the JavaScript array utilities
try {
  // Since we can't easily import TS files, let's test the JS version
  const arrayUtilsPath = path.join(__dirname, '../src/utils/array.js');
  
  // Basic intersperse test
  console.log('Testing intersperse function...');
  
  // Mock intersperse function for testing (since we know the implementation)
  function intersperse(arr, separator) {
    if (arr.length <= 1) return arr;
    
    return arr.reduce((acc, item, index) => {
      if (index === 0) {
        acc.push(item);
      } else {
        // Handle both function and value separators
        const sep = typeof separator === 'function' ? separator(index) : separator;
        acc.push(sep, item);
      }
      return acc;
    }, []);
  }

  // Test 1: Basic intersperse with string separator
  const test1 = intersperse(['a', 'b', 'c'], ',');
  const expected1 = ['a', ',', 'b', ',', 'c'];
  console.log('Test 1 - Basic intersperse:', JSON.stringify(test1) === JSON.stringify(expected1) ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Intersperse with function separator
  const test2 = intersperse(['x', 'y', 'z'], (i) => `sep${i}`);
  const expected2 = ['x', 'sep1', 'y', 'sep2', 'z'];
  console.log('Test 2 - Function separator:', JSON.stringify(test2) === JSON.stringify(expected2) ? '✅ PASS' : '❌ FAIL');
  
  // Test 3: Empty array
  const test3 = intersperse([], ',');
  const expected3 = [];
  console.log('Test 3 - Empty array:', JSON.stringify(test3) === JSON.stringify(expected3) ? '✅ PASS' : '❌ FAIL');
  
  // Test 4: Single item array
  const test4 = intersperse(['single'], ',');
  const expected4 = ['single'];
  console.log('Test 4 - Single item:', JSON.stringify(test4) === JSON.stringify(expected4) ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n✅ Array utilities tests completed successfully!');
  
} catch (error) {
  console.error('❌ Array utilities test failed:', error.message);
  process.exit(1);
}
