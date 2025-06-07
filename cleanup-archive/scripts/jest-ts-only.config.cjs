/**
 * Specialized Jest configuration for TypeScript tests
 * Focuses on fixing module resolution and ESM/CommonJS compatibility
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use Node.js environment
  testEnvironment: "node",
  
  // Target TypeScript tests
  testMatch: [
    "<rootDir>/test/**/*.test.ts"
  ],
  
  // Ignore problematic patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/swissknife_old/",
  ],
  
  // Use Babel for transforming TypeScript
  transform: {
    "^.+\\.tsx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ],
        plugins: [
          ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }]
        ]
      }
    ]
  },
  
  // Improve module resolution
  moduleNameMapper: {
    // Map .js imports in TypeScript files to the TypeScript source
    "^(.*)\\.js$": "$1",
    // Add common module mappings
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock critical modules 
    "^../../../src/models/registry.js$": "<rootDir>/test/mocks/models/registry.js"
  },
  
  // Explicitly include TypeScript files
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  
  // Settings to help with ESM
  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es)/)"
  ],
  
  // Extended timeout for slower tests
  testTimeout: 15000,
};
