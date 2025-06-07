// test/unit/config/manager-simple.test.js
// Simple JavaScript version to test configuration manager

const { ConfigurationManager } = require('../../../src/config/manager.ts');

describe('ConfigurationManager - Simple Test', () => {
  let configManager;

  beforeEach(() => {
    // Reset singleton instance for testing
    if (ConfigurationManager.instance) {
      delete ConfigurationManager.instance;
    }
    configManager = ConfigurationManager.getInstance();
  });

  afterEach(() => {
    // Clean up
    if (ConfigurationManager.instance) {
      delete ConfigurationManager.instance;
    }
  });

  test('should create singleton instance', () => {
    const instance1 = ConfigurationManager.getInstance();
    const instance2 = ConfigurationManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should set and get basic values', () => {
    configManager.set('testKey', 'testValue');
    expect(configManager.get('testKey')).toBe('testValue');
  });

  test('should return default value when key does not exist', () => {
    expect(configManager.get('nonExistentKey', 'defaultValue')).toBe('defaultValue');
  });

  test('should check if key exists', () => {
    configManager.set('existingKey', 'value');
    expect(configManager.has('existingKey')).toBe(true);
    expect(configManager.has('nonExistentKey')).toBe(false);
  });

  test('should list all keys', () => {
    configManager.set('key1', 'value1');
    configManager.set('key2', 'value2');
    const keys = configManager.listKeys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });
});
