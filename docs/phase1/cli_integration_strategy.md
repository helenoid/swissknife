# CLI Integration Strategy

This document outlines the specific strategy for integrating Goose features (reimplemented in TypeScript), IPFS Kit MCP Server, and TaskNet enhancements into the SwissKnife CLI architecture. It provides practical guidance on the integration approach, sequencing, and implementation techniques.

## Integration Principles

1. **Clean Room TypeScript Implementation**: Create independent TypeScript implementations of all functionality using clean room methodology without direct Rust code translation (see [../CLEAN_ROOM_IMPLEMENTATION.md](../CLEAN_ROOM_IMPLEMENTATION.md))
2. **Tight Coupling**: Ensure integrated components are tightly coupled with SwissKnife (except IPFS Kit MCP Server)
3. **Interface-Driven Design**: Define clear interfaces before implementation
4. **Incremental Integration**: Build functionality incrementally, ensuring stability at each step
5. **Test-Driven Development**: Implement comprehensive tests (unit, integration) for each component. Integration tests are crucial for verifying cross-component interactions.

## Integration Workflow

For each component, follow this integration workflow:

1. **Analysis**: Analyze Goose feature for TypeScript implementation
2. **Interface Design**: Design TypeScript interfaces and type definitions
3. **Implementation**: Implement the feature in TypeScript
4. **Testing**: Create comprehensive tests for the implementation
5. **CLI Integration**: Integrate with SwissKnife CLI architecture
6. **Documentation**: Update documentation with TypeScript examples

```
┌──────────┐     ┌───────────────┐     ┌────────────────┐     ┌──────────┐
│ Analysis │─────▶ Interface     │─────▶ TypeScript     │─────▶ Testing  │
│          │     │ Design        │     │ Implementation │     │          │
└──────────┘     └───────────────┘     └────────────────┘     └──────────┘
                                                                    │
                  ┌───────────────┐                ┌───────────────┐│
                  │ Documentation │◀───────────────│ CLI           ││
                  │               │                │ Integration   │◀┘
                  └───────────────┘                └───────────────┘
```

## Component-Specific Integration Strategies

### 1. TypeScript AI Agent Implementation

**Source**: Goose AI agent functionality

**Integration Approach**:
1. Analyze Goose AI agent architecture (state machines, reasoning loops, tool usage patterns).
2. Design TypeScript class hierarchy (`Agent`, `Memory`, `ModelAdapter`, etc.) and interfaces, focusing on extensibility.
3. Implement core reasoning engine in TypeScript, potentially using state machines or async iterators.
4. Create robust message handling, including streaming support and tool call/result formatting.
5. Implement memory management (short-term, long-term via IPFS potentially) and context window handling.
6. Add flexible prompt handling and templating (e.g., using libraries like Handlebars or similar).
7. Integrate with SwissKnife command system via `ExecutionContext` service access.
8. **Challenge:** Ensuring efficient state management and context handling for long conversations.

**CLI Interface Example**:
```
swissknife agent chat                          # Start interactive chat with agent
swissknife agent execute "prompt" --model <id> # Execute one-off prompt with specific model
swissknife agent config set defaultModel <id>  # Configure agent settings
```

**Implementation Location**: `src/agent/`

**Dependencies**: None (foundation for other components)

### 2. TypeScript Tool System

**Source**: Goose tool execution framework

**Integration Approach**:
1. Analyze Goose tool system architecture
2. Design TypeScript tool interfaces and registries
3. Implement tool registration mechanism
4. Create tool execution framework
5. Implement parameter validation and serialization
6. Add tool discovery and documentation
7. Integrate with AI agent implementation

**CLI Interface Example**:
```
swissknife tools list                          # List available tools
swissknife tools info <tool>                   # Show tool documentation
swissknife tools execute <tool> [args]         # Execute tool directly
```

**Implementation Location**: `src/agent/tools/`

**Dependencies**: TypeScript AI Agent Implementation

### 3. IPFS Kit MCP Client

**Source**: New development for IPFS Kit MCP Server integration

**Integration Approach**:
1. Analyze IPFS Kit MCP Server API (HTTP, WebSocket) and data formats (CBOR, JSON).
2. Design TypeScript client interfaces (`IpfsClient`) abstracting underlying transport.
3. Implement REST API client using `fetch` or `axios` for core operations (`add`, `get`, `pin`, `ls`).
4. Create WebSocket client for real-time features like PubSub (if needed by TaskNet).
5. Implement robust content addressing (CID generation/validation using `multiformats`) and data streaming for large files.
6. Add comprehensive error handling (network errors, server errors, timeouts) and configurable retry logic.
7. Integrate client as a service accessible via `ExecutionContext`.
8. **Challenge:** Handling large file transfers efficiently and managing potential connection interruptions.

**CLI Interface Example**:
```
swissknife ipfs add <file>                     # Add file to IPFS Kit MCP Server
swissknife ipfs get <cid> --output <path>      # Get content from IPFS Kit MCP Server
swissknife ipfs pin add <cid>                  # Pin content
swissknife ipfs server status                  # Check IPFS Kit MCP Server status
```

