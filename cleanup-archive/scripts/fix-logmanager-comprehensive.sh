#!/bin/bash
#
# Comprehensive LogManager Fix
#
# This script fixes the LogManager implementation and its associated tests
# by addressing import path issues and assertion style problems.

# Set script to exit on error
set -e

echo "Starting comprehensive LogManager fix..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# 1. Fix LogManager implementation
echo "Fixing LogManager implementation..."

# Make sure LogManager has proper export compatibility
if ! grep -q "exports.__esModule" src/utils/logging/manager.js; then
  # Add ESM export compatibility
  sed -i 's/module.exports = { LogManager };/module.exports = { LogManager };\n\n\/\/ Add ESM export compatibility\nif (typeof exports !== '"'"'undefined'"'"') {\n  Object.defineProperty(exports, "__esModule", { value: true });\n  exports.LogManager = LogManager;\n}/' src/utils/logging/manager.js
  echo "Added ES Module compatibility to LogManager"
fi

# 2. Create CommonJS test utilities
echo "Creating CommonJS test utilities..."
cat > test/helpers/testUtils.cjs << 'EOF'
/**
 * CommonJS version of test utilities for SwissKnife testing
 */
const path = require('path');
const fs = require('fs/promises');
const os = require('os');

/**
 * Creates a temporary directory for test files
 */
async function createTempTestDir(prefix = 'swissknife-test-') {
    const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
}

/**
 * Removes a temporary test directory
 */
async function removeTempTestDir(tempDir) {
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
    catch (error) {
        // Ignore errors (e.g., if directory doesn't exist)
        console.warn(`Warning: Could not remove temp directory ${tempDir}:`, error);
    }
}

/**
 * Creates a temporary configuration file for testing
 */
async function createTempConfigFile(config) {
    const tempDir = await createTempTestDir();
    const configPath = path.join(tempDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return configPath;
}

module.exports = {
    createTempTestDir,
    removeTempTestDir,
    createTempConfigFile
};
EOF

# 3. Create fixed LogManager test
echo "Creating fixed LogManager test..."
cat > test/unit/utils/logging/manager.test.js << 'EOF'
/**
 * Unit tests for LogManager
 */

const path = require('path');
const { LogManager } = require('../../../../src/utils/logging/manager');
const testUtils = require('../../../helpers/testUtils.cjs');

// Set up Jest globals
const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');

describe('LogManager', () => {
  let logManager;
  let tempDir;
  let logFilePath;
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await testUtils.createTempTestDir();
    logFilePath = path.join(tempDir, 'test.log');
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await testUtils.removeTempTestDir(tempDir);
  });
  
  beforeEach(() => {
    // Reset singleton
    LogManager.instance = null;
    
    // Create new instance with test configuration
    logManager = LogManager.getInstance({
      logFilePath,
      level: 'debug',
      console: true,
      file: true
    });
    
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  // Basic tests
  it('should create a singleton instance', () => {
    expect(logManager).toBeDefined();
    expect(LogManager.getInstance()).toBe(logManager);
  });

  it('should log at error level', () => {
    logManager.error('Test error message');
    expect(console.error).toHaveBeenCalledWith('Test error message');
  });

  it('should log at warn level', () => {
    logManager.warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith('Test warning message');
  });

  it('should log at info level', () => {
    logManager.info('Test info message');
    expect(console.info).toHaveBeenCalledWith('Test info message');
  });

  it('should log at debug level', () => {
    logManager.debug('Test debug message');
    expect(console.debug).toHaveBeenCalledWith('Test debug message');
  });

  it('should respect log level settings', () => {
    // Set to info level, debug shouldn't show
    LogManager.instance = null;
    logManager = LogManager.getInstance({
      logFilePath,
      level: 'info',
      console: true
    });
    
    logManager.debug('Debug message');
    logManager.info('Info message');
    
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith('Info message');
  });
});
EOF

# 4. Create specialized Jest configuration
echo "Creating specialized Jest configuration..."
cat > jest-logmanager-fix.config.cjs << 'EOF'
/**
 * Fixed Jest configuration for LogManager test
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use node environment
  testEnvironment: "node",
  
  // Only run LogManager tests
  testMatch: ["<rootDir>/test/unit/utils/logging/manager.test.js"],
  
  // Increased timeout for tests
  testTimeout: 30000
};
EOF

# 5. Run the tests to verify
echo "Running LogManager tests to verify fix..."
npx jest --config=jest-logmanager-fix.config.cjs

# 6. Try with the default Jest configuration
echo "Running LogManager tests with default Jest configuration..."
npx jest test/unit/utils/logging/manager.test.js

echo "Comprehensive LogManager fix completed successfully!"
