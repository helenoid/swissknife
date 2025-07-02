/**
 * Storage Manager
 * 
 * This module provides a centralized storage management system.
 */

export class StorageManager {
  static instance;

  constructor(options = {}) {
    this.options = options;
    this.stores = new Map();
  }

  /**
   * Get the singleton instance of StorageManager
   */
  static getInstance() {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Register a storage provider
   * @param {string} name - Name of the storage provider
   * @param {Object} provider - Storage provider implementation
   * @returns {StorageManager} - This instance for chaining
   */
  registerStore(name, provider) {
    this.stores.set(name, provider);
    return this;
  }

  /**
   * Get a registered storage provider
   * @param {string} name - Name of the storage provider
   * @returns {Object|undefined} - Storage provider or undefined
   */
  getStore(name) {
    return this.stores.get(name);
  }

  /**
   * Save data to a specific storage provider
   * @param {string} storeName - Name of the storage provider
   * @param {string} key - Data key
   * @param {any} data - Data to save
   * @returns {Promise<boolean>} - Success status
   */
  async save(storeName, key, data) {
    const store = this.getStore(storeName);
    if (!store) {
      throw new Error(`Storage provider '${storeName}' not found`);
    }
    return store.save(key, data);
  }

  /**
   * Load data from a specific storage provider
   * @param {string} storeName - Name of the storage provider
   * @param {string} key - Data key
   * @returns {Promise<any>} - Retrieved data
   */
  async load(storeName, key) {
    const store = this.getStore(storeName);
    if (!store) {
      throw new Error(`Storage provider '${storeName}' not found`);
    }
    return store.load(key);
  }

  /**
   * Delete data from a specific storage provider
   * @param {string} storeName - Name of the storage provider
   * @param {string} key - Data key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(storeName, key) {
    const store = this.getStore(storeName);
    if (!store) {
      throw new Error(`Storage provider '${storeName}' not found`);
    }
    return store.delete(key);
  }
}

export default StorageManager;
