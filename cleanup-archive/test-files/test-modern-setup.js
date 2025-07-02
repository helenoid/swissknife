// Increased timeouts for all tests
jest.setTimeout(30000);

// Chai-Jest adapter
global.chai = {
  expect: (value) => {
    const jestExpect = expect(value);
    return {
      to: {
        equal: (expected) => jestExpect.toBe(expected),
        deep: {
          equal: (expected) => jestExpect.toEqual(expected),
          include: (expected) => jestExpect.toEqual(expect.objectContaining(expected))
        },
        be: {
          true: () => jestExpect.toBe(true),
          false: () => jestExpect.toBe(false),
          null: () => jestExpect.toBeNull(),
          undefined: () => jestExpect.toBeUndefined()
        },
        include: (expected) => {
          if (typeof value === 'string') {
            jestExpect.toContain(expected);
          } else if (Array.isArray(value)) {
            jestExpect.toContain(expected);
          } else {
            jestExpect.toEqual(expect.objectContaining(expected));
          }
        },
        eql: (expected) => jestExpect.toEqual(expected)
      }
    };
  }
};

console.log('Modern test setup completed with chai-jest adapter');
