/**
 * Modern focused Jest configuration
 * Designed specifically for the core failing tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  
  // Disable cache for fresh runs
  cache: false,
  
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
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },
  
  // Don't transform node_modules with ES modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|ink.*|chalk)/)"
  ],
  
  // Module resolution
  moduleNameMapper: {
    // Handle CSS imports
    "\\.(css|scss)$": "<rootDir>/test/mocks/stubs/style-mock.js",
    // Handle image imports
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/mocks/stubs/file-mock.js",
  },
  
  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/setup-jest.js"]
};
