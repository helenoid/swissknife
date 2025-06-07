/**
 * Benchmark runner for SwissKnife
 * 
 * This script runs performance benchmarks to measure execution time and 
 * resource usage of critical components in the SwissKnife system.
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { spawnSync } from 'child_process';

// Ensure benchmark results directory exists
const RESULTS_DIR = path.join(process.cwd(), 'benchmark-results');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Define benchmarks to run
const benchmarks = [
  {
    name: 'Command Execution',
    description: 'Measures the performance of executing basic commands',
    run: benchmarkCommandExecution
  },
  {
    name: 'Model Inference',
    description: 'Measures the performance of model inference operations',
    run: benchmarkModelInference
  },
  {
    name: 'Task Scheduling',
    description: 'Measures the performance of the Fibonacci heap task scheduler',
    run: benchmarkTaskScheduling
  },
  {
    name: 'Storage Operations',
    description: 'Measures the performance of storage operations',
    run: benchmarkStorageOperations
  }
];

async function main() {
  console.log('🏎️  Running SwissKnife Performance Benchmarks');
  
  const results = {
    timestamp: new Date().toISOString(),
    system: getSystemInfo(),
    benchmarks: {}
  };
  
  for (const benchmark of benchmarks) {
    console.log(`\n📊 Running benchmark: ${benchmark.name}`);
    console.log(benchmark.description);
    
    try {
      const benchmarkResult = await benchmark.run();
      results.benchmarks[benchmark.name] = benchmarkResult;
      
      console.log(`✅ ${benchmark.name} completed successfully`);
      console.log(`   Average execution time: ${benchmarkResult.averageExecutionMs.toFixed(2)}ms`);
      
      if (benchmarkResult.operationsPerSecond) {
        console.log(`   Operations per second: ${benchmarkResult.operationsPerSecond.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`❌ ${benchmark.name} failed:`, error);
      results.benchmarks[benchmark.name] = { error: error.message };
    }
  }
  
  // Save results
  const resultsPath = path.join(RESULTS_DIR, `benchmark-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 Benchmark results saved to ${resultsPath}`);
  
  // Compare with previous results if available
  compareWithPreviousResults(results);
}

/**
 * Get system information
 */
function getSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cpus: getCPUInfo(),
    memory: {
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  };
}

/**
 * Get CPU information
 */
function getCPUInfo() {
  try {
    const os = require('os');
    const cpus = os.cpus();
    return {
      count: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Benchmark command execution performance
 */
async function benchmarkCommandExecution() {
  const iterations = 10;
  const executionTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    // Run a simple help command
    const result = spawnSync('node', ['cli.mjs', 'help'], { 
      encoding: 'utf8',
      timeout: 5000
    });
    
    if (result.error || result.status !== 0) {
      throw new Error(`Command execution failed: ${result.error || result.stderr}`);
    }
    
    const end = performance.now();
    executionTimes.push(end - start);
  }
  
  const averageExecutionMs = executionTimes.reduce((a, b) => a + b, 0) / iterations;
  const operationsPerSecond = 1000 / averageExecutionMs;
  
  return {
    iterations,
    executionTimes,
    averageExecutionMs,
    operationsPerSecond
  };
}

/**
 * Benchmark model inference performance
 */
async function benchmarkModelInference() {
  // Import modules needed for testing model inference
  try {
    // In a real benchmark, we would use actual models
    // For this example, we'll simulate model inference with timeouts
    
    const iterations = 5;
    const executionTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate model inference with timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const end = performance.now();
      executionTimes.push(end - start);
    }
    
    const averageExecutionMs = executionTimes.reduce((a, b) => a + b, 0) / iterations;
    const operationsPerSecond = 1000 / averageExecutionMs;
    
    return {
      iterations,
      executionTimes,
      averageExecutionMs,
      operationsPerSecond,
      note: "This is a simulation - real model inference would be tested in a complete implementation"
    };
  } catch (error) {
    throw new Error(`Model inference benchmark error: ${error.message}`);
  }
}

/**
 * Benchmark task scheduling performance
 */
async function benchmarkTaskScheduling() {
  try {
    // In a real benchmark, we would use the actual scheduler
    // For this example, we'll simulate fibonacci heap operations
    
    const iterations = 1000;
    const taskCount = 1000;
    const executionTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const tasks = Array.from({ length: taskCount }, (_, i) => ({
        id: `task-${i}`,
        priority: Math.floor(Math.random() * 100)
      }));
      
      const start = performance.now();
      
      // Simulate heap operations (insert, extractMin)
      const heap = [];
      
      // Insert
      for (const task of tasks) {
        heap.push(task);
        // Simulate a simple heap sort after each insertion
        heap.sort((a, b) => a.priority - b.priority);
      }
      
      // Extract min (pop lowest priority)
      for (let j = 0; j < taskCount; j++) {
        heap.shift();
      }
      
      const end = performance.now();
      executionTimes.push(end - start);
    }
    
    const averageExecutionMs = executionTimes.reduce((a, b) => a + b, 0) / iterations;
    const operationsPerSecond = 1000 / averageExecutionMs;
    
    return {
      iterations,
      taskCount,
      executionTimes,
      averageExecutionMs,
      operationsPerSecond,
      note: "This is a simplified simulation - real heap operations would be tested in a complete implementation"
    };
  } catch (error) {
    throw new Error(`Task scheduling benchmark error: ${error.message}`);
  }
}

