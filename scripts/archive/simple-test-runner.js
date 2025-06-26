#!/usr/bin/env node

// Simple Node.js test runner to bypass Jest hanging issues
const path = require('path');
const fs = require('fs');

console.log('=== Simple Node.js Test Runner ===');

// Basic assertion functions
global.expect = function(actual) {
  return {
    toBe: function(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
      return true;
    },
    toEqual: function(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
      return true;
    },
    toBeTruthy: function() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
      return true;
    },
    toBeFalsy: function() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
      return true;
    },
    toBeNull: function() {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
      }
      return true;
    },
    toBeUndefined: function() {
      if (actual !== undefined) {
        throw new Error(`Expected ${actual} to be undefined`);
      }
      return true;
    }
  };
};

global.describe = function(description, fn) {
  console.log(`\n--- ${description} ---`);
  try {
    fn();
    console.log(`✓ ${description} completed`);
  } catch (error) {
    console.error(`✗ ${description} failed:`, error.message);
  }
};

global.it = function(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
  } catch (error) {
    console.error(`  ✗ ${description}: ${error.message}`);
  }
};

global.beforeEach = function(fn) {
  // Simple beforeEach implementation
  fn();
};

// Run a simple test
describe('Basic Test Framework', () => {
  it('should work with basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
  });
});

console.log('\n=== Test framework ready ===');
