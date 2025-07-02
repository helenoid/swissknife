/** @type {import('jest').Config} */
module.exports = {
  // Use node environment for tests
  testEnvironment: 'node',
  
  // Verbose output for debugging
  verbose: true,
  
  // Increased timeout for slow tests
  testTimeout: 30000,
  
  // Handle Haste module naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Skip transforming to avoid ESM/CJS issues
  transform: {},
  
  // Ignore problematic directories
  modulePathIgnorePatterns: [
    'swissknife_old',
    'node_modules'
  ]
};
