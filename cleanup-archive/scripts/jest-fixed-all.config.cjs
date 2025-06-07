/**
 * Robust Jest configuration for SwissKnife project
 */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test matching pattern
  testMatch: ['<rootDir>/test/**/*.test.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Transform with babel
  transform: {
    "^.+\\.(js|jsx|mjs)$": ["babel-jest", {
      presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }],
    "^.+\\.(ts|tsx)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }]
  },
  
  // Module resolution
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  
  // Increased timeout
  testTimeout: 30000,
  
  // Setup file
  setupFilesAfterEnv: ["<rootDir>/test/setup-jest-all.js"],
  
  // Enable verbose output
  verbose: true
};
