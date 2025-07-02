/**
 * Chai-compatible stub for Jest
 * 
 * This module provides a Chai-like interface that uses Jest's expect underneath
 * to make it easier to port tests from Chai to Jest.
 */

// Create chai expect implementation using Jest's expect
const chaiExpect = function(value) {
  return {
    to: {
      equal: (expected) => expect(value).toBe(expected),
      deep: {
        equal: (expected) => expect(value).toEqual(expected),
        include: (expected) => expect(value).toEqual(expect.objectContaining(expected))
      },
      be: {
        true: () => expect(value).toBe(true),
        false: () => expect(value).toBe(false),
        null: () => expect(value).toBeNull(),
        undefined: () => expect(value).toBeUndefined(),
        empty: () => {
          if (typeof value === 'string' || Array.isArray(value)) {
            expect(value.length).toBe(0);
          } else if (typeof value === 'object' && value !== null) {
            expect(Object.keys(value).length).toBe(0);
          } else {
            throw new Error(`Cannot check if ${typeof value} is empty`);
          }
        }
      },
      exist: () => expect(value).toBeDefined(),
      eql: (expected) => expect(value).toEqual(expected),
      not: {
        equal: (expected) => expect(value).not.toBe(expected),
        deep: {
          equal: (expected) => expect(value).not.toEqual(expected)
        },
        be: {
          true: () => expect(value).not.toBe(true),
          false: () => expect(value).not.toBe(false),
          null: () => expect(value).not.toBeNull(),
          undefined: () => expect(value).not.toBeUndefined(),
          empty: () => {
            if (typeof value === 'string' || Array.isArray(value)) {
              expect(value.length).not.toBe(0);
            } else if (typeof value === 'object' && value !== null) {
              expect(Object.keys(value).length).not.toBe(0);
            } else {
              throw new Error(`Cannot check if ${typeof value} is empty`);
            }
          }
        }
      },
      include: (expected) => {
        if (typeof value === 'string') {
          expect(value).toContain(expected);
        } else if (Array.isArray(value)) {
          expect(value).toContain(expected);
        } else {
          expect(value).toEqual(expect.objectContaining(expected));
        }
      },
      match: (regex) => expect(value).toMatch(regex),
      throw: (expected) => {
        if (typeof value !== 'function') {
          throw new Error('expect(fn).to.throw() requires a function');
        }
        if (expected instanceof RegExp) {
          expect(value).toThrow(expected);
        } else if (typeof expected === 'string') {
          expect(value).toThrow(expected);
        } else {
          expect(value).toThrow();
        }
      },
      eventually: {
        equal: async (expected) => expect(await value).toBe(expected),
        deep: {
          equal: async (expected) => expect(await value).toEqual(expected)
        }
      }
    }
  };
};

// Simple assertion module
const assertModule = {
  equal: (actual, expected, message) => expect(actual).toBe(expected),
  deepEqual: (actual, expected, message) => expect(actual).toEqual(expected),
  strictEqual: (actual, expected, message) => expect(actual).toBe(expected),
  notEqual: (actual, expected, message) => expect(actual).not.toBe(expected),
  ok: (value, message) => expect(value).toBeTruthy(),
  fail: (message) => expect(false).toBeTruthy(message),
  throws: (fn, expected, message) => {
    if (expected instanceof RegExp) {
      expect(fn).toThrow(expected);
    } else if (typeof expected === 'function') {
      expect(fn).toThrow(expected);
    } else {
      expect(fn).toThrow();
    }
  }
};

// Export for CommonJS (Jest primarily uses CJS)
module.exports = {
  expect: chaiExpect,
  assert: assertModule,
  should: () => {},
  default: {
    expect: chaiExpect,
    assert: assertModule,
    should: () => {}
  }
};
