/**
 * Custom Jest configuration for running problematic tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Disable process.config usage
  haste: {
    enableSymlinks: true,
  },
  
  // Module directories
  moduleDirectories: ['node_modules'],

  // Transform configuration
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
  
  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    "/node_modules/(?!lodash-es).+\\.js$"
  ],
  
  // Handle ESM extensions
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  
  // Module name mapping for imports
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^lodash-es$": "lodash",
    "lodash-es": "lodash",
    "@/(.*)": "<rootDir>/src/$1",
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
  },
  
  // Test environment setup
  testEnvironment: "node",
  
  // Path aliasing for TypeScript paths
  modulePaths: ['<rootDir>'],
  
  // Allow importing modules with .js extensions in TypeScript files
  resolver: undefined
};
