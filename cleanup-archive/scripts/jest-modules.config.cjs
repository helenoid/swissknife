/**
 * Jest configuration for testing all modules
 * This configuration properly handles TypeScript and JavaScript files
 * and sets up the correct module resolution.
 */
module.exports = {
  // Use a NodeJS environment for tests
  testEnvironment: 'node',
  
  // Look for test files in these directories
  roots: ['<rootDir>/test'],
  
  // Tell Jest to recognize these file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Use ts-jest for TypeScript files
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Configure ts-jest
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      diagnostics: {
        warnOnly: true
      }
    }
  },
  
  // Setup proper module resolution for ESM and CommonJS
  moduleNameMapper: {
    // Handle module imports
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Use CommonJS for test files to avoid ESM compatibility issues
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel/runtime|@babel/runtime-corejs3)/)'
  ],
  
  // Pattern for test files
  testMatch: [
    '**/test/**/*.test.ts',
    '**/test/**/*.test.js'
  ],
  
  // Setup test coverage reporting
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts'
  ],
  
  // Allow ESM modules but with CommonJS interoperability
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Make sure mocks are reset between tests
  restoreMocks: true,
  resetMocks: false,
  
  // Helps avoid path issues with ESM imports
  modulePathIgnorePatterns: [],
  
  // Use a setup file to configure Jest environment
  setupFilesAfterEnv: ['<rootDir>/test/helpers/setup-jest.js'],
  
  // Helpful info on test failures
  verbose: true,
  
  // Allow extended timeout for slow tests
  testTimeout: 15000
};