/**
 * Benchmark storage operations performance
 */
async function benchmarkStorageOperations() {
  try {
    // In a real benchmark, we would use the actual storage system
    // For this example, we'll simulate storage operations with filesystem
    
    const iterations = 100;
    const executionTimes = [];
    const testDir = path.join(RESULTS_DIR, 'test-storage');
    
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Write file
      const testFile = path.join(testDir, `test-${i}.json`);
      const testData = { test: `data-${i}`, timestamp: Date.now() };
      fs.writeFileSync(testFile, JSON.stringify(testData));
      
      // Read file
      const readData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
      
      // Delete file
      fs.unlinkSync(testFile);
      
      const end = performance.now();
      executionTimes.push(end - start);
    }
    
    // Clean up
    try {
      fs.rmdirSync(testDir);
    } catch (error) {
      // Ignore error if directory isn't empty
    }
    
    const averageExecutionMs = executionTimes.reduce((a, b) => a + b, 0) / iterations;
    const operationsPerSecond = 1000 / averageExecutionMs;
    
    return {
      iterations,
      executionTimes,
      averageExecutionMs,
      operationsPerSecond,
      note: "This benchmark uses filesystem operations as a proxy for storage performance"
    };
  } catch (error) {
    throw new Error(`Storage operations benchmark error: ${error.message}`);
  }
}

/**
 * Compare current benchmark results with previous runs
 */
function compareWithPreviousResults(currentResults) {
  try {
    // Find previous benchmark results
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(file => file.startsWith('benchmark-') && file.endsWith('.json'))
      .sort();
    
    if (files.length <= 1) {
      console.log('\n⚠️  No previous benchmark results found for comparison');
      return;
    }
    
    // Get the second most recent file (most recent is the current one)
    const previousFile = files[files.length - 2];
    const previousResults = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, previousFile), 'utf8'));
    
    console.log('\n📈 Comparison with previous benchmark results:');
    
    for (const benchmarkName in currentResults.benchmarks) {
      if (previousResults.benchmarks[benchmarkName] && 
          !previousResults.benchmarks[benchmarkName].error &&
          !currentResults.benchmarks[benchmarkName].error) {
        
        const current = currentResults.benchmarks[benchmarkName].averageExecutionMs;
        const previous = previousResults.benchmarks[benchmarkName].averageExecutionMs;
        const change = ((current - previous) / previous) * 100;
        
        console.log(`   ${benchmarkName}:`);
        console.log(`     Previous: ${previous.toFixed(2)}ms`);
        console.log(`     Current:  ${current.toFixed(2)}ms`);
        console.log(`     Change:   ${change.toFixed(2)}% ${change > 0 ? '⬆️ (slower)' : '⬇️ (faster)'}`);
      }
    }
  } catch (error) {
    console.error('Error comparing benchmark results:', error);
  }
}

// Run the benchmarks
main().catch(error => {
  console.error('Benchmark error:', error);
  process.exit(1);
});