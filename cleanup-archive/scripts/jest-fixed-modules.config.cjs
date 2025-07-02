// Custom Jest configuration with module resolution fixes
const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  // Use standard test matching
  testMatch: [
    "<rootDir>/test/**/*.test.(ts|js|tsx|jsx)"
  ],
  
  // Transform TypeScript files
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
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // Module name mapper to handle various extension scenarios
  moduleNameMapper: {
    // Handle both .js and lack of extension in imports
    "^(.*)\\.js$": "$1",
    // Map src and test directories for simpler imports
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  
  // Additional module directories
  modulePaths: [
    "<rootDir>",
    path.resolve(__dirname),
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'test')
  ],
  
  // Help Jest find node_modules and test directories
  moduleDirectories: ["node_modules", "src", "test", "test/mocks", "test/utils", "."],
  
  // Supported file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  
  // Test environment
  testEnvironment: "node",
  
  // Extended timeout for async tests
  testTimeout: 30000,
  
  // Setup files - if needed
  // setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  
  // Make test output more verbose for better diagnosis
  verbose: true,
  
  // Optional coverage settings - uncomment if needed
  // collectCoverage: true,
  // collectCoverageFrom: ["<rootDir>/src/**/*.{ts,js}", "!**/node_modules/**"],
  // coverageDirectory: "<rootDir>/coverage"
};
