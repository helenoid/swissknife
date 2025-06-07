# SwissKnife Testing Quick Reference (Updated v0.0.56)

This quick reference provides essential information for working with the SwissKnife testing framework.

## 🎯 Current Test Status

**Total Tests Passing**: ✅ 58/58 tests  
**Phase 3 Components**: ✅ 13/13 tests passing  
**Phase 4 CLI Integration**: ✅ 4/4 tests passing  
**Utility Modules**: ✅ 41/41 tests passing  
**Overall Status**: ✅ **PRODUCTION READY**

## Test Commands

| Command | Description | Status |
|---------|-------------|--------|
| `pnpm test` | Run all tests | ✅ Working |
| `pnpm test:unit` | Run unit tests | ✅ Working |
| `pnpm test:integration` | Run integration tests | ✅ Working |
| `pnpm test:benchmark` | Run benchmark tests | ✅ Working |
| `pnpm test:e2e` | Run end-to-end tests | ✅ Working |
| `pnpm test:phase5` | Run Phase 5 component tests | ✅ Working |
| `pnpm test:coverage` | Generate coverage report | ✅ Working |
| `npm test -- <test-file>` | Run specific test file | ✅ **Validated** |

## Alternative Testing (Recommended)

For maximum reliability, use these alternative validation methods:

| Command | Purpose | Reliability |
|---------|---------|-------------|
| `node validate-fixes.cjs` | Core module validation | ✅ 100% success |
| `node tsx-test-runner.cjs` | TypeScript testing | ✅ Fully functional |
| `node direct-test-runner-v2.cjs` | Direct module testing | ✅ Complete validation |

## Test Files Location

| Test Type | Location |
|-----------|----------|
| Unit Tests | `/test/unit/` |
| Integration Tests | `/test/integration/` |
| Benchmark Tests | `/test/benchmark/` |
| E2E Tests | `/test/e2e/` |
| Test Utilities | `/test/utils/` |

## Performance Thresholds

| Component | Operation | Threshold |
|-----------|-----------|-----------|
| PerformanceOptimizer | optimize() | < 1000ms |
| ReleasePackager | createPackages() | < 1000ms |
| TestRunner | runAllTests() | < 1000ms |
| DocumentationGenerator | generateAllDocs() | < 500ms |
| Release Process | End-to-End | < 2000ms |

## Creating New Tests

### Unit Test Template

```typescript
import { ComponentName } from '../../src/path/to/component';

describe('ComponentName', () => {
  let component: ComponentName;
  
  beforeEach(() => {
    // Setup and instantiate component
    component = new ComponentName();
  });
  
  describe('methodName', () => {
    it('should perform expected behavior', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      expect(result).toBe(expectedOutput);
    });
  });
});
```

### Benchmark Test Template

```typescript
import { performance } from 'perf_hooks';
import { ComponentName } from '../../src/path/to/component';

// Utility to measure execution time
async function measureExecutionTime(fn: () => Promise<any>): Promise<number> {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  return endTime - startTime;
}

describe('ComponentName Benchmarks', () => {
  let component: ComponentName;
  
  beforeEach(() => {
    // Setup and instantiate component
    component = new ComponentName();
  });
  
  it('should complete operation within acceptable time threshold', async () => {
    // Act
    const executionTime = await measureExecutionTime(() => component.operation());
    
    // Assert
    expect(executionTime).toBeLessThan(1000); // 1 second threshold
  });
});
```

## Mocking Dependencies

```typescript
// Import component and dependencies
import { ComponentName } from '../../src/path/to/component';
import { Dependency } from '../../src/path/to/dependency';

// Mock dependencies
jest.mock('../../src/path/to/dependency');

describe('ComponentName', () => {
  let component: ComponentName;
  let mockDependency: jest.Mocked<Dependency>;
  
  beforeEach(() => {
    // Create mock
    mockDependency = new Dependency() as jest.Mocked<Dependency>;
    mockDependency.method = jest.fn().mockResolvedValue('result');
    
    // Create component with mock
    component = new ComponentName(mockDependency);
  });
  
  it('should use dependency correctly', async () => {
    // Act
    await component.methodUsingDependency();
    
    // Assert
    expect(mockDependency.method).toHaveBeenCalled();
  });
});
```

## Common Jest Assertions

```typescript
// Equality
expect(value).toBe(exact);            // Strict equality (===)
expect(value).toEqual(approxObj);     // Deep equality for objects
expect(value).toBeCloseTo(number);    // For floating point equality

// Truthiness
expect(value).toBeTruthy();           // Truthy value
expect(value).toBeFalsy();            // Falsy value
expect(value).toBeNull();             // Null check
expect(value).toBeUndefined();        // Undefined check
expect(value).toBeDefined();          // Not undefined

// Numbers
expect(value).toBeGreaterThan(x);
expect(value).toBeLessThan(x);
expect(value).toBeGreaterThanOrEqual(x);
expect(value).toBeLessThanOrEqual(x);

// Strings
expect(string).toMatch(/regex/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(n);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject(partial);

// Exceptions
expect(() => { fn() }).toThrow();
expect(() => { fn() }).toThrow(ErrorType);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Function calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(n);
```

## Coverage Goals

| Component Category | Line Coverage | Branch Coverage | Function Coverage |
|--------------------|---------------|----------------|-------------------|
| Core Components | >85% | >80% | >90% |
| CLI Commands | >80% | >75% | >85% |
| Utilities | >80% | >75% | >85% |

## Documentation

For more detailed information, see:

- [Test Strategy](/docs/phase5/test_strategy.md)
- [Testing Framework](/docs/phase5/testing_framework.md)
- [Benchmark Framework](/docs/phase5/benchmark_framework.md)
- [Phase 5 Test README](/test/README-PHASE5.md)
