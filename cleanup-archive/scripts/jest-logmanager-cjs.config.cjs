/**
 * Jest configuration for LogManager test - CommonJS version
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Use Babel for JavaScript files
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  
  // Only run LogManager tests - use the JS version, not the TS version
  testMatch: ["<rootDir>/test/unit/utils/logging/manager.test.js"],
  
  // Add module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "src"],
  
  // Increased timeout for tests
  testTimeout: 30000
};