**Implementation Location**: `src/ipfs/`

**Dependencies**: Command System

### 4. Graph-of-Thought Implementation

**Source**: TaskNet enhancements

**Integration Approach**:
1. Analyze Graph-of-Thought pattern requirements for non-linear reasoning.
2. Design TypeScript graph data structures (`ThoughtGraph`, `ThoughtNode`, `ThoughtEdge`) supporting DAGs.
3. Implement node/edge representations with metadata (status, results, confidence). Use IPLD for persistence structure.
4. Create efficient graph traversal (DFS, BFS) and manipulation utilities.
5. Implement core reasoning algorithms (e.g., expanding nodes via AI calls, synthesizing results).
6. Add utilities for graph visualization (e.g., exporting to DOT or Mermaid format) and debugging.
7. Integrate with AI agent (for node processing) and Task System (for scheduling node execution).
8. **Challenge:** Managing graph complexity and ensuring efficient persistence/retrieval via IPLD.

**CLI Interface Example**:
```
swissknife got create [template]               # Create Graph-of-Thought structure
swissknife got visualize <graph-id>            # Visualize graph structure
swissknife got execute <graph-id>              # Execute reasoning on graph
```

**Implementation Location**: `src/thinking/got/`

**Dependencies**: TypeScript AI Agent Implementation

### 5. Fibonacci Heap Task Scheduler

**Source**: TaskNet enhancements

**Integration Approach**:
1. Analyze Fibonacci heap requirements
2. Design TypeScript data structure implementation
3. Implement heap operations (insert, decrease-key, extract-min)
4. Create task priority management system
5. Implement scheduler service
6. Add monitoring and debugging capabilities
7. Integrate with task execution system

**CLI Interface Example**:
```
swissknife scheduler status                    # Show scheduler status
swissknife scheduler tasks                     # List scheduled tasks
swissknife scheduler priority <task-id> <prio> # Adjust task priority
```

**Implementation Location**: `src/tasks/scheduler/`

**Dependencies**: Command System

### 6. Task Decomposition System

**Source**: TaskNet enhancements

**Integration Approach**:
1. Analyze task decomposition requirements
2. Design decomposition strategies and algorithms
3. Implement problem subdivision mechanisms
4. Create subtask dependency management
5. Implement result aggregation
6. Add decomposition templates and patterns
7. Integrate with Graph-of-Thought system

**CLI Interface Example**:
```
swissknife decompose <task> [options]          # Decompose complex task
swissknife decompose templates                 # List decomposition templates
swissknife decompose visualize <task-id>       # Visualize task decomposition
```

**Implementation Location**: `src/tasks/decomposition/`

**Dependencies**: Graph-of-Thought Implementation, Fibonacci Heap Scheduler

### 7. Task Delegation System

**Source**: TaskNet enhancements

**Integration Approach**:
1. Analyze task delegation requirements
2. Design delegation strategies and algorithms
3. Implement worker capability discovery
4. Create task matching and distribution
5. Implement progress tracking and monitoring
6. Add result collection and aggregation
7. Integrate with task decomposition system

**CLI Interface Example**:
```
swissknife delegate <task-id> [worker]         # Delegate task to worker
swissknife delegate status                     # Show delegation status
swissknife delegate workers                    # List available workers
```

**Implementation Location**: `src/tasks/delegation/`

**Dependencies**: Task Decomposition System

### 8. ML Engine Integration

**Source**: IPFS Transformers JS

**Integration Approach**:
1. Analyze ML acceleration components
2. Design TypeScript wrapper interfaces
3. Implement tensor operations and handling
4. Create model execution framework
5. Implement hardware acceleration detection
6. Add model optimization utilities
7. Integrate with AI agent system

**CLI Interface Example**:
```
swissknife ml models                           # List available ML models
swissknife ml run <model> <input>              # Run inference on model
swissknife ml optimize <model>                 # Optimize model
```

**Implementation Location**: `src/ml/`

**Dependencies**: TypeScript AI Agent Implementation, IPFS Kit MCP Client

### 9. Enhanced Model Management

**Source**: Current model management + new development

**Integration Approach**:
1. Analyze current model management system
2. Design enhanced model registry
3. Implement model versioning and tracking
4. Create model discovery and registration
5. Implement model caching and optimization
6. Add model analysis and comparison tools
7. Integrate with ML engine and agent system

**CLI Interface Example**:
```
swissknife models list                         # List available models
swissknife models register <model>             # Register new model
swissknife models compare <model1> <model2>    # Compare model performance
```

**Implementation Location**: `src/models/`

**Dependencies**: ML Engine Integration, IPFS Kit MCP Client

### 10. Command System Enhancement

**Source**: Current command system + new development

**Integration Approach**:
1. Analyze current command system
2. Design enhanced command architecture
3. Implement advanced parameter handling
4. Create nested subcommands support
5. Implement command discovery and registration
6. Add comprehensive help documentation generation
7. Integrate with all new components

**CLI Interface Example**:
```
swissknife command --help                      # Show command help
swissknife command subcommand [options]        # Execute subcommand
swissknife commands                            # List available commands
```

