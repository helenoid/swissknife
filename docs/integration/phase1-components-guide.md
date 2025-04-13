# Phase 1 Integration Components Guide

This document provides detailed information about the Phase 1 integration components implemented in the SwissKnife system. These components form the foundation of the clean room reimplementation of Goose features in TypeScript.

## Table of Contents

1. [Overview](#overview)
2. [Integration Framework](#integration-framework)
   - [Integration Registry](#integration-registry)
   - [Goose Bridge](#goose-bridge)
3. [Graph-of-Thought System](#graph-of-thought-system)
   - [GoTNode](#gotnode)
   - [GoTManager](#gotmanager)
4. [Task Scheduling System](#task-scheduling-system)
   - [Fibonacci Heap](#fibonacci-heap)
   - [FibHeapScheduler](#fibheapscheduler)
5. [IPFS Storage System](#ipfs-storage-system)
   - [MCP Client](#mcp-client)
6. [CLI Commands](#cli-commands)
   - [Graph-of-Thought Commands](#graph-of-thought-commands)
   - [Task Scheduler Commands](#task-scheduler-commands)
   - [Goose Integration Commands](#goose-integration-commands)
7. [End-to-End Workflow](#end-to-end-workflow)
8. [Developer Guide](#developer-guide)
9. [Performance Considerations](#performance-considerations)

## Overview

Phase 1 of the SwissKnife-Goose integration focuses on establishing the foundation architecture and implementing key components needed for a clean room reimplementation of Goose features. The main components are:

1. **Integration Framework**: Provides a standardized way to connect different system components
2. **Graph-of-Thought System**: Implements advanced reasoning patterns and task decomposition
3. **Task Scheduling System**: Delivers priority-based task scheduling using a Fibonacci heap
4. **IPFS Storage System**: Connects to the IPFS Kit MCP Server for content-addressed storage

These components work together to provide a robust foundation for complex reasoning, task management, and storage capabilities.

## Integration Framework

### Integration Registry

The Integration Registry acts as a central hub for all integration bridges in the system, allowing different components to discover and communicate with each other.

**Key Features:**
- Singleton pattern for system-wide access
- Registration and retrieval of integration bridges
- Bridge initialization management
- Bridge filtering by source and target

**Example Usage:**
```typescript
import { IntegrationRegistry, GooseBridge } from './integration';

// Get the registry instance
const registry = IntegrationRegistry.getInstance();

// Register a bridge
const gooseBridge = new GooseBridge();
registry.registerBridge(gooseBridge);

// Initialize the bridge
await registry.initializeBridge(gooseBridge.id);

// Call methods on the bridge
const models = await registry.callBridge(gooseBridge.id, 'listModels', {});
```

### Goose Bridge

The Goose Bridge is an implementation of the IntegrationBridge interface that provides access to Goose AI capabilities through a clean room reimplementation.

**Key Features:**
- Implements the IntegrationBridge interface
- Provides access to Goose AI models, tools, and message processing
- Configurable endpoint, timeout, and retry settings

**Example Usage:**
```typescript
import { GooseBridge } from './integration/bridges/goose-bridge';

// Create and initialize the bridge
const bridge = new GooseBridge({
  endpoint: 'http://custom-endpoint',
  timeout: 60000,
  maxRetries: 5
});

await bridge.initialize();

// Call methods on the bridge
const response = await bridge.call('processMessage', {
  message: 'Hello, world!'
});
```

## Graph-of-Thought System

### GoTNode

GoTNode is the core data structure used in the Graph-of-Thought system. It represents a single node in a reasoning graph, which can be a question, task, thought, decision, action, result, answer, or error.

**Key Features:**
- Unique ID for each node
- Type classification (question, task, thought, etc.)
- Status tracking (pending, active, completed, failed, blocked)
- Parent-child relationships for graph structure
- Custom data storage
- Priority assignment for scheduling
- Serialization and deserialization support

**Example Usage:**
```typescript
import { GoTNode } from './tasks/graph/node';

// Create a new node
const node = new GoTNode({
  type: 'task',
  content: 'Research quantum computing',
  data: { assignedTo: 'research_tool' },
  priority: 5
});

// Update node status
node.updateStatus('active');

// Add parent and child relationships
node.addParent('parent-node-id');
node.addChild('child-node-id');

// Update content and data
node.updateContent('Research quantum computing algorithms');
node.updateData({ assignedTo: 'research_tool', keywords: ['quantum', 'algorithm'] });

// Serialize to JSON
const json = node.toJSON();

// Deserialize from JSON
const restoredNode = GoTNode.fromJSON(json);
```

### GoTManager

The GoTManager provides a system for creating, managing, and executing Graph-of-Thought structures. It enables complex reasoning patterns by managing the creation, traversal, and execution of graph-based thought processes.

**Key Features:**
- Singleton pattern for system-wide access
- Graph creation and management
- Node creation and relationship management
- Graph traversal and query capabilities
- Node status tracking and updates
- Graph persistence to IPFS via MCP client
- Graph execution for automated reasoning flows

**Example Usage:**
```typescript
import { GoTManager } from './tasks/graph/manager';
import { MCPClient } from './storage/ipfs/mcp-client';

// Get the manager instance
const manager = GoTManager.getInstance();

// Create a new graph
const graphId = manager.createGraph();

// Create nodes in the graph
const questionNode = manager.createNode(graphId, {
  type: 'question',
  content: 'What is the capital of France?'
});

const taskNode = manager.createNode(graphId, {
  type: 'task',
  content: 'Look up capital of France',
  parentIds: [questionNode.id]
});

// Get nodes from the graph
const allNodes = manager.getGraphNodes(graphId);
const taskNodes = manager.getNodesByType(graphId, 'task');
const readyNodes = manager.getReadyNodes(graphId);

// Update node status
manager.updateNodeStatus(taskNode.id, 'completed');

// Connect to MCP client for persistence
const mcpClient = new MCPClient();
await mcpClient.connect();
manager.setMCPClient(mcpClient);

// Persist the graph to IPFS
const cid = await manager.persistGraph(graphId);

// Execute the graph reasoning flow
await manager.executeGraph(graphId);
```

## Task Scheduling System

### Fibonacci Heap

The Fibonacci Heap is an efficient priority queue implementation that provides O(1) amortized time for many operations including insert and decrease-key, and O(log n) amortized time for extract-min. This makes it ideal for priority-based task scheduling.

**Key Features:**
- Efficient priority queue operations
- Support for arbitrary value types
- Key-based priority assignment
- Operations: insert, extractMin, decreaseKey, delete, merge

**Example Usage:**
```typescript
import { FibonacciHeap } from './tasks/scheduler/fibonacci-heap';

// Create a new heap
const heap = new FibonacciHeap();

// Insert items with priority (lower number = higher priority)
heap.insert(5, { id: 'task1', name: 'Task 1' });
heap.insert(3, { id: 'task2', name: 'Task 2' });
heap.insert(7, { id: 'task3', name: 'Task 3' });

// Get size and check if empty
const size = heap.getSize(); // 3
const isEmpty = heap.isEmpty(); // false

// Extract the minimum value (highest priority)
const highestPriorityTask = heap.extractMin(); // { id: 'task2', name: 'Task 2' }

// Find minimum without extracting
const nextTask = heap.findMin(); // { id: 'task1', name: 'Task 1' }

// Create a second heap and merge
const heap2 = new FibonacciHeap();
heap2.insert(2, { id: 'task4', name: 'Task 4' });
heap.merge(heap2);
```

### FibHeapScheduler

The FibHeapScheduler is a task scheduler that uses a Fibonacci Heap for efficient priority-based task scheduling.

**Key Features:**
- Priority-based task scheduling
- Task retrieval by priority
- Task count tracking
- Peek capability to view next task without removing

**Example Usage:**
```typescript
import { FibHeapScheduler } from './tasks/scheduler/fibonacci-heap';

// Create a new scheduler
const scheduler = new FibHeapScheduler();

// Schedule tasks with priority (lower number = higher priority)
scheduler.scheduleTask(5, { id: 'task1', description: 'Task 1' });
scheduler.scheduleTask(3, { id: 'task2', description: 'Task 2' });
scheduler.scheduleTask(7, { id: 'task3', description: 'Task 3' });

// Check task count and if tasks exist
const count = scheduler.getTaskCount(); // 3
const hasTasks = scheduler.hasTasks(); // true

// Get the next highest priority task (removes from scheduler)
const nextTask = scheduler.getNextTask(); // { id: 'task2', description: 'Task 2' }

// Peek at the next task without removing
const peekTask = scheduler.peekNextTask(); // { id: 'task1', description: 'Task 1' }
```

## IPFS Storage System

### MCP Client

The MCP Client provides integration with the Python-based IPFS Kit MCP Server, allowing SwissKnife to leverage content-addressed storage for data persistence.

**Key Features:**
- Connection management to MCP server
- Content addition and retrieval
- IPLD node creation and management
- CAR file creation
- Configurable settings for timeout and retries
- Event emitter for status updates

**Example Usage:**
```typescript
import { MCPClient } from './storage/ipfs/mcp-client';

// Create and connect to MCP client
const client = new MCPClient({
  baseUrl: 'http://localhost:5000',
  token: 'your-auth-token'
});

await client.connect();

// Add content to IPFS
const { cid } = await client.addContent('Hello, world!', {
  pin: true,
  wrapWithDirectory: false
});

// Retrieve content from IPFS
const content = await client.getContent(cid);

// Create and retrieve IPLD nodes
const nodeData = { type: 'example', value: 'test' };
const links = [
  { name: 'link1', cid: 'cid1' },
  { name: 'link2', cid: 'cid2' }
];

const { cid: nodeCid } = await client.addNode(nodeData, links);
const node = await client.getNode(nodeCid);

// Create a CAR file
const roots = ['root1', 'root2'];
const blocks = {
  'block1': Buffer.from('block1 data'),
  'block2': Buffer.from('block2 data')
};

const { carCid } = await client.createCar(roots, blocks);

// Disconnect when done
client.disconnect();
```

## CLI Commands

The Phase 1 integration includes several CLI commands that allow users to interact with the new components through the command line.

### Graph-of-Thought Commands

The `got` command provides functionality to interact with the Graph-of-Thought system:

```bash
# Create a new Graph-of-Thought
swissknife got create

# Add a node to a graph
swissknife got node graph123 question -c "What is quantum computing?" -p "high"

# Add a task node with parent
swissknife got node graph123 task -c "Research quantum computing" -p "parent-node-id"

# List all nodes in a graph
swissknife got list graph123

# Filter nodes by type
swissknife got list graph123 -t task

# Update a node's status
swissknife got update node123 completed

# Update a node's content
swissknife got update node123 -c "New content"

# Persist a graph to IPFS
swissknife got persist graph123

# Visualize a graph structure
swissknife got visualize graph123 -o graph.dot

# Execute a graph's reasoning flow
swissknife got execute graph123
```

### Task Scheduler Commands

The `scheduler` command provides functionality to interact with the Fibonacci Heap Scheduler:

```bash
# Add a task to the scheduler
swissknife scheduler add "Process file" -p 5

# Add a task with custom data
swissknife scheduler add "Process data" -p 3 -d '{"key":"value"}'

# List all scheduled tasks
swissknife scheduler list

# Get the next highest priority task
swissknife scheduler next

# Peek at the next task without removing it
swissknife scheduler peek

# Get the count of scheduled tasks
swissknife scheduler count

# Clear all scheduled tasks
swissknife scheduler clear
```

### Goose Integration Commands

The `goose` command provides functionality to interact with the Goose Integration Bridge:

```bash
# Check bridge status
swissknife goose status

# List available models
swissknife goose models

# List available tools
swissknife goose tools

# Process a message
swissknife goose process "What is the capital of France?"

# Process a message from a file
swissknife goose process -f message.txt

# Process a message with a specific model
swissknife goose process "What is quantum computing?" -m gpt-4o

# Save response to a file
swissknife goose process "Explain blockchain" -o response.md
```

## End-to-End Workflow

The Phase 1 components work together to provide a complete workflow for complex problem-solving. Here's an example of how they interact:

1. A user submits a question through the Goose bridge
2. The system creates a Graph-of-Thought to decompose the problem
3. Tasks are created as nodes in the graph
4. Tasks are scheduled based on priority and dependencies
5. The scheduler processes tasks in priority order
6. Results are stored back in the graph nodes
7. The final answer is derived from the completed graph
8. The entire graph is persisted to IPFS via the MCP client

This approach enables sophisticated reasoning patterns and automatic problem decomposition, while ensuring results are properly stored and can be retrieved later.

## Developer Guide

### Getting Started

To start using the Phase 1 integration components in your code:

1. Import the necessary components:
   ```typescript
   import { 
     IntegrationRegistry, 
     GooseBridge, 
     GoTManager, 
     GoTNode, 
     FibHeapScheduler, 
     MCPClient 
   } from './integration';
   ```

2. Initialize the components:
   ```typescript
   // Set up the integration registry and bridge
   const registry = IntegrationRegistry.getInstance();
   const gooseBridge = new GooseBridge();
   registry.registerBridge(gooseBridge);
   await registry.initializeBridge(gooseBridge.id);
   
   // Set up the GoT manager
   const gotManager = GoTManager.getInstance();
   
   // Set up the scheduler
   const scheduler = new FibHeapScheduler();
   
   // Set up the MCP client
   const mcpClient = new MCPClient();
   await mcpClient.connect();
   gotManager.setMCPClient(mcpClient);
   ```

3. Create a workflow:
   ```typescript
   // Create a graph
   const graphId = gotManager.createGraph();
   
   // Add a question node
   const questionNode = gotManager.createNode(graphId, {
     type: 'question',
     content: 'How does quantum computing work?'
   });
   
   // Add task nodes
   const task1 = gotManager.createNode(graphId, {
     type: 'task',
     content: 'Research quantum principles',
     parentIds: [questionNode.id]
   });
   
   const task2 = gotManager.createNode(graphId, {
     type: 'task',
     content: 'Research computing implementation',
     parentIds: [questionNode.id]
   });
   
   // Schedule tasks
   scheduler.scheduleTask(1, {
     nodeId: task1.id,
     graphId: graphId,
     type: 'process_node'
   });
   
   scheduler.scheduleTask(1, {
     nodeId: task2.id,
     graphId: graphId,
     type: 'process_node'
   });
   
   // Process tasks (in a real implementation, this would be more sophisticated)
   while (scheduler.hasTasks()) {
     const task = scheduler.getNextTask();
     // Process the task...
     gotManager.updateNodeStatus(task.nodeId, 'completed');
   }
   
   // Persist the graph
   const cid = await gotManager.persistGraph(graphId);
   ```

### Best Practices

1. **Error Handling**: Always wrap async operations in try/catch blocks to handle errors gracefully
2. **Resource Management**: Close connections (like MCP client) when done to free resources
3. **Graph Structure**: Design graph structures carefully to ensure proper task dependencies
4. **Priority Assignment**: Use consistent priority schemes across your application
5. **Data Persistence**: Persist important data to IPFS for durability
6. **Node Status**: Keep node status updated to reflect current processing state
7. **Event Handling**: Listen for events from components to react to state changes

## Performance Considerations

When using the Phase 1 integration components, keep these performance considerations in mind:

1. **Graph Size**: Very large graphs (thousands of nodes) may impact performance
2. **Heap Operations**: While Fibonacci heap operations are efficient, extracting all tasks is O(n log n)
3. **IPFS Operations**: IPFS operations involve network I/O and can be slow
4. **Persistence Strategy**: Persist graphs selectively rather than continuously
5. **Memory Usage**: Monitor memory usage for large graphs or many scheduled tasks
6. **Concurrency**: When implementing concurrent task processing, use appropriate locking
7. **Batch Operations**: Batch related IPFS operations when possible

For most use cases, these components provide excellent performance with the advantages of sophisticated reasoning capabilities and reliable storage.