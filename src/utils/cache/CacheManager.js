/**
 * Cache management system with TTL and LRU capabilities
 */
class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.enabled = options.enabled !== false;
    
    this.cache = new Map();
    this.accessOrder = new Map(); // For LRU tracking
    this.timers = new Map(); // For TTL cleanup
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Set a value in the cache
   */
  set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) {
      return this;
    }

    // Clear existing timer if key exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Check if we need to evict items
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Set the value
    const entry = {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.stats.sets++;

    // Set TTL timer if specified
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    return this;
  }

  /**
   * Get a value from the cache
   */
  get(key) {
    if (!this.enabled) {
      return undefined;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access tracking
    entry.accessCount++;
    this.updateAccessOrder(key);
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Check if a key exists in cache
   */
  has(key) {
    if (!this.enabled) {
      return false;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a value from cache
   */
  delete(key) {
    if (!this.enabled) {
      return false;
    }

    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.accessOrder.delete(key);
      
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      
      this.stats.deletes++;
    }

    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.accessOrder.clear();
    this.timers.clear();
    
    return this;
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;

    return {
      ...this.stats,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    return this;
  }

  /**
   * Get or set a value with a factory function
   */
  async getOrSet(key, factory, ttl = this.defaultTTL) {
    if (this.has(key)) {
      return this.get(key);
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Update access order for LRU
   */
  updateAccessOrder(key) {
    this.accessOrder.delete(key); // Remove if exists
    this.accessOrder.set(key, Date.now()); // Add to end
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    if (this.accessOrder.size === 0) {
      return;
    }

    // Get the first (oldest) key
    const oldestKey = this.accessOrder.keys().next().value;
    this.delete(oldestKey);
    this.stats.evictions++;
  }

  /**
   * Set multiple values at once
   */
  mset(entries, ttl = this.defaultTTL) {
    for (const [key, value] of entries) {
      this.set(key, value, ttl);
    }
    return this;
  }

  /**
   * Get multiple values at once
   */
  mget(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * Delete multiple keys at once
   */
  mdel(keys) {
    let deleted = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Get all keys in cache
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in cache
   */
  values() {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * Get all entries in cache
   */
  entries() {
    const result = [];
    for (const [key, entry] of this.cache) {
      result.push([key, entry.value]);
    }
    return result;
  }

  /**
   * Enable or disable cache
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
    return this;
  }

  /**
   * Check if cache is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache) {
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    return expiredKeys.length;
  }

  /**
   * Set cache configuration
   */
  configure(options) {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize;
      // Evict if current size exceeds new max
      while (this.cache.size > this.maxSize) {
        this.evictLRU();
      }
    }
    
    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL;
    }
    
    if (options.enabled !== undefined) {
      this.setEnabled(options.enabled);
    }

    return this;
  }
}

module.exports = CacheManager;
