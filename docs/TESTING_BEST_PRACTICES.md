# SwissKnife Testing Best Practices Guide

This document provides comprehensive guidance on testing best practices for the SwissKnife project, emphasizing the advanced dependency injection patterns and comprehensive testing strategies that have been successfully implemented.

## 🎯 Overview

The SwissKnife testing architecture has evolved from simple component testing to comprehensive dependency injection mastery, enabling realistic testing scenarios that exercise actual business logic while maintaining full control over dependencies.

## Core Testing Principles

### 1. Comprehensive Dependency Injection
- **External Dependencies**: Mock all external libraries (fs, glob, chalk, uuid, etc.)
- **Internal Dependencies**: Inject internal services through constructors and factory methods
- **Singleton Services**: Use proper mocking patterns for singleton instances
- **Registry Patterns**: Mock registry-based dependencies for service discovery

### 2. Realistic Testing Scenarios
- **Business Logic Focus**: Test actual business logic rather than simplified scenarios
- **Error Path Coverage**: Comprehensive testing of error scenarios and edge cases
- **Integration Validation**: Verify proper interaction between components
- **Type Safety**: Maintain full TypeScript support with proper type checking

### 3. Maintainable Test Architecture
- **Standardized Patterns**: Use consistent patterns across all test suites
- **Reusable Mocks**: Create reusable mock patterns for common dependencies
- **Clear Structure**: Organize tests with clear setup, execution, and validation phases
- **Documentation**: Document complex mocking strategies for team understanding

## Dependency Injection Patterns

### External Dependency Mocking

#### File System Operations
```typescript
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn()
  },
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn()
}));

// Usage in test
const mockFs = require('fs');
mockFs.promises.readFile.mockResolvedValue('file content');
```

#### Glob Pattern Matching
```typescript
jest.mock('glob', () => ({
  glob: jest.fn(),
  globSync: jest.fn()
}));

// Usage in test
const { glob } = require('glob');
(glob as jest.Mock).mockResolvedValue(['file1.ts', 'file2.ts']);
```

#### External Libraries
```typescript
jest.mock('chalk', () => ({
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  bold: jest.fn((text) => text)
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345')
}));
```

#### LRU Cache
```typescript
jest.mock('lru-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    size: 0
  }));
});
```

### Internal Dependency Injection

#### Registry Pattern Mocking
```typescript
// Mock the registry module
jest.mock('../../../src/services/registry', () => ({
  Registry: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    list: jest.fn(),
    remove: jest.fn()
  }))
}));

// Create typed mock instance
const mockRegistry = {
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  list: jest.fn(),
  remove: jest.fn()
} as jest.Mocked<Registry>;
```

#### Singleton Pattern Mocking
```typescript
// Mock singleton service
jest.mock('../../../src/services/singleton-service', () => ({
  SingletonService: {
    getInstance: jest.fn()
  }
}));

// Create mock instance
const mockSingletonInstance = {
  method: jest.fn(),
  asyncMethod: jest.fn(),
  property: 'mock-value'
} as jest.Mocked<SingletonService>;

// Set up getInstance mock
const { SingletonService } = require('../../../src/services/singleton-service');
(SingletonService.getInstance as jest.Mock).mockReturnValue(mockSingletonInstance);
```

#### Service Injection
```typescript
describe('ComponentWithDependencies', () => {
  let component: ComponentWithDependencies;
  let mockService1: jest.Mocked<Service1>;
  let mockService2: jest.Mocked<Service2>;

  beforeEach(() => {
    // Create mocked dependencies
    mockService1 = {
      method1: jest.fn(),
      method2: jest.fn()
    } as jest.Mocked<Service1>;

    mockService2 = {
      asyncMethod: jest.fn(),
      property: 'mock-value'
    } as jest.Mocked<Service2>;

    // Inject dependencies through constructor
    component = new ComponentWithDependencies(mockService1, mockService2);
  });

  // Test methods...
});
```

## Test Structure Patterns

