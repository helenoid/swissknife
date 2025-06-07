// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));

/**
 * Configuration Manager Tests (CommonJS Version)
 * 
 * This test suite uses Jest for testing the ConfigManager
 */
// CommonJS imports
const { z } = require('zod');
const path = require('path');
const fs = require('fs/promises');

// Import our mock implementations
const { ConfigManager } = require('../../mocks/config-manager.mock.cjs');
const { ErrorManager } = require('../../mocks/error-manager.mock.cjs');

// Helper functions for creating and removing temp directories
async function createTempTestDir(prefix) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const dirName = `${prefix}-${timestamp}-${randomId}`;
  const dirPath = path.join('/tmp', dirName);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

// Helper to clean up after tests
async function cleanupTempDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.warn(`Warning: Failed to clean up temp dir ${dirPath}: ${err.message}`);
  }
}

describe('ConfigManager', () => {
  let configDir;
  let configManager;
  let mockErrorManager;
  
  beforeEach(async () => {
    // Create a temp directory for test configs
    configDir = await createTempTestDir('config-manager-test');
    
    // Reset the singleton instances
    ConfigManager.resetInstance();
    ErrorManager.resetInstance();
    
    // Get fresh instances
    configManager = ConfigManager.getInstance();
    mockErrorManager = ErrorManager.getInstance();
    
    // Initialize the config manager with our test directory
    configManager.initialize(configDir);
    
    // Mock fs methods as needed for specific tests
    jest.spyOn(fs, 'writeFile').mockImplementation(async () => {});
    jest.spyOn(fs, 'readFile').mockImplementation(async () => '{}');
  });
  
  afterEach(async () => {
    // Cleanup after tests
    await cleanupTempDir(configDir);
    jest.restoreAllMocks();
  });
  
  describe('Basic Functionality', () => {
    it('should be a singleton', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
    
    it('should initialize with a config directory', () => {
      expect(configManager.getConfigDir()).toBe(configDir);
    });
    
    it('should set and get values', () => {
      // Set config values
      configManager.set('test.key', 'test-value');
      configManager.set('test.number', 42);
      
      // Verify values
      expect(configManager.get('test.key')).toBe('test-value');
      expect(configManager.get('test.number')).toBe(42);
    });
    
    it('should return default values for missing keys', () => {
      expect(configManager.get('missing.key', 'default')).toBe('default');
    });
  });
  
  describe('Schema Validation', () => {
    it('should validate values against schemas', () => {
      // Define schema
      const numberSchema = z.number();
      configManager.registerSchema('app.port', numberSchema);
      
      // Valid value
      configManager.set('app.port', 3000);
      expect(configManager.get('app.port')).toBe(3000);
      
      // Invalid value should throw
      expect(() => configManager.set('app.port', 'not-a-number')).toThrow();
    });
  });
  
  describe('Persistence', () => {
    it('should save and load configuration', async () => {
      // Set up the write mock to capture data
      let savedData = null;
      jest.spyOn(fs, 'writeFile').mockImplementation(async (path, data) => {
        savedData = data;
      });
      
      // Set data and save
      configManager.set('app.name', 'test-app');
      await configManager.save();
      
      // Verify data was "written"
      expect(savedData).toContain('test-app');
      
      // Set up the read mock
      jest.spyOn(fs, 'readFile').mockImplementation(async () => 
        JSON.stringify({
          app: { name: 'loaded-app' }
        })
      );
      
      // Reset and load
      ConfigManager.resetInstance();
      configManager = ConfigManager.getInstance();
      configManager.initialize(configDir);
      await configManager.load();
      
      // Verify loaded value
      expect(configManager.get('app.name')).toBe('loaded-app');
    });
  });
});
