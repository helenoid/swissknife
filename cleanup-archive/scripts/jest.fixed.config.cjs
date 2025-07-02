// jest.fixed.config.cjs
/**
 * Fixed Jest Configuration for SwissKnife
 * 
 * This configuration has been fixed to address module resolution, ESM/CommonJS compatibility,
 * and proper handling of mock implementations.
 */

/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 60000,
  
  // Handle Haste module naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },

  // Transform configuration for JS/TS files
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest", 
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
        ],
        plugins: ["@babel/plugin-transform-modules-commonjs"]
      }
    ]
  },
  
  // Transform node_modules with ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module resolution
  moduleNameMapper: {
    // Handle .js extensions in imports from TypeScript
    "^(.*)\\.js$": "$1",
    // Handle lodash-es imports
    "^lodash-es$": "lodash"
  },
  
  // Module directories and extensions
  moduleDirectories: ["node_modules", "src", "test"],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Ignore problematic directories
  modulePathIgnorePatterns: ["swissknife_old"],
  
  // Setup file for global Jest configuration - use a more robust setup file
  setupFilesAfterEnv: ["<rootDir>/test/fixed-test-setup.js"],
  
  // Explicitly set testEnvironmentOptions to avoid issues with TextEncoder
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