**Implementation Location**: `src/cli/`

**Dependencies**: All component interfaces

## Integration Sequence

The integration should proceed in the following sequence to ensure dependencies are satisfied:

1. **Phase 1: Foundation & Architecture (Weeks 1-2)**
   - TypeScript interface definitions
   - Component architecture design
   - IPFS Kit MCP Server client interface definition
   - Initial command system enhancements
   
2. **Phase 2A: Core AI Implementation (Weeks 3-4)**
   - TypeScript AI Agent Implementation
   - Tool System Implementation
   - Basic ML Engine Integration
   
3. **Phase 2B: Storage & Communication (Weeks 5-6)**
   - IPFS Kit MCP Client Implementation
   - Enhanced Model Management
   - Communication infrastructure
   
4. **Phase 3A: Task Enhancement Foundations (Week 7)**
   - Graph-of-Thought Implementation
   - Fibonacci Heap Scheduler
   
5. **Phase 3B: Advanced Task Systems (Weeks 8-9)**
   - Task Decomposition System
   - Task Delegation System
   
6. **Phase 4: CLI Integration (Weeks 10-12)**
   - Complete Command System Enhancement
   - Final CLI integration for all components
   - Cross-component integration testing
   
7. **Phase 5: Optimization & Finalization (Weeks 13-14)**
   - Performance optimization
   - Documentation completion
   - Final testing and validation

## Implementation Patterns

### TypeScript Class Implementation Pattern

```typescript
// Example TypeScript class implementation for the AI Agent
export interface AgentOptions {
  /** The model identifier (e.g., 'gpt-4', 'claude-3') */
  model: string;
  /** Controls randomness (0.0-1.0). Lower is more deterministic. */
  temperature?: number;
  /** Maximum tokens to generate in the response. */
  maxTokens?: number;
  /** List of tools available to the agent. */
  tools?: Tool[];
}

/**
 * Core class managing AI interactions, tools, and memory.
 */
export class TypeScriptAgent {
  private options: AgentOptions;
  private tools: Map<string, Tool> = new Map();
  private memory: MessageMemory; // Assumes MessageMemory class exists
  
  constructor(options: AgentOptions) {
    this.options = {
      temperature: 0.7,
      maxTokens: 1000,
      ...options
    };
    
    // Register tools if provided
    if (options.tools) {
      options.tools.forEach(tool => this.registerTool(tool));
    }
    
    // Initialize memory management
    this.memory = new MessageMemory();
  }

  /**
   * Processes a user message, interacts with the model and tools, and returns a response.
   * @param message The user's input message.
   * @param context Optional context for the execution.
   * @returns A promise resolving to the agent's response.
   */
  
  async processMessage(message: string, context?: any): Promise<AgentResponse> {
    // Add user message to conversation history
    this.memory.addMessage({ role: 'user', content: message });

    // Core logic: Generate response using model, potentially calling tools
    const response = await this.generateResponse(message, context);

    // Add agent's response to conversation history
    this.memory.addMessage({ role: 'assistant', content: response.content });
    
    return response;
  }
  
  /**
   * Registers a tool, making it available for the agent to use.
   * @param tool The tool instance to register.
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves the list of registered tools.
   * @returns An array of registered tool instances.
   */
  
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Internal method to orchestrate response generation.
   * This involves prompt construction, model invocation, tool execution logic, etc.
   * @param message The user message.
   * @param context Optional context.
   * @returns The agent's response.
   */
  private async generateResponse(message: string, context?: any): Promise<AgentResponse> { // Assumes AgentResponse type exists
    // 1. Construct prompt using message, memory, context, and available tools.
    // 2. Call the appropriate AI model adapter with the prompt and options.
    // 3. Parse model response: Check for tool calls.
    // 4. If tool calls requested:
    //    a. Validate tool calls.
    //    b. Execute tools via ToolExecutor.
    //    c. Get tool results.
    //    d. Potentially call model again with tool results.
    // 5. Format final response content.

    // Placeholder implementation:
    return {
      id: generateUUID(), // Use a proper UUID generator
      content: "Example response",
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
  }
}
```

### TypeScript Tool Implementation Pattern

