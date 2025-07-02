/**
 * Unified Jest configuration for SwissKnife project
 * Handles both ESM and CommonJS modules properly
 */

/** @type {import('jest').Config} */
module.exports = {
  // Basic test configuration
  testEnvironment: 'node',
  
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
  
  // Module resolution helpers
  moduleNameMapper: {
    // Handle both .js and lack of extension in imports
    "^(.*)\\.js$": "$1",
    // Map src and test directories for simpler imports
    "^@/(.*)$": "<rootDir>/src/$1"
  },

  // Additional module directories and paths
  modulePaths: ["<rootDir>", "<rootDir>/src", "<rootDir>/test"],
  moduleDirectories: ["node_modules", "src", "test", "."],
  
  // Extension handling
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  
  // Setup for tests
  setupFilesAfterEnv: ["<rootDir>/test/setup-jest.js"],
  
  // Make test output more verbose for better diagnosis
  verbose: true,
};