### Comprehensive Test Setup
```typescript
describe('ComponentName - Comprehensive Tests', () => {
  let testSubject: ComponentName;
  let mockExternalDep: jest.Mocked<ExternalDependency>;
  let mockInternalService: jest.Mocked<InternalService>;

  beforeEach(() => {
    // Reset all mocks and clear previous state
    jest.clearAllMocks();

    // Create mocked dependencies with default behaviors
    mockExternalDep = {
      method: jest.fn().mockReturnValue('default-result'),
      asyncMethod: jest.fn().mockResolvedValue('async-result')
    } as jest.Mocked<ExternalDependency>;

    mockInternalService = {
      serviceMethod: jest.fn().mockReturnValue('service-result'),
      asyncServiceMethod: jest.fn().mockResolvedValue('async-service-result')
    } as jest.Mocked<InternalService>;

    // Inject dependencies through constructor or factory
    testSubject = new ComponentName(mockExternalDep, mockInternalService);
  });

  afterEach(() => {
    // Clean up resources and reset singletons if needed
    ComponentName.resetInstances?.();
  });

  describe('business logic scenarios', () => {
    it('should handle normal operation flow', async () => {
      // Arrange
      const inputData = { key: 'value' };
      const expectedResult = { processed: true };

      // Act
      const result = await testSubject.processData(inputData);

      // Assert
      expect(mockExternalDep.method).toHaveBeenCalledWith(inputData);
      expect(mockInternalService.serviceMethod).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should handle dependency failures gracefully', async () => {
      // Arrange
      const errorMessage = 'External dependency failed';
      mockExternalDep.asyncMethod.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(testSubject.processDataAsync()).rejects.toThrow(errorMessage);
      expect(mockInternalService.asyncServiceMethod).not.toHaveBeenCalled();
    });

    it('should handle edge cases correctly', () => {
      // Arrange
      const edgeCaseInput = null;

      // Act
      const result = testSubject.handleEdgeCase(edgeCaseInput);

      // Assert
      expect(result).toBe(false);
      expect(mockExternalDep.method).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from dependencies', async () => {
      // Test error propagation scenarios
    });

    it('should handle invalid input gracefully', () => {
      // Test input validation and error handling
    });
  });
});
```

## Advanced Testing Techniques

### Mock Behavior Customization
```typescript
beforeEach(() => {
  // Set up different behaviors for different test scenarios
  mockService.method
    .mockReturnValueOnce('first-call-result')
    .mockReturnValueOnce('second-call-result')
    .mockReturnValue('default-result');

  // Set up conditional behavior
  mockService.conditionalMethod.mockImplementation((input) => {
    if (input === 'special') {
      return 'special-result';
    }
    return 'normal-result';
  });
});
```

### Async Testing Patterns
```typescript
it('should handle async operations correctly', async () => {
  // Mock async dependencies
  mockAsyncService.processAsync.mockResolvedValue({ success: true });

  // Test async operation
  const result = await testSubject.performAsyncOperation();

  expect(result.success).toBe(true);
  expect(mockAsyncService.processAsync).toHaveBeenCalledTimes(1);
});

it('should handle async errors appropriately', async () => {
  // Mock async error
  mockAsyncService.processAsync.mockRejectedValue(new Error('Async error'));

  // Test error handling
  await expect(testSubject.performAsyncOperation()).rejects.toThrow('Async error');
});
```

### Complex Dependency Chains
```typescript
describe('complex dependency scenarios', () => {
  beforeEach(() => {
    // Set up dependency chain: A -> B -> C
    mockServiceC.method.mockReturnValue('c-result');
    mockServiceB.method.mockImplementation(() => {
      return mockServiceC.method() + '-b';
    });
    mockServiceA.method.mockImplementation(() => {
      return mockServiceB.method() + '-a';
    });
  });

  it('should handle complex dependency chains', () => {
    const result = testSubject.processWithChain();
    
    expect(mockServiceC.method).toHaveBeenCalled();
    expect(mockServiceB.method).toHaveBeenCalled();
    expect(mockServiceA.method).toHaveBeenCalled();
    expect(result).toBe('c-result-b-a');
  });
});
```

