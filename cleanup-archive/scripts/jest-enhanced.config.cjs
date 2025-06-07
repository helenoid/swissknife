/**
 * Enhanced unified Jest configuration for SwissKnife
 * 
 * Features:
 * - Compatible with both ESM and CommonJS modules
 * - Proper path resolution for TypeScript and JavaScript files
 * - Extended transformers for special file types
 * - Handles mixed module system environments
 */

const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Increased timeout for async operations
  testTimeout: 30000,

  // Test files pattern
  testMatch: ['<rootDir>/test/**/*.test.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Transform
  transform: {
    "^.+\\.(js|jsx|mjs)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }]
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ],
    "^.+\\.(ts|tsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },

  // Module name mappers for import resolution
  moduleNameMapper: {
    // Handle .js extension in imports (for ESM compatibility)
    "^(.*)\\.js$": "$1",
    // Map direct src imports
    "^@/(.*)$": "<rootDir>/src/$1",
    // Handle potential prefix
    "^@swissknife/(.*)$": "<rootDir>/src/$1",
  },

  // Additional module directories and paths
  modulePaths: ["<rootDir>", "<rootDir>/src", "<rootDir>/test"],
  moduleDirectories: ["node_modules", "src", "test", "."],

  // Extension handling
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/enhanced-setup.js"],

  // Coverage
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!**/__mocks__/**",
    "!**/node_modules/**"
  ],

  // Make test output more verbose for better diagnosis
  verbose: true,

  // Use a custom resolver if needed
  // resolver: "<rootDir>/test/enhanced-resolver.js",
};
