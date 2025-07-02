/**
 * ConfigManager Mock for Testing (CommonJS Version)
 * 
 * This provides a testing-friendly version of the ConfigManager
 */

const { z } = require('zod');
const path = require('path');
const fs = require('fs/promises');

/**
 * Config Manager class used for tests
 */
class ConfigManager {
  static instance = null;
  
  /**
   * Private constructor - use getInstance() instead
   */
  constructor() {
    this.config = new Map();
    this.schemas = new Map();
    this.configDir = null;
    this.configPath = null;
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance() {
    ConfigManager.instance = null;
  }
  
  /**
   * Initialize with a config directory
   */
  initialize(configDir) {
    this.configDir = configDir;
    this.configPath = path.join(configDir, 'config.json');
    return this;
  }
  
  /**
   * Get the current config directory
   */
  getConfigDir() {
    return this.configDir;
  }
  
  /**
   * Set a config value
   */
  set(key, value, options = {}) {
    // Validate against schema if registered
    if (this.schemas.has(key)) {
      const schema = this.schemas.get(key);
      try {
        value = schema.parse(value);
      } catch (error) {
        throw new Error(`Invalid value for key ${key}: ${error.message}`);
      }
    }
    
    // Store the value
    this.config.set(key, {
      value,
      isSensitive: options.isSensitive || false,
      description: options.description || ''
    });
    
    return this;
  }
  
  /**
   * Get a config value
   */
  get(key, defaultValue = undefined) {
    const item = this.config.get(key);
    return item ? item.value : defaultValue;
  }
  
  /**
   * Register a schema for a config key
   */
  registerSchema(key, schema) {
    this.schemas.set(key, schema);
    return this;
  }
  
  /**
   * Save configuration to disk
   */
  async save() {
    if (!this.configDir) {
      throw new Error('Config directory not initialized');
    }
    
    // Convert config map to object
    const configObj = {};
    this.config.forEach((item, key) => {
      const parts = key.split('.');
      let current = configObj;
      
      // Build nested structure
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      // Set the value
      current[parts[parts.length - 1]] = item.value;
    });
    
    // Write to file
    await fs.writeFile(
      this.configPath,
      JSON.stringify(configObj, null, 2)
    );
    
    return true;
  }
  
  /**
   * Load configuration from disk
   */
  async load() {
    if (!this.configDir) {
      throw new Error('Config directory not initialized');
    }
    
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(data);
      
      // Flatten the object into key-value pairs
      const flattenObject = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenObject(value, newKey);
          } else {
            this.set(newKey, value);
          }
        });
      };
      
      flattenObject(config);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, that's fine for a new config
        return false;
      }
      throw error;
    }
  }
}

module.exports = {
  ConfigManager
};
