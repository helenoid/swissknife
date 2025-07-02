// Mock common dependencies
jest.mock("chalk", () => ({ default: (str: string) => str, red: (str: string) => str, green: (str: string) => str, blue: (str: string) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Chai-to-Jest Assertion Adapter for TypeScript Tests
 * 
 * This module provides a compatibility layer that allows tests written
 * with Chai syntax to work with Jest. It's particularly useful for
 * migrating existing Chai-based tests to Jest without rewriting them.
 * 
 * Enhanced version with complete TypeScript support and improved Jest compatibility
 */

// Type definitions for better TypeScript support
type ChaiExpectation<T = any> = {
  to: ChaiAssertions<T>;
  not: ChaiAssertions<T>;
  be: ChaiAssertionBe<T>;
  deep: { 
    equal: (expected: any) => void;
    include: (subset: any) => void;
  };
};

interface ChaiAssertionHave<T = any> {
  property: (name: string, value?: any) => void;
  length: (length: number) => void;
  lengthOf: (length: number) => void;
  members: (members: any[]) => void;
  keys: (keys: string[] | string) => void;
  ownProperty: (property: string) => void;
  nested: {
    property: (path: string, value?: any) => void;
  };
}

interface ChaiAssertionBe<T = any> {
  true: () => void;
  false: () => void;
  undefined: () => void;
  null: () => void;
  NaN: () => void;
  empty: () => void;
  a: (type: string) => void;
  an: (type: string) => void;
  instanceof: (constructor: any) => void;
  greaterThan: (n: number) => void;
  lessThan: (n: number) => void;
  at: {
    least: (n: number) => void;
    most: (n: number) => void;
  };
  not: { 
    undefined: () => void;
    null: () => void;
    empty: () => void;
  };
}

interface ChaiAssertions<T = any> {
  equal: (expected: any) => void;
  equals: (expected: any) => void;
  eq: (expected: any) => void;
  eql: (expected: any) => void;
  be: ChaiAssertionBe<T>;
  include: (expected: any) => void;
  includes: (expected: any) => void;
  contains: (expected: any) => void;
  contain: (expected: any) => void;
  have: ChaiAssertionHave<T>;
  match: (regex: RegExp) => void;
  string: (substring: string) => void;
  throw: (errorLike?: any, errMsgMatcher?: any) => void;
  rejectedWith: (errorLike?: any, errMsgMatcher?: any) => Promise<void>;
  fulfilled: () => Promise<void>;
  rejected: () => Promise<void>;
  eventually: ChaiAssertions<T>;
  above: (n: number) => void;
  below: (n: number) => void;
  lengthOf: (length: number) => void;
  keys: (keys: string[] | string) => void;
  deep: { 
    equal: (expected: any) => void;
    include: (subset: any) => void;
    nested: { property: (path: string, value?: any) => void; };
  };
}

/**
 * Creates a Chai-like expect function that delegates to Jest
 * @param actual - The value to test
 */
export function chaiExpected<T>(actual: T): ChaiExpectation<T> {
  const commonAssertions = (isNot: boolean): ChaiAssertions<T> => ({
    equal: (expected: any) => isNot ? expect(actual).not.toBe(expected) : expect(actual).toBe(expected),
    equals: (expected: any) => isNot ? expect(actual).not.toBe(expected) : expect(actual).toBe(expected),
    eq: (expected: any) => isNot ? expect(actual).not.toBe(expected) : expect(actual).toBe(expected),
    eql: (expected: any) => isNot ? expect(actual).not.toEqual(expected) : expect(actual).toEqual(expected),
    
    be: {
      true: () => isNot ? expect(actual).not.toBe(true) : expect(actual).toBe(true),
      false: () => isNot ? expect(actual).not.toBe(false) : expect(actual).toBe(false),
      undefined: () => isNot ? expect(actual).not.toBeUndefined() : expect(actual).toBeUndefined(),
      null: () => isNot ? expect(actual).not.toBeNull() : expect(actual).toBeNull(),
      NaN: () => isNot ? expect(actual).not.toBeNaN() : expect(actual).toBeNaN(),
      empty: () => {
        if (Array.isArray(actual) || typeof actual === 'string') {
          isNot ? expect(actual).not.toHaveLength(0) : expect(actual).toHaveLength(0);
        } else if (typeof actual === 'object' && actual !== null) {
          isNot ? expect(Object.keys(actual)).not.toHaveLength(0) : expect(Object.keys(actual)).toHaveLength(0);
        }
      },
      a: (type: string) => isNot ? expect(typeof actual).not.toBe(type) : expect(typeof actual).toBe(type),
      an: (type: string) => isNot ? expect(typeof actual).not.toBe(type) : expect(typeof actual).toBe(type),
      instanceof: (constructor: any) => isNot ? expect(actual).not.toBeInstanceOf(constructor) : expect(actual).toBeInstanceOf(constructor),
      greaterThan: (n: number) => isNot ? expect(actual as unknown as number).not.toBeGreaterThan(n) : expect(actual as unknown as number).toBeGreaterThan(n),
      lessThan: (n: number) => isNot ? expect(actual as unknown as number).not.toBeLessThan(n) : expect(actual as unknown as number).toBeLessThan(n),
      at: {
        least: (n: number) => isNot ? expect(actual as unknown as number).not.toBeGreaterThanOrEqual(n) : expect(actual as unknown as number).toBeGreaterThanOrEqual(n),
        most: (n: number) => isNot ? expect(actual as unknown as number).not.toBeLessThanOrEqual(n) : expect(actual as unknown as number).toBeLessThanOrEqual(n),
      },
      not: { 
        undefined: () => expect(actual).not.toBeUndefined(),
        null: () => expect(actual).not.toBeNull(),
        empty: () => {
          if (Array.isArray(actual) || typeof actual === 'string') {
            expect(actual).not.toHaveLength(0);
          } else if (typeof actual === 'object' && actual !== null) {
            expect(Object.keys(actual)).not.toHaveLength(0);
          }
        }
      },
    },
    
    include: (expected: any) => {
      if (typeof actual === 'string') {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else if (Array.isArray(actual)) {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else {
        isNot ? expect(actual).not.toEqual(expect.objectContaining(expected)) : expect(actual).toEqual(expect.objectContaining(expected));
      }
    },
    
    includes: (expected: any) => {
      if (typeof actual === 'string') {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else if (Array.isArray(actual)) {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else {
        isNot ? expect(actual).not.toEqual(expect.objectContaining(expected)) : expect(actual).toEqual(expect.objectContaining(expected));
      }
    },
    
    contain: (expected: any) => {
      if (typeof actual === 'string') {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else if (Array.isArray(actual)) {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else {
        isNot ? expect(actual).not.toEqual(expect.objectContaining(expected)) : expect(actual).toEqual(expect.objectContaining(expected));
      }
    },
    
    contains: (expected: any) => {
      if (typeof actual === 'string') {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else if (Array.isArray(actual)) {
        isNot ? expect(actual).not.toContain(expected) : expect(actual).toContain(expected);
      } else {
        isNot ? expect(actual).not.toEqual(expect.objectContaining(expected)) : expect(actual).toEqual(expect.objectContaining(expected));
      }
    },
    
    have: {
      property: (name: string, value?: any) => {
        isNot ? expect(actual).not.toHaveProperty(name) : expect(actual).toHaveProperty(name);
        if (value !== undefined) {
          isNot ? expect((actual as any)[name]).not.toBe(value) : expect((actual as any)[name]).toBe(value);
        }
      },
      
      length: (length: number) => isNot ? expect((actual as any).length).not.toBe(length) : expect((actual as any).length).toBe(length),
      lengthOf: (length: number) => isNot ? expect((actual as any).length).not.toBe(length) : expect((actual as any).length).toBe(length),
      
      members: (members: any[]) => {
        if (Array.isArray(actual)) {
          isNot ? expect(actual).not.toEqual(expect.arrayContaining(members)) : expect(actual).toEqual(expect.arrayContaining(members));
          isNot ? expect(actual.length).not.toBe(members.length) : expect(actual.length).toBe(members.length);
        }
      },
      
      keys: (keys: string[] | string) => {
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        const objKeys = Object.keys(actual as object);
        keyArray.forEach(key => {
          isNot ? expect(objKeys).not.toContain(key) : expect(objKeys).toContain(key);
        });
      },
      
      ownProperty: (property: string) => {
        isNot ? expect(Object.prototype.hasOwnProperty.call(actual, property)).toBeFalsy() : expect(Object.prototype.hasOwnProperty.call(actual, property)).toBeTruthy();
      },
      
      nested: {
        property: (path: string, value?: any) => {
          isNot ? expect(actual).not.toHaveProperty(path) : expect(actual).toHaveProperty(path);
          if (value !== undefined) {
            isNot ? expect(actual).not.toHaveProperty(path, value) : expect(actual).toHaveProperty(path, value);
          }
        }
      }
    },
    
    match: (regex: RegExp) => isNot ? expect(String(actual)).not.toMatch(regex) : expect(String(actual)).toMatch(regex),
    string: (substring: string) => isNot ? expect(String(actual)).not.toContain(substring) : expect(String(actual)).toContain(substring),
    
    throw: (errorLike?: any, errMsgMatcher?: any) => {
      if (typeof actual !== 'function') {
        throw new Error('Expected function to throw');
      }
      
      if (isNot) {
        expect(actual).not.toThrow(errorLike);
      } else {
        expect(actual).toThrow(errorLike);
      }
    },
    
    rejectedWith: async (errorLike?: any, errMsgMatcher?: any) => {
      if (!(actual instanceof Promise)) {
        throw new Error('Expected a promise');
      }
      
      if (isNot) {
        await expect(actual).resolves.toBeDefined(); // If it resolves, it didn't reject
      } else {
        await expect(actual).rejects.toThrow(errorLike);
      }
    },
    
    fulfilled: async () => {
      if (!(actual instanceof Promise)) {
        throw new Error('Expected a promise');
      }
      isNot ? await expect(actual).rejects.toBeDefined() : await expect(actual).resolves.toBeDefined();
    },
    
    rejected: async () => {
      if (!(actual instanceof Promise)) {
        throw new Error('Expected a promise');
      }
      isNot ? await expect(actual).resolves.toBeDefined() : await expect(actual).rejects.toBeDefined();
    },
    
    eventually: commonAssertions(isNot), // For promise chaining, just returns the same assertions
    
    above: (n: number) => isNot ? expect(actual as unknown as number).not.toBeGreaterThan(n) : expect(actual as unknown as number).toBeGreaterThan(n),
    below: (n: number) => isNot ? expect(actual as unknown as number).not.toBeLessThan(n) : expect(actual as unknown as number).toBeLessThan(n),
    lengthOf: (length: number) => isNot ? expect((actual as any).length).not.toBe(length) : expect((actual as any).length).toBe(length),
    
    keys: (keys: string[] | string) => {
      const keyArray = typeof keys === 'string' ? [keys] : keys;
      const objKeys = Object.keys(actual as object);
      keyArray.forEach(key => {
        isNot ? expect(objKeys).not.toContain(key) : expect(objKeys).toContain(key);
      });
    },
    
    deep: {
      equal: (expected: any) => isNot ? expect(actual).not.toEqual(expected) : expect(actual).toEqual(expected),
      include: (subset: any) => {
        if (Array.isArray(actual)) {
          isNot ? expect(actual).not.toEqual(expect.arrayContaining(subset)) : expect(actual).toEqual(expect.arrayContaining(subset));
        } else {
          isNot ? expect(actual).not.toEqual(expect.objectContaining(subset)) : expect(actual).toEqual(expect.objectContaining(subset));
        }
      },
      nested: { 
        property: (path: string, value?: any) => {
          isNot ? expect(actual).not.toHaveProperty(path) : expect(actual).toHaveProperty(path);
          if (value !== undefined) {
            isNot ? expect(actual).not.toHaveProperty(path, value) : expect(actual).toHaveProperty(path, value);
          }
        }
      }
    },
  });

  return {
    to: commonAssertions(false),
    not: commonAssertions(true),
    be: commonAssertions(false).be, // Direct access to 'be' for top-level 'expect(x).be.true'
    deep: commonAssertions(false).deep, // Direct access to 'deep' for top-level 'expect(x).deep.equal'
  };
}

// Create a chai object that can be used as a global
export const chai = {
  expect: chaiExpected,
};
