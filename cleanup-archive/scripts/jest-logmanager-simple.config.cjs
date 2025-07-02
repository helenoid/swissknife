/**
 * Simple Jest configuration for LogManager CommonJS test
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Only run our simplified test
  testMatch: ["<rootDir>/test/unit/utils/logging/manager.test.simplified.cjs"],
  
  // Increased timeout for tests
  testTimeout: 30000
};
