/**
 * Simplified Jest configuration for core functionality tests
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
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }]
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
  
  // Module name mapping for imports
  moduleNameMapper: {
    // Handle CSS imports for React components
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    
    // Map lodash-es imports to lodash (CommonJS version)
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1"
  },
  
  // Add module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "src"],
  
  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  
  // Increased timeout for tests
  testTimeout: 30000
};