```typescript
// Example tool implementation for file operations
export interface ToolParameter {
  /** Name of the parameter (used in arguments object). */
  name: string;
  /** Data type expected for the parameter. */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Description for help messages and agent understanding. */
  description: string;
  /** Whether the parameter is mandatory. */
  required: boolean;
  /** Default value if not provided. */
  default?: any;
}

/**
 * Interface defining the structure for all tools.
 */
export interface Tool {
  /** Unique name identifying the tool. */
  name: string;
  /** Description of what the tool does, for AI and user understanding. */
  description: string;
  /** Definition of the parameters the tool accepts. */
  parameters: ToolParameter[];
  /** The asynchronous function that executes the tool's logic. */
  execute(params: any, context?: any): Promise<any>; // Consider a more specific return type
}

/**
 * Example implementation of a tool for file system operations.
 */
export class FileTool implements Tool {
  readonly name = 'file';
  readonly description = 'Read, write, or list files on the local filesystem.';
  
  parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform (read, write, list)',
      required: true,
      // Potentially add choices: ['read', 'write', 'list']
    },
    {
      name: 'path',
      type: 'string',
      description: 'The absolute or relative path to the file or directory.',
      required: true
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write (for write action)',
      required: false // Only required for 'write' action
    }
  ];

  /**
   * Executes the file operation based on the provided parameters.
   * @param params Parsed parameters matching the 'parameters' definition.
   * @param context Optional execution context (e.g., access to config, base path).
   * @returns A promise resolving to the result of the file operation.
   */
  
  async execute(params: any, context?: any): Promise<any> {
    const { action, path, content } = params;
    
    // Input validation should ideally happen before execute is called (e.g., in ToolExecutor)
    // but basic checks can be added here.
    switch (action) {
      case 'read':
        // Add validation: path must be provided
        return this.readFile(path);
      case 'write':
        // Add validation: path and content must be provided
        if (content === undefined || content === null) {
          throw new Error("Parameter 'content' is required for write action.");
        }
        return this.writeFile(path, content);
      case 'list':
        // Add validation: path must be provided
        return this.listDirectory(path);
      default:
        // Provide valid actions in the error message
        throw new Error(`Unsupported action: '${action}'. Valid actions are 'read', 'write', 'list'.`);
    }
  }

  // --- Private helper methods using Node.js 'fs/promises' ---

  private async readFile(path: string): Promise<{ success: boolean; content: string }> {
    // Implementation using fs.readFile(path, 'utf8')
    // Handle potential errors (file not found, permissions)
    console.log(`Reading file: ${path}`); // Example logging
    return { success: true, content: 'Example file content from readFile' };
  }

  private async writeFile(path: string, content: string): Promise<{ success: boolean; bytesWritten: number }> {
    // Implementation using fs.writeFile(path, content, 'utf8')
    // Handle potential errors (directory not found, permissions)
    console.log(`Writing to file: ${path}`); // Example logging
    return { success: true, bytesWritten: Buffer.byteLength(content, 'utf8') };
  }

  private async listDirectory(path: string): Promise<{ success: boolean; entries: string[] }> {
    // Implementation using fs.readdir(path)
    // Handle potential errors (path not found, not a directory)
    console.log(`Listing directory: ${path}`); // Example logging
    return { success: true, entries: ['file1.txt', 'subdir/'] };
  }
  
  private async readFile(path: string): Promise<any> {
    // Implementation for reading a file
    return { success: true, content: 'Example file content' };
  }
  
  private async writeFile(path: string, content: string): Promise<any> {
    // Implementation for writing to a file
    return { success: true, bytesWritten: content.length };
  }
  
  private async listDirectory(path: string): Promise<any> {
    // Implementation for listing directory contents
    return { success: true, files: ['file1.txt', 'file2.txt'] };
  }
}
```

### Graph-of-Thought Implementation Pattern

