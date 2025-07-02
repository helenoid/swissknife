/**
 * Benchmark utilities for performance testing
 */

/**
 * Measures the execution time of a function and reports the results
 */
export async function benchmarkFunction(
  name: string,
  fn: () => Promise<any>,
  iterations: number = 1
): Promise<{ name: string, totalMs: number, avgMs: number, minMs: number, maxMs: number }> {
  console.log(`Running benchmark: ${name} (${iterations} iterations)`);
  
  const times: number[] = [];
  let totalMs = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = process.hrtime.bigint();
    await fn();
    const endTime = process.hrtime.bigint();
    
    const durationMs = Number(endTime - startTime) / 1_000_000;
    times.push(durationMs);
    totalMs += durationMs;
    
    // Progress indicator for long-running benchmarks
    if (iterations > 10 && i % Math.floor(iterations / 10) === 0) {
      process.stdout.write('.');
    }
  }
  
  const avgMs = totalMs / iterations;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  
  if (iterations > 10) {
    process.stdout.write('\n');
  }
  
  console.log(`  Total: ${totalMs.toFixed(2)}ms`);
  console.log(`  Avg: ${avgMs.toFixed(2)}ms`);
  console.log(`  Min: ${minMs.toFixed(2)}ms`);
  console.log(`  Max: ${maxMs.toFixed(2)}ms`);
  console.log('-----------------------------------');
  
  return { name, totalMs, avgMs, minMs, maxMs };
}

/**
 * Runs a suite of benchmarks and reports results
 */
export async function runBenchmarkSuite(
  name: string,
  benchmarks: Array<{ name: string, fn: () => Promise<any>, iterations?: number }>
): Promise<void> {
  console.log(`\n======= BENCHMARK SUITE: ${name} =======\n`);
  
  const results = [];
  
  for (const benchmark of benchmarks) {
    const result = await benchmarkFunction(
      benchmark.name,
      benchmark.fn,
      benchmark.iterations || 1
    );
    results.push(result);
  }
  
  console.log('\n======= SUMMARY =======\n');
  
  // Sort by average time (ascending)
  results.sort((a, b) => a.avgMs - b.avgMs);
  
  for (const result of results) {
    console.log(`${result.name}: ${result.avgMs.toFixed(2)}ms avg`);
  }
  
  console.log('\n=======================\n');
}

/**
 * Generates a random string of specified length
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a random object with specified depth and breadth
 */
export function randomObject(depth: number = 3, breadth: number = 5): any {
  if (depth <= 0) {
    // Leaf node
    return randomString(10);
  }
  
  const obj: any = {};
  
  for (let i = 0; i < breadth; i++) {
    const key = randomString(5);
    
    // Mix of values: objects, arrays, strings, numbers, booleans
    const valueType = Math.floor(Math.random() * 5);
    
    switch (valueType) {
      case 0: // Nested object
        obj[key] = randomObject(depth - 1, breadth);
        break;
      case 1: // Array
        const arr = [];
        for (let j = 0; j < breadth; j++) {
          arr.push(randomObject(depth - 1, breadth / 2));
        }
        obj[key] = arr;
        break;
      case 2: // String
        obj[key] = randomString(20);
        break;
      case 3: // Number
        obj[key] = Math.random() * 1000;
        break;
      case 4: // Boolean
        obj[key] = Math.random() > 0.5;
        break;
    }
  }
  
  return obj;
}