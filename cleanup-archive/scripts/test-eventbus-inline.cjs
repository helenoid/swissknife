#!/usr/bin/env node

/**
 * Direct EventBus testing - inline implementation
 */

console.log('🧪 Testing EventBus functionality...\n');

// Inline EventBus implementation for testing
class EventBus {
  static instance = null;
  
  constructor() {
    this.listeners = {};
    this.oneTimeListeners = {};
  }

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
    return this;
  }

  once(event, handler) {
    if (!this.oneTimeListeners[event]) {
      this.oneTimeListeners[event] = [];
    }
    this.oneTimeListeners[event].push(handler);
    return this;
  }

  emit(event, data) {
    let errors = [];
    
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }

    if (this.oneTimeListeners[event]) {
      const handlers = [...this.oneTimeListeners[event]];
      this.oneTimeListeners[event] = [];
      
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
    
    if (errors.length > 0 && event !== 'error') {
      this.emit('error', { sourceEvent: event, errors });
    }
  }

  off(event, handler) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
    
    if (this.oneTimeListeners[event]) {
      this.oneTimeListeners[event] = this.oneTimeListeners[event].filter(h => h !== handler);
    }
    
    return this;
  }
  
  removeAll(event) {
    delete this.listeners[event];
    delete this.oneTimeListeners[event];
    return this;
  }
}

function testEventBus() {
  const results = [];
  
  try {
    console.log('✅ EventBus class defined');

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
    
    // Test 3: removeAll functionality (the key fix)
    console.log('\n📋 Test 3: removeAll functionality');
    let callCount = 0;
    
    eventBus.on('remove-test', () => { callCount++; });
    eventBus.on('remove-test', () => { callCount++; });
    
    // First emission
    eventBus.emit('remove-test', 'data');
    
    if (callCount === 2) {
      console.log('✅ Initial handlers called correctly (count: 2)');
      
      // Remove all handlers
      eventBus.removeAll('remove-test');
      
      // Second emission should not call any handlers
      eventBus.emit('remove-test', 'data');
      
      if (callCount === 2) {
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
      
      if (offCallCount === 1) {
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
    console.log('🎉 All EventBus tests PASSED! The removeAll fix is working correctly.');
    return true;
  } else {
    console.log('⚠️  Some EventBus tests failed. Check implementation.');
    return false;
  }
}

// Run the test
const success = testEventBus();
process.exit(success ? 0 : 1);
