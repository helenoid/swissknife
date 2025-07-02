/**
 * Jest configuration for LogManager test
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Transform configuration
  transform: {
    // Handle TypeScript and JavaScript files
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ]
      },
    ],
  },
  
  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    "/node_modules/(?!lodash-es).+\\.js$"
  ],
  
  // Handle ESM extensions
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  
  // Module name mapper for imports
  moduleNameMapper: {
    // Map lodash-es imports to lodash (CommonJS version)
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1"
  },
  
  // Add module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "src"],
  
  // Use minimal setup file that doesn't cause issues
  setupFilesAfterEnv: ['<rootDir>/test/minimal.setup.js'],
  
  // Only run LogManager tests
  testMatch: ["<rootDir>/test/unit/utils/logging/manager.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/test/unit/utils/logging/manager.test.ts"],
  
  // Increased timeout for tests
  testTimeout: 30000
};
