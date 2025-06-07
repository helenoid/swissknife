/**
 * Jest configuration for BaseAIAgent tests (CommonJS version)
 */

module.exports = {
  // Use common Jest settings
  testEnvironment: 'node',
  verbose: true,
  
  // Setup module name mapper for @ alias and file extensions
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../../../src/(.*)$': '<rootDir>/src/$1',
  },
  
  // Add transforms for TypeScript files
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  
  // Set module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Configure test paths for BaseAIAgent test
  testMatch: ['<rootDir>/test/unit/ai/agent/base-agent-simple.test.js'],
  
  // Mock configurations
  setupFiles: ['<rootDir>/test/unit/ai/agent/setupTests.js'],
  
  // Set up module directories for Node to resolve modules
  moduleDirectories: ['node_modules', 'src'],
  
  // Configure roots for better module resolution
  roots: ['<rootDir>/src', '<rootDir>/test'],
  
  // Set up coverage collection
  collectCoverageFrom: [
    'src/ai/agent/base-agent.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  
  // Setup Jest's handling of ESM vs CommonJS
  transformIgnorePatterns: ['/node_modules/(?!uuid)'],
  
  // Set test timeout
  testTimeout: 30000,
};
