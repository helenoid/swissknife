/**
 * Ultra-simplified Jest configuration to bypass Haste issues
 */

module.exports = {
  testEnvironment: 'node',
  
  // Completely disable haste
  haste: false,
  
  // Use watchman false to avoid file watching issues
  watchman: false,
  
  // Very specific test matching
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.test.ts'
  ],
  
  // Aggressive ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-test/',
    '/swissknife_old/',
    '/test-diagnostics',
    '/goose/',
    '/ipfs_accelerate_js/',
    'package.json'
  ],
  
  // Minimal transform
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      isolatedModules: true,
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          strict: false,
          skipLibCheck: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true
        }
      }
    }],
    '^.+\\.js$': 'babel-jest'
  },
  
  // Clear module cache
  clearMocks: true,
  restoreMocks: true,
  
  // Timeout
  testTimeout: 10000,
  
  // No coverage for now
  collectCoverage: false,
  
  // Cache disabled
  cache: false,
  
  // Verbose for debugging
  verbose: true
};
