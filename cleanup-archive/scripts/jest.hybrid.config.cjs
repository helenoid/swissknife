/**
 * Hybrid Jest configuration for SwissKnife
 * 
 * This configuration handles both CommonJS and ES Modules in the same test run
 * It's specifically designed for the "type": "module" setting in package.json
 */

/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Transform setup that works with both ESM and CommonJS
  transform: {
    // For .js files (treat as ES Modules)
    "^.+\\.js$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: []
    }],
    // For .ts files (treat as TypeScript)
    "^.+\\.ts$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: []
    }],
    // For .cjs files (explicit CommonJS)
    "^.+\\.cjs$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }]
      ],
      plugins: []
    }]
  },
  
  // Handle ESM usage
  extensionsToTreatAsEsm: [".ts"],
  
  // Transformations for node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module name mapping for imports
  moduleNameMapper: {
    // Handle CSS imports for React components
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    
    // Map lodash-es imports to lodash (CommonJS version)
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1",
    
    // Handle missing modules by providing mocks
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    "chai": "<rootDir>/test/mocks/stubs/chai-stub.js"
  },
  
  // Module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  
  // Module file extensions
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "cjs", "mjs", "json", "node"],
  
  // Test pattern
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx,cjs,mjs}"],
  
  // Test timeout (milliseconds)
  testTimeout: 15000,

  // Use our ESM-compatible setup file
  setupFilesAfterEnv: ['<rootDir>/test/jest.esm.setup.js'],
  
  // Avoid automocking
  automock: false,

  // Make sure globals are properly defined
  globals: {
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
  }
};