```typescript
// Example Graph-of-Thought data structures and basic class
/** Enum defining different types of nodes in the thought graph. */
export enum NodeType {
  INPUT = 'input', // Added Input type
  QUESTION = 'question',
  FACT = 'fact',
  HYPOTHESIS = 'hypothesis',
  CONCLUSION = 'conclusion',
  DECOMPOSITION = 'decomposition', // Added Decomposition type
  SYNTHESIS = 'synthesis' // Added Synthesis type
}

/** Interface representing a node in the thought graph. */
export interface GraphNode {
  /** Unique identifier for the node (e.g., UUID or CID). */
  id: string;
  /** The main content of the node (text, code, query, etc.). */
  content: string;
  /** The type of the node, indicating its role in the reasoning process. */
  type: NodeType;
  /** Current status of the node's processing. */
  status: 'Pending' | 'Ready' | 'InProgress' | 'CompletedSuccess' | 'CompletedFailure';
  /** Result of the node's processing (can be complex object or CID). */
  result?: any;
  /** Optional metadata (timestamps, confidence scores, etc.). */
  metadata?: Record<string, any>;
}

/** Interface representing a directed edge between two nodes. */
export interface GraphEdge {
  /** ID of the source node. */
  source: string;
  /** ID of the target node. */
  target: string;
  /** Type of relationship (e.g., 'depends_on', 'elaborates', 'conflicts_with'). */
  type: string;
  /** Optional weight for the edge. */
  weight?: number;
}

/**
 * Class representing the Graph-of-Thought structure.
 * Manages nodes and edges, providing traversal and manipulation methods.
 */
export class GraphOfThought {
  readonly id: string; // Graph identifier
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  // Adjacency lists for efficient traversal
  private adj: Map<string, string[]> = new Map();
  private revAdj: Map<string, string[]> = new Map();
  
  constructor(id?: string) { // Assumes generateUUID exists
    this.id = id || generateUUID();
  }

  /**
   * Adds a node to the graph.
   * @param node The node object to add.
   * @returns The ID of the added node.
   */
  
  addNode(node: GraphNode): string {
    if (this.nodes.has(node.id)) {
      // Handle update or throw error based on desired behavior
      console.warn(`Node with ID ${node.id} already exists. Overwriting.`);
    }
    this.nodes.set(node.id, node);
    // Initialize adjacency lists for the new node
    if (!this.adj.has(node.id)) this.adj.set(node.id, []);
    if (!this.revAdj.has(node.id)) this.revAdj.set(node.id, []);
    return node.id;
  }

  /**
   * Retrieves a node by its ID.
   * @param id The ID of the node to retrieve.
   * @returns The node object or undefined if not found.
   */
  
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }
  
  /**
   * Adds a directed edge between two nodes.
   * @param source ID of the source node.
   * @param target ID of the target node.
   * @param type Type of the relationship.
   * @param weight Optional weight.
   */
  addEdge(source: string, target: string, type: string, weight: number = 1): void {
    if (!this.nodes.has(source) || !this.nodes.has(target)) {
      throw new Error(`Cannot create edge: Source (${source}) or Target (${target}) node does not exist.`);
    }
    // Add edge to list
    
    this.edges.push({ source, target, type, weight });
    // Update adjacency lists
    this.adj.get(source)?.push(target);
    this.revAdj.get(target)?.push(source);
  }

  // ... (Getters for edges, adjacency lists remain similar) ...
  
  // Example: Get direct children (targets of outgoing edges)
  getChildren(nodeId: string): string[] {
    return this.adj.get(nodeId) || [];
  }

  // Example: Get direct parents (sources of incoming edges)
  getParents(nodeId: string): string[] {
    return this.revAdj.get(nodeId) || [];
  }


  /**
   * Performs a Depth-First Search traversal starting from a given node.
   * @param startNodeId The ID of the node to start traversal from.
   * @param visitor A function called for each visited node.
   */
  traverseDFS(startNodeId: string, visitor: (node: GraphNode, depth: number) => void): void {
    const visited = new Set<string>();
    const stack: [string, number][] = [[startNodeId, 0]]; // Use a stack for DFS

    while (stack.length > 0) {
      const [nodeId, depth] = stack.pop()!;
      if (!nodeId || visited.has(nodeId)) continue;

      const node = this.getNode(nodeId);
      if (!node) continue;

      visited.add(nodeId);
      visitor(node, depth);

      // Add children to the stack (reverse order to visit left branches first if desired)
      const children = this.getChildren(nodeId).reverse();
      for (const childId of children) {
        if (!visited.has(childId)) {
          stack.push([childId, depth + 1]);
        }
      }
    }
  }

  /**
   * Serializes the graph to a JSON-compatible object.
   * @returns A plain object representing the graph.
   */
  
  // ... (toJSON and fromJSON methods would need updating for adjacency lists if included) ...
}

// Note: For IPLD persistence, serialization would involve converting this structure
// into linked CBOR blocks, likely storing node content separately.
```

### Fibonacci Heap Implementation Pattern

