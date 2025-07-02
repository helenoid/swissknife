// jest.react.config.cjs
/**
 * Jest configuration specifically for React/TypeScript component tests
 * This addresses the issues with the ModelSelector test and similar component tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use Node.js environment for component testing
  testEnvironment: 'node',
  
  // Increase timeout for slow tests
  testTimeout: 60000,
  
  // Configure Haste module mapper to avoid collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Transform configuration using Babel
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
          "@babel/plugin-transform-modules-commonjs",
          ["@babel/plugin-proposal-decorators", { "legacy": true }],
          ["@babel/plugin-proposal-class-properties", { "loose": true }]
        ]
      }
    ]
  },
  
  // Don't transform these modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|ink.*|chalk|@modelcontextprotocol|react-is)/)",
  ],
  
  // Module resolution
  moduleNameMapper: {
    // Handle CSS/SCSS imports
    "\\.(css|scss)$": "<rootDir>/test/mocks/stubs/style-mock.js",
    // Handle image imports
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/mocks/stubs/file-mock.js",
    // Ensure proper path resolution for modules
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1"
  },
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/unified-setup.js"],

  // Use CommonJS modules for Jest compatibility
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Module file extensions to look for
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  
  // Print setup info for diagnostics
  verbose: true
};
