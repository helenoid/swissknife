/**
 * Jest configuration for focused BaseAIAgent tests
 */

module.exports = {
  // Use node test environment
  testEnvironment: 'node',
  
  // Basic setup for running single test file
  verbose: true,
  
  // Specific tests to run
  testMatch: [
    '<rootDir>/test/unit/ai/agent/focused-agent-test.js',
    '<rootDir>/test/unit/utils/logging/integrated-manager.test.js',
    '<rootDir>/test/unit/utils/logging/manager.simple.test.js'
  ],
  
  // Use CommonJS for these tests
  transformIgnorePatterns: ['/node_modules/(?!(uuid|lodash-es))'],
  
  // Transform setup for JS & TS files
  transform: {
    "^.+\\.[jt]s$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ]
    }]
  },
  
  // Module handling
  moduleDirectories: ['node_modules'],
  
  // Important: jest-environment-node doesn't support ESM yet
  // so we're using these settings for compatibility
  testRegex: [],
  
  // Disable ESM handling for these tests
  extensionsToTreatAsEsm: []
}
