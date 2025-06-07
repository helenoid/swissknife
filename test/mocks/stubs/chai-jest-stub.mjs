/**
 * Chai-compatible stub for Jest (ESM Version)
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
      include: (substring) => {
        if (typeof value === 'string') {
          expect(value).toContain(substring);
        } else if (Array.isArray(value)) {
          expect(value).toContain(substring);
        } else if (typeof value === 'object' && value !== null) {
          expect(value).toEqual(expect.objectContaining(substring));
        }
      },
      match: (regex) => expect(value).toMatch(regex),
      throw: (errorType) => {
        if (typeof value !== 'function') {
          throw new Error('Expected a function to test for thrown errors');
        }
        
        if (errorType) {
          expect(value).toThrow(errorType);
        } else {
          expect(value).toThrow();
        }
      }
    }
  };
};

// Create chai assert implementation
const assert = {
  equal: (actual, expected) => expect(actual).toBe(expected),
  deepEqual: (actual, expected) => expect(actual).toEqual(expected),
  strictEqual: (actual, expected) => expect(actual).toBe(expected),
  isTrue: (value) => expect(value).toBe(true),
  isFalse: (value) => expect(value).toBe(false),
  isNull: (value) => expect(value).toBeNull(),
  isUndefined: (value) => expect(value).toBeUndefined(),
  isDefined: (value) => expect(value).toBeDefined(),
  throws: (fn, errorType) => {
    if (errorType) {
      expect(fn).toThrow(errorType);
    } else {
      expect(fn).toThrow();
    }
  }
};

// Create a minimalist chai stub
const chai = {
  expect: chaiExpect,
  assert: assert
};

export default chai;
