# CLI Integration Strategy

This document outlines the specific strategy for integrating Goose features (reimplemented in TypeScript), IPFS Kit MCP Server, and TaskNet enhancements into the SwissKnife CLI architecture. It provides practical guidance on the integration approach, sequencing, and implementation techniques.

## Integration Principles

1. **Clean Room TypeScript Implementation**: Create independent TypeScript implementations of all functionality using clean room methodology without direct Rust code translation (see [../CLEAN_ROOM_IMPLEMENTATION.md](../CLEAN_ROOM_IMPLEMENTATION.md))
2. **Tight Coupling**: Ensure integrated components are tightly coupled with SwissKnife (except IPFS Kit MCP Server)
3. **Interface-Driven Design**: Define clear interfaces before implementation
4. **Incremental Integration**: Build functionality incrementally, ensuring stability at each step
5. **Test-Driven Development**: Implement comprehensive tests for each component

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
1. Analyze Goose AI agent architecture and features
2. Design TypeScript class hierarchy and interfaces
3. Implement core reasoning engine in TypeScript
4. Create message handling and processing system
5. Implement memory and context management
6. Add prompt handling and templating
7. Integrate with SwissKnife command system

**CLI Interface Example**:
```
swissknife agent chat                          # Start interactive chat with agent
swissknife agent execute "prompt" [options]    # Execute one-off prompt
swissknife agent config                        # Configure agent settings
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
1. Analyze IPFS Kit MCP Server API and protocols
2. Design TypeScript client interfaces
3. Implement REST API client for basic operations
4. Create WebSocket/WebRTC clients for real-time operations
5. Implement content addressing and CID handling
6. Add error handling and retry logic
7. Integrate with SwissKnife storage abstraction

**CLI Interface Example**:
```
swissknife ipfs add <file>                     # Add file to IPFS Kit MCP Server
swissknife ipfs get <cid>                      # Get content from IPFS Kit MCP Server
swissknife ipfs status                         # Check IPFS Kit MCP Server status
swissknife ipfs config                         # Configure IPFS Kit connection
```

**Implementation Location**: `src/ipfs/`

**Dependencies**: Command System

### 4. Graph-of-Thought Implementation

**Source**: TaskNet enhancements

**Integration Approach**:
1. Analyze Graph-of-Thought pattern and requirements
2. Design TypeScript graph data structures
3. Implement node and edge representations
4. Create graph traversal and manipulation utilities
5. Implement thinking pattern algorithms
6. Add visualization and debugging tools
7. Integrate with AI agent implementation

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
// Example TypeScript class implementation
export interface AgentOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

export class TypeScriptAgent {
  private options: AgentOptions;
  private tools: Map<string, Tool> = new Map();
  private memory: MessageMemory;
  
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
    
    // Initialize memory
    this.memory = new MessageMemory();
  }
  
  async processMessage(message: string, context?: any): Promise<AgentResponse> {
    // Log the incoming message
    this.memory.addMessage({ role: 'user', content: message });
    
    // Process the message
    const response = await this.generateResponse(message, context);
    
    // Log the response
    this.memory.addMessage({ role: 'assistant', content: response.content });
    
    return response;
  }
  
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  private async generateResponse(message: string, context?: any): Promise<AgentResponse> {
    // Implementation of response generation
    // This would include calling the AI model, processing tools, etc.
    
    return {
      id: Date.now().toString(),
      content: "Example response",
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
  }
}
```

### TypeScript Tool Implementation Pattern

