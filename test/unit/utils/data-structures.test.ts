/**
 * Data structure utilities test - simple data manipulation without external dependencies
 */

// Simple data structure utility functions for testing
const dataUtils = {
  // Array utilities
  unique: <T>(array: T[]): T[] => [...new Set(array)],
  
  flatten: <T>(arrays: T[][]): T[] => arrays.reduce((acc, val) => acc.concat(val), []),
  
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Object utilities  
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj } as any;
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  // Map utilities
  groupBy: <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
};

describe('Data Structure Utilities', () => {
  describe('array operations', () => {
    test('should remove duplicates from array', () => {
      expect(dataUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(dataUtils.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(dataUtils.unique([])).toEqual([]);
    });

    test('should flatten nested arrays', () => {
      expect(dataUtils.flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
      expect(dataUtils.flatten([['a'], ['b', 'c']])).toEqual(['a', 'b', 'c']);
      expect(dataUtils.flatten([])).toEqual([]);
    });

    test('should chunk array into specified sizes', () => {
      expect(dataUtils.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(dataUtils.chunk(['a', 'b', 'c', 'd'], 3)).toEqual([['a', 'b', 'c'], ['d']]);
      expect(dataUtils.chunk([], 2)).toEqual([]);
    });
  });

  describe('object operations', () => {
    test('should pick specified properties from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(dataUtils.pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
      expect(dataUtils.pick(obj, [])).toEqual({});
    });

    test('should omit specified properties from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(dataUtils.omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 });
      expect(dataUtils.omit(obj, [])).toEqual(obj);
    });
  });

  describe('grouping operations', () => {
    test('should group array by key function', () => {
      const items = [
        { type: 'fruit', name: 'apple' },
        { type: 'vegetable', name: 'carrot' },
        { type: 'fruit', name: 'banana' }
      ];
      
      const grouped = dataUtils.groupBy(items, item => item.type);
      expect(grouped).toEqual({
        fruit: [
          { type: 'fruit', name: 'apple' },
          { type: 'fruit', name: 'banana' }
        ],
        vegetable: [
          { type: 'vegetable', name: 'carrot' }
        ]
      });
    });

    test('should handle empty array in groupBy', () => {
      expect(dataUtils.groupBy([], (x: any) => x.key)).toEqual({});
    });
  });

  describe('edge cases', () => {
    test('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const uniqueResult = dataUtils.unique(largeArray);
      expect(uniqueResult).toHaveLength(1000);
      expect(uniqueResult[0]).toBe(0);
      expect(uniqueResult[999]).toBe(999);
    });

    test('should handle complex nested structures', () => {
      const nested = [[1, [2]], [3, [4, 5]]];
      // Note: Our flatten only goes one level deep, as designed
      expect(dataUtils.flatten(nested)).toEqual([1, [2], 3, [4, 5]]);
    });
  });
});
