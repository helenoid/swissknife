# SwissKnife Benchmark Framework

This document provides a quick reference for the SwissKnife benchmark framework, which measures and tracks the performance of critical components across all project phases.

## Overview

The benchmark framework is designed to:

1. Measure performance of key components
2. Establish baseline performance metrics
3. Detect performance regressions
4. Identify optimization opportunities
5. Compare performance across different implementations

## Benchmark Structure

Benchmarks are organized by project phase:

```
test/benchmark/
├── phase1.benchmark.ts  # Configuration and Command Registry benchmarks
├── phase2.benchmark.ts  # AI Agent, Task System, and Storage benchmarks
├── phase3.benchmark.ts  # TaskNet enhancement benchmarks
├── phase4.benchmark.ts  # CLI integration benchmarks
└── phase5.benchmark.ts  # Performance optimization benchmarks
```

## Running Benchmarks

### Running All Benchmarks

```bash
npm run test:benchmark
```

### Running Phase-Specific Benchmarks

```bash
npx jest test/benchmark/phase1.benchmark.ts
npx jest test/benchmark/phase2.benchmark.ts
npx jest test/benchmark/phase3.benchmark.ts
npx jest test/benchmark/phase4.benchmark.ts
npx jest test/benchmark/phase5.benchmark.ts
```

### Benchmark Output

Benchmark results are displayed in the console and include:

- **min**: Minimum execution time (ms)
- **max**: Maximum execution time (ms)
- **avg**: Average execution time (ms)
- **p95**: 95th percentile execution time (ms)
- **p50**: Median execution time (ms)
- **iterations**: Number of iterations run

Example output:
```
ConfigurationManager.get() performance: {
  min: 0.12,
  max: 3.45,
  avg: 0.78,
  p95: 2.1,
  p50: 0.65,
  iterations: 100
}
```

## Writing Benchmark Tests

### Benchmark Helper

Each benchmark file includes a helper function to measure execution time:

```typescript
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
    p50: times.sort((a, b) => a - b)[Math.floor(times.length * 0.5)],
    iterations
  };
}
```

### Example Benchmark

```typescript
test('ConfigurationManager.get() performance', async () => {
  const results = await benchmark(() => {
    configManager.get('test.string');
    configManager.get('test.number');
    configManager.get('test.boolean');
    configManager.get('test.object');
  });
  
  console.log('ConfigurationManager.get() performance:', results);
  
  // Performance assertions
  expect(results.avg).toBeLessThan(5); // Should be under 5ms
});
```

### Testing Different Input Sizes

For components where performance can vary with input size:

```typescript
// Test with different content sizes
const contents = [
  Buffer.from('Small content string'),            // Small
  Buffer.from('A'.repeat(1000)),                  // ~1KB
  Buffer.from('B'.repeat(10000))                  // ~10KB
];

for (const content of contents) {
  const results = await benchmark(async () => {
    await storageSystem.store(content);
  }, 20);
  
  console.log(`StorageSystem.store() performance (${content.length} bytes):`, results);
  expect(results.avg).toBeLessThan(30); // Should be under 30ms with mock
}
```

## Best Practices

1. **Isolate Components**: Use mocks for dependencies to isolate the component being benchmarked

2. **Consistent Environment**: Run benchmarks in a consistent environment for comparable results

3. **Appropriate Iterations**:
   - Simple operations: 100-1000 iterations
   - Medium complexity: 50-100 iterations
   - Complex or I/O operations: 10-50 iterations

4. **Realistic Data**: Use realistic data sizes and patterns that match production usage

5. **Variable Conditions**: Test under different conditions (input sizes, concurrency levels)

6. **Performance Thresholds**: Include assertions for acceptable performance thresholds

7. **Documentation**: Document expected performance characteristics and any known bottlenecks

8. **Periodic Runs**: Run benchmarks periodically to track performance over time

9. **CI Integration**: Include benchmark tests in CI pipeline with performance regression detection

## Interpreting Results

- Compare against established baselines
- Look for outliers (min/max values)
- Check the p95 value to understand worst-case performance
- Consider the use case requirements (e.g., real-time vs. batch processing)
- Compare different implementations or optimizations

## Common Benchmark Categories

- **I/O Performance**: File operations, network requests, database access
- **Memory Usage**: Allocation patterns, memory efficiency
- **CPU Performance**: Computation-intensive operations
- **Concurrency**: Performance under parallel execution
- **Scaling**: Performance as data size or workload increases
