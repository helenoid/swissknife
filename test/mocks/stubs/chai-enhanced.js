/**
 * Enhanced Chai stub that provides compatibility with Jest
 */

// Create chai-like assertion methods that actually use Jest under the hood
const expect = global.expect;

const chai = {
  expect: (actual) => {
    return {
      to: {
        equal: (expected) => expect(actual).toEqual(expected),
        deep: {
          equal: (expected) => expect(actual).toEqual(expected),
          include: (expected) => {
            if (Array.isArray(actual)) {
              expect(actual).toEqual(expect.arrayContaining([expected]));
            } else if (typeof actual === 'object' && actual !== null) {
              expect(actual).toEqual(expect.objectContaining(expected));
            } else {
              throw new Error('Cannot deep include on non-object types');
            }
          }
        },
        be: {
          a: (type) => {
            if (type === 'string') expect(typeof actual).toBe('string');
            else if (type === 'number') expect(typeof actual).toBe('number');
            else if (type === 'boolean') expect(typeof actual).toBe('boolean');
            else if (type === 'function') expect(typeof actual).toBe('function');
            else if (type === 'object') expect(typeof actual).toBe('object');
            else if (type === 'array') expect(Array.isArray(actual)).toBe(true);
            else expect(actual).toBeInstanceOf(type);
          },
          an: function(type) { this.a(type); },
          true: () => expect(actual).toBe(true),
          false: () => expect(actual).toBe(false),
          null: () => expect(actual).toBeNull(),
          undefined: () => expect(actual).toBeUndefined()
        },
        have: {
          property: (prop, value) => {
            expect(actual).toHaveProperty(prop);
            if (arguments.length > 1) {
              expect(actual[prop]).toEqual(value);
            }
          },
          length: (length) => expect(actual.length).toBe(length)
        },
        include: (expected) => {
          if (typeof actual === 'string') {
            expect(actual).toContain(expected);
          } else if (Array.isArray(actual)) {
            expect(actual).toContain(expected);
          } else if (typeof actual === 'object' && actual !== null) {
            expect(actual).toEqual(expect.objectContaining(expected));
          } else {
            throw new Error('Cannot include on this type');
          }
        },
        throw: () => expect(actual).toThrow()
      }
    };
  },
  
  // Add chai assert API
  assert: {
    equal: (actual, expected) => expect(actual).toEqual(expected),
    strictEqual: (actual, expected) => expect(actual).toBe(expected),
    deepEqual: (actual, expected) => expect(actual).toEqual(expected),
    isTrue: (actual) => expect(actual).toBe(true),
    isFalse: (actual) => expect(actual).toBe(false),
    isNull: (actual) => expect(actual).toBeNull(),
    isUndefined: (actual) => expect(actual).toBeUndefined(),
    isDefined: (actual) => expect(actual).not.toBeUndefined(),
    throws: (fn) => expect(fn).toThrow()
  }
};

// Handle CommonJS exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = chai;
}

// Handle ESM exports
export default chai;
export const { expect: chaiExpect, assert } = chai;
