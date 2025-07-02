#!/usr/bin/env node

/**
 * Debug the TTL=0 cache issue
 */

const { CacheManager } = require('./src/utils/cache/manager.ts');

console.log('🔧 Debugging TTL=0 Cache Issue...\n');

function debugTTLZero() {
  try {
    // Reset instances
    CacheManager.resetInstances();
    
    // Create cache instance
    const cache = CacheManager.getInstance('debug', { maxItems: 10, ttl: 100 });
    cache.clear();
    
    console.log('1. Setting item with TTL=0...');
    cache.set('neverExpire', 'always here', 0);
    
    console.log('2. Checking item immediately...');
    const immediate = cache.get('neverExpire');
    console.log(`   Result: ${immediate}`);
    
    console.log('3. Waiting 200ms...');
    setTimeout(() => {
      const afterWait = cache.get('neverExpire');
      console.log(`   Result after wait: ${afterWait}`);
      
      // Debug the internal cache state
      const prefixedKey = `cache:neverExpire`;
      const internalCache = cache['cache'];
      const item = internalCache.get(prefixedKey);
      
      console.log('4. Internal cache state:');
      console.log(`   Has key: ${internalCache.has(prefixedKey)}`);
      console.log(`   Item exists: ${!!item}`);
      if (item) {
        console.log(`   Item value: ${item.value}`);
        console.log(`   Item expiry: ${item.expiry}`);
        console.log(`   Current time: ${Date.now()}`);
        console.log(`   Has expired: ${item.expiry !== null && item.expiry < Date.now()}`);
      }
      
      if (afterWait === 'always here') {
        console.log('\n✅ TTL=0 working correctly - item never expires');
      } else {
        console.log('\n❌ TTL=0 not working - item expired when it shouldn\'t');
      }
      
      cache.destroy();
      CacheManager.resetInstances();
    }, 200);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTTLZero();
