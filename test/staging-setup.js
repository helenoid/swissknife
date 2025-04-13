/**
 * Staging environment setup for Jest tests
 * 
 * This file configures the testing environment for staging tests,
 * setting appropriate environment variables and mocks.
 */

// Set environment to staging
process.env.NODE_ENV = 'staging';

// Set staging-specific environment variables
process.env.API_URL = process.env.STAGING_API_URL || 'https://api.staging.example.com';
process.env.API_KEY = process.env.STAGING_API_KEY || 'test-api-key';
process.env.LOG_LEVEL = 'debug';
process.env.VERBOSE = 'true';

// Increase timeout for all tests in staging
jest.setTimeout(30000);

console.log('Running tests in STAGING environment');
console.log(`API URL: ${process.env.API_URL}`);