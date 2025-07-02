export interface CacheOptions {
  maxItems?: number;
  ttl?: number;
  storageMode?: 'memory' | 'local' | 'session';
  keyPrefix?: string;
}

export interface CacheItem<T> {
  value: T;
  expiry: number | null;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export class CacheManager<T = any> {
  private static instances: Map<string, CacheManager<any>> = new Map();
  private cache: Map<string, CacheItem<T>>;
  private options: Required<CacheOptions>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Default options
  private static readonly DEFAULT_OPTIONS: Required<CacheOptions> = {
    maxItems: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    storageMode: 'memory',
    keyPrefix: 'cache:'
  };
  
  private constructor(_id: string, options: CacheOptions = {}) {
    this.options = { ...CacheManager.DEFAULT_OPTIONS, ...options };
    this.cache = new Map<string, CacheItem<T>>();
    
    // Set up automatic cleanup if TTL is enabled
    // Don't start cleanup timer in test environment to prevent hanging
    if (this.options.ttl > 0 && process.env.NODE_ENV !== 'test') {
      this.cleanupTimer = setInterval(() => this.cleanup(), Math.min(this.options.ttl / 2, 60000));
    }
  }
  
  /**
   * Get a cache instance with a given ID
   */
  static getInstance<T>(id: string = 'default', options?: CacheOptions): CacheManager<T> {
    if (!CacheManager.instances.has(id)) {
      CacheManager.instances.set(id, new CacheManager<T>(id, options));
    }
    return CacheManager.instances.get(id) as CacheManager<T>;
  }
  
  /**
   * Reset all cache instances (useful for testing)
   */
  static resetInstances(): void {
    // Destroy all existing instances to clean up timers
    for (const instance of CacheManager.instances.values()) {
      instance.destroy();
    }
    CacheManager.instances.clear();
  }
  
  /**
   * Get an item from the cache
   */
  get(key: string): T | undefined {
    const prefixedKey = this.getKeyWithPrefix(key);
    const item = this.cache.get(prefixedKey);
    
    if (!item) {
      this.stats.misses++; // Increment miss count
      return undefined;
    }
    
    // Check if item has expired
    if (this.hasExpired(item)) {
      this.delete(key);
      this.stats.misses++; // Increment miss count
      return undefined;
    }
    
    // Update access stats
    item.lastAccessed = Date.now();
    item.accessCount++;
    this.stats.hits++; // Increment hit count
    
    return item.value;
  }
  
  /**
   * Set an item in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const prefixedKey = this.getKeyWithPrefix(key);
    const now = Date.now();
    
    let expiry: number | null;
    if (ttl !== undefined) {
      // If TTL is explicitly set to 0, item never expires
      expiry = ttl === 0 ? null : now + ttl;
    } else {
      // Use default TTL from options
      expiry = this.options.ttl > 0 ? now + this.options.ttl : null;
    }
    
    this.cache.set(prefixedKey, {
      value,
      expiry,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0
    });
    
    // Enforce max items limit if needed (only if maxItems > 0)
    if (this.options.maxItems > 0 && this.cache.size > this.options.maxItems) {
      this.evictOldest();
    }
  }
  
  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const prefixedKey = this.getKeyWithPrefix(key);
    const item = this.cache.get(prefixedKey);
    
    if (!item) {
      return false;
    }
    
    // Check if item has expired
    if (this.hasExpired(item)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete an item from the cache
   */
  delete(key: string): boolean {
    const prefixedKey = this.getKeyWithPrefix(key);
    return this.cache.delete(prefixedKey);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the size of the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys()).map(key => 
      key.startsWith(this.options.keyPrefix) 
        ? key.substring(this.options.keyPrefix.length) 
        : key
    );
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    let totalAccessCount = 0;
    let oldestItem = Infinity;
    let newestItem = 0;
    
    for (const item of this.cache.values()) {
      totalAccessCount += item.accessCount;
      oldestItem = Math.min(oldestItem, item.createdAt);
      newestItem = Math.max(newestItem, item.createdAt);
    }
    
    return {
      size: this.cache.size,
      totalAccessCount,
      averageAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
      oldestItemAge: oldestItem !== Infinity ? Date.now() - oldestItem : 0,
      newestItemAge: newestItem !== 0 ? Date.now() - newestItem : 0,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
    };
  }
  
  /**
   * Cache hit/miss statistics
   */
  private stats = {
    hits: 0,
    misses: 0
  };
  
  /**
   * Check if a cache item has expired
   */
  private hasExpired(item: CacheItem<T>): boolean {
    return item.expiry !== null && item.expiry < Date.now();
  }
  
  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry !== null && item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Evict the least recently used or oldest item
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      // Use last accessed time for LRU eviction
      if (item.lastAccessed < oldestTime) {
        oldestKey = key;
        oldestTime = item.lastAccessed;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Add the prefix to a key
   */
  private getKeyWithPrefix(key: string): string {
    return `${this.options.keyPrefix}${key}`;
  }
  
  /**
   * Clean up when instance is no longer needed
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}
