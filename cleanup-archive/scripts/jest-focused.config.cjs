/**
 * Simplified Jest configuration for specific core tests
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
    "^lodash-es$": "lodash",
    "^lodash-es/(.*)$": "lodash/$1",
    
    // Map any problematic imports for testing
    "^../tools/executor.js$": "<rootDir>/test/mocks/tools/executor.js",
    "^../../../src/command-registry.js$": "<rootDir>/test/mocks/command-registry.js",
    "^../../../src/storage/ipfs/mcp-client.js$": "<rootDir>/test/utils/mockMCPClient.js"
  },
  
  // Add module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "src"],
  
  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  
  // Increased timeout for tests
  testTimeout: 30000,
  
  // Create mocks automatically for components
  automock: false,
  
  // Test paths to ignore
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/test/e2e/",
    "/test/benchmark/",
    "/test/web_platform_tests/",
    "/test/web_audio_tests/",
    "/test/unit/cli/",
    "/test/unit/ux/"
  ]
};
