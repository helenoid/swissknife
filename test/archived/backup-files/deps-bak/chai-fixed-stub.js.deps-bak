/**
 * Chai stub for Jest compatibility
 * Improved version with better Jest-Chai compatibility
 */

// Create chai expect implementation using Jest's expect
const chaiExpect = function(value) {
  const jestExpect = jest.expect(value);
  
  return {
    to: {
      equal: (expected) => jestExpect.toBe(expected),
      deep: {
        equal: (expected) => jestExpect.toEqual(expected),
        include: (expected) => jestExpect.toEqual(jest.expect.objectContaining(expected))
      },
      be: {
        true: () => jestExpect.toBe(true),
        false: () => jestExpect.toBe(false),
        null: () => jestExpect.toBeNull(),
        undefined: () => jestExpect.toBeUndefined(),
        empty: () => {
          if (typeof value === 'string' || Array.isArray(value)) {
            jest.expect(value.length).toBe(0);
          } else if (typeof value === 'object' && value !== null) {
            jest.expect(Object.keys(value).length).toBe(0);
          }
        }
      },
      exist: () => jestExpect.toBeDefined(),
      eql: (expected) => jestExpect.toEqual(expected),
      not: {
        equal: (expected) => jestExpect.not.toBe(expected),
        deep: {
          equal: (expected) => jestExpect.not.toEqual(expected)
        },
        be: {
          true: () => jestExpect.not.toBe(true),
          false: () => jestExpect.not.toBe(false),
          null: () => jestExpect.not.toBeNull(),
          undefined: () => jestExpect.not.toBeUndefined(),
          empty: () => {
            if (typeof value === 'string' || Array.isArray(value)) {
              jest.expect(value.length).not.toBe(0);
            } else if (typeof value === 'object' && value !== null) {
              jest.expect(Object.keys(value).length).not.toBe(0);
            }
          }
        },
        exist: () => jestExpect.toBeUndefined()
      },
      include: (expected) => {
        if (typeof value === 'string') {
          jestExpect.toContain(expected);
        } else if (Array.isArray(value)) {
          jestExpect.toContain(expected);
        } else if (typeof value === 'object' && value !== null) {
          jestExpect.toEqual(jest.expect.objectContaining(expected));
        }
      },
      match: (regex) => jestExpect.toMatch(regex),
      throw: () => jest.expect(() => value()).toThrow(),
      eventually: {
        equal: async (expected) => jest.expect(await value).toBe(expected),
        deep: {
          equal: async (expected) => jest.expect(await value).toEqual(expected)
        }
      }
    }
  };
};

// Set fail property on the expect function
chaiExpect.fail = function(message) {
  throw new Error(message);
};

const assertModule = {
  equal: (actual, expected) => jest.expect(actual).toBe(expected),
  deepEqual: (actual, expected) => jest.expect(actual).toEqual(expected),
  isTrue: (value) => jest.expect(value).toBe(true),
  isFalse: (value) => jest.expect(value).toBe(false),
  isNull: (value) => jest.expect(value).toBeNull(),
  isUndefined: (value) => jest.expect(value).toBeUndefined(),
  exists: (value) => jest.expect(value).not.toBeUndefined(),
  notEqual: (actual, expected) => jest.expect(actual).not.toBe(expected),
  throws: (fn) => jest.expect(fn).toThrow(),
  fail: (message) => {
    throw new Error(message);
  }
};

// Support both ESM and CommonJS exports
export const expect = chaiExpect;
export const assert = assertModule;
export const should = () => {};

export default {
  expect: chaiExpect,
  assert: assertModule,
  should: () => {}
};

// CommonJS compatibility
if (typeof module !== 'undefined') {
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
}
