/**
 * Debug test for array utility functions
 */

import { intersperse } from '../../../src/utils/array.js';

describe('Array Utilities Debug', () => {
  test('debug intersperse function step by step', () => {
    const input = ['a', 'b'];
    const separator = (i: number) => {
      console.log(`Separator called with index: ${i}`);
      return `sep${i}`;
    };
    
    console.log('About to call intersperse...');
    const result = intersperse(input, separator);
    console.log('intersperse finished');
    
    console.log('Result:', result);
    
    // Let's also test what flatMap does directly
    const testFlatMap = input.flatMap((a, i) => {
      console.log(`flatMap called with a=${a}, i=${i}`);
      if (i) {
        const sepResult = separator(i);
        console.log(`Separator returned: ${sepResult}`);
        return [sepResult, a];
      } else {
        return [a];
      }
    });
    
    console.log('Direct flatMap result:', testFlatMap);
    
    expect(Array.isArray(result)).toBe(true);
  });
});
