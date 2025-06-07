// Jest configuration for error handling tests
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  testMatch: ['**/test/unit/utils/errors/**/*.test.(js|ts)'],
  moduleNameMapper: {
    "^lodash-es$": "lodash"
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  verbose: true,
  testTimeout: 10000
};
