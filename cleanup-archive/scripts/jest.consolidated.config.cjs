/**
 * Consolidated Jest configuration combining all fixes for SwissKnife tests
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
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ],
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-object-rest-spread'
        ]
      }
    ]
  },
  
  // Run tests one at a time to avoid conflicts
  maxConcurrency: 1,
  
  // Module name resolution with comprehensive mapping
  moduleNameMapper: {
    // Handle ESM imports in CommonJS
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(.+)\\.js$': '$1',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Module directories and extensions
  moduleDirectories: ['node_modules', 'src', 'test'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/fixed-jest-setup.js'],
  
  // Handle React testing for components
  testEnvironmentOptions: {
    url: "http://localhost/"
  },
  
  // Haste configuration to avoid module collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/**/types.{js,ts}'
  ],
  
  // Transform certain node_modules that use ESM
  transformIgnorePatterns: [
    '/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)'
  ],
  
  // Environment options for TextEncoder
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
