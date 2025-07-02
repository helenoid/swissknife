/**
 * Jest configuration for the SwissKnife project
 * 
 * This configuration file addresses various issues with testing, including:
 * - ESM/CommonJS compatibility
 * - lodash-es module transformation
 * - File extensions and module resolution
 * - Comprehensive code coverage reporting
 * - Phase-specific test configuration
 */

/** @type {import('jest').Config} */
module.exports = {
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
    // Transform lodash-es which uses ESM
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
    "lodash-es": "lodash",
    
    // Handle missing modules by providing mocks
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    "chai": "<rootDir>/test/mocks/stubs/chai-stub.js"
  },
  
  // Test environment setup
  testEnvironment: "node",
  
  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/entrypoints/**",
    // Include all phase implementations
    "src/cli-phase*.ts",
    "src/phase*/**/*.{js,jsx,ts,tsx}",
  ],
  
  // Coverage thresholds to enforce
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    },
    "src/phase1/**/*.{js,jsx,ts,tsx}": {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    },
    "src/phase5/**/*.{js,jsx,ts,tsx}": {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    },
    "src/core/**/*.{js,jsx,ts,tsx}": {
      statements: 85,
      branches: 75,
      functions: 85,
      lines: 85
    }
  },
  
  // Mocking configuration
  automock: false,
  
  // Module resolution
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  
  // Test paths
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx}"],
  
  // Test timeout (milliseconds)
  testTimeout: 15000,
  
  // Coverage reporting
  coverageReporters: ["text", "lcov", "html", "json", "json-summary"],
  coverageDirectory: "<rootDir>/coverage",
  
  // Test results processor
  testResultsProcessor: process.env.CI ? "jest-junit" : undefined,
  
  // In case of Node.js internals mocking
  globals: {
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
  }
};
