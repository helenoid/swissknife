// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
// Mock temp directory helpers
const createTempTestDir = jest.fn().mockImplementation((name) => `/tmp/test-${name}-${Date.now()}`);
const removeTempTestDir = jest.fn().mockImplementation(async (dir) => Promise.resolve());
/**
 * Setup file for Jest tests
 * This file is loaded before every test file to:
 * 1. Setup global test environment
 * 2. Mock any required global dependencies
 * 3. Provide helper utilities for tests
 */

// Set test environment properties
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in test output
if (process.env.SUPPRESS_CONSOLE_OUTPUT === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    // Keep error for test debugging
    error: console.error
  };
}

// Create helper for directory creation/cleanup
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to ensure temporary directories exist
function ensureTempDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// Setup temp directories for tests
const tempBaseDir = path.join(os.tmpdir(), 'swissknife-tests');
ensureTempDir(tempBaseDir);

// Create test utils setup
global.testUtils = {
  tempBaseDir,
  
  // Create a temporary directory for tests
  createTempTestDir: (prefix) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const dirName = `temp-test-dir-${timestamp}-${randomId}`;
    const dirPath = path.join(tempBaseDir, dirName);
    
    ensureTempDir(dirPath);
    return dirPath;
  },
  
  // Remove a temporary test directory
  removeTempTestDir: (dirPath) => {
    if (fs.existsSync(dirPath) && dirPath.includes('temp-test-dir')) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  },
  
  // Clean up all temporary test directories
  cleanupAllTempDirs: () => {
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
      ensureTempDir(tempBaseDir);
    }
  }
};

// Setup afterAll to clean up resources
afterAll(() => {
  if (process.env.CLEANUP_TEST_DIRS === 'true') {
    global.testUtils.cleanupAllTempDirs();
  }
});
