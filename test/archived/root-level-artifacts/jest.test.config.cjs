/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/test/jest-simple-setup.js'],
  testMatch: [
    '**/test/**/*.test.[jt]s',
    '**/test/**/*.test.[jt]sx'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false,
      tsconfig: 'tsconfig.jest.json'
    }],
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testTimeout: 10000,
  maxWorkers: 1,
  verbose: true,
  collectCoverage: false,
  passWithNoTests: true
};
