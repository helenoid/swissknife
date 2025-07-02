/**
 * Simplified Jest configuration for ESM tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Transform nothing - just use Node's native ESM support
  transform: {},
  
  // Don't transform node_modules
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  
  // Explicitly treat all files as ESM
  extensionsToTreatAsEsm: [".js", ".ts", ".tsx", ".jsx"],
  
  // Setup the environment variable for test mode
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // This is the most important part - how Jest handles ESM
  moduleNameMapper: {
    // Force .js extensions to be treated as ESM
    "^(.+)\\.js$": "$1.js"
  }
};
