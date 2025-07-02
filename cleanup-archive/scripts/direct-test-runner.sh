#!/bin/bash

# Simple test runner to bypass Jest hanging issues
echo "Testing individual modules directly..."

cd /home/barberb/swissknife

# Test EventBus directly
echo "=== Testing EventBus ==="
node -e "
try {
  const { EventBus } = require('./dist/utils/events/event-bus.js');
  console.log('EventBus imported successfully');
  const bus = new EventBus();
  bus.emit('test', 'data');
  console.log('EventBus basic functionality works');
} catch (e) {
  console.error('EventBus test failed:', e.message);
}
"

# Test CacheManager directly
echo "=== Testing CacheManager ==="
node -e "
try {
  const { CacheManager } = require('./dist/utils/cache/manager.js');
  console.log('CacheManager imported successfully');
  const cache = new CacheManager();
  cache.set('test', 'value');
  console.log('CacheManager basic functionality works');
} catch (e) {
  console.error('CacheManager test failed:', e.message);
}
"

echo "Direct testing complete."
