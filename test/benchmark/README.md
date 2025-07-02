# SwissKnife Benchmark Tests

This directory contains benchmark tests for measuring the performance of critical SwissKnife components across all project phases.

## Overview

Benchmark tests provide quantitative measurements of component performance for:
- Establishing performance baselines
- Detecting performance regressions
- Identifying optimization opportunities
- Comparing different implementations

## Directory Structure

```
benchmark/
├── phase1.benchmark.ts    # Configuration and Command Registry benchmarks
├── phase2.benchmark.ts    # AI Agent, Task System, and Storage benchmarks
├── phase3.benchmark.ts    # TaskNet enhancement benchmarks
├── phase4.benchmark.ts    # CLI integration benchmarks
└── phase5.benchmark.ts    # Performance optimization benchmarks
```

## Running Benchmarks

### Running All Benchmarks

```bash
npm run test:benchmark
```

### Running Phase-Specific Benchmarks

```bash
# Run benchmarks for specific phases
npm run test:benchmark:phase1
npm run test:benchmark:phase2
npm run test:benchmark:phase3
npm run test:benchmark:phase4
npm run test:benchmark:phase5

# Run all phase benchmarks
npm run test:benchmark:all
```

## Interpreting Results

Benchmark results include:
- **min**: Minimum execution time (ms)
- **max**: Maximum execution time (ms)
- **avg**: Average execution time (ms)
- **p95**: 95th percentile (near worst-case) execution time (ms)
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

## Performance Thresholds

Each benchmark test includes assertions for expected performance thresholds, which serve as regression tests to catch performance degradation.

## Best Practices for Writing Benchmarks

1. **Isolate Components**: Use mocks for dependencies to isolate the component being benchmarked
2. **Consistent Environment**: Run benchmarks in a consistent environment
3. **Appropriate Iterations**:
   - Simple operations: 100-1000 iterations
   - Medium complexity: 50-100 iterations
   - Complex operations: 10-50 iterations
4. **Test Different Conditions**: Test with various input sizes, concurrency levels, etc.

## Documentation

For more information, see:
- [Benchmark Quick Reference](/docs/phase5/benchmark_quick_reference.md)
- [Testing Framework Guide](/docs/phase5/testing_framework_guide.md)
