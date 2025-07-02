/**
 * Basic minimal Jest configuration for our fixed test
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Basic transform setup
  transform: {
    "^.+\\.(t|j)sx?$": "babel-jest"
  },
  
  // No need for module mapping or transformIgnorePatterns
  
  // Set a longer timeout for tests
  testTimeout: 30000
};
