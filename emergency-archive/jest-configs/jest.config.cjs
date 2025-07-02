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
  haste: {
    enableSymlinks: false
  },

  // Transform configuration
  transform: {
    // Use ts-jest for TypeScript files
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        useESM: true,
      },
    ],
    // Handle JavaScript files with babel-jest
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", {
            targets: { node: "current" },
            modules: 'commonjs'
          }],
          "@babel/preset-react"
        ],
        plugins: [
          "@babel/plugin-transform-class-properties",
          "@babel/plugin-transform-runtime"
        ]
      },
    ],
  },

  // Transform all node_modules including lodash-es and other ESM packages
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],

  // Handle ESM extensions
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],

  // Add module directories to ensure proper resolution
  moduleDirectories: ["node_modules", "<rootDir>/src"],

  // Module name mapping for imports
  moduleNameMapper: {
    // Handle CSS imports for React components
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",

    // Map lodash-es imports to lodash (CommonJS version)
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1",

    // Map nanoid to a mock or stub
    "^nanoid$": "<rootDir>/test/mocks/stubs/nanoid-stub.js",

    // Handle missing modules by providing mocks
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",

    // Mock Node.js fs module for consistent testing
    "^fs$": "<rootDir>/test/mocks/fs-mock.js",
    "^node:fs$": "<rootDir>/test/mocks/fs-mock.js",

    // Handle .js extensions in TypeScript imports for ESM compatibility
    "^(\\..*)\\.js$": "$1",

    // Add mapping for command-registry.js

    // Map relative imports from test directory to src directory
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Test environment setup
  testEnvironment: "node",

  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.js'],

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

  // Ignore dist directory
  modulePathIgnorePatterns: ["<rootDir>/dist/"],

  // Test paths
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx}"],

  // Test timeout (milliseconds)
  testTimeout: 60000, // Increased timeout further

  // Coverage reporting
  coverageReporters: ["text", "lcov", "html", "json", "json-summary"],
  coverageDirectory: "<rootDir>/coverage",

  // Test results processor
  testResultsProcessor: process.env.CI ? "jest-junit" : undefined,

  // In case of Node.js internals mocking
  globals: {
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
  },

  // Watch plugin for better terminal experience
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname"
  ],
};
