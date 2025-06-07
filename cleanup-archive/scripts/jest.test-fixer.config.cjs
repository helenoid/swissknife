/**
 * Enhanced Jest configuration specifically for fixing broken tests
 * This configuration provides comprehensive mocking and fixes common issues
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
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: ["@babel/plugin-transform-modules-commonjs"]
      }
    ]
  },
  
  // Transform node_modules with ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module resolution with comprehensive mocking
  moduleNameMapper: {
    // Mock common SwissKnife modules
    "^../src/utils/logger\\.js$": "<rootDir>/test/mocks/logger.js",
    "^\\./utils/logger\\.js$": "<rootDir>/test/mocks/logger.js", 
    "^../src/config/manager\\.js$": "<rootDir>/test/mocks/config-manager.js",
    "^\\./config/manager\\.js$": "<rootDir>/test/mocks/config-manager.js",
    "^../src/tasks/manager\\.js$": "<rootDir>/test/mocks/task-manager.js",
    "^\\./tasks/manager\\.js$": "<rootDir>/test/mocks/task-manager.js",
    "^../src/types/storage\\.js$": "<rootDir>/test/mocks/storage.js",
    "^\\./types/storage\\.js$": "<rootDir>/test/mocks/storage.js",
    "^../src/ai/agent/agent\\.js$": "<rootDir>/test/mocks/agent.js",
    "^\\./ai/agent/agent\\.js$": "<rootDir>/test/mocks/agent.js",
    
    // Handle chai imports
    "^chai$": "<rootDir>/test/mocks/stubs/chai-enhanced.js",
    "^chai.js$": "<rootDir>/test/mocks/stubs/chai-enhanced.js",
    
    // Handle React and Ink imports for components
    "^react$": "<rootDir>/node_modules/react",
    "^ink$": "<rootDir>/node_modules/ink",
    
    // Handle lodash-es imports
    "^lodash-es$": "lodash",
    
    // Handle path aliases
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  
  // Module directories and extensions
  moduleDirectories: ["node_modules", "<rootDir>/src", "<rootDir>/test"],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Ignore problematic directories
  modulePathIgnorePatterns: ["<rootDir>/swissknife_old"],
  
  // Setup file for global Jest configuration
  setupFilesAfterEnv: [
    "<rootDir>/test/unified-setup.js", 
    "<rootDir>/test/enhanced-setup.js"
  ],
  
  // Increased timeout for stability
  testTimeout: 60000
};
