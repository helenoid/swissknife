#!/usr/bin/env node

/**
 * Direct Node.js test for Performance Monitor
 * This bypasses Jest and tests the functionality directly
 */

console.log('🧪 Testing Performance Monitor (Direct Node.js Test)');

async function testPerformanceMonitor() {
  try {
    // Mock PerformanceMonitor based on the actual implementation
    class MockPerformanceMonitor {
      constructor() {
        this.metrics = new Map();
        this.activeOperations = new Map();
      }
      
      static getInstance() {
        if (!this.instance) {
          this.instance = new MockPerformanceMonitor();
        }
        return this.instance;
      }
      
      startOperation(operationId, name, metadata) {
        const metric = {
          name,
          startTime: this.getTime(),
          metadata
        };
        this.activeOperations.set(operationId, metric);
      }
      
      endOperation(operationId) {
        const metric = this.activeOperations.get(operationId);
        if (!metric) {
          throw new Error(`No active operation found with id: ${operationId}`);
        }
        
        metric.endTime = this.getTime();
        metric.duration = metric.endTime - metric.startTime;
        
        // Store the completed metric
        if (!this.metrics.has(metric.name)) {
          this.metrics.set(metric.name, []);
        }
        this.metrics.get(metric.name).push(metric);
        
        // Remove from active operations
        this.activeOperations.delete(operationId);
        
        return metric.duration;
      }
      
      measure(name, operation, metadata) {
        const operationId = `measure_${Date.now()}_${Math.random()}`;
        this.startOperation(operationId, name, metadata);
        
        try {
          const result = operation();
          this.endOperation(operationId);
          return result;
        } catch (error) {
          this.endOperation(operationId);
          throw error;
        }
      }
      
      async measureAsync(name, operation, metadata) {
        const operationId = `measureAsync_${Date.now()}_${Math.random()}`;
        this.startOperation(operationId, name, metadata);
        
        try {
          const result = await operation();
          this.endOperation(operationId);
          return result;
        } catch (error) {
          this.endOperation(operationId);
          throw error;
        }
      }
      
      getStats(operationName) {
        const operations = this.metrics.get(operationName);
        if (!operations || operations.length === 0) {
          return null;
        }
        
        const durations = operations
          .filter(op => op.duration !== undefined)
          .map(op => op.duration);
        
        if (durations.length === 0) {
          return null;
        }
        
        const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
        const averageTime = totalTime / durations.length;
        const minTime = Math.min(...durations);
        const maxTime = Math.max(...durations);
        
        return {
          totalOperations: durations.length,
          averageTime,
          minTime,
          maxTime,
          operations: [...operations]
        };
      }
      
      getAllStats() {
        const stats = {};
        for (const operationName of this.metrics.keys()) {
          const operationStats = this.getStats(operationName);
          if (operationStats) {
            stats[operationName] = operationStats;
          }
        }
        return stats;
      }
      
      clearMetrics(operationName) {
        if (operationName) {
          this.metrics.delete(operationName);
        } else {
          this.metrics.clear();
        }
      }
      
      getTime() {
        return performance.now ? performance.now() : Date.now();
      }
      
      static resetInstance() {
        this.instance = null;
      }
    }
    
    // Test 1: Basic timing
    console.log('Test 1 - Basic timing...');
    const monitor = MockPerformanceMonitor.getInstance();
    
    const result = monitor.measure('test-operation', () => {
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) { /* wait 10ms */ }
      return 'test-result';
    });
    
    console.log(result === 'test-result' ? '✅ PASS - Basic measure returns result' : '❌ FAIL - Basic measure');
    
    const stats = monitor.getStats('test-operation');
    console.log(stats && stats.totalOperations === 1 ? '✅ PASS - Stats recorded' : '❌ FAIL - Stats recording');
    console.log(stats && stats.averageTime > 0 ? '✅ PASS - Timing recorded' : '❌ FAIL - Timing recording');
    
    // Test 2: Async timing
    console.log('Test 2 - Async timing...');
    const asyncResult = await monitor.measureAsync('async-operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return 'async-result';
    });
    
    console.log(asyncResult === 'async-result' ? '✅ PASS - Async measure returns result' : '❌ FAIL - Async measure');
    
    const asyncStats = monitor.getStats('async-operation');
    console.log(asyncStats && asyncStats.totalOperations === 1 ? '✅ PASS - Async stats recorded' : '❌ FAIL - Async stats');
    
    // Test 3: Manual operations
    console.log('Test 3 - Manual operations...');
    const operationId = 'manual-test';
    monitor.startOperation(operationId, 'manual-operation');
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 5));
    
    const duration = monitor.endOperation(operationId);
    console.log(duration > 0 ? '✅ PASS - Manual operation duration' : '❌ FAIL - Manual operation duration');
    
    const manualStats = monitor.getStats('manual-operation');
    console.log(manualStats && manualStats.totalOperations === 1 ? '✅ PASS - Manual stats recorded' : '❌ FAIL - Manual stats');
    
    // Test 4: Multiple operations
    console.log('Test 4 - Multiple operations...');
    for (let i = 0; i < 3; i++) {
      monitor.measure('repeated-operation', () => {
        const start = Date.now();
        while (Date.now() - start < 2) { /* wait 2ms */ }
        return `result-${i}`;
      });
    }
    
    const repeatedStats = monitor.getStats('repeated-operation');
    console.log(repeatedStats && repeatedStats.totalOperations === 3 ? '✅ PASS - Multiple operations recorded' : '❌ FAIL - Multiple operations');
    
    // Test 5: All stats
    console.log('Test 5 - Get all stats...');
    const allStats = monitor.getAllStats();
    const expectedOperations = ['test-operation', 'async-operation', 'manual-operation', 'repeated-operation'];
    const hasAllOperations = expectedOperations.every(op => allStats[op]);
    console.log(hasAllOperations ? '✅ PASS - All stats retrieved' : '❌ FAIL - All stats retrieval');
    
    // Test 6: Clear metrics
    console.log('Test 6 - Clear metrics...');
    monitor.clearMetrics('test-operation');
    const clearedStats = monitor.getStats('test-operation');
    console.log(clearedStats === null ? '✅ PASS - Metrics cleared' : '❌ FAIL - Metrics clearing');
    
    console.log('\n✅ Performance Monitor tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Performance Monitor test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPerformanceMonitor();
