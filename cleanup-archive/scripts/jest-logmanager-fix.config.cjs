/**
 * Fixed Jest configuration for LogManager test
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Only run LogManager tests
  testMatch: ["<rootDir>/test/unit/utils/logging/manager.test.js"],
  
  // Increased timeout for tests
  testTimeout: 30000
};
