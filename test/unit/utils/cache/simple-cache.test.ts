/**
 * Simple CacheManager test to debug hanging issue
 */
import { CacheManager } from '../../../../src/utils/cache/manager.js';

describe('CacheManager Simple Test', () => {
  test('should create cache manager instance', () => {
    const cache = CacheManager.getInstance('test');
    expect(cache).toBeDefined();
  });

  test('should set and get values', () => {
    const cache = CacheManager.getInstance('test2');
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });
});
