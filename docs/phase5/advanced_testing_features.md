# Advanced Testing Features

This document describes the advanced testing features added to the SwissKnife testing framework.

## Event Tracing Framework

The event tracing framework provides sophisticated capabilities for testing complex asynchronous workflows in TaskNet components. It records and validates event sequences, making it easy to verify that components interact correctly.

### Key Features

- Recording of method calls and events with timestamps
- Validation of event sequences
- Recording of task lifecycle events
- Real-time event observation
- Proxy-based component tracing

### Usage Example

```typescript
import { TaskNetTracer, makeTraceable } from '../utils/event-tracer';

// Create a tracer and component
const tracer = new TaskNetTracer();
const taskManager = makeTraceable(new TaskManager(), tracer);

// Start recording
tracer.startRecording();

// Execute operations
const task = await taskManager.createTask({ title: 'Test Task' });
tracer.recordTaskCreation(task.id, task);
await taskManager.executeTask(task.id);
tracer.recordTaskCompletion(task.id, result);

// Validate sequence
expect(tracer.hasSequence([
  'task:created',
  'TaskManager:executeTask:called',
  'task:completed'
])).toBe(true);
```

## Platform-Specific Testing

The platform-specific testing framework ensures that SwissKnife works correctly across different operating systems by detecting the current platform and running appropriate tests.

### Tested Platform Features

- Path handling differences (Windows vs Unix)
- File system case sensitivity
- Environment variable handling
- Configuration directory locations
- Line ending differences (CRLF vs LF)
- Shell script compatibility

### Running Tests

```bash
npm run test:platform
```

## Benchmark Comparison Tool

The benchmark comparison tool enables tracking of performance over time and detects regressions between runs.

### Key Features

- Comparison of benchmark results between runs
- Automatic detection of performance regressions
- Detailed performance reports
- Configurable regression thresholds
- Integration with CI/CD pipeline

### Usage

```bash
# Collect benchmark results from all tests
npm run benchmark:collect

# Compare current results with baseline
npm run benchmark:compare --baseline benchmark-results/baseline.json --current benchmark-results/latest.json --threshold 10
```

### Report Format

The benchmark comparison tool generates reports in Markdown format:

```markdown
# SwissKnife Benchmark Comparison Report

Generated: 2025-05-10T12:34:56.789Z

## Summary

- Total Tests: 6
- Regressions: 1
- Improvements: 2
- No Significant Changes: 3
- Threshold for Significance: 10%

## Performance Regressions 🔴

| Test | Baseline (ms) | Current (ms) | Change (%) | P95 Change (%) |
|------|---------------|-------------|------------|----------------|
| TaskManager.processTasks | 270.40 | 320.85 | +18.66% | +15.24% |

## Performance Improvements 🟢

| Test | Baseline (ms) | Current (ms) | Change (%) | P95 Change (%) |
|------|---------------|-------------|------------|----------------|
| IPFSKitClient.getContent | 70.80 | 58.42 | -17.49% | -15.33% |
| DocumentationGenerator.generateAllDocs | 130.50 | 110.78 | -15.11% | -12.56% |

## No Significant Changes ⚪

| Test | Baseline (ms) | Current (ms) | Change (%) |
|------|---------------|-------------|------------|
| PerformanceOptimizer.optimize | 182.70 | 175.32 | -4.04% |
| ReleasePackager.createPackages | 350.60 | 358.42 | +2.23% |
| TestRunner.runAllTests | 450.30 | 442.85 | -1.65% |
```
