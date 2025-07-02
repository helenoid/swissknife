import { CacheManager } from '../src/utils/cache/manager';

export {};
describe('CacheManager Minimal Test', () => {
  it('should create cache manager instance', () => {
    const cache = CacheManager.getInstance();
    expect(cache).toBeDefined();
  });

  it('should set and get values', () => {
    const cache = CacheManager.getInstance();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });
});
