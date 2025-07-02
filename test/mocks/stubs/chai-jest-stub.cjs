/**
 * Chai-to-Jest Assertion Adapter for CommonJS Tests
 * 
 * This adapter provides compatibility for tests written with Chai syntax
 * to work with Jest by providing an adapter layer.
 */

// Create a chai-like expect function that delegates to Jest
function chaiExpect(actual) {
  // Main assertion object
  const assertions = {
    // Core assertions
    equal: (expected) => expect(actual).toBe(expected),
    eql: (expected) => expect(actual).toEqual(expected),
    include: (expected) => {
      if (typeof actual === 'string') {
        expect(actual).toContain(expected);
      } else if (Array.isArray(actual)) {
        expect(actual).toContain(expected);
      } else {
        expect(actual).toEqual(expect.objectContaining(expected));
      }
    },
    contain: function(expected) { return this.include(expected); },
    
    // Boolean assertions
    be: {
      true: () => expect(actual).toBe(true),
      false: () => expect(actual).toBe(false),
      undefined: () => expect(actual).toBeUndefined(),
      null: () => expect(actual).toBeNull(),
      empty: () => {
        if (Array.isArray(actual) || typeof actual === 'string') {
          expect(actual.length).toBe(0);
        } else if (typeof actual === 'object' && actual !== null) {
          expect(Object.keys(actual)).toHaveLength(0);
        }
      },
      a: (type) => expect(typeof actual).toBe(type),
      an: (type) => expect(typeof actual).toBe(type),
    },
    
    // Property and length assertions
    have: {
      property: (name, value) => {
        expect(actual).toHaveProperty(name);
        if (value !== undefined) {
          expect(actual[name]).toBe(value);
        }
      },
      length: (length) => expect(actual.length).toBe(length),
      lengthOf: function(length) { return this.length(length); },
      keys: (keys) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const objKeys = Object.keys(actual);
        keyArray.forEach(key => {
          expect(objKeys).toContain(key);
        });
      },
      been: {
        called: () => expect(actual.called).toBeTruthy(),
        calledOnce: () => expect(actual.callCount).toBe(1),
        calledWith: (...args) => expect(actual.calledWith(...args)).toBeTruthy(),
      }
    },
    
    // Error handling
    throw: () => expect(actual).toThrow(),
    
    // Deep assertions
    deep: {
      equal: (expected) => expect(actual).toEqual(expected)
    }
  };

  // Allow chaining
  assertions.to = assertions;
  assertions.be.to = assertions;
  assertions.have.to = assertions;
  
  // Add negation
  assertions.not = {
    equal: (expected) => expect(actual).not.toBe(expected),
    include: (expected) => {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        expect(actual).not.toContain(expected);
      } else {
        expect(actual).not.toMatchObject(expected);
      }
    },
    be: {
      undefined: () => expect(actual).not.toBeUndefined(),
      null: () => expect(actual).not.toBeNull(),
    },
    to: {}
  };
  
  assertions.not.to = assertions.not;
  
  return assertions;
}

// Configure Chai adapter for global usage
const chai = {
  expect: chaiExpect
};

// Make available globally for easy access in tests
global.chai = chai;

// Export
module.exports = chai;
