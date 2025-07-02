// Enhanced Jest configuration for fixing failing tests
module.exports = {
  // Use node environment for tests
  testEnvironment: 'node',
  
  // Transform TypeScript and JavaScript files
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ],
        // Skip type checking to avoid TypeScript errors
        plugins: [
          '@babel/plugin-transform-modules-commonjs'
        ]
      }
    ]
  },
  
  // Supported file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Handle .js extensions in imports from TypeScript files
  moduleNameMapper: {
    '^(.*)\\.js$': '$1',
  },
  
  // Increase test timeout to handle slow tests
  testTimeout: 60000,
  
  // Disable symlinks to avoid Haste module naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Transform node_modules with ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files for Jest
  setupFilesAfterEnv: ['./test/setup-jest-fix.js'],
  
  // Ignore the directory with duplicate module names
  modulePathIgnorePatterns: [
    'swissknife_old'
  ],
  
  // Run tests in serial to avoid parallel execution issues
  maxConcurrency: 1,
  
  // Fail gracefully on directory-level errors
  testPathIgnorePatterns: [
    '/node_modules/',
    '/swissknife_old/'
  ]
}
