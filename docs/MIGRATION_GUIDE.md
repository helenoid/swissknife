# Migration Guide for SwissKnife Unified Architecture

This guide helps developers understand how to migrate code and workflows to the new unified SwissKnife architecture.

## Table of Contents

- [Overview](#overview)
- [Key Architecture Changes](#key-architecture-changes)
- [Code Migration Guidelines](#code-migration-guidelines)
- [Examples](#examples)
- [Common Migration Scenarios](#common-migration-scenarios)
- [Testing During Migration](#testing-during-migration)
- [Troubleshooting](#troubleshooting)

## Overview

SwissKnife has transitioned to a unified, domain-driven architecture where all components are implemented directly in TypeScript within a single cohesive codebase. The only external component is the Python-based IPFS Kit MCP Server, which is integrated via well-defined APIs.

This approach replaces the previous strategy that involved multiple separately maintained components with varying degrees of coupling.

## Key Architecture Changes

### From:
- **Multiple Separate Components**: Different source codebases with integration bridges
- **Mixed Language Implementations**: Components in TypeScript, Rust, etc.
- **Component-Based Organization**: Code organized by source component
- **Integration Layer**: Cross-component bridges and integration layer

### To:
- **Single TypeScript Codebase**: All functionality in one unified codebase
- **Pure TypeScript Implementation**: Clean room implementation of all features in TypeScript
- **Domain-Driven Organization**: Code organized by functional domain
- **Direct Integration**: Components communicate directly through TypeScript interfaces
- **External MCP Server**: Python-based IPFS Kit MCP Server as the only external component

## Code Migration Guidelines

### 1. Identify Your Component Location

Determine where your code belongs in the domain-driven structure:

| Previous Location | New Domain | Directory |
|-------------------|------------|-----------|
| `typescript-implementations/ai` | AI Domain | `src/ai/` |
| `typescript-implementations/tools` | AI Domain | `src/ai/tools/` |
| `ipfs-accelerate/tensor` | ML Domain | `src/ml/tensor/` |
| `ipfs-accelerate/hardware` | ML Domain | `src/ml/hardware/` |
| `swissknife_old/task` | Tasks Domain | `src/tasks/` |
| `integration/storage` | Storage Domain | `src/storage/` |

### 2. Convert Component-Based Code to Domain-Based

Follow these steps to migrate your code:

1. **Clean Implementation**: Create a TypeScript clean room implementation of your feature
2. **Domain Placement**: Place your code in the appropriate domain directory
3. **Interface Definition**: Define clear TypeScript interfaces for cross-domain communication
4. **Type Safety**: Leverage TypeScript's type system for robust cross-domain interactions
5. **Test Migration**: Update tests to reflect the new structure and interfaces

### 3. Update Import Paths

Update all imports to reflect the new domain-based structure:

```typescript
// OLD: Component-based imports
import { AgentManager } from '../typescript-implementations/ai/agent';
import { FileSystemTool } from '../typescript-implementations/tools/filesystem';
import { TensorOperations } from '../ipfs-accelerate/tensor/operations';

// NEW: Domain-based imports
import { Agent } from '../ai/agent';
import { FileSystemTool } from '../ai/tools/implementations/filesystem';
import { TensorOperations } from '../ml/tensor/operations';
```

### 4. Use Direct TypeScript Communication

Replace bridge-based communication with direct TypeScript function calls:

```typescript
// OLD: Bridge-based communication
const bridge = new AIBridge();
const result = await bridge.executeAgentAction(action);

// NEW: Direct TypeScript communication
import { Agent } from '../ai/agent';
const agent = new Agent({ /* options */ });
const result = await agent.executeAction(action);
```

### 5. Update IPFS Kit MCP Server Integration

Use the unified Storage domain client for MCP server communication:

```typescript
// OLD: Direct MCP server communication
import { MCPClient } from '../integration/mcp/client';
const client = new MCPClient({ baseUrl: 'http://localhost:5001' });
const result = await client.addContent(content);

// NEW: Domain-based storage abstraction
import { getStorageProvider } from '../storage';
const storage = getStorageProvider();
const result = await storage.add(content);
```

## Examples

### Example 1: Migrating an AI Tool

**Old Location**: `typescript-implementations/tools/web-search.ts`

```typescript
// Old implementation
export class WebSearchTool {
  async execute(query: string): Promise<SearchResult[]> {
    // Implementation
    return results;
  }
}

// Old usage
import { WebSearchTool } from '../typescript-implementations/tools/web-search';
const tool = new WebSearchTool();
const results = await tool.execute(query);
```

**New Location**: `src/ai/tools/implementations/web-search.ts`

```typescript
// New implementation
import { Tool, ToolResult } from '../../tool';

export interface WebSearchParams {
  query: string;
  limit?: number;
}

export class WebSearchTool implements Tool {
  name = 'web_search';
  description = 'Search the web for information';
  
  async execute(params: WebSearchParams): Promise<ToolResult> {
    // Implementation
    return {
      status: 'success',
      data: results
    };
  }
}

// New registration
import { ToolRegistry } from '../../registry';
ToolRegistry.getInstance().registerTool(new WebSearchTool());

// New usage
import { ToolExecutor } from '../../executor';
const executor = ToolExecutor.getInstance();
const result = await executor.execute('web_search', { query });
```

### Example 2: Migrating a Task Component

**Old Location**: `swissknife_old/task/scheduler.ts`

```typescript
// Old implementation
export class TaskScheduler {
  schedule(task: Task, priority: number): void {
    // Implementation
  }
  
  getNextTask(): Task | null {
    // Implementation
    return task;
  }
}

// Old usage
import { TaskScheduler } from '../swissknife_old/task/scheduler';
const scheduler = new TaskScheduler();
scheduler.schedule(task, 5);
```

**New Location**: `src/tasks/scheduler/scheduler.ts`

```typescript
// New implementation
import { FibonacciHeap } from './fibonacci-heap';
import { Task } from '../task';

export class TaskScheduler {
  private heap: FibonacciHeap<Task>;
  
  constructor() {
    this.heap = new FibonacciHeap<Task>((a, b) => a.priority - b.priority);
  }
  
  addTask(task: Task): void {
    this.heap.insert(task);
  }
  
  getNextTask(): Task | null {
    const node = this.heap.extractMin();
    return node ? node.data : null;
  }
}

// New usage
import { TaskScheduler } from '../tasks/scheduler';
import { TaskManager } from '../tasks/manager';

const manager = TaskManager.getInstance();
const taskId = await manager.createTask('Do something', 5);
```

## Common Migration Scenarios

### AI Agent Integration

**Old Approach**:
- Load TypeScript implementations through a bridge
- Use separate communication protocols

**New Approach**:
- Import Agent directly from the AI domain
- Configure with dependencies using TypeScript interfaces
- Use direct method calls for all operations

```typescript
// New integration example
import { Agent } from '../ai/agent';
import { ToolRegistry } from '../ai/tools/registry';
import { getModelProvider } from '../ai/models';
import { getStorageProvider } from '../storage';

// Create agent with dependencies
const agent = new Agent({
  model: getModelProvider().getModel('gpt-4'),
  tools: ToolRegistry.getInstance().getAllTools(),
  storage: getStorageProvider()
});

// Process a message
const response = await agent.processMessage('Hello, world!');
```

### Task Processing Integration

**Old Approach**:
- Use TaskNet from swissknife_old
- Separate task processing system

**New Approach**:
- Import TaskManager from the Tasks domain
- Use Graph-of-Thought for complex tasks
- Leverage the Fibonacci heap scheduler

```typescript
// New integration example
import { TaskManager } from '../tasks/manager';
import { GraphOfThought } from '../tasks/graph';

// Create a task
const manager = TaskManager.getInstance();
const taskId = await manager.createTask('Solve this problem');

// Use Graph-of-Thought for complex reasoning
const got = new GraphOfThought();
const result = await got.processQuery('What are the implications of X?');
```

### IPFS Storage Integration

**Old Approach**:
- Direct integration with IPFS
- No MCP client abstraction

**New Approach**:
- Use Storage domain provider
- Communicate with IPFS Kit MCP Server through client

```typescript
// New integration example
import { getStorageProvider } from '../storage';

// Get storage provider (automatically uses MCP client)
const storage = getStorageProvider();

// Add content
const cid = await storage.add('Hello, world!');

// Retrieve content
const content = await storage.get(cid);
```

## Testing During Migration

1. **Create Parallel Tests**: Write tests for both old and new implementations
2. **Feature Parity Tests**: Verify same behavior in both implementations
3. **Interface Tests**: Test through the public interfaces, not implementation details
4. **Integration Tests**: Verify cross-domain communication

Example test for both implementations:

```typescript
// Test both implementations
describe('Agent implementations', () => {
  // Test old implementation
  test('old implementation processes message', async () => {
    const oldAgent = new OldAgentImplementation();
    const response = await oldAgent.processMessage('Hello');
    expect(response).toContain('Hello');
  });
  
  // Test new implementation
  test('new implementation processes message', async () => {
    const newAgent = new Agent({
      model: mockModel,
      tools: [],
      storage: mockStorage
    });
    const response = await newAgent.processMessage('Hello');
    expect(response).toContain('Hello');
  });
});
```

## Troubleshooting

### Import Issues

**Problem**: Cannot find module in new structure
**Solution**: 
- Check the domain location using the migration table
- Update import paths to use domain-based structure
- Use relative imports (`../`) when crossing domain boundaries

### Type Mismatches

**Problem**: TypeScript errors due to interface changes
**Solution**:
- Check the interface definitions in the new domain
- Update code to match the new interface requirements
- Add type adaptors if needed for temporary compatibility

### MCP Server Connection Issues

**Problem**: Unable to connect to IPFS Kit MCP Server
**Solution**:
- Verify server is running with `swissknife mcp status`
- Check client configuration in `storage/ipfs/mcp-client.ts`
- Use storage provider factory for automatic configuration

### Performance Regressions

**Problem**: Slower performance after migration
**Solution**:
- Check for excessive serialization/deserialization
- Verify hardware acceleration is properly configured
- Use worker threads for CPU-intensive operations via `workers` domain