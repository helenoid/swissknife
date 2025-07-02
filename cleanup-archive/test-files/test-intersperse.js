// Quick test of the intersperse function
// TypeScript function that expects a function separator
function intersperse(as, separator) {
  return as.flatMap((a, i) => (i ? [separator(i), a] : [a]));
}

// Test cases
console.log('Test 1:', intersperse(['a', 'b', 'c'], (i) => `sep${i}`));
console.log('Expected:', ['a', 'sep1', 'b', 'sep2', 'c']);

console.log('Test 2:', intersperse([1, 2, 3, 4], (i) => i * 10));
console.log('Expected:', [1, 10, 2, 20, 3, 30, 4]);

console.log('Test 3:', intersperse([], (i) => `sep${i}`));
console.log('Expected:', []);

console.log('Test 4:', intersperse(['single'], (i) => `sep${i}`));
console.log('Expected:', ['single']);

// Test with index tracking
const indices = [];
intersperse(['x', 'y', 'z'], (i) => {
  indices.push(i);
  return '-';
});
console.log('Indices:', indices);
console.log('Expected indices:', [1, 2]);
