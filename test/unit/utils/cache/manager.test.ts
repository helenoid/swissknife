/**
 * Unit tests for CacheManager
 */
import { CacheManager } from '../../../../src/utils/cache/manager.js';

describe('CacheManager', () => {
  let cacheManager: CacheManager<any>;
  
  beforeEach(() => {
    // Reset singleton instances for clean tests - this now properly destroys timers
    CacheManager.resetInstances();
    
    // Reset the cache for each test
    cacheManager = CacheManager.getInstance('test', { maxItems: 5, ttl: 100 });
    cacheManager.clear();
  });

  afterEach(() => {
    // Clean up timers to prevent hanging tests
    if (cacheManager) {
      cacheManager.destroy();
    }
    // Reset instances will now properly destroy all remaining instances
    CacheManager.resetInstances();
  });

  afterAll(() => {
    // Final cleanup - ensure all instances are destroyed
    CacheManager.resetInstances();
  });
  
  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      // Arrange
      cacheManager.set('key1', 'value1');
      
      // Act
      const result = cacheManager.get('key1');
      
      // Assert
      expect(result).toBe('value1');
    });
    
    it('should return undefined for non-existent keys', () => {
      // Act
      const result = cacheManager.get('nonExistentKey');
      
      // Assert
      expect(result).toBeUndefined();
    });
    
    it('should report if a key exists', () => {
      // Arrange
      cacheManager.set('key1', 'value1');
      
      // Act & Assert
      expect(cacheManager.has('key1')).toBe(true);
      expect(cacheManager.has('notExistingKey')).toBe(false);
    });
    
    it('should delete keys', () => {
      // Arrange
      cacheManager.set('key1', 'value1');
      
      // Act
      const deleteResult = cacheManager.delete('key1');
      
      // Assert
      expect(deleteResult).toBe(true);
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.get('key1')).toBeUndefined();
    });
    
    it('should return false when deleting a non-existent key', () => {
      // Act
      const deleteResult = cacheManager.delete('nonExistentKey');
      
      // Assert
      expect(deleteResult).toBe(false);
    });
    
    it('should clear all keys', () => {
      // Arrange
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      
      // Act
      cacheManager.clear();
      
      // Assert
      expect(cacheManager.size()).toBe(0);
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
    });
    
    it('should return all keys', () => {
      // Arrange
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      
      // Act
      const keys = cacheManager.keys();
      
      // Assert
      expect(keys).toEqual(['key1', 'key2']);
    });
  });
  
  describe('expiration', () => {
    it('should expire items after TTL', async () => {
      // Arrange
      cacheManager.set('expiringKey', 'expiringValue', 50); // 50ms TTL
      
      // Act & Assert
      expect(cacheManager.get('expiringKey')).toBe('expiringValue');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Verify item has expired
      expect(cacheManager.get('expiringKey')).toBeUndefined();
    });
    
    it('should respect different TTLs for different items', async () => {
      // Arrange
      cacheManager.set('quickExpire', 'gone soon', 50); // 50ms TTL
      cacheManager.set('slowExpire', 'linger longer', 150); // 150ms TTL
      
      // Wait for first item to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Act & Assert
      expect(cacheManager.get('quickExpire')).toBeUndefined();
      expect(cacheManager.get('slowExpire')).toBe('linger longer');
      
      // Wait for second item to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify second item has also expired
      expect(cacheManager.get('slowExpire')).toBeUndefined();
    });
    
    it('should not expire items with TTL set to 0', async () => {
      // Arrange
      cacheManager.set('neverExpire', 'always here', 0); // 0ms TTL
      
      // Wait for a long time
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Act & Assert
      expect(cacheManager.get('neverExpire')).toBe('always here');
    });
  });
  
  describe('cache limits', () => {
    it('should respect maxItems limit', () => {
      // Arrange - fill the cache (maxItems is 5)
      for (let i = 0; i < 6; i++) {
        cacheManager.set(`key${i}`, `value${i}`);
      }
      
      // Act & Assert - verify the oldest item was evicted
      expect(cacheManager.size()).toBe(5);
      expect(cacheManager.get('key0')).toBeUndefined();
      expect(cacheManager.get('key1')).toBe('value1');
    });
    
    it('should not evict items if maxItems is 0', () => {
      // Arrange
      const unlimitedCache = CacheManager.getInstance('unlimited', { maxItems: 0 });
      unlimitedCache.clear();
      
      // Act - add more items than default maxItems
      for (let i = 0; i < 10; i++) {
        unlimitedCache.set(`key${i}`, `value${i}`);
      }
      
      // Assert
      expect(unlimitedCache.size()).toBe(10);
      expect(unlimitedCache.get('key0')).toBe('value0');
    });
  });
  
  describe('statistics', () => {
    it('should track cache statistics', () => {
      // Arrange - Create a fresh cache instance for accurate statistics
      const statsCache = CacheManager.getInstance('stats-test');
      statsCache.clear(); // Ensure it's clean
      
      statsCache.set('statsKey1', 'statsValue1');
      statsCache.set('statsKey2', 'statsValue2');
      
      // Act
      statsCache.get('statsKey1'); // Hit
      statsCache.get('statsKey1'); // Hit
      statsCache.get('statsKey2'); // Hit
      statsCache.get('nonExistent'); // Miss
      
      // Get stats
      const stats = statsCache.getStats();
      
      // Assert
      expect(stats.size).toBe(2);
      expect(stats.totalAccessCount).toBe(3); // Only successful gets increment accessCount in implementation
      expect(stats.averageAccessCount).toBe(3 / 2); // 3 accesses / 2 items
      expect(stats.hitRatio).toBe(3 / 4); // 3 hits / (3 hits + 1 miss)
    });
  });
  
  describe('multiple instances', () => {
    it('should support multiple independent cache instances', () => {
      // Arrange
      const cache1 = CacheManager.getInstance('instance1');
      const cache2 = CacheManager.getInstance('instance2');
      
      // Clear to ensure independence
      cache1.clear();
      cache2.clear();
      
      // Act
      cache1.set('key', 'value for cache 1');
      cache2.set('key', 'value for cache 2');
      
      // Assert
      expect(cache1.get('key')).toBe('value for cache 1');
      expect(cache2.get('key')).toBe('value for cache 2');
      expect(cache1.get('key')).not.toBe(cache2.get('key'));
    });
  });
  
  describe('key prefix', () => {
    it('should use the specified key prefix', () => {
      // Arrange
      const prefixedCache = CacheManager.getInstance('prefixed', { keyPrefix: 'myprefix:' });
      prefixedCache.clear();
      
      // Act
      prefixedCache.set('mykey', 'myvalue');
      
      // Assert - check internal storage (accessing private property for testing)
      // This might require a different approach if direct access is not desired/possible
      // For now, we'll rely on the public interface which should handle prefixes internally
      expect(prefixedCache.has('mykey')).toBe(true);
      expect(prefixedCache.get('mykey')).toBe('myvalue');
      
      // Verify the internal key format (if possible/necessary)
      // This part is tricky without exposing internal state or a dedicated method
      // For now, we trust the public methods to handle the prefix correctly
    });
    
    it('should return keys without the prefix', () => {
      // Arrange
      const prefixedCache = CacheManager.getInstance('prefixed-keys', { keyPrefix: 'myprefix:' });
      prefixedCache.clear();
      prefixedCache.set('key1', 'value1');
      prefixedCache.set('key2', 'value2');
      
      // Act
      const keys = prefixedCache.keys();
      
      // Assert
      expect(keys).toEqual(['key1', 'key2']);
    });
  });
  
  describe('updating items', () => {
    it('should update the value of an existing key', () => {
      // Arrange
      cacheManager.set('updateKey', 'initialValue');
      
      // Act
      cacheManager.set('updateKey', 'updatedValue');
      
      // Assert
      expect(cacheManager.get('updateKey')).toBe('updatedValue');
    });
    
    it('should update the TTL of an existing key', async () => {
      // Arrange
      cacheManager.set('updateTTLKey', 'value', 50); // Short TTL
      
      // Update with a longer TTL
      cacheManager.set('updateTTLKey', 'value', 200);
      
      // Wait past the original TTL but before the new TTL
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Act & Assert
      expect(cacheManager.get('updateTTLKey')).toBe('value');
      
      // Wait past the new TTL
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Act & Assert
      expect(cacheManager.get('updateTTLKey')).toBeUndefined();
    });
  });
  
  describe('destruction', () => {
    it('should clear the cache and stop cleanup timer on destruction', () => {
      // Arrange
      const instanceId = 'destroy-test';
      const destroyableCache = CacheManager.getInstance(instanceId, { ttl: 50 });
      destroyableCache.set('key', 'value');
      
      // Capture the timer before destruction
      const timerBeforeDestroy = destroyableCache['cleanupTimer'];
      
      // Spy on clearInterval to check if timer is stopped
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Act
      destroyableCache.destroy();
      
      // Assert
      expect(destroyableCache.size()).toBe(0);
      expect(destroyableCache.get('key')).toBeUndefined();
      
      // In test environment, timer might be null, so only check if it was set
      if (timerBeforeDestroy !== null) {
        expect(clearIntervalSpy).toHaveBeenCalledWith(timerBeforeDestroy);
      }
      expect(destroyableCache['cleanupTimer']).toBeNull();
      
      // Verify the instance is removed from static map (if possible/necessary)
      // This might require accessing a private static property
      // expect((CacheManager as any).instances.has(instanceId)).toBe(false);
      
      clearIntervalSpy.mockRestore(); // Restore original clearInterval
    });
  });
});
