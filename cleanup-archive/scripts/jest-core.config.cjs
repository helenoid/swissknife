/**
 * Jest configuration for core functionality tests
 * Excludes CLI and UI components to focus on core integrations
 */

const baseConfig = require('./jest.config.cjs');
const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  // Only test core functionality
  testMatch: [
    // Include all unit tests except UI/CLI
    "<rootDir>/test/unit/**/*.test.(ts|tsx|js|jsx)",
    "<rootDir>/test/integration/**/*.test.(ts|tsx|js|jsx)",
  ],
  // Exclude UI and CLI tests
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/test/e2e/",
    "/test/examples/",
    "/test/benchmark/",
    "/test/web_/",
    "/test/unit/cli/",
    "/test/unit/ux/",
    "/test/integration/cli-models/",
    "/test/unit/entrypoints/",
    "/test/web_platform_tests/",
    "/test/web_audio_tests/"
  ],
  // Transform configuration from base config is maintained
  // Increased timeout for integration tests
  testTimeout: 60000,
  
  // Additional configuration for module resolution
  modulePaths: [
    "<rootDir>",
    path.resolve(__dirname),
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'test')
  ],
  
  // Enhanced module directories to include root and specific directories
  moduleDirectories: ["node_modules", "src", "test", "test/mocks", "test/utils", "."],
  
  // Verbose logging to see where modules are loaded from
  verbose: true,
  
  // Mock modules that might be causing issues
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Add any additional module mappings
    "^lodash-es$": "lodash",
    "^lodash-es/(.*)$": "lodash/$1",
    
    // Common mocks for all relative paths
    "command-registry\\.js$": "<rootDir>/test/mocks/command-registry.js",
    "mcp-client\\.js$": "<rootDir>/test/utils/mockMCPClient.js",
    "models/registry\\.js$": "<rootDir>/test/mocks/models/registry.js",
    
    // Fix specific module resolution issues with explicit paths
    "^../../../src/command-registry.js$": "<rootDir>/test/mocks/command-registry.js",
    "^../../../src/command-registry$": "<rootDir>/test/mocks/command-registry.js",
    "^../../../../src/command-registry.js$": "<rootDir>/test/mocks/command-registry.js",
    "^./command-registry.js$": "<rootDir>/test/mocks/command-registry.js",
    
    "^../../../src/storage/ipfs/mcp-client.js$": "<rootDir>/test/utils/mockMCPClient.js",
    "^../../../src/storage/ipfs/mcp-client$": "<rootDir>/test/utils/mockMCPClient.js",
    "^../../src/storage/ipfs/mcp-client.js$": "<rootDir>/test/utils/mockMCPClient.js",
    "^./mcp-client.js$": "<rootDir>/test/utils/mockMCPClient.js",
    
    // Model registry mocks
    "^../../../src/models/registry.js$": "<rootDir>/test/mocks/models/registry.js",
    "^../../../src/models/registry$": "<rootDir>/test/mocks/models/registry.js",
    "^../../../../src/models/registry.js$": "<rootDir>/test/mocks/models/registry.js",
    "^./registry.js$": "<rootDir>/test/mocks/models/registry.js",
    "^./models/registry.js$": "<rootDir>/test/mocks/models/registry.js",
    
    // Chai stub
    "chai$": "<rootDir>/test/mocks/stubs/chai-stub.js",
    
    // Resolve source paths with absolute imports
    "^src/(.*)$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1"
  },
  
  // Setup the environment variable for test mode
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Make sure chai is mocked properly
  setupFilesAfterEnv: [
    '<rootDir>/test/jest.setup.js',
    '<rootDir>/test/jest.enhanced-setup.js'
  ]
};