```typescript
// Example Fibonacci Heap implementation for task scheduling (Conceptual)
// Note: A full, correct Fibonacci Heap implementation is complex.
// This pattern focuses on the interface and key aspects.
// Consider using a well-tested library if available.

/** Interface for a node within the Fibonacci Heap. */
export interface HeapNode<T> {
  /** Priority value (lower means higher priority). */
  key: number;
  /** The actual task or task ID. */
  value: T;
  // Internal heap structure properties:
  degree: number; // Number of children
  marked: boolean; // Flag for cascading cuts
  parent: HeapNode<T> | null; // Pointer to parent node
  child: HeapNode<T> | null; // Pointer to one child node
  left: HeapNode<T>; // Pointer to left sibling in circular list
  right: HeapNode<T>; // Pointer to right sibling in circular list
}

/**
 * Fibonacci Heap implementation for prioritizing tasks.
 * Provides O(1) amortized insert/decreaseKey and O(log n) amortized extractMin.
 */
export class FibonacciHeap<T> {
  private min: HeapNode<T> | null = null; // Pointer to the node with the minimum key
  private nodeCount: number = 0; // Total number of nodes in the heap
  // Map to quickly find a node by its value (Task ID) for decreaseKey operation.
  // Requires Task IDs to be unique and hashable.
  private nodeMap: Map<string, HeapNode<T>> = new Map(); // Assuming T has an 'id' property
  
  // Optional comparator if keys can be equal and value comparison is needed.
  // constructor(private comparator: (a: T, b: T) => number = () => 0) {}
  constructor() {}
  
  /** Checks if the heap is empty. */
  isEmpty(): boolean {
    return this.min === null; // Or check nodeCount === 0
  }

  /** Returns the number of tasks in the heap. */
  
  size(): number {
    return this.nodeCount;
  }
  
  /**
   * Inserts a task with a given priority into the heap.
   * Amortized time complexity: O(1).
   * @param key The priority (lower is higher urgency).
   * @param value The task object or ID (must have a unique 'id' property).
   * @returns The newly created heap node.
   */
  insert(key: number, value: T & { id: string }): HeapNode<T> {
    if (this.nodeMap.has(value.id)) {
      throw new Error(`Value with ID ${value.id} already exists in the heap.`);
    }
    const node = this._createNode(key, value); // Internal helper to create node

    // Add node to the root list
    if (this.min === null) {
      // Heap was empty
      node.left = node;
      node.right = node;
      this.min = node;
    } else {
      // Insert node into the root list (circular doubly linked list)
      node.right = this.min;
      node.left = this.min.left;
      this.min.left.right = node;
      this.min.left = node;
      // Update min pointer if necessary
      if (node.key < this.min.key) {
        this.min = node;
      }
    }

    this.nodeCount++;
    this.nodeMap.set(value.id, node); // Map ID to node
    return node;
  }

  /**
   * Removes and returns the task with the highest priority (minimum key).
   * Amortized time complexity: O(log n).
   * @returns The highest priority task or null if the heap is empty.
   */
  
  // ... (Complex implementation involving promoting children and consolidation) ...
  // ... (Placeholder - requires full implementation) ...
  extractMin(): (T & { id: string }) | null {
     const minValue = this.min?.value;
     if (minValue) {
       // Full implementation needed here
       // 1. Remove min node from root list
       // 2. Promote min node's children to root list
       // 3. If heap is not empty, call consolidate()
       // 4. Update nodeCount and nodeMap
       // this.nodeMap.delete(minValue.id);
       // this.nodeCount--;
     }
     return minValue || null;
   }


  /**
   * Decreases the priority key of a task already in the heap.
   * Amortized time complexity: O(1).
   * @param value The task object or ID (must have a unique 'id' property).
   * @param newKey The new, lower priority key.
   * @returns True if the key was decreased, false otherwise.
   */
  decreaseKey(value: T & { id: string }, newKey: number): boolean {
    const node = this.nodeMap.get(value.id);
    if (!node) {
      console.error(`Cannot decrease key: Value with ID ${value.id} not found.`);
      return false; // Node not found
    }

    if (newKey > node.key) {
      console.error(`Cannot decrease key: New key ${newKey} is greater than current key ${node.key}.`);
      return false; // New key must be smaller
    }
    if (newKey === node.key) {
        return true; // No change needed
    }

    node.key = newKey;
    const parent = node.parent;

    // If heap property is violated (node key < parent key)
    if (parent !== null && node.key < parent.key) {
      this._cut(node, parent); // Cut node from parent
      this._cascadingCut(parent); // Perform cascading cuts up the tree
    }

    // Update overall minimum pointer if necessary
    if (this.min === null || node.key < this.min.key) {
      this.min = node;
    }

    return true;
  }

  // --- Private Helper Methods (Essential for Heap Operations) ---

  private _createNode(key: number, value: T & { id: string }): HeapNode<T> {
    const node: HeapNode<T> = {
      key, value,
      degree: 0, marked: false,
      parent: null, child: null,
      left: null!, right: null! // Will be set immediately
    };
    node.left = node;
    node.right = node;
    return node;
  }

  // _consolidate(): Merges roots of same degree until all root degrees are unique. Crucial for extractMin.
  private _consolidate(): void { /* ... Complex implementation ... */ }

  // _cut(node, parent): Removes node from parent's child list and adds it to the root list.
  private _cut(node: HeapNode<T>, parent: HeapNode<T>): void { /* ... Implementation ... */ }

  // _cascadingCut(node): Recursively cuts marked ancestors if their child is cut.
  private _cascadingCut(node: HeapNode<T>): void { /* ... Implementation ... */ }

  // _link(child, parent): Makes child a child of parent. Used in consolidate.
  // private _link(child: HeapNode<T>, parent: HeapNode<T>): void { /* ... Implementation ... */ }

  // Helpers for manipulating circular doubly linked lists (insert, remove, merge)
  // ...
}
  
  decreaseKey(value: T, newKey: number): boolean {
    // Implementation of Fibonacci heap decrease-key operation
    const node = this.nodeMap.get(value);
    if (!node) return false;
    
    if (newKey > node.key) {
      return false; // New key is greater, not allowed
    }
    
    node.key = newKey;
    
    const parent = node.parent;
    if (parent !== null && node.key < parent.key) {
      this.cut(node, parent);
      this.cascadingCut(parent);
    }
    
    if (node.key < this.min!.key) {
      this.min = node;
    }
    
    return true;
  }
  
  // Other required helper methods would be implemented here
  private createNode(key: number, value: T): HeapNode<T> {
    // Implementation
  }
  
  private insertNodeIntoList(node: HeapNode<T>, list: HeapNode<T>): void {
    // Implementation
  }
  
  private removeNodeFromList(node: HeapNode<T>): void {
    // Implementation
  }
  
  private mergeNodeLists(a: HeapNode<T>, b: HeapNode<T>): void {
    // Implementation
  }
  
  private consolidate(): void {
    // Implementation
  }
  
  private cut(node: HeapNode<T>, parent: HeapNode<T>): void {
    // Implementation
  }
  
  private cascadingCut(node: HeapNode<T>): void {
    // Implementation
  }
}
```

