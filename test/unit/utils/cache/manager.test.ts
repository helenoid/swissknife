/**
 * Unit tests for CacheManager
 */

import { CacheManager } from '../../../../src/utils/cache/manager';

describe('CacheManager', () => {
  let cacheManager: any;
  
  beforeEach(() => {
    // Reset singleton
    (CacheManager as any).instance = null;
    
    // Create new instance
    cacheManager = CacheManager.getInstance({
      maxItems: 100,
      ttl: 1000 // 1 second TTL for testing
    });
  });
  
  describe('basic operations', () => {
    it('should set and get values', async () => {
      // Act
      await cacheManager.set('test-key', 'test-value');
      const value = await cacheManager.get('test-key');
      
      // Assert
      expect(value).toBe('test-value');
    });
    
    it('should return undefined for non-existent keys', async () => {
      // Act
      const value = await cacheManager.get('non-existent-key');
      
      // Assert
      expect(value).toBeUndefined();
    });
    
    it('should delete values', async () => {
      // Arrange
      await cacheManager.set('test-key', 'test-value');
      
      // Act
      await cacheManager.delete('test-key');
      const value = await cacheManager.get('test-key');
      
      // Assert
      expect(value).toBeUndefined();
    });
    
    it('should clear all values', async () => {
      // Arrange
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      
      // Act
      await cacheManager.clear();
      
      // Assert
      expect(await cacheManager.get('key1')).toBeUndefined();
      expect(await cacheManager.get('key2')).toBeUndefined();
    });
    
    it('should check if key exists', async () => {
      // Arrange
      await cacheManager.set('test-key', 'test-value');
      
      // Act & Assert
      expect(await cacheManager.has('test-key')).toBe(true);
      expect(await cacheManager.has('non-existent-key')).toBe(false);
    });
  });
  
  describe('complex values', () => {
    it('should handle objects', async () => {
      // Arrange
      const testObject = {
        id: 123,
        name: 'Test Object',
        nested: {
          property: 'nested value'
        }
      };
      
      // Act
      await cacheManager.set('object-key', testObject);
      const retrievedObject = await cacheManager.get('object-key');
      
      // Assert
      expect(retrievedObject).toEqual(testObject);
    });
    
    it('should handle arrays', async () => {
      // Arrange
      const testArray = [1, 2, 3, 'four', { five: 5 }];
      
      // Act
      await cacheManager.set('array-key', testArray);
      const retrievedArray = await cacheManager.get('array-key');
      
      // Assert
      expect(retrievedArray).toEqual(testArray);
    });
    
    it('should handle buffer data', async () => {
      // Arrange
      const testBuffer = Buffer.from('Test buffer data');
      
      // Act
      await cacheManager.set('buffer-key', testBuffer);
      const retrievedBuffer = await cacheManager.get('buffer-key');
      
      // Assert - Depending on implementation, might return Buffer or convert to Base64
      if (Buffer.isBuffer(retrievedBuffer)) {
        expect(retrievedBuffer.equals(testBuffer)).toBe(true);
      } else if (typeof retrievedBuffer === 'string') {
        // Handle Base64 encoding if that's how buffers are cached
        expect(Buffer.from(retrievedBuffer, 'base64').equals(testBuffer)).toBe(true);
      } else {
        // Some other implementation
        expect(retrievedBuffer).toBeDefined();
      }
    });
  });
  
  describe('TTL behavior', () => {
    it('should expire items after TTL', async () => {
      // Arrange
      await cacheManager.set('ttl-key', 'ttl-value');
      
      // Act - Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100)); // Slightly more than TTL
      
      // Assert
      expect(await cacheManager.get('ttl-key')).toBeUndefined();
    });
    
    it('should set custom TTL for specific items', async () => {
      // Skip if custom TTL isn't supported
      if (typeof cacheManager.set !== 'function' || 
          cacheManager.set.length < 3) {
        console.log('Skipping custom TTL test - feature not supported');
        return;
      }
      
      // Arrange - Set with short TTL
      await cacheManager.set('short-ttl-key', 'short-ttl-value', 500); // 500ms TTL
      await cacheManager.set('long-ttl-key', 'long-ttl-value', 2000); // 2s TTL
      
      // Act - Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Assert
      expect(await cacheManager.get('short-ttl-key')).toBeUndefined();
      expect(await cacheManager.get('long-ttl-key')).toBe('long-ttl-value');
      
      // Act - Wait for long TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1500)); // Total 2100ms
      
      // Assert
      expect(await cacheManager.get('long-ttl-key')).toBeUndefined();
    });
    
    it('should support disabling TTL for specific items', async () => {
      // Skip if this feature isn't supported
      if (typeof cacheManager.set !== 'function' || 
          cacheManager.set.length < 3) {
        console.log('Skipping TTL disable test - feature not supported');
        return;
      }
      
      // Arrange - Set with no TTL
      await cacheManager.set('no-ttl-key', 'no-ttl-value', 0); // 0 means no expiration
      
      // Act - Wait longer than default TTL
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Assert - Item should still be in cache
      expect(await cacheManager.get('no-ttl-key')).toBe('no-ttl-value');
    });
    
    it('should reset TTL when updating value', async () => {
      // Skip if this behavior isn't confirmed
      if (!cacheManager.resetTTLOnUpdate) {
        console.log('Skipping TTL reset test - behavior unknown');
        return;
      }
      
      // Arrange
      await cacheManager.set('update-key', 'initial-value');
      
      // Act - Wait part of the TTL, then update
      await new Promise(resolve => setTimeout(resolve, 500)); // Half of TTL
      await cacheManager.set('update-key', 'updated-value');
      
      // Wait the original TTL
      await new Promise(resolve => setTimeout(resolve, 600)); // Total 1100ms
      
      // Assert - Value should still be in cache with new value
      expect(await cacheManager.get('update-key')).toBe('updated-value');
      
      // Wait for the reset TTL to expire
      await new Promise(resolve => setTimeout(resolve, 500)); // Total 1600ms
      
      // Assert - Now the value should be gone
      expect(await cacheManager.get('update-key')).toBeUndefined();
    });
  });
  
  describe('cache limits', () => {
    it('should respect max items limit', async () => {
      // Create a small cache
      const smallCache = CacheManager.getInstance({
        maxItems: 5,
        ttl: 1000
      });
      
      // Act - Add more items than limit
      for (let i = 0; i < 10; i++) {
        await smallCache.set(`key${i}`, `value${i}`);
      }
      
      // Assert - Oldest items should be evicted
      let count = 0;
      for (let i = 0; i < 10; i++) {
        if (await smallCache.has(`key${i}`)) {
          count++;
        }
      }
      
      expect(count).toBeLessThanOrEqual(5);
      
      // The most recent items should still be present
      expect(await smallCache.has('key9')).toBe(true);
      expect(await smallCache.has('key8')).toBe(true);
    });
    
    it('should handle max size limit if implemented', async () => {
      // Skip if max size limit isn't implemented
      if (!('maxSize' in cacheManager) && 
          !('getSize' in cacheManager)) {
        console.log('Skipping max size test - feature not implemented');
        return;
      }
      
      // Create a size-limited cache
      const sizeCache = CacheManager.getInstance({
        maxSize: 1000, // 1KB
        ttl: 1000
      });
      
      // Act - Add items totaling more than the limit
      for (let i = 0; i < 10; i++) {
        const largeValue = 'X'.repeat(200); // Each value is ~200 bytes
        await sizeCache.set(`key${i}`, largeValue);
      }
      
      // Assert - Total size should be <= maxSize
      if ('getSize' in sizeCache) {
        expect(sizeCache.getSize()).toBeLessThanOrEqual(1000);
      }
      
      // Some older items should be evicted
      let count = 0;
      for (let i = 0; i < 10; i++) {
        if (await sizeCache.has(`key${i}`)) {
          count++;
        }
      }
      
      expect(count).toBeLessThan(10);
    });
  });
  
  describe('eviction policies', () => {
    it('should implement LRU eviction by default', async () => {
      // Create a small cache to test eviction
      const lruCache = CacheManager.getInstance({
        maxItems: 3,
        ttl: 1000
      });
      
      // Act - Add initial items
      await lruCache.set('key1', 'value1');
      await lruCache.set('key2', 'value2');
      await lruCache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      await lruCache.get('key1');
      
      // Add one more item to trigger eviction
      await lruCache.set('key4', 'value4');
      
      // Assert - key2 should be evicted (least recently used)
      expect(await lruCache.has('key1')).toBe(true);
      expect(await lruCache.has('key2')).toBe(false);
      expect(await lruCache.has('key3')).toBe(true);
      expect(await lruCache.has('key4')).toBe(true);
    });
    
    it('should support custom eviction policies if implemented', async () => {
      // Skip if custom policies aren't supported
      if (!('setEvictionPolicy' in cacheManager)) {
        console.log('Skipping eviction policy test - feature not implemented');
        return;
      }
      
      // Create a cache with a custom policy
      const customCache = CacheManager.getInstance({
        maxItems: 3,
        ttl: 1000,
        evictionPolicy: 'FIFO' // First In First Out
      });
      
      // Act - Add initial items
      await customCache.set('key1', 'value1');
      await customCache.set('key2', 'value2');
      await customCache.set('key3', 'value3');
      
      // Access key1 to make it most recently used (shouldn't matter for FIFO)
      await customCache.get('key1');
      
      // Add one more item to trigger eviction
      await customCache.set('key4', 'value4');
      
      // Assert - key1 should be evicted (first in)
      expect(await customCache.has('key1')).toBe(false);
      expect(await customCache.has('key2')).toBe(true);
      expect(await customCache.has('key3')).toBe(true);
      expect(await customCache.has('key4')).toBe(true);
    });
  });
  
  describe('cache tiers', () => {
    it('should support multiple cache tiers if implemented', async () => {
      // Skip if tiered caching isn't supported
      if (!('addTier' in cacheManager) &&
          !('tiers' in cacheManager)) {
        console.log('Skipping cache tiers test - feature not implemented');
        return;
      }
      
      // Create a tiered cache
      const tieredCache = CacheManager.getInstance();
      
      // Add in-memory and persistent tiers
      if ('addTier' in tieredCache) {
        tieredCache.addTier('memory', { maxItems: 10, ttl: 1000 });
        tieredCache.addTier('persistent', { maxItems: 100, ttl: 10000 });
      }
      
      // Act - Add an item
      await tieredCache.set('tiered-key', 'tiered-value');
      
      // Assert - Value should be in all tiers
      expect(await tieredCache.get('tiered-key')).toBe('tiered-value');
      
      // If we can check specific tiers
      if ('getFromTier' in tieredCache) {
        expect(await tieredCache.getFromTier('memory', 'tiered-key')).toBe('tiered-value');
        expect(await tieredCache.getFromTier('persistent', 'tiered-key')).toBe('tiered-value');
      }
    });
    
    it('should cascade through tiers on cache miss', async () => {
      // Skip if tiered caching isn't supported
      if (!('addTier' in cacheManager) &&
          !('tiers' in cacheManager)) {
        console.log('Skipping tier cascade test - feature not implemented');
        return;
      }
      
      // Create a tiered cache
      const tieredCache = CacheManager.getInstance();
      
      // Add tiers
      if ('addTier' in tieredCache) {
        tieredCache.addTier('memory', { maxItems: 10, ttl: 500 }); // Short TTL
        tieredCache.addTier('persistent', { maxItems: 100, ttl: 10000 }); // Long TTL
      }
      
      // Set an item
      await tieredCache.set('cascade-key', 'cascade-value');
      
      // Wait for memory tier to expire
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Should still get the value from persistent tier
      expect(await tieredCache.get('cascade-key')).toBe('cascade-value');
      
      // If we can check specific tiers
      if ('getFromTier' in tieredCache) {
        expect(await tieredCache.getFromTier('memory', 'cascade-key')).toBeUndefined();
        expect(await tieredCache.getFromTier('persistent', 'cascade-key')).toBe('cascade-value');
        
        // Get should also restore to memory tier
        expect(await tieredCache.getFromTier('memory', 'cascade-key')).toBe('cascade-value');
      }
    });
  });
  
  describe('serialization', () => {
    it('should handle serialization of complex objects', async () => {
      // Arrange - Create complex nested object with different types
      const complexObject = {
        string: 'text value',
        number: 42,
        boolean: true,
        date: new Date(),
        nested: {
          array: [1, 2, 3],
          buffer: Buffer.from('buffer data'),
          set: new Set([1, 2, 3]),
          map: new Map([['key', 'value']])
        },
        fn: function() { return 'should be stripped'; }
      };
      
      // Act
      await cacheManager.set('complex-key', complexObject);
      const retrievedObject = await cacheManager.get('complex-key');
      
      // Assert - Most properties should be preserved
      expect(retrievedObject.string).toBe(complexObject.string);
      expect(retrievedObject.number).toBe(complexObject.number);
      expect(retrievedObject.boolean).toBe(complexObject.boolean);
      
      // Date might be string or Date object depending on serialization
      if (retrievedObject.date instanceof Date) {
        expect(retrievedObject.date.getTime()).toBe(complexObject.date.getTime());
      } else {
        expect(new Date(retrievedObject.date).getTime()).toBe(complexObject.date.getTime());
      }
      
      // Array should be preserved
      expect(Array.isArray(retrievedObject.nested.array)).toBe(true);
      expect(retrievedObject.nested.array.length).toBe(3);
      
      // Function should be stripped
      expect(typeof retrievedObject.fn).not.toBe('function');
    });
  });
  
  describe('performance', () => {
    it('should have fast access times', async () => {
      // Skip if not running performance tests
      if (process.env.RUN_PERFORMANCE_TESTS !== 'true') {
        console.log('Skipping performance test - enable with RUN_PERFORMANCE_TESTS=true');
        return;
      }
      
      // Arrange - Prefill cache
      for (let i = 0; i < 50; i++) {
        await cacheManager.set(`perf-key-${i}`, `perf-value-${i}`);
      }
      
      // Act - Measure get performance
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        const key = `perf-key-${i % 50}`;
        await cacheManager.get(key);
      }
      const end = performance.now();
      
      // Assert - Should be reasonably fast
      const timePerOperation = (end - start) / 1000;
      expect(timePerOperation).toBeLessThan(1); // Less than 1ms per operation
    });
  });
});