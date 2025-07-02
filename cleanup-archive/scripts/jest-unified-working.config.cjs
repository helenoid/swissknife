/**
 * Unified Jest configuration for SwissKnife tests
 * This configuration supports both ESM and CommonJS modules
 */

module.exports = {
  // Set testTimeout to handle longer-running tests
  testTimeout: 30000,
  
  // Transform configuration
  transform: {
    // Handle TypeScript and JavaScript files
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-transform-class-properties"
        ]
      },
    ],
  },
  
  // Transform lodash-es and other ESM modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Handle ESM extensions
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  
  // Add module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  
  // Add file extensions for module resolution
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  
  // Setup files for test environment
  setupFiles: ["<rootDir>/test/comprehensive.setup.js"],
  
  // Ensure proper path resolution for imports with .js extensions
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1"
  },
  
  // Enable collecting coverage information
  collectCoverage: false,
  
  // Show detailed test results
  verbose: true,
  
  // Set test environment
  testEnvironment: "node"
};