### IPFS Kit MCP Client Implementation Pattern

```typescript
// Example IPFS Kit MCP client implementation using Fetch API
export interface IPFSKitConfig {
  /** Base URL of the IPFS Kit MCP Server API (e.g., http://localhost:5001). */
  baseUrl: string;
  /** Optional API key if required by the server. */
  /** Request timeout in milliseconds. */
  timeout?: number;
}

/**
 * Client for interacting with an IPFS Kit MCP Server.
 */
export class IPFSKitClient {
  private config: Required<IPFSKitConfig>; // Use Required for defaults
  // Using native fetch, no need for httpClient property if not using Axios
  
  constructor(config: IPFSKitConfig) {
    // Set defaults
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '', // Default to empty string if undefined
      timeout: config.timeout || 30000, // 30 seconds default
    };

    // Validate base URL
    if (!this.config.baseUrl) {
        throw new Error("IPFSKitClient: baseUrl is required in config.");
    }
    
    // No need to initialize httpClient if using native fetch directly
  }

  /**
   * Adds content (file or buffer) to the IPFS server.
   * @param content The content to add as a string or Buffer.
   * @returns A promise resolving to the CID of the added content.
   */
  
  async addContent(content: string | Buffer | Blob): Promise<{ cid: string }> {
    const formData = new FormData();
    const blob = content instanceof Blob ? content : new Blob([content]);
    formData.append('file', blob);

    const url = `${this.config.baseUrl}/api/v0/add`;
    const response = await this._fetchWithTimeout(url, {
      method: 'POST',
      body: formData,
      // Headers might be needed for API key, automatically set by FormData for content-type
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`IPFS add failed: ${data.Message || response.statusText}`);
    }
    // Assuming standard Kubo API response format
    return { cid: data.Hash };
  }

  /**
   * Retrieves content for a given CID.
   * @param cid The Content Identifier (CID) string.
   * @returns A promise resolving to a Buffer containing the content.
   */
  
  async getContent(cid: string): Promise<Buffer> {
    const url = `${this.config.baseUrl}/api/v0/cat?arg=${cid}`;
    const response = await this._fetchWithTimeout(url, { method: 'POST' }); // cat is often POST

    if (!response.ok) {
        const errorData = await response.text(); // Read error message
        throw new Error(`IPFS cat failed for ${cid}: ${response.statusText} - ${errorData}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Lists CIDs currently pinned by the server (or associated pinning service).
   * @returns A promise resolving to an array of pinned CID strings.
   */
  
  async listPins(): Promise<string[]> {
    const url = `${this.config.baseUrl}/api/v0/pin/ls?type=recursive`; // Usually want recursive pins
    const response = await this._fetchWithTimeout(url, { method: 'POST' }); // pin/ls is often POST

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`IPFS pin ls failed: ${errorData.Message || response.statusText}`);
    }
    const data = await response.json();
    return Object.keys(data.Keys || {}); // Standard Kubo API response
  }

  /**
   * Requests the server (or associated pinning service) to pin a CID.
   * @param cid The CID to pin.
   * @returns A promise resolving to true if the pin request was successful (may be asynchronous).
   */
  
  async pinContent(cid: string): Promise<{ Pins: string[] }> {
    const url = `${this.config.baseUrl}/api/v0/pin/add?arg=${cid}`;
    const response = await this._fetchWithTimeout(url, { method: 'POST' });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`IPFS pin add failed for ${cid}: ${errorData.Message || response.statusText}`);
    }
    return await response.json(); // Returns { Pins: [cid] } on success
  }

  // --- Optional: WebSocket/WebRTC methods ---
  // connectWebSocket(): WebSocket { ... }
  // connectWebRTC(): RTCDataChannel { ... }

  // --- Private Helper Methods ---

  /**
   * Wrapper around fetch with timeout and potential API key injection.
   */
  private async _fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const headers = new Headers(options.headers || {});
    if (this.config.apiKey) {
      headers.set('Authorization', `Bearer ${this.config.apiKey}`); // Example Auth
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.config.timeout}ms: ${url}`);
      }
      throw error; // Re-throw other errors
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Removed createHttpClient and wsUrl as they are not needed for fetch-based example
  
  // WebSocket/WebRTC methods for real-time operations
  connectWebSocket(): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/api/v0/pubsub`);
    // Setup handlers and authentication
    return ws;
  }
  
  // Helper methods
  private createHttpClient(): any {
    // Create and configure HTTP client (Axios, fetch, etc.)
    return {
      // Example implementation
    };
  }
  
  private get wsUrl(): string {
    return this.config.baseUrl.replace(/^http/, 'ws');
  }
}
```

## Testing Strategy

Each implemented component should be tested using:

1. **Unit Tests**: Test individual TypeScript classes and functions
2. **Type Tests**: Verify TypeScript type correctness
3. **Integration Tests**: Test component interactions
4. **CLI Tests**: Test command-line interface
5. **Performance Tests**: Verify performance expectations

### Example TypeScript Unit Test

```typescript
// Example TypeScript agent test
import { expect } from 'chai';
import { TypeScriptAgent, AgentOptions } from '../src/agent/typescript-agent';
import { MockTool } from './mocks/mock-tool';

