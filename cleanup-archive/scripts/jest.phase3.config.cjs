// jest.phase3.config.cjs
/**
 * Jest configuration specifically optimized for Phase 3 TypeScript tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 60000,
  
  // Transform configuration for TypeScript files
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
  
  // Module name resolution
  moduleNameMapper: {
    '^(.*)\\.(js|ts)$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Module directories and extensions
  moduleDirectories: ['node_modules', 'src', 'test'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  
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
  }
};
