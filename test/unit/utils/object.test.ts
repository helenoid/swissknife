/**
 * Test for object utility functions
 */

// Mock utility functions
function isPlainObject(obj: any): obj is object {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  
  // Check if it's a built-in object type (Date, RegExp, etc.)
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Error) {
    return false;
  }
  
  // Check if it has a constructor and if it's the Object constructor
  const proto = Object.getPrototypeOf(obj);
  return proto === null || proto === Object.prototype;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const cloned = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

function merge(target: any, source: any): any {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isPlainObject(result[key]) && isPlainObject(source[key])) {
        result[key] = merge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

describe('Object Utilities', () => {
  describe('isPlainObject', () => {
    test('should identify plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    test('should reject non-plain objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(42)).toBe(false);
    });
  });

  describe('deepClone', () => {
    test('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    test('should clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    test('should clone arrays', () => {
      const original = [1, { a: 2 }, [3, 4]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
      expect(cloned[2]).not.toBe(original[2]);
    });

    test('should clone dates', () => {
      const date = new Date('2023-01-01');
      const cloned = deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('merge', () => {
    test('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = merge(target, source);
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      expect(result).not.toBe(target);
    });

    test('should merge nested objects', () => {
      const target = { a: { x: 1, y: 2 }, b: 3 };
      const source = { a: { y: 4, z: 5 }, c: 6 };
      const result = merge(target, source);
      
      expect(result).toEqual({
        a: { x: 1, y: 4, z: 5 },
        b: 3,
        c: 6
      });
    });

    test('should handle empty objects', () => {
      expect(merge({}, { a: 1 })).toEqual({ a: 1 });
      expect(merge({ a: 1 }, {})).toEqual({ a: 1 });
      expect(merge({}, {})).toEqual({});
    });
  });
});
