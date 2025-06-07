/**
 * Chai-to-Jest Assertion Adapter for TypeScript Tests
 * 
 * This module provides a compatibility layer that allows tests written
 * with Chai syntax to work with Jest. It's particularly useful for
 * migrating existing Chai-based tests to Jest without rewriting them.
 */

// Type definitions for Sinon stub/spy
interface SinonStub {
  called: boolean;
  callCount: number;
  calledWith: (...args: any[]) => boolean;
  calledOnce: boolean;
  calledTwice: boolean;
  calledWithExactly: (...args: any[]) => boolean;
  calledWithMatch: (...args: any[]) => boolean;
}

// Create a chai-like expect function that delegates to Jest
export function chaiExpect(actual: any): any {
  // Main assertion object
  const assertions: any = {
    // Core assertions
    to: {},
    be: {},
    not: {
      to: {}
    },
    deep: {
      equal: (expected: any) => expect(actual).toEqual(expected)
    },
    
    // Method to handle property access dynamically
    get(target: any, prop: string) {
      if (prop === 'to') return assertions.to;
      if (prop === 'be') return assertions.be;
      if (prop === 'deep') return assertions.deep;
      if (prop === 'not') return assertions.not;
      return undefined;
    }
  };
  
  // Standard assertions
  assertions.to.equal = (expected: any) => expect(actual).toBe(expected);
  assertions.to.eql = (expected: any) => expect(actual).toEqual(expected);
  assertions.to.include = (expected: any) => {
    if (typeof actual === 'string') {
      expect(actual).toContain(expected);
    } else if (Array.isArray(actual)) {
      expect(actual).toContain(expected);
    } else {
      expect(actual).toEqual(expect.objectContaining(expected));
    }
  };
  assertions.to.contain = assertions.to.include;
  
  // Boolean assertions
  assertions.to.be.true = () => expect(actual).toBe(true);
  assertions.to.be.false = () => expect(actual).toBe(false);
  assertions.to.be.undefined = () => expect(actual).toBeUndefined();
  assertions.to.be.null = () => expect(actual).toBeNull();
  assertions.to.be.empty = () => {
    if (Array.isArray(actual) || typeof actual === 'string') {
      expect(actual.length).toBe(0);
    } else if (typeof actual === 'object' && actual !== null) {
      expect(Object.keys(actual)).toHaveLength(0);
    }
  };
  
  // Type assertions
  assertions.to.be.a = (type: string) => expect(typeof actual).toBe(type);
  assertions.to.be.an = assertions.to.be.a;
  
  // Property and length assertions
  assertions.to.have = {};
  assertions.to.have.property = (name: string, value?: any) => {
    expect(actual).toHaveProperty(name);
    if (value !== undefined) {
      expect(actual[name]).toBe(value);
    }
  };
  assertions.to.have.length = (length: number) => expect(actual.length).toBe(length);
  assertions.to.have.lengthOf = assertions.to.have.length;
  
  // Keys assertions
  assertions.to.have.keys = (keys: string | string[]) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const objKeys = Object.keys(actual);
    keyArray.forEach(key => {
      expect(objKeys).toContain(key);
    });
  };
  
  // Sinon assertions
  assertions.to.have.been = {};
  assertions.to.have.been.called = () => {
    expect((actual as SinonStub).called).toBeTruthy();
  };
  assertions.to.have.been.calledOnce = () => {
    expect((actual as SinonStub).callCount).toBe(1);
  };
  assertions.to.have.been.calledWith = (...args: any[]) => {
    expect((actual as SinonStub).calledWith(...args)).toBeTruthy();
  };
  
  // Negation
  assertions.not.to.equal = (expected: any) => expect(actual).not.toBe(expected);
  assertions.not.to.include = (expected: any) => {
    if (typeof actual === 'string' || Array.isArray(actual)) {
      expect(actual).not.toContain(expected);
    } else {
      expect(actual).not.toMatchObject(expected);
    }
  };
  assertions.not.to.be = {};
  assertions.not.to.be.undefined = () => expect(actual).not.toBeUndefined();
  assertions.not.to.be.null = () => expect(actual).not.toBeNull();
  
  // Error handling
  assertions.to.throw = () => expect(actual).toThrow();
  
  return assertions.to;
}

// Configure Chai adapter for global usage
const chai = {
  expect: chaiExpect
};

// Export everything
export default chai;
