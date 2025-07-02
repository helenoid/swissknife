// Simplified Jest configuration for error handling tests
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  testMatch: ['**/error-handling-tests.js'],
  moduleNameMapper: {
    "^lodash-es$": "lodash"
  },
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  testTimeout: 10000
};
