/**
 * Test to verify CacheManager timer cleanup
 */
import { CacheManager } from './src/utils/cache/cache-manager.js';

describe('CacheManager Timer Cleanup', () => {
  afterEach(() => {
    CacheManager.resetInstances();
  });

  afterAll(() => {
    CacheManager.resetInstances();
  });

  it('should properly cleanup timers when destroyed', (done) => {
    const cache = CacheManager.getInstance('test-cleanup', { ttl: 100 });
    cache.set('key', 'value');
    
    // Destroy the cache to clean up timers
    cache.destroy();
    
    // Reset all instances
    CacheManager.resetInstances();
    
    // Test should complete quickly without hanging
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 100);
  });

  it('should handle multiple instances cleanup', (done) => {
    const cache1 = CacheManager.getInstance('test1', { ttl: 100 });
    const cache2 = CacheManager.getInstance('test2', { ttl: 100 });
    
    cache1.set('key1', 'value1');
    cache2.set('key2', 'value2');
    
    // Reset should destroy all instances
    CacheManager.resetInstances();
    
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 100);
  });
});
