// Mock global config functions
const getGlobalConfig = jest.fn().mockReturnValue({});
const saveGlobalConfig = jest.fn().mockImplementation(() => Promise.resolve());
const addApiKey = jest.fn().mockImplementation(() => Promise.resolve());
/**
 * SwissKnife Jest Test Helper
 * 
 * This module provides utility functions for testing with Jest.
 * It helps address common issues with ES modules, mocking, and testing.
 */

const path = require('path');

/**
 * Create Mock Module
 * 
 * Creates a simple mock implementation for modules that may have import/require issues.
 * 
 * @param {string} modulePath - Path to the module to mock
 * @param {object} mockImplementation - Mock implementation
 */
function createMockModule(modulePath, mockImplementation = {}) {
  jest.mock(modulePath, () => mockImplementation, { virtual: true });
  return jest.requireMock(modulePath);
}

/**
 * Fixes paths for tests that may have relative import issues
 */
function setupPathFixes() {
  // Add common module paths to NODE_PATH
  process.env.NODE_PATH = [
    path.join(process.cwd(), 'src'),
    path.join(process.cwd(), 'test'),
    process.env.NODE_PATH
  ].filter(Boolean).join(path.delimiter);
  
  // Force module path refresh
  require('module').Module._initPaths();
}

/**
 * Setup common mocks for SwissKnife tests
 */
function setupCommonMocks() {
  // Mock config utilities
  createMockModule('../utils/config.js', {
    getCurrentProjectConfig: jest.fn().mockResolvedValue({}),
    saveCurrentProjectConfig: jest.fn().mockResolvedValue(undefined),
    getGlobalConfig: jest.fn().mockResolvedValue({}),
    saveGlobalConfig: jest.fn().mockResolvedValue(undefined),
    getMcprcConfig: jest.fn().mockResolvedValue({})
  });
  
  // Mock logging utilities
  createMockModule('../utils/log.js', {
    logError: jest.fn(),
    logInfo: jest.fn(),
    logDebug: jest.fn(),
    logWarn: jest.fn()
  });
}

module.exports = {
  createMockModule,
  setupPathFixes,
  setupCommonMocks
};
