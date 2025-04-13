/** @type {import('jest').Config} */
export default {
  // Extend the main Jest configuration
  preset: './jest.config.js',
  
  // Override settings for staging tests
  testEnvironment: "node",
  
  // Only run e2e tests in staging environment
  testMatch: ["<rootDir>/test/e2e/**/*.test.{js,jsx,ts,tsx}"],
  
  // Set timeout higher for staging tests that might be slower
  testTimeout: 30000,
  
  // Add environment variables for staging
  setupFiles: ["<rootDir>/test/staging-setup.js"],
  
  // Different coverage threshold for staging tests
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  }
};