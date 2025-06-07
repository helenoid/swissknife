/**
 * Fixed Jest configuration for SwissKnife project
 * This config addresses the main issues causing test failures
 */

module.exports = {
  // Basic test environment
  testEnvironment: 'node',
  
  // Ignore problematic directories that cause Haste collisions
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-test/',
    '/swissknife_old/',
    '/test-diagnostics-.*/',
    '/goose/',
    '/ipfs_accelerate_js/'
  ],
  
  // Only look for tests in the test directory
  testMatch: [
    '<rootDir>/test/**/*.test.{js,ts,tsx}',
    '<rootDir>/test/**/*.spec.{js,ts,tsx}'
  ],
  
  // Ignore these directories completely for module resolution
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/dist-test/',
    '<rootDir>/swissknife_old/',
    '<rootDir>/test-diagnostics-.*/',
    '<rootDir>/goose/',
    '<rootDir>/ipfs_accelerate_js/'
  ],
  
  // Basic TypeScript support
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020', 'dom'],
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: false,
          noImplicitAny: false,
          resolveJsonModule: true
        }
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ]
    }]
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  
  // Module name mapping for common issues
  moduleNameMapper: {
    // Handle .js extensions in TypeScript imports
    '^(\\./.*)\\.js$': '$1',
    '^(\\.\\./.*)\\.js$': '$1',
    
    // Map problematic modules to mocks
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  
  // Transform node_modules that are ESM
  transformIgnorePatterns: [
    '/node_modules/(?!(lodash-es|@modelcontextprotocol)/)'
  ],
  
  // Disable Haste to avoid naming collisions
  haste: {
    enableSymlinks: false,
    computeSha1: false
  },
  
  // Basic coverage
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**'
  ],
  
  // Increased timeout for slow tests
  testTimeout: 30000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Don't cache between runs while debugging
  cache: false,
  
  // Global setup
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true
    }
  }
};
