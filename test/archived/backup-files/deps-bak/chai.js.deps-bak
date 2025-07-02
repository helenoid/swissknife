/**
 * Chai compatibility module for ESM
 * This provides Chai-like assertion APIs that work with Jest
 */

// Create compatible Chai expect implementation that uses Jest
const chaiExpect = function(value) {
  const assertions = {
    to: {
      equal: (expected) => expect(value).toBe(expected),
      deep: {
        equal: (expected) => expect(value).toEqual(expected),
      },
      be: {
        true: () => expect(value).toBe(true),
        false: () => expect(value).toBe(false),
        null: () => expect(value).toBeNull(),
        undefined: () => expect(value).toBeUndefined(),
        a: (type) => {
          if (type === 'function' || type === 'Function') return expect(typeof value).toBe('function');
          if (type === 'string' || type === 'String') return expect(typeof value).toBe('string');
          if (type === 'number' || type === 'Number') return expect(typeof value).toBe('number');
          if (type === 'object' || type === 'Object') return expect(typeof value).toBe('object');
          if (type === 'array' || type === 'Array') return expect(Array.isArray(value)).toBe(true);
          return expect(value).toBeInstanceOf(type);
        },
      },
      exist: () => expect(value).not.toBeUndefined(),
      include: (item) => {
        if (typeof value === 'string') return expect(value).toContain(item);
        if (Array.isArray(value)) return expect(value).toContain(item);
        if (typeof value === 'object') return expect(value).toHaveProperty(item);
      },
      not: {
        equal: (expected) => expect(value).not.toBe(expected),
        deep: {
          equal: (expected) => expect(value).not.toEqual(expected),
        },
        be: {
          true: () => expect(value).not.toBe(true),
          false: () => expect(value).not.toBe(false),
        },
      },
      throw: (expected) => {
        if (typeof value !== 'function') {
          throw new Error('expect.to.throw requires a function');
        }
        return expect(value).toThrow(expected);
      }
    }
  };

  // Add toThrow for direct Jest compatibility
  if (typeof value === 'function') {
    assertions.toThrow = (expected) => expect(value).toThrow(expected);
  }

  return assertions;
};

// Export for ESM
export const expect = chaiExpect;

// Export as default for better compatibility
export default { expect: chaiExpect };
