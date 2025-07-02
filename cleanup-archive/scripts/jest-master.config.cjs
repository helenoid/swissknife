/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Longer timeout for slow tests
  testTimeout: 60000,
  
  // Haste configuration to avoid naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Transform configuration
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
  
  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module resolution
  moduleNameMapper: {
    // Handle .js extensions in imports
    "^(.*)\\.js$": "$1",
    // Handle path aliases
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  
  // Module directories
  moduleDirectories: ["node_modules", "<rootDir>/src", "<rootDir>/test"],
  
  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Path patterns to ignore
  modulePathIgnorePatterns: [
    "<rootDir>/swissknife_old",
    "<rootDir>/node_modules"
  ],
  
  // Enable verbose output
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/helpers/jest-master-setup.js']
};
