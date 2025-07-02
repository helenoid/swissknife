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
