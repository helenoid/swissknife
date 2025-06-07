/**
 * Final Minimal Jest Configuration
 */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Core test pattern - match standard Jest patterns too
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)",
    "<rootDir>/*.test.js",
    "<rootDir>/test-*.js"
  ],
  
  // Basic transform for JS files
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Setup file
  setupFilesAfterEnv: ['<rootDir>/test-setup-final.js'],
  
  // Verbose output for debugging
  verbose: true,
};
