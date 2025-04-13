/**
 * Chai stub for Jest compatibility
 * 
 * This stub file maps chai assertions to Jest's expect API
 * to avoid adding another assertion library dependency
 */

// Map chai's expect to Jest's expect
export const expect = jest.fn((value) => {
  return {
    to: {
      equal: (expected) => expect(value).toBe(expected),
      deep: {
        equal: (expected) => expect(value).toEqual(expected),
        include: (expected) => expect(value).toEqual(expect.objectContaining(expected)),
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
        },
      },
      exist: () => expect(value).not.toBeUndefined(),
      eql: (expected) => expect(value).toEqual(expected),
      not: {
        equal: (expected) => expect(value).not.toBe(expected),
        deep: {
          equal: (expected) => expect(value).not.toEqual(expected),
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
          },
        },
        exist: () => expect(value).toBeUndefined(),
      },
      include: (expected) => {
        if (typeof value === 'string') {
          expect(value).toContain(expected);
        } else if (Array.isArray(value)) {
          expect(value).toContain(expected);
        } else if (typeof value === 'object' && value !== null) {
          expect(value).toEqual(expect.objectContaining(expected));
        } else {
          throw new Error(`Cannot check if ${typeof value} includes ${expected}`);
        }
      },
      match: (regex) => expect(value).toMatch(regex),
      throw: () => expect(() => value()).toThrow(),
      eventually: {
        equal: async (expected) => expect(await value).toBe(expected),
        deep: {
          equal: async (expected) => expect(await value).toEqual(expected),
        },
      },
    },
  };
});

expect.fail = (message) => {
  throw new Error(message);
};

// Stub for chai's assert
export const assert = {
  equal: (actual, expected) => expect(actual).toBe(expected),
  deepEqual: (actual, expected) => expect(actual).toEqual(expected),
  isTrue: (value) => expect(value).toBe(true),
  isFalse: (value) => expect(value).toBe(false),
  isNull: (value) => expect(value).toBeNull(),
  isUndefined: (value) => expect(value).toBeUndefined(),
  exists: (value) => expect(value).not.toBeUndefined(),
  notEqual: (actual, expected) => expect(actual).not.toBe(expected),
  throws: (fn) => expect(fn).toThrow(),
  fail: (message) => {
    throw new Error(message);
  },
};