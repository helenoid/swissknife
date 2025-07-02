// fixed.phase3.config.cjs
/**
 * Fixed Jest configuration specifically optimized for Phase 3 tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 60000,
  
  // Transform configuration for TypeScript and JavaScript files
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript'
        ],
        plugins: ['@babel/plugin-transform-modules-commonjs']
      }
    ]
  },
  
  // Module name resolution - handle .js extensions in import statements
  moduleNameMapper: {
    '^(.*)\\.(js|ts)$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // This handles .js extensions in import paths for ESM compatibility in CommonJS env
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Module directories and extensions
  moduleDirectories: ['node_modules', 'src', 'test'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Setup files - use our fixed setup file
  setupFilesAfterEnv: ['<rootDir>/test/fixed-jest-setup.js'],
  
  // Handle Haste module naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Run tests one at a time to avoid conflicts
  maxConcurrency: 1,
  
  // Explicitly set testEnvironmentOptions
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  
  // Transform non-standard ESM modules that might be in node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)'
  ]
};
