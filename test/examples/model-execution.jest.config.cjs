/**
 * Jest configuration specifically for model-execution tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Use CommonJS transform for all files
  transform: {
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
  
  // Transform all node_modules including ESM packages
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module name mapping for imports
  moduleNameMapper: {
    // Handle CSS and asset imports
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    
    // Map lodash-es imports to lodash
    "^lodash-es$": "lodash",
    "^lodash-es/(.*)$": "lodash/$1",
    
    // Mock problematic modules
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    "chai": "<rootDir>/test/mocks/stubs/chai-stub.js"
  },
  
  // Module directories
  moduleDirectories: ["node_modules", "src"],
  
  // File extensions to process
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  
  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/test/examples/model-execution.setup.js'],
  
  // Increase test timeout
  testTimeout: 30000,
  
  // Root directory
  rootDir: ".",
};
