#!/usr/bin/env tsx

/**
 * Alternative Test Suite - Bypasses Jest
 * Comprehensive testing using direct TypeScript execution
 */

console.log('🧪 SwissKnife Alternative Test Suite');
console.log('====================================');

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Simple assertion framework
 */
class Assert {
  static equals(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  static true(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }

  static exists(value: any, message?: string): void {
    if (value === null || value === undefined) {
      throw new Error(message || 'Expected value to exist');
    }
  }

  static throws(fn: () => void, message?: string): void {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new Error(message || 'Expected function to throw');
    }
  }
}

/**
 * Test runner function
 */
async function runTest(name: string, testFn: () => Promise<void> | void): Promise<void> {
  totalTests++;
  const startTime = Date.now();
  
  try {
    console.log(`📝 ${name}`);
    await testFn();
    const duration = Date.now() - startTime;
    passedTests++;
    console.log(`  ✅ PASS (${duration}ms)`);
    results.push({ name, status: 'PASS', duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    failedTests++;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ FAIL (${duration}ms): ${message}`);
    results.push({ name, status: 'FAIL', duration, error: message });
  }
}

/**
 * FibonacciHeap Tests
 */
async function testFibonacciHeap(): Promise<void> {
  const { FibonacciHeap } = await import('./src/tasks/scheduler/fibonacci-heap.js');
  
  await runTest('FibonacciHeap - Basic Insert and Extract', () => {
    const heap = new FibonacciHeap<string>();
    heap.insert(5, 'five');
    heap.insert(3, 'three');
    heap.insert(7, 'seven');
    
    Assert.equals(heap.findMin(), 'three', 'Should find minimum value');
    Assert.equals(heap.extractMin(), 'three', 'Should extract minimum value');
    Assert.equals(heap.findMin(), 'five', 'Should find new minimum after extraction');
  });

  await runTest('FibonacciHeap - Empty Heap Behavior', () => {
    const heap = new FibonacciHeap<string>();
    
    Assert.true(heap.isEmpty(), 'New heap should be empty');
    Assert.equals(heap.findMin(), null, 'Empty heap should return null for findMin');
    Assert.equals(heap.extractMin(), null, 'Empty heap should return null for extractMin');
  });

  await runTest('FibonacciHeap - Complex Operations', () => {
    const heap = new FibonacciHeap<number>();
    
    // Insert multiple values
    for (let i = 10; i > 0; i--) {
      heap.insert(i, i);
    }
    
    // Extract in order
    for (let i = 1; i <= 10; i++) {
      Assert.equals(heap.extractMin(), i, `Should extract ${i} in order`);
    }
    
    Assert.true(heap.isEmpty(), 'Heap should be empty after extracting all elements');
  });
}

/**
 * CLI Component Tests
 */
async function testCLIComponents(): Promise<void> {
  const { Command } = await import('commander');
  
  await runTest('Commander - Basic Instantiation', () => {
    const program = new Command();
    Assert.exists(program, 'Program should be created');
    Assert.equals(typeof program.command, 'function', 'Program should have command method');
  });

  await runTest('IPFSCommand - Import and Instantiation', async () => {
    const { IPFSCommand } = await import('./src/cli/commands/ipfsCommand.js');
    const program = new Command();
    const ipfsCommand = new IPFSCommand(program);
    
    Assert.exists(ipfsCommand, 'IPFSCommand should be created');
    Assert.equals(typeof ipfsCommand.register, 'function', 'Should have register method');
  });

  await runTest('IPFSCommand - Command Registration', async () => {
    const { IPFSCommand } = await import('./src/cli/commands/ipfsCommand.js');
    const program = new Command();
    const ipfsCommand = new IPFSCommand(program);
    
    // This should not throw
    ipfsCommand.register();
    
    // Check if commands were added
    const commands = program.commands;
    const hasIpfsCommand = commands.some(cmd => cmd.name() === 'ipfs');
    Assert.true(hasIpfsCommand, 'IPFS command should be registered');
  });
}

/**
 * Utility Tests
 */
async function testUtilities(): Promise<void> {
  await runTest('Logger - Basic Import', async () => {
    const { logger } = await import('./src/utils/logger.js');
    Assert.exists(logger, 'Logger should be importable');
    Assert.equals(typeof logger.info, 'function', 'Logger should have info method');
    Assert.equals(typeof logger.error, 'function', 'Logger should have error method');
  });
}

/**
 * Configuration Tests
 */
async function testConfiguration(): Promise<void> {
  const fs = await import('fs');
  
  await runTest('Package.json - Existence and Structure', () => {
    Assert.true(fs.existsSync('package.json'), 'package.json should exist');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    Assert.exists(packageJson.name, 'Package should have name');
    Assert.exists(packageJson.version, 'Package should have version');
    Assert.exists(packageJson.scripts, 'Package should have scripts');
  });

  await runTest('TypeScript Config - Existence', () => {
    Assert.true(fs.existsSync('tsconfig.json'), 'tsconfig.json should exist');
    Assert.true(fs.existsSync('tsconfig.test.json'), 'tsconfig.test.json should exist');
  });
}

/**
 * Main test execution
 */
async function runAllTests(): Promise<void> {
  console.log('Starting comprehensive test suite...\n');
  
  try {
    await testFibonacciHeap();
    console.log('');
    
    await testCLIComponents();
    console.log('');
    
    await testUtilities();
    console.log('');
    
    await testConfiguration();
    console.log('');
    
  } catch (error) {
    console.error('Test suite error:', error);
  }
  
  // Summary
  console.log('🎯 Test Suite Summary');
  console.log('====================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log(`\n${failedTests === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed'}`);
  
  // Exit with appropriate code
  process.exit(failedTests === 0 ? 0 : 1);
}

// Run the test suite
runAllTests().catch(error => {
  console.error('Fatal error in test suite:', error);
  process.exit(1);
});
