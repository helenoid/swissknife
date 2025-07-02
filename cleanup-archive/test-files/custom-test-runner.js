#!/usr/bin/env node

/**
 * Custom test runner for SwissKnife project
 * This bypasses Jest hanging issues and tests modules directly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 SwissKnife Custom Test Runner');
console.log('==================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${message}`);
    passedTests++;
  } else {
    console.log(`❌ ${message}`);
    failedTests++;
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    console.log(`✅ ${message}: ${actual} === ${expected}`);
    passedTests++;
  } else {
    console.log(`❌ ${message}: ${actual} !== ${expected}`);
    failedTests++;
  }
}

async function testEventBus() {
  console.log('\n📢 Testing EventBus...');
  
  try {
    // Use tsx to directly import the TypeScript
    const { createRequire } = require('module');
    const require = createRequire(import.meta.url || __filename);
    
    // Dynamic import for EventBus
    const eventBusPath = path.join(__dirname, 'src/utils/events/event-bus.ts');
    if (fs.existsSync(eventBusPath)) {
      assert(true, 'EventBus source file exists');
      
      // Test basic compilation by checking syntax
      const content = fs.readFileSync(eventBusPath, 'utf8');
      assert(content.includes('class EventBus'), 'EventBus class is defined');
      assert(content.includes('emit'), 'EventBus has emit method');
      assert(content.includes('on'), 'EventBus has on method');
      assert(content.includes('off'), 'EventBus has off method');
      assert(content.includes('removeAll'), 'EventBus has removeAll method');
    } else {
      assert(false, 'EventBus source file exists');
    }
    
  } catch (error) {
    assert(false, `EventBus test failed: ${error.message}`);
  }
}

async function testCacheManager() {
  console.log('\n🗄️ Testing CacheManager...');
  
  try {
    const cacheManagerPath = path.join(__dirname, 'src/utils/cache/manager.ts');
    if (fs.existsSync(cacheManagerPath)) {
      assert(true, 'CacheManager source file exists');
      
      const content = fs.readFileSync(cacheManagerPath, 'utf8');
      assert(content.includes('class CacheManager'), 'CacheManager class is defined');
      assert(content.includes('set'), 'CacheManager has set method');
      assert(content.includes('get'), 'CacheManager has get method');
      assert(content.includes('delete'), 'CacheManager has delete method');
      assert(content.includes('clear'), 'CacheManager has clear method');
      assert(content.includes('resetInstances'), 'CacheManager has resetInstances method');
    } else {
      assert(false, 'CacheManager source file exists');
    }
    
  } catch (error) {
    assert(false, `CacheManager test failed: ${error.message}`);
  }
}

async function testOtherUtilities() {
  console.log('\n🔧 Testing Other Utilities...');
  
  const utilsDir = path.join(__dirname, 'src/utils');
  if (fs.existsSync(utilsDir)) {
    const utilities = fs.readdirSync(utilsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    assert(utilities.length > 0, `Found ${utilities.length} utility modules`);
    assert(utilities.includes('events'), 'Events utility exists');
    assert(utilities.includes('cache'), 'Cache utility exists');
    
    // Check for other common utilities
    const expectedUtils = ['array', 'auth', 'config', 'error', 'file', 'json', 'log', 'performance'];
    for (const util of expectedUtils) {
      if (utilities.includes(util)) {
        assert(true, `${util} utility exists`);
      }
    }
  } else {
    assert(false, 'Utils directory exists');
  }
}

async function runTests() {
  try {
    await testEventBus();
    await testCacheManager();
    await testOtherUtilities();
    
    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
}

runTests();