## Comprehensive Test Examples

The following comprehensive test suites demonstrate the advanced dependency injection patterns:

### 1. File Operations Test
**Location**: `test/unit/utils/file-comprehensive.test.ts`
- Mocks: fs, glob, LRU cache
- Demonstrates: File system abstraction, caching behavior, error handling

### 2. Command Parser Test
**Location**: `test/unit/commands/cli/command-parser-comprehensive.test.ts`
- Mocks: Registry pattern, command validation
- Demonstrates: Registry injection, command lifecycle, validation logic

### 3. Execution Model Test
**Location**: `test/unit/models/execution-comprehensive.test.ts`
- Mocks: Singleton services, execution context
- Demonstrates: Singleton pattern mocking, execution flow validation

### 4. Help Generator Test
**Location**: `test/unit/commands/help-generator-comprehensive.test.ts`
- Mocks: Registry dependencies, command metadata
- Demonstrates: Command discovery, template processing, output formatting

### 5. Configuration Management Test
**Location**: `test/unit/config/config-comprehensive.test.ts`
- Mocks: File system abstraction, environment variables
- Demonstrates: Configuration loading, validation, environment handling

### 6. AI Agent Test
**Location**: `test/unit/ai/agent-comprehensive.test.ts`
- Mocks: Multiple AI services, model providers, context managers
- Demonstrates: Complex multi-dependency injection, service orchestration

### 7. Task Management Test
**Location**: `test/unit/tasks/task-comprehensive.test.ts`
- Mocks: Registry patterns, execution context, task scheduler
- Demonstrates: Task lifecycle, scheduling, execution coordination

## Testing Commands

### Primary Test Commands
```bash
# Run comprehensive test suite
npm run test:hybrid

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Alternative Validation (Recommended for reliability)
```bash
# Core module validation
node validate-fixes.cjs

# TypeScript-compatible testing
node tsx-test-runner.cjs

# Direct module validation
node direct-test-runner-v2.cjs
```

## Best Practices Checklist

### Before Writing Tests
- [ ] Identify all external dependencies
- [ ] Identify all internal service dependencies
- [ ] Plan dependency injection strategy
- [ ] Design mock interfaces

### During Test Implementation
- [ ] Use consistent naming patterns
- [ ] Create typed mock instances
- [ ] Set up proper beforeEach/afterEach hooks
- [ ] Include error scenario testing
- [ ] Test edge cases and boundary conditions

### After Test Implementation
- [ ] Verify test isolation (tests pass individually)
- [ ] Check mock usage and interactions
- [ ] Validate error handling coverage
- [ ] Review test readability and maintainability
- [ ] Document complex mocking strategies

## Common Pitfalls and Solutions

### Pitfall: Incomplete Mock Setup
**Problem**: Tests fail due to unmocked dependencies
**Solution**: Comprehensive dependency analysis and complete mock setup

### Pitfall: Mock Leakage Between Tests
**Problem**: Tests affect each other due to shared mock state
**Solution**: Proper beforeEach/afterEach cleanup with `jest.clearAllMocks()`

### Pitfall: Over-Mocking
**Problem**: Tests become too isolated and don't test realistic scenarios
**Solution**: Balance between isolation and integration, mock external dependencies but allow internal logic

### Pitfall: Weak Error Testing
**Problem**: Error paths are not adequately tested
**Solution**: Comprehensive error scenario coverage with dependency failure simulation

## Conclusion

The comprehensive dependency injection testing approach provides:

1. **Realistic Testing**: Tests exercise actual business logic with controlled dependencies
2. **Maintainable Architecture**: Standardized patterns make tests easy to maintain and extend
3. **Quality Assurance**: Comprehensive coverage of normal and error scenarios
4. **Type Safety**: Full TypeScript support with proper type checking
5. **Scalability**: Patterns can be easily applied to new components and features

This testing strategy ensures high-quality, maintainable code while providing confidence in the system's behavior under various conditions.
