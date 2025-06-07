// Specialized Jest configuration for error handling tests
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  testMatch: [
    '**/test/unit/utils/errors/error-handling.simple.test.js',
    '**/test/unit/utils/errors/error-handling.fixed.test.js'
  ],
  moduleNameMapper: {
    "^lodash-es$": "lodash",
    "^@/(.*)$": "<rootDir>/src/",
    "^@test/(.*)$": "<rootDir>/test/"
  },
  moduleFileExtensions: ['js', 'ts', 'json'],
  verbose: true,
  testTimeout: 10000,
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.js']
};
