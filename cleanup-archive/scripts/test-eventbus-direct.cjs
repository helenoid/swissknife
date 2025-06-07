#!/usr/bin/env node

/**
 * Direct EventBus testing - bypasses Jest hanging issues
 * Tests the EventBus functionality directly with Node.js
 */

console.log('🧪 Testing EventBus functionality...\n');

async function testEventBus() {
  const results = [];
  
  try {
    // Import the EventBus from temporary JS version
    const { EventBus } = require('./temp-eventbus.js');
    console.log('✅ EventBus imported successfully');

    // Reset singleton for clean testing
    EventBus.instance = null;
    
    // Get instance
    const eventBus = EventBus.getInstance();
    console.log('✅ EventBus instance created');
    
    // Test 1: Basic event emission and handling
    console.log('\n📋 Test 1: Basic event emission and handling');
    let testPassed = false;
    const testData = { message: 'hello world' };
    
    eventBus.on('test-event', (data) => {
      if (data.message === 'hello world') {
        testPassed = true;
      }
    });
    
    eventBus.emit('test-event', testData);
    
    if (testPassed) {
      console.log('✅ PASS: Basic event handling works');
      results.push('✅ Basic event handling');
    } else {
      console.log('❌ FAIL: Basic event handling failed');
      results.push('❌ Basic event handling');
    }
    
    // Test 2: Multiple handlers for same event
    console.log('\n📋 Test 2: Multiple handlers for same event');
    let handler1Called = false;
    let handler2Called = false;
    
    eventBus.on('multi-event', () => { handler1Called = true; });
    eventBus.on('multi-event', () => { handler2Called = true; });
    
    eventBus.emit('multi-event', 'test');
    
    if (handler1Called && handler2Called) {
      console.log('✅ PASS: Multiple handlers work');
      results.push('✅ Multiple handlers');
    } else {
      console.log('❌ FAIL: Multiple handlers failed');
      results.push('❌ Multiple handlers');
    }
    
    // Test 3: removeAll functionality (the fixed method)
    console.log('\n📋 Test 3: removeAll functionality');
    let callCount = 0;
    
    eventBus.on('remove-test', () => { callCount++; });
    eventBus.on('remove-test', () => { callCount++; });
    
    // First emission
    eventBus.emit('remove-test', 'data');
    
    // Should have called both handlers
    if (callCount === 2) {
      console.log('✅ Initial handlers called correctly (count: 2)');
      
      // Remove all handlers
      eventBus.removeAll('remove-test');
      
      // Second emission should not call any handlers
      eventBus.emit('remove-test', 'data');
      
      if (callCount === 2) { // Still 2, not 4
        console.log('✅ PASS: removeAll works correctly');
        results.push('✅ removeAll functionality');
      } else {
        console.log(`❌ FAIL: removeAll failed, count is ${callCount}`);
        results.push('❌ removeAll functionality');
      }
    } else {
      console.log(`❌ FAIL: Initial handlers failed, count is ${callCount}`);
      results.push('❌ removeAll functionality');
    }
    
    // Test 4: once() functionality
    console.log('\n📋 Test 4: once() functionality');
    let onceCallCount = 0;
    
    eventBus.once('once-event', () => { onceCallCount++; });
    
    // Emit twice
    eventBus.emit('once-event', 'data1');
    eventBus.emit('once-event', 'data2');
    
    if (onceCallCount === 1) {
      console.log('✅ PASS: once() functionality works');
      results.push('✅ once() functionality');
    } else {
      console.log(`❌ FAIL: once() failed, called ${onceCallCount} times`);
      results.push('❌ once() functionality');
    }
    
    // Test 5: off() functionality
    console.log('\n📋 Test 5: off() functionality');
    let offCallCount = 0;
    const offHandler = () => { offCallCount++; };
    
    eventBus.on('off-event', offHandler);
    eventBus.emit('off-event', 'data');
    
    if (offCallCount === 1) {
      eventBus.off('off-event', offHandler);
      eventBus.emit('off-event', 'data');
      
      if (offCallCount === 1) { // Still 1, not 2
        console.log('✅ PASS: off() functionality works');
        results.push('✅ off() functionality');
      } else {
        console.log(`❌ FAIL: off() failed, count is ${offCallCount}`);
        results.push('❌ off() functionality');
      }
    } else {
      console.log(`❌ FAIL: Initial off test failed, count is ${offCallCount}`);
      results.push('❌ off() functionality');
    }
    
    // Test 6: Error handling
    console.log('\n📋 Test 6: Error handling');
    let errorEventReceived = false;
    
    eventBus.on('error', (errorData) => {
      if (errorData.sourceEvent === 'error-test' && errorData.errors.length > 0) {
        errorEventReceived = true;
      }
    });
    
    eventBus.on('error-test', () => {
      throw new Error('Test error');
    });
    
    eventBus.emit('error-test', 'data');
    
    if (errorEventReceived) {
      console.log('✅ PASS: Error handling works');
      results.push('✅ Error handling');
    } else {
      console.log('❌ FAIL: Error handling failed');
      results.push('❌ Error handling');
    }
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    results.push('❌ FATAL ERROR');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 EventBus Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.startsWith('✅')).length;
  const total = results.length;
  
  results.forEach(result => console.log(result));
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All EventBus tests PASSED! The fix is working correctly.');
    return true;
  } else {
    console.log('⚠️  Some EventBus tests failed. Check implementation.');
    return false;
  }
}

// Run the test
testEventBus().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