describe('TypeScriptAgent', () => {
  let agent: TypeScriptAgent;
  let mockTool: MockTool;
  
  beforeEach(() => {
    mockTool = new MockTool();
    
    const options: AgentOptions = {
      model: 'test-model',
      temperature: 0.5,
      tools: [mockTool]
    };
    
    agent = new TypeScriptAgent(options);
  });
  
  it('should initialize with correct options', () => {
    expect(agent.getOptions().model).to.equal('test-model');
    expect(agent.getOptions().temperature).to.equal(0.5);
  });
  
  it('should register tools correctly', () => {
    const tools = agent.getTools();
    expect(tools).to.have.lengthOf(1);
    expect(tools[0].name).to.equal(mockTool.name);
  });
  
  it('should process messages and return responses', async () => {
    const response = await agent.processMessage('Hello');
    
    expect(response).to.not.be.undefined;
    expect(response.role).to.equal('assistant');
    expect(response.content).to.be.a('string');
  });
  
  it('should execute tools when called', async () => {
    mockTool.setResponse({ result: 'tool execution result' });
    
    // Simulate message that would trigger tool execution
    const response = await agent.processMessage('Use the mock tool');
    
    expect(mockTool.getExecutionCount()).to.equal(1);
    expect(response.content).to.include('tool execution result');
  });
});
```

### Example CLI Integration Test

```typescript
// Example CLI integration test
import { expect } from 'chai';
import { execSync } from 'child_process';

describe('Agent CLI Commands', () => {
  it('should execute agent commands', () => {
    const output = execSync('node bin/swissknife.js agent execute "Hello world"').toString();
    expect(output).to.include('assistant');
  });
  
  it('should list registered tools', () => {
    const output = execSync('node bin/swissknife.js tools list').toString();
    expect(output).to.include('file');
    expect(output).to.include('web');
  });
  
  it('should execute tools directly', () => {
    const output = execSync('node bin/swissknife.js tools execute file --action list --path .').toString();
    expect(output).to.include('success');
    expect(output).to.include('files');
  });
});
```

## Documentation Approach

Documentation for integrated components should include:

1. **TypeScript Interface Definitions**: Complete documentation of interfaces and types
2. **Class Documentation**: Methods, properties, and usage examples
3. **CLI Command Reference**: Commands, subcommands, and options
4. **Architecture Diagrams**: Component relationships and data flow
5. **Integration Guides**: How components work together

### Example TypeScript Interface Documentation

```typescript
/**
 * Options for configuring a TypeScript agent.
 */
export interface AgentOptions {
  /**
   * The model identifier to use for this agent.
   * Must be a valid model ID supported by the system.
   */
  model: string;
  
  /**
   * Temperature setting for response generation.
   * Higher values (e.g., 0.8) make output more random.
   * Lower values (e.g., 0.2) make output more deterministic.
   * @default 0.7
   */
  temperature?: number;
  
  /**
   * Maximum number of tokens to generate in responses.
   * @default 1000
   */
  maxTokens?: number;
  
  /**
   * Array of tools available to the agent.
   * @default []
   */
  tools?: Tool[];
}
```

### Example CLI Command Documentation

```markdown
# agent

Interact with the TypeScript AI agent

## Usage

```
swissknife agent chat [options]
swissknife agent execute <prompt> [options]
swissknife agent config [options]
```

## Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| --model | -m | string | Model to use | gpt-4 |
| --temperature | -t | number | Temperature setting | 0.7 |
| --max-tokens | -mt | number | Maximum output tokens | 1000 |

## Subcommands

### chat

Start an interactive chat with the agent

#### Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| --system | -s | string | System prompt | default |
| --persist | -p | boolean | Persist chat history | false |

### execute

Execute a single prompt

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| prompt | Text prompt to send to the agent | Yes |

#### Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| --system | -s | string | System prompt | default |
| --json | -j | boolean | Output in JSON format | false |

### config

Configure agent settings

#### Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| --list | -l | boolean | List current configuration | false |
| --set | -s | string | Set configuration value | - |
| --reset | -r | boolean | Reset to default configuration | false |

## Examples

```bash
# Start interactive chat
swissknife agent chat

# Execute a prompt
swissknife agent execute "What is the capital of France?"

# Execute with specific model
swissknife agent execute "Explain quantum computing" --model gpt-4

# Configure agent
swissknife agent config --set temperature=0.8
```
```

## Conclusion

This CLI integration strategy provides a comprehensive approach to reimplementing Goose features in TypeScript, integrating with the IPFS Kit MCP Server, and incorporating TaskNet enhancements. By following these patterns and sequences, the integration will maintain consistency, type safety, and maintainability while leveraging the benefits of TypeScript for tight coupling with the SwissKnife system.

The strategy emphasizes TypeScript-first development, interface-driven design, and incremental integration, ensuring that SwissKnife evolves into a powerful, cohesive AI toolkit with advanced problem-solving capabilities and sophisticated storage integration.
