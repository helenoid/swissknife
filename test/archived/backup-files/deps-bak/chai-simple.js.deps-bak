/**
 * Simplified Chai stub for Jest compatibility
 */

// Create chai expect implementation using Jest's expect
const chaiExpect = function(value) {
  return {
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
      },
      exist: () => expect(value).toBeDefined(),
    },
    toThrow: (expected) => expect(value).toThrow(expected)
  };
};

// CommonJS exports
module.exports = {
  expect: chaiExpect,
  assert: {
    equal: (actual, expected) => expect(actual).toBe(expected),
    deepEqual: (actual, expected) => expect(actual).toEqual(expected),
  },
  should: () => {}
};
