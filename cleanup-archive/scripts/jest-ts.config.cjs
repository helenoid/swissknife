/**
 * Jest configuration for TypeScript-based tests
 * Optimized for SwissKnife core functionality
 */

const baseConfig = require('./jest-core.config.cjs');
const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  
  // Test only TypeScript test files
  testMatch: [
    "<rootDir>/test/**/*.test.ts"
  ],
  
  // Extend the TypeScript configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-proposal-class-properties",
          "@babel/plugin-proposal-object-rest-spread"
        ]
      }
    ],
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }]
        ]
      }
    ]
  },
  
  // Additional TS-specific module mapper
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Fix TypeScript specific imports
    "^(.*)\\.js$": "$1"
  },
  
  // Help TypeScript find the right modules
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};
