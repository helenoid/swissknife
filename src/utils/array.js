/**
 * Array utility functions
 */

/**
 * Insert a separator between array elements
 */
function intersperse(array, separator) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (array.length <= 1) {
    return [...array];
  }
  
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(array[i]);
    if (i < array.length - 1) {
      // Support both function and value separators
      const separatorValue = typeof separator === 'function' ? separator(i + 1) : separator;
      result.push(separatorValue);
    }
  }
  
  return result;
}

/**
 * Chunk an array into smaller arrays of specified size
 */
function chunk(array, size) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (typeof size !== 'number' || size <= 0) {
    throw new Error('Size must be a positive number');
  }
  
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  
  return result;
}

/**
 * Remove duplicate elements from array
 */
function unique(array) {
  if (!Array.isArray(array)) {
    throw new Error('Argument must be an array');
  }
  
  return [...new Set(array)];
}

/**
 * Remove duplicate elements using a key function
 */
function uniqueBy(array, keyFn) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (typeof keyFn !== 'function') {
    throw new Error('Second argument must be a function');
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Flatten nested arrays
 */
function flatten(array, depth = 1) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  return array.flat(depth);
}

/**
 * Group array elements by a key function
 */
function groupBy(array, keyFn) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (typeof keyFn !== 'function') {
    throw new Error('Second argument must be a function');
  }
  
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Sort array by multiple criteria
 */
function sortBy(array, ...criteria) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      let aVal, bVal;
      
      if (typeof criterion === 'function') {
        aVal = criterion(a);
        bVal = criterion(b);
      } else if (typeof criterion === 'string') {
        aVal = a[criterion];
        bVal = b[criterion];
      } else {
        throw new Error('Criteria must be functions or strings');
      }
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

/**
 * Find the intersection of multiple arrays
 */
function intersection(...arrays) {
  if (arrays.length === 0) {
    return [];
  }
  
  if (!arrays.every(arr => Array.isArray(arr))) {
    throw new Error('All arguments must be arrays');
  }
  
  const first = arrays[0];
  const others = arrays.slice(1);
  
  return first.filter(item => 
    others.every(arr => arr.includes(item))
  );
}

/**
 * Find the difference between arrays
 */
function difference(array, ...others) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (!others.every(arr => Array.isArray(arr))) {
    throw new Error('All other arguments must be arrays');
  }
  
  const excluded = new Set(others.flat());
  return array.filter(item => !excluded.has(item));
}

/**
 * Partition array into two arrays based on predicate
 */
function partition(array, predicate) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (typeof predicate !== 'function') {
    throw new Error('Second argument must be a function');
  }
  
  const truthy = [];
  const falsy = [];
  
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  
  return [truthy, falsy];
}

/**
 * Take elements from the beginning of array
 */
function take(array, n) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (typeof n !== 'number' || n < 0) {
    throw new Error('Second argument must be a non-negative number');
  }
  
  return array.slice(0, n);
}

/**
 * Drop elements from the beginning of array
 */
function drop(array, n) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }
  
  if (typeof n !== 'number' || n < 0) {
    throw new Error('Second argument must be a non-negative number');
  }
  
  return array.slice(n);
}

/**
 * Zip multiple arrays together
 */
function zip(...arrays) {
  if (arrays.length === 0) {
    return [];
  }
  
  if (!arrays.every(arr => Array.isArray(arr))) {
    throw new Error('All arguments must be arrays');
  }
  
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  const result = [];
  
  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  
  return result;
}

module.exports = {
  intersperse,
  chunk,
  unique,
  uniqueBy,
  flatten,
  groupBy,
  sortBy,
  intersection,
  difference,
  partition,
  take,
  drop,
  zip
};
