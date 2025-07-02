// Increase timeout for all tests
jest.setTimeout(30000);

// Create chai-jest adapter
if (typeof chai === 'undefined' || !chai.expect) {
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
            undefined: () => jestExpect.toBeUndefined(),
            empty: () => {
              if (typeof value === 'string' || Array.isArray(value)) {
                expect(value.length).toBe(0);
              } else if (typeof value === 'object' && value !== null) {
                expect(Object.keys(value).length).toBe(0);
              }
            }
          },
          exist: () => jestExpect.toBeDefined(),
          eql: (expected) => jestExpect.toEqual(expected),
          not: {
            equal: (expected) => jestExpect.not.toBe(expected),
            be: {
              true: () => jestExpect.not.toBe(true),
              false: () => jestExpect.not.toBe(false)
            }
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
          match: (regex) => jestExpect.toMatch(regex)
        }
      };
    }
  };
}

console.log('Enhanced Jest setup completed with Chai compatibility');
