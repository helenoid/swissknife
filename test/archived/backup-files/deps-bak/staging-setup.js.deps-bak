/**
 * Jest Global Setup Script for Staging Environment Tests
 *
 * This script runs before Jest executes tests configured for the 'staging' environment
 * (likely specified via `setupFilesAfterEnv` in `jest.staging.config.js`).
 * It sets environment variables to point tests towards staging resources
 * and configures test behavior like timeouts.
 */

// Define constants for environment variable names
const NODE_ENV_VAR = 'NODE_ENV';
const API_URL_VAR = 'API_URL';
const API_KEY_VAR = 'API_KEY';
const LOG_LEVEL_VAR = 'LOG_LEVEL';
const VERBOSE_VAR = 'VERBOSE';

// Staging-specific environment variable names (if different)
const STAGING_API_URL_VAR = 'STAGING_API_URL';
const STAGING_API_KEY_VAR = 'STAGING_API_KEY';

// --- Environment Setup ---

// 1. Set NODE_ENV to 'staging'
// This might be used by application code to load staging-specific configurations.
process.env[NODE_ENV_VAR] = 'staging';

// 2. Set API endpoint for staging tests
// Uses a specific staging environment variable if provided, otherwise falls back to a default staging URL.
process.env[API_URL_VAR] = process.env[STAGING_API_URL_VAR] || 'https://api.staging.example.com';

// 3. Set API key for staging tests
// Uses a specific staging environment variable if provided, otherwise falls back to a default test key.
// IMPORTANT: Avoid committing real staging keys here. Use environment variables in CI/local setup.
process.env[API_KEY_VAR] = process.env[STAGING_API_KEY_VAR] || 'test-staging-api-key'; // Changed default slightly

// 4. Set log level for tests (e.g., 'debug' for more verbose test output)
process.env[LOG_LEVEL_VAR] = 'debug';

// 5. Set verbosity flag (if used by the application or tests)
process.env[VERBOSE_VAR] = 'true';

// --- Jest Configuration ---

// Increase the default timeout for all tests run with this setup.
// Staging environments might be slower or have higher network latency.
const STAGING_TEST_TIMEOUT_MS = 30000; // 30 seconds
jest.setTimeout(STAGING_TEST_TIMEOUT_MS);

// --- Logging ---

// Log confirmation that the staging setup is running
console.log(`Jest setup: Running tests in STAGING environment (NODE_ENV=${process.env[NODE_ENV_VAR]})`);
console.log(`Jest setup: API URL set to ${process.env[API_URL_VAR]}`);
console.log(`Jest setup: Default test timeout set to ${STAGING_TEST_TIMEOUT_MS}ms`);
