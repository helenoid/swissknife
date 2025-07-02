/**
 * Cache Manager implementation
 */

export interface CacheOptions {
  maxItems?: number;
  ttl?: number; // time to live in milliseconds
  keyPrefix?: string;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager<T> {
  private static instances: Map<string, CacheManager<any>> = new Map();
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  private accessCount: Map<string, number> = new Map();
  private totalAccesses = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor(private name: string, options: CacheOptions = {}) {
    this.options = {
      maxItems: options.maxItems ?? 100,
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
      keyPrefix: options.keyPrefix ?? ''
    };
    
    // Start periodic cleanup only if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startCleanupTimer();
    }
  }

  static getInstance<T>(name: string, options: CacheOptions = {}): CacheManager<T> {
    if (!CacheManager.instances.has(name)) {
      CacheManager.instances.set(name, new CacheManager(name, options));
    }
    return CacheManager.instances.get(name)!;
  }

  set(key: string, value: T, ttl?: number): void {
    // Clean expired entries first
    this.cleanExpired();

    const internalKey = this.getInternalKey(key);

    // Remove oldest entry if at max capacity
    if (this.cache.size >= this.options.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        const originalKey = this.getOriginalKey(firstKey);
        this.accessCount.delete(originalKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.ttl
    };

    this.cache.set(internalKey, entry);
    if (!this.accessCount.has(key)) {
      this.accessCount.set(key, 0);
    }
  }

  get(key: string): T | undefined {
    const internalKey = this.getInternalKey(key);
    const entry = this.cache.get(internalKey);
    if (!entry) {
      this.totalAccesses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(internalKey);
      this.accessCount.delete(key);
      this.totalAccesses++;
      return undefined;
    }

    // Increment access count
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    this.totalAccesses++;

    return entry.value;
  }

  has(key: string): boolean {
    const internalKey = this.getInternalKey(key);
    const entry = this.cache.get(internalKey);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(internalKey);
      this.accessCount.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const internalKey = this.getInternalKey(key);
    const deleted = this.cache.delete(internalKey);
    if (deleted) {
      this.accessCount.delete(key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys()).map(key => this.getOriginalKey(key));
  }

  values(): T[] {
    this.cleanExpired();
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  getStats(): { size: number; maxItems: number; hitRatio?: number; totalAccessCount: number; averageAccessCount: number } {
    const totalAccesses = Array.from(this.accessCount.values()).reduce((sum, count) => sum + count, 0);
    const hitRatio = this.totalAccesses > 0 ? totalAccesses / this.totalAccesses : 0;
    const averageAccessCount = this.accessCount.size > 0 ? totalAccesses / this.accessCount.size : 0;

    return {
      size: this.size(),
      maxItems: this.options.maxItems,
      hitRatio,
      totalAccessCount: totalAccesses,
      averageAccessCount
    };
  }

  destroy(): void {
    this.clear();
    this.accessCount.clear();
    this.totalAccesses = 0;
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Remove from static instances
    CacheManager.instances.delete(this.name);
  }

  private getInternalKey(key: string): string {
    return this.options.keyPrefix + key;
  }

  private getOriginalKey(internalKey: string): string {
    return internalKey.startsWith(this.options.keyPrefix) 
      ? internalKey.slice(this.options.keyPrefix.length)
      : internalKey;
  }

  private startCleanupTimer(): void {
    // Run cleanup every minute
    this.cleanupTimer = setInterval(() => {
      this.cleanExpired();
    }, 60000);
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [internalKey, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(internalKey);
        const originalKey = this.getOriginalKey(internalKey);
        this.accessCount.delete(originalKey);
      }
    }
  }

  // For testing purposes
  static resetInstances(): void {
    // Destroy all existing instances first to clean up timers
    for (const instance of CacheManager.instances.values()) {
      if (instance.cleanupTimer) {
        clearInterval(instance.cleanupTimer);
        instance.cleanupTimer = null;
      }
    }
    CacheManager.instances.clear();
  }
}
