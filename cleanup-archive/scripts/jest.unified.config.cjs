/** @type {import('jest').Config} */

const config = {
  // Prevent haste module naming collisions
  haste: {
    // Ignore Haste for these patterns
    hasteImplModulePath: null,
  },
  // Disable watchman to prevent conflicts with symlinks
  watchman: false,
  // The root of the project
  rootDir: '.',
  
  // Test environment
  testEnvironment: 'node',
  
  // Test patterns
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  // File extensions to consider
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Explicitly transform JSX/TSX/JS/TS files with babel-jest and ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
        diagnostics: false,
        isolatedModules: true
      }
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Use TypeScript-specific setup for TS tests
  setupFilesAfterEnv: ['<rootDir>/test/typescript-jest-setup.js'],
  
  // Module name mapper to handle various module formats and aliases
  moduleNameMapper: {
    // Handle chai imports
    '^chai$': '<rootDir>/test/mocks/stubs/chai-enhanced.js',
    
    // Handle React and Ink imports for components
    '^react$': '<rootDir>/node_modules/react',
    '^ink$': '<rootDir>/node_modules/ink',
    
    // Handle lodash-es imports
    '^lodash-es$': 'lodash',
    
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Handle helpers and utilities
    '^../helpers/testUtils$': '<rootDir>/test/helpers/universal-testUtils.js',
    '^./helpers/testUtils$': '<rootDir>/test/helpers/universal-testUtils.js',
    '^test/helpers/testUtils$': '<rootDir>/test/helpers/universal-testUtils.js'
  },
  
  // Don't treat TypeScript files as ESM by default since we're using ts-jest with commonjs
  // extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Add ts-jest preset for typescript handling
  preset: 'ts-jest',
  
  // Increase the test timeout to handle potentially slow tests
  testTimeout: 30000,
  
  // Use verbose output for detailed test results
  verbose: true,
  
  // Collect coverage reports
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  
  // Use default coverage reporters
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // Global test settings
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  
  // Test runner settings
  testRunner: 'jest-circus/runner',
};

module.exports = config;
