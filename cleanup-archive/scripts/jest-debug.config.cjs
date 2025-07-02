/**
 * Simplified Jest configuration for debugging tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: "node",
  
  // Look for tests in test directory
  testMatch: [
    "<rootDir>/test/**/*.test.js"
  ],
  
  // Don't watch for changes
  watchman: false,
  
  // Ignore problematic directories
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/test/e2e/",
    "/swissknife_old/",
    "/test/web_/",
  ],
  
  // Basic transforms
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // Simple setup file
  setupFilesAfterEnv: [],
  
  // Time out tests after 10 seconds
  testTimeout: 10000
};
