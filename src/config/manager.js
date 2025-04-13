/**
 * Configuration Manager for SwissKnife
 * 
 * This module provides a centralized way to manage application configuration.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';
import { logger } from '../utils/logger.js';

// Singleton instance
let instance = null;

/**
 * Configuration Manager class
 */
export class ConfigManager {
  constructor() {
    this.config = {};
    this.configPath = join(homedir(), '.swissknife', 'config.json');
    this.initialized = false;
  }

  /**
   * Initialize the configuration manager
   * 
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  async initialize() {
    try {
      await this.load();
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize configuration manager', error);
      return false;
    }
  }

  /**
   * Load configuration from disk
   * 
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  async load() {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(data);
      } else {
        // Use default config if file doesn't exist
        this.config = this.getDefaultConfig();
        await this.save();
      }
      return true;
    } catch (error) {
      logger.error('Failed to load configuration', error);
      // Fall back to default config
      this.config = this.getDefaultConfig();
      return false;
    }
  }

  /**
   * Save configuration to disk
   * 
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  async save() {
    try {
      // Create directory if it doesn't exist
      const configDir = join(homedir(), '.swissknife');
      if (!existsSync(configDir)) {
        const fs = await import('fs/promises');
        await fs.mkdir(configDir, { recursive: true });
      }

      // Write config file
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      return true;
    } catch (error) {
      logger.error('Failed to save configuration', error);
      return false;
    }
  }

  /**
   * Get default configuration
   * 
   * @returns {Object} Default configuration object
   */
  getDefaultConfig() {
    return {
      models: {
        default: 'gpt-4o',
        providers: {
          'openai': {
            baseUrl: 'https://api.openai.com/v1',
            apiKey: ''
          },
          'anthropic': {
            baseUrl: 'https://api.anthropic.com',
            apiKey: ''
          }
        }
      },
      storage: {
        type: 'local',
        path: join(homedir(), '.swissknife', 'storage')
      },
      logging: {
        level: 'info',
        path: join(homedir(), '.swissknife', 'logs')
      },
      ui: {
        theme: 'dark',
        colors: {
          primary: 'blue',
          secondary: 'green'
        }
      }
    };
  }

  /**
   * Get a configuration value by key
   * 
   * @param {string} key Configuration key in dot notation
   * @param {any} defaultValue Default value if key is not found
   * @returns {any} Configuration value
   */
  get(key, defaultValue) {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized');
    }

    const parts = key.split('.');
    let value = this.config;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return defaultValue;
      }
      value = value[part];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a configuration value by key
   * 
   * @param {string} key Configuration key in dot notation
   * @param {any} value Value to set
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  async set(key, value) {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized');
    }

    const parts = key.split('.');
    let current = this.config;

    // Traverse the object, creating objects as needed
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    // Set the value
    current[parts[parts.length - 1]] = value;

    // Save to disk
    return this.save();
  }

  /**
   * Get all configuration
   * 
   * @returns {Object} Complete configuration object
   */
  getAll() {
    if (!this.initialized) {
      throw new Error('Configuration manager not initialized');
    }
    return this.config;
  }

  /**
   * Reset configuration to defaults
   * 
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  async reset() {
    this.config = this.getDefaultConfig();
    return this.save();
  }

  /**
   * Get the configuration manager instance (singleton)
   * 
   * @returns {ConfigManager} Singleton instance
   */
  static getInstance() {
    if (!instance) {
      instance = new ConfigManager();
    }
    return instance;
  }
}

// Export singleton accessor
export const getConfigManager = () => ConfigManager.getInstance();