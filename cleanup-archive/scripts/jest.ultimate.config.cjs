/** @type {import('jest').Config} */
module.exports = {
  // Test environment and matching
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Increased timeout
  testTimeout: 60000,
  
  // Transform configuration
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
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
    "^(.*)\\.js$": "$1",
    "^lodash-es$": "lodash",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Handle potential ESM imports in tests
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  
  // Module directories and extensions
  moduleDirectories: ["node_modules", "src", "test"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/ultimate-setup.js"],
  
  // Haste configuration
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Run tests one at a time to avoid resource contention
  maxConcurrency: 1,
  
  // Explicitly set testEnvironmentOptions to avoid issues with TextEncoder
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  
  // Verbose output
  verbose: true
};
