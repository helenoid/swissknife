/**
 * Benchmark Tests for Phase 1 Components
 * 
 * This file contains benchmark tests for core Phase 1 components:
 * - Configuration system
 * - Command registry
 */

const { performance } = require('perf_hooks');
const ConfigurationManager = require('../../src/config/manager').ConfigurationManager;
const CommandRegistry = require('../../src/commands/registry').CommandRegistry;

/**
 * Benchmark helper that measures execution time of a function
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} Benchmark results with min, max, avg times
 */
async function benchmark(fn, iterations = 100) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const sum = times.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: sum / times.length,
    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
    iterations
  };
}

describe('Phase 1 Benchmark Tests', () => {
  // Configuration Manager benchmarks
  describe('ConfigurationManager', () => {
    let configManager;
    
    beforeEach(() => {
      // Create a fresh instance for each test with in-memory storage
      configManager = ConfigurationManager.getInstance({ inMemory: true });
      
      // Initialize with some test data
      configManager.set('test.string', 'string-value');
      configManager.set('test.number', 123);
      configManager.set('test.boolean', true);
      configManager.set('test.object', { key: 'value', nested: { key: 'value' } });
      configManager.set('test.array', [1, 2, 3, 4, 5]);
    });
    
    test('get() performance', async () => {
      const results = await benchmark(() => {
        configManager.get('test.string');
        configManager.get('test.number');
        configManager.get('test.boolean');
        configManager.get('test.object');
        configManager.get('test.array');
        configManager.get('nonexistent.key', 'default');
      });
      
      console.log('ConfigurationManager.get() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(5); // Should be very fast (< 5ms)
    });
    
    test('set() performance', async () => {
      const results = await benchmark(() => {
        configManager.set('benchmark.key1', 'value-' + Math.random());
        configManager.set('benchmark.key2', Math.random() * 1000);
        configManager.set('benchmark.key3', { random: Math.random() });
      });
      
      console.log('ConfigurationManager.set() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(10); // Should be reasonably fast (< 10ms)
    });
    
    test('load() and save() performance', async () => {
      const results = await benchmark(async () => {
        await configManager.save();
        await configManager.load();
      }, 20); // Fewer iterations for I/O operations
      
      console.log('ConfigurationManager load/save performance:', results);
      
      // Set some expectation thresholds (more lenient for I/O)
      expect(results.avg).toBeLessThan(50); // Should be under 50ms
    });
  });
  
  // Command Registry benchmarks
  describe('CommandRegistry', () => {
    let registry;
    
    beforeEach(() => {
      registry = new CommandRegistry();
      
      // Register some test commands
      for (let i = 0; i < 20; i++) {
        registry.register(`test-command-${i}`, {
          execute: () => `Executed test command ${i}`,
          description: `Test command ${i}`,
          usage: `test-command-${i} [options]`,
          options: {
            option1: { type: 'string', description: 'Option 1' },
            option2: { type: 'boolean', description: 'Option 2' }
          }
        });
      }
    });
    
    test('register() performance', async () => {
      let counter = 100; // Start from a different range
      
      const results = await benchmark(() => {
        registry.register(`bench-command-${counter++}`, {
          execute: () => 'Benchmark command',
          description: 'Benchmark command description',
          usage: 'bench-command [options]'
        });
      });
      
      console.log('CommandRegistry.register() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(2); // Should be very fast (< 2ms)
    });
    
    test('get() performance', async () => {
      const results = await benchmark(() => {
        registry.get('test-command-1');
        registry.get('test-command-5');
        registry.get('test-command-10');
        registry.get('test-command-15');
        registry.get('nonexistent-command'); // Should handle missing commands efficiently
      });
      
      console.log('CommandRegistry.get() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(1); // Should be extremely fast (< 1ms)
    });
    
    test('execute() performance', async () => {
      const results = await benchmark(() => {
        registry.execute('test-command-3', { option1: 'test', option2: true });
        registry.execute('test-command-7', { option1: 'benchmark' });
        registry.execute('test-command-12', { option2: false });
      });
      
      console.log('CommandRegistry.execute() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(5); // Should be fast (< 5ms)
    });
    
    test('list() performance', async () => {
      const results = await benchmark(() => {
        registry.list();
      });
      
      console.log('CommandRegistry.list() performance:', results);
      
      // Set some expectation thresholds
      expect(results.avg).toBeLessThan(1); // Should be very fast (< 1ms)
    });
  });
});