```typescript
// Example tool implementation
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(params: any, context?: any): Promise<any>;
}

export class FileTool implements Tool {
  name = 'file';
  description = 'Read or write files on the filesystem';
  
  parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform (read, write, list)',
      required: true
    },
    {
      name: 'path',
      type: 'string',
      description: 'File or directory path',
      required: true
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write (for write action)',
      required: false
    }
  ];
  
  async execute(params: any, context?: any): Promise<any> {
    const { action, path, content } = params;
    
    switch (action) {
      case 'read':
        return this.readFile(path);
      case 'write':
        return this.writeFile(path, content);
      case 'list':
        return this.listDirectory(path);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
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
// Example Graph-of-Thought implementation
export enum NodeType {
  QUESTION = 'question',
  FACT = 'fact',
  HYPOTHESIS = 'hypothesis',
  CONCLUSION = 'conclusion'
}

export interface GraphNode {
  id: string;
  content: string;
  type: NodeType;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string; // Node ID
  target: string; // Node ID
  type: string;
  weight?: number;
}

export class GraphOfThought {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  
  constructor(id?: string) {
    this.id = id || generateUUID();
  }
  
  addNode(node: GraphNode): string {
    this.nodes.set(node.id, node);
    return node.id;
  }
  
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }
  
  addEdge(source: string, target: string, type: string, weight: number = 1): void {
    if (!this.nodes.has(source) || !this.nodes.has(target)) {
      throw new Error(`Cannot create edge: one or both nodes don't exist`);
    }
    
    this.edges.push({ source, target, type, weight });
  }
  
  getOutgoingEdges(nodeId: string): GraphEdge[] {
    return this.edges.filter(edge => edge.source === nodeId);
  }
  
  getIncomingEdges(nodeId: string): GraphEdge[] {
    return this.edges.filter(edge => edge.target === nodeId);
  }
  
  traverse(startNodeId: string, visitor: (node: GraphNode, depth: number) => void): void {
    const visited = new Set<string>();
    
    const dfs = (nodeId: string, depth: number) => {
      if (visited.has(nodeId)) return;
      
      const node = this.getNode(nodeId);
      if (!node) return;
      
      visited.add(nodeId);
      visitor(node, depth);
      
      const outgoing = this.getOutgoingEdges(nodeId);
      for (const edge of outgoing) {
        dfs(edge.target, depth + 1);
      }
    };
    
    dfs(startNodeId, 0);
  }
  
  toJSON(): any {
    return {
      id: this.id,
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }
  
  static fromJSON(data: any): GraphOfThought {
    const graph = new GraphOfThought(data.id);
    
    // Add nodes
    data.nodes.forEach((node: GraphNode) => {
      graph.addNode(node);
    });
    
    // Add edges
    data.edges.forEach((edge: GraphEdge) => {
      graph.addEdge(edge.source, edge.target, edge.type, edge.weight);
    });
    
    return graph;
  }
}
```

### Fibonacci Heap Implementation Pattern

```typescript
// Example Fibonacci Heap implementation for task scheduling
export interface HeapNode<T> {
  key: number;
  value: T;
  degree: number;
  marked: boolean;
  parent: HeapNode<T> | null;
  child: HeapNode<T> | null;
  left: HeapNode<T>;
  right: HeapNode<T>;
}

export class FibonacciHeap<T> {
  private min: HeapNode<T> | null = null;
  private nodeCount: number = 0;
  private nodeMap: Map<T, HeapNode<T>> = new Map();
  
  constructor(private comparator: (a: T, b: T) => number = () => 0) {}
  
  isEmpty(): boolean {
    return this.nodeCount === 0;
  }
  
  size(): number {
    return this.nodeCount;
  }
  
  insert(key: number, value: T): HeapNode<T> {
    // Implementation of Fibonacci heap insert operation
    const node = this.createNode(key, value);
    
    if (this.min === null) {
      this.min = node;
    } else {
      this.insertNodeIntoList(node, this.min);
      if (node.key < this.min.key) {
        this.min = node;
      }
    }
    
    this.nodeCount++;
    this.nodeMap.set(value, node);
    return node;
  }
  
  extractMin(): T | null {
    // Implementation of Fibonacci heap extract-min operation
    if (this.min === null) return null;
    
    const minNode = this.min;
    const value = minNode.value;
    
    // Handle children
    if (minNode.child !== null) {
      let child = minNode.child;
      const firstChild = child;
      
      do {
        child.parent = null;
        child = child.right;
      } while (child !== firstChild);
      
      if (this.min.right === this.min) {
        // Min was the only root
        this.min = firstChild;
      } else {
        this.mergeNodeLists(this.min, firstChild);
      }
    }
    
    // Remove min from root list
    this.removeNodeFromList(minNode);
    
    if (minNode.right === minNode) {
      this.min = null;
    } else {
      this.min = minNode.right;
      this.consolidate();
    }
    
    this.nodeCount--;
    this.nodeMap.delete(value);
    return value;
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
// Example IPFS Kit MCP client implementation
export interface IPFSKitConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class IPFSKitClient {
  private config: IPFSKitConfig;
  private httpClient: any; // Axios or similar
  
  constructor(config: IPFSKitConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config
    };
    
    // Initialize HTTP client
    this.httpClient = this.createHttpClient();
  }
  
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    const formData = new FormData();
    
    if (typeof content === 'string') {
      formData.append('file', new Blob([content]));
    } else {
      formData.append('file', new Blob([content]));
    }
    
    const response = await this.httpClient.post('/api/v0/add', formData);
    return { cid: response.data.Hash };
  }
  
  async getContent(cid: string): Promise<Buffer> {
    const response = await this.httpClient.get(`/api/v0/cat?arg=${cid}`, {
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  }
  
  async listPins(): Promise<string[]> {
    const response = await this.httpClient.get('/api/v0/pin/ls');
    return Object.keys(response.data.Keys || {});
  }
  
  async pinContent(cid: string): Promise<boolean> {
    const response = await this.httpClient.post(`/api/v0/pin/add?arg=${cid}`);
    return response.data.Pins.includes(cid);
  }
  
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