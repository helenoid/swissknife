/**
 * Simple TypeScript Jest configuration for running TS tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest', 
      {
        tsconfig: 'tsconfig.test.json',
        isolatedModules: true,
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es)/)"
  ],
  verbose: true
};
