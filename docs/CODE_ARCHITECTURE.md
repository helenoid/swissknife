# SwissKnife Unified Architecture

This document provides a comprehensive overview of the SwissKnife unified architecture, which combines all functionality into a single TypeScript codebase with domain-driven organization. All features are directly integrated in TypeScript, with the Python-based IPFS Kit MCP Server as the only external component that's integrated via API calls.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [MCP Architecture Pattern](#mcp-architecture-pattern)
- [Cross-Language Communication](#cross-language-communication)
- [Role-Based Architecture](#role-based-architecture)
- [Project Structure](#project-structure)
- [Implementation Details](#implementation-details)
- [Data Flow Patterns](#data-flow-patterns)
- [Component Relationships](#component-relationships)
- [Extension Mechanisms](#extension-mechanisms)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

SwissKnife follows a comprehensive architecture that integrates multiple codebases and language environments:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     SwissKnife Unified TypeScript Codebase                │
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐  │
│  │    CLI/UI      │  │  Command       │  │  Model                      │  │
│  │  (React/Ink)   │  │  System        │  │  Registry                   │  │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘  │
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐  │
│  │  AI            │  │  ML            │  │  TaskNet                    │  │
│  │  Capabilities  │  │  Acceleration  │  │  System                     │  │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘  │
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐  │
│  │   Storage      │  │  Config        │  │  Worker                     │  │
│  │   System       │  │  System        │  │  System                     │  │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
                                    │ API-Based Integration
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          IPFS Kit MCP Server (Python)                     │
└───────────────────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Primary Language**:
  - **TypeScript**: All functionality is implemented in a single TypeScript codebase
  - **JavaScript**: Runtime environment through Node.js
  - **Python**: IPFS Kit MCP Server (the only external component)

- **Frameworks & Libraries**:
  - **React/Ink**: Terminal-based UI components
  - **Node.js**: JavaScript runtime environment
  - **Axios**: HTTP client for API communication
  - **WebSockets**: Real-time communication
  - **Node.js ML**: Neural network execution capabilities
  - **TypeScript Type System**: Type-safe interfaces across all components

- **Storage & Computation**:
  - **IPFS**: Content-addressed storage via IPFS Kit MCP Server
  - **Neural Network Acceleration**: ML model execution integrated directly in TypeScript
  - **Tiered Cache System**: Memory, disk, and memory-mapped caching
  - **Fibonacci Heap Scheduler**: Efficient task prioritization and management

- **AI & ML**:
  - **Graph-of-Thought**: Advanced non-linear reasoning system
  - **Model Registry**: Version-controlled ML models
  - **Tool System**: Type-safe tool interfaces for AI capabilities
  - **IPFS Content Storage**: CID-based retrieval for AI assets

## Core Components

### 1. Domain-Driven Architecture Components

#### AI Capabilities Domain:

- **Agent System**: Core AI agent implementation
  - **Agent**: Main AI agent implementation
  - **Context**: Agent context management
  - **Memory**: Conversation history and memory

- **Tool System**: Tool definition and execution
  - **Tool**: Tool interface definition
  - **ToolRegistry**: Tool registration and discovery
  - **ToolExecutor**: Tool execution and result handling
  - **BuiltInTools**: Standard tool implementations

- **Model System**: Model management and execution
  - **ModelRegistry**: Registry for ML models
  - **ModelProvider**: Model provider interface
  - **ModelExecutor**: Model execution and response processing

- **Thinking System**: Advanced reasoning capabilities
  - **GraphOfThought**: Graph-based reasoning system
  - **ThinkingPatterns**: Predefined thinking strategies
  - **ReasoningEngine**: Reasoning implementation

#### CLI and UI Domain:

- **Command System**: Process CLI commands
  - **CommandRegistry**: Command registration system
  - **CommandParser**: Command parsing and validation
  - **CommandContext**: Command execution context

- **UI Components**: Terminal UI implementation
  - **MessageComponent**: Chat message display
  - **InputComponent**: User input handling
  - **SelectionComponent**: Option selection UI
  - **ProgressComponent**: Progress visualization

- **Formatters**: Output formatting
  - **MarkdownFormatter**: Markdown rendering
  - **CodeFormatter**: Syntax highlighting
  - **TableFormatter**: Table rendering

#### Storage Domain:

- **IPFS Integration**: Integration with IPFS Kit MCP Server
  - **MCPClient**: Client for IPFS Kit MCP Server
  - **ContentManager**: Content management operations
  - **CIDUtilities**: CID handling and operations

- **Caching System**: Multi-tier caching
  - **MemoryCache**: In-memory caching
  - **DiskCache**: Persistent disk caching
  - **MMFCache**: Memory-mapped file caching

- **Storage Interface**: Abstract storage operations
  - **StorageProvider**: Storage provider interface
  - **StorageOperations**: Common storage operations
  - **MetadataManager**: Content metadata management

### 2. Communication and Integration

- **Direct TypeScript Integration**: Components communicate directly through TypeScript imports
  - **ModuleImports**: Direct TypeScript module imports
  - **TypedInterfaces**: Type-safe interface contracts
  - **EventEmitters**: Event-based communication

- **API-Based MCP Server Integration**: Integration with IPFS Kit MCP Server
  - **HTTPClient**: REST API client for synchronous operations
  - **WebSocketClient**: WebSocket client for real-time events
  - **ContentAddressing**: CID-based content addressing

- **Worker Thread Communication**: Communication between worker threads
  - **MessagePassing**: Structured message passing
  - **SharedMemory**: Shared memory for performance-critical operations
  - **WorkerPool**: Worker thread pool management

### 3. Task Processing Components

- **Task Management System**: Advanced task handling
  - **TaskManager**: Core task management
  - **TaskDecomposition**: Task breakdown to subtasks
  - **TaskExecution**: Task execution coordination

- **Fibonacci Heap Scheduler**: Efficient task scheduling
  - **FibonacciHeap**: Heap data structure implementation
  - **PriorityCalculation**: Dynamic priority calculation
  - **SchedulerQueue**: Task execution queue

- **Graph-of-Thought System**: Graph-based reasoning
  - **DirectedAcyclicGraph**: Core graph data structure
  - **NodeProcessor**: Graph node processing
  - **GraphTraversal**: Graph traversal algorithms
  - **ReasoningSynthesis**: Result synthesis from graph

## Direct TypeScript Integration

The unified architecture implements all functionality directly in TypeScript, with clear domain boundaries and well-defined interfaces between components:

### Model Layer

The Model layer contains domain-specific business logic implemented directly in TypeScript:

```typescript
// Example: AI domain agent implementation in TypeScript
// src/ai/agent/agent.ts
import { Tool } from '../tools/tool';
import { Model } from '../models/model';
import { ToolExecutor } from '../tools/executor';
import { ThinkingManager } from '../thinking/manager';

export interface AgentOptions {
  model: Model;
  tools?: Tool[];
  maxTokens?: number;
  temperature?: number;
}

export class Agent {
  private model: Model;
  private tools: Map<string, Tool> = new Map();
  private toolExecutor: ToolExecutor;
  private thinkingManager: ThinkingManager;
  
  constructor(options: AgentOptions) {
    this.model = options.model;
    this.toolExecutor = new ToolExecutor();
    this.thinkingManager = new ThinkingManager();
    
    // Register tools if provided
    if (options.tools) {
      for (const tool of options.tools) {
        this.registerTool(tool);
      }
    }
  }
  
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.toolExecutor.registerTool(tool);
  }
  
  async processMessage(message: string): Promise<string> {
    // Implementation of message processing with thinking patterns
    const thinking = await this.thinkingManager.createThinkingProcess(message);
    const modelResponse = await this.model.generate({
      messages: [...thinking.getContext(), { role: 'user', content: message }],
      maxTokens: this.maxTokens,
      temperature: this.temperature
    });
    
    // Handle tool calls if present in response
    if (modelResponse.toolCalls && modelResponse.toolCalls.length > 0) {
      return await this.toolExecutor.executeToolCalls(modelResponse.toolCalls);
    }
    
    return modelResponse.content;
  }
}
```

### Controller Layer

The Controller layer processes requests and coordinates between domains using direct TypeScript imports:

```typescript
// Example: CLI command controllers in TypeScript
// src/cli/commands/model-command.ts
import { CommandRegistry } from './registry';
import { ModelRegistry } from '../../ai/models/registry';
import { Agent } from '../../ai/agent/agent';

export function registerModelCommands() {
  const modelRegistry = ModelRegistry.getInstance();
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'model',
    name: 'model',
    description: 'Manage and use AI models',
    subcommands: [
      {
        id: 'list',
        name: 'list',
        description: 'List available models',
        handler: async (args, context) => {
          const models = modelRegistry.getAllModels();
          context.ui.renderTable({
            headers: ['ID', 'Name', 'Provider', 'Default'],
            rows: models.map(model => [
              model.id,
              model.name,
              model.provider,
              modelRegistry.getDefaultModel()?.id === model.id ? '✓' : ''
            ])
          });
          return 0;
        }
      },
      {
        id: 'use',
        name: 'use',
        description: 'Set default model',
        args: [{ name: 'model-id', description: 'ID of the model to use', required: true }],
        handler: async (args, context) => {
          const modelId = args['model-id'];
          const model = modelRegistry.getModel(modelId);
          
          if (!model) {
            context.ui.error(`Model "${modelId}" not found`);
            return 1;
          }
          
          modelRegistry.setDefaultModel(modelId);
          context.ui.success(`Default model set to ${model.name} (${model.id})`);
          return 0;
        }
      }
      // More model commands...
    ],
    handler: async (args, context) => {
      // Show help for model command if no subcommand provided
      context.ui.renderHelp(this);
      return 0;
    }
  });
}
```

### Persistence Layer

The Persistence layer integrates with the IPFS Kit MCP Server through a TypeScript client API:

```typescript
// Example: IPFS Kit MCP client in TypeScript
// src/storage/ipfs/mcp-client.ts
import axios from 'axios';

export interface MCPClientOptions {
  baseUrl: string;
  timeout?: number;
  authentication?: {
    type: 'apiKey' | 'token';
    value: string;
  };
}

export class MCPClient {
  private options: MCPClientOptions;
  private httpClient: any;
  
  constructor(options: MCPClientOptions) {
    this.options = {
      timeout: 30000, // 30 seconds default
      ...options
    };
    
    this.httpClient = axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout,
      headers: this.getAuthHeaders()
    });
  }
  
  private getAuthHeaders(): Record<string, string> {
    // Implementation of authentication headers
    const headers: Record<string, string> = {};
    
    if (this.options.authentication) {
      if (this.options.authentication.type === 'apiKey') {
        headers['X-API-Key'] = this.options.authentication.value;
      } else if (this.options.authentication.type === 'token') {
        headers['Authorization'] = `Bearer ${this.options.authentication.value}`;
      }
    }
    
    return headers;
  }
  
  // Content operations
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    const formData = new FormData();
    const blob = content instanceof Buffer 
      ? new Blob([content]) 
      : new Blob([Buffer.from(content)]);
    formData.append('file', blob);
    
    const response = await this.httpClient.post('/api/v0/add', formData);
    return { cid: response.data.Hash };
  }
  
  async getContent(cid: string): Promise<Buffer> {
    const response = await this.httpClient.get(`/api/v0/cat?arg=${cid}`, {
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  }
}
```
```

## API-Based Integration

The system uses API-based communication to integrate with the IPFS Kit MCP Server:

### 1. REST API Communication

```typescript
// Example: Using the MCPClient for data operations
import { MCPClient } from '../storage/ipfs/mcp-client';
import { ConfigurationManager } from '../config/manager';

async function storeDocument(document: string): Promise<string> {
  // Get configuration
  const config = ConfigurationManager.getInstance();
  const mcpConfig = config.get('storage.mcp');
  
  // Initialize MCP client
  const mcpClient = new MCPClient({
    baseUrl: mcpConfig.baseUrl,
    authentication: {
      type: mcpConfig.authType,
      value: mcpConfig.authValue
    }
  });
  
  // Store document in IPFS via MCP server
  try {
    const result = await mcpClient.addContent(document);
    console.log(`Document stored with CID: ${result.cid}`);
    return result.cid;
  } catch (error) {
    console.error('Failed to store document:', error);
    throw error;
  }
}

async function retrieveDocument(cid: string): Promise<string> {
  // Get configuration
  const config = ConfigurationManager.getInstance();
  const mcpConfig = config.get('storage.mcp');
  
  // Initialize MCP client
  const mcpClient = new MCPClient({
    baseUrl: mcpConfig.baseUrl,
    authentication: {
      type: mcpConfig.authType,
      value: mcpConfig.authValue
    }
  });
  
  // Retrieve document from IPFS via MCP server
  try {
    const content = await mcpClient.getContent(cid);
    return content.toString('utf-8');
  } catch (error) {
    console.error(`Failed to retrieve document with CID ${cid}:`, error);
    throw error;
  }
}
```

### 2. WebSocket Communication

```typescript
// Example: WebSocket connection for real-time events
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ConfigurationManager } from '../config/manager';

export class MCPEventClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second delay
  
  constructor(private baseUrl: string) {
    super();
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
      
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          this.emit('message', data);
          
          // Emit specific event types
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.emit('disconnected');
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connect().catch(err => {
              console.error('Failed to reconnect:', err);
            });
          }, delay);
        }
      };
    });
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(JSON.stringify(data));
  }
  
  subscribe(topic: string): void {
    this.send({
      type: 'subscribe',
      topic
    });
  }
  
  unsubscribe(topic: string): void {
    this.send({
      type: 'unsubscribe',
      topic
    });
  }
}
```

### 3. Type-Safe API Client

To ensure type safety across the API boundary, we define TypeScript interfaces that match the expected Python MCP server responses:

```typescript
// Example: Type-safe interfaces for MCP Server API
export interface MCPServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ContentInfo {
  cid: string;
  size: number;
  name?: string;
  mimeType?: string;
  created: string; // ISO date string
}

export interface PinInfo {
  cid: string;
  status: 'pinned' | 'pinning' | 'failed';
  created: string; // ISO date string
}

// Type-safe client implementation
export class TypedMCPClient {
  private client: MCPClient;
  
  constructor(options: MCPClientOptions) {
    this.client = new MCPClient(options);
  }
  
  async addContent(content: string | Buffer, name?: string): Promise<ContentInfo> {
    const result = await this.client.addContent(content);
    
    return {
      cid: result.cid,
      size: content instanceof Buffer ? content.length : Buffer.from(content).length,
      name,
      created: new Date().toISOString()
    };
  }
  
  async getContent(cid: string): Promise<Buffer> {
    return this.client.getContent(cid);
  }
  
  async pinContent(cid: string): Promise<PinInfo> {
    const response = await this.client.makeRequest<PinInfo>('/api/v0/pin/add', {
      method: 'POST',
      data: { cid }
    });
    
    if (!response.success) {
      throw new Error(`Failed to pin content: ${response.error?.message}`);
    }
    
    return response.data!;
  }
}
```

## Task Management Architecture

The system implements a sophisticated task management architecture with Graph-of-Thought reasoning and Fibonacci heap scheduling:

### 1. Graph-of-Thought Implementation

```typescript
// Example: Graph-of-Thought implementation in TypeScript
// src/tasks/graph/graph-of-thought.ts
import { DirectedAcyclicGraph } from './dag';
import { FibonacciHeapScheduler } from '../scheduler/fibonacci-heap-scheduler';

export interface ThoughtNode {
  id: string;
  type: ThoughtNodeType;
  content: string;
  dependencies: string[];
  status: NodeStatus;
  metadata: {
    confidence: number;
    createdAt: number;
    completedAt?: number;
  };
  result?: any;
}

export enum ThoughtNodeType {
  QUESTION = 'question',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  HYPOTHESIS = 'hypothesis',
  EVIDENCE = 'evidence',
  CONCLUSION = 'conclusion'
}

export enum NodeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class GraphOfThought {
  private dag: DirectedAcyclicGraph<ThoughtNode>;
  private scheduler: FibonacciHeapScheduler<ThoughtNode>;
  
  constructor() {
    this.dag = new DirectedAcyclicGraph<ThoughtNode>();
    this.scheduler = new FibonacciHeapScheduler<ThoughtNode>(
      (a, b) => this.calculatePriority(a) - this.calculatePriority(b)
    );
  }
  
  createNode(type: ThoughtNodeType, content: string, dependencies: string[] = []): ThoughtNode {
    const node: ThoughtNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      content,
      dependencies,
      status: NodeStatus.PENDING,
      metadata: {
        confidence: 0,
        createdAt: Date.now()
      }
    };
    
    this.dag.addNode(node);
    
    // Add edges for dependencies
    for (const dependencyId of dependencies) {
      if (this.dag.hasNode(dependencyId)) {
        this.dag.addEdge(dependencyId, node.id);
      }
    }
    
    // Schedule if dependencies are met
    if (this.areDependenciesMet(node)) {
      this.scheduler.insert(node);
    }
    
    return node;
  }
  
  private areDependenciesMet(node: ThoughtNode): boolean {
    // Check if all dependencies are completed
    for (const dependencyId of node.dependencies) {
      const dependency = this.dag.getNode(dependencyId);
      if (!dependency || dependency.status !== NodeStatus.COMPLETED) {
        return false;
      }
    }
    
    return true;
  }
  
  async executeNextTask(): Promise<ThoughtNode | null> {
    if (this.scheduler.isEmpty()) {
      return null;
    }
    
    const node = this.scheduler.extractMin();
    if (!node) {
      return null;
    }
    
    // Mark as processing
    node.status = NodeStatus.PROCESSING;
    
    try {
      // Process the node based on its type
      const processedNode = await this.processNode(node);
      
      // Mark as completed
      processedNode.status = NodeStatus.COMPLETED;
      processedNode.metadata.completedAt = Date.now();
      
      // Update in DAG
      this.dag.updateNode(processedNode.id, processedNode);
      
      // Find dependent nodes that can now be scheduled
      this.scheduleDependentNodes(processedNode.id);
      
      return processedNode;
    } catch (error) {
      // Mark as failed
      node.status = NodeStatus.FAILED;
      this.dag.updateNode(node.id, node);
      
      console.error(`Error processing node ${node.id}:`, error);
      return node;
    }
  }
  
  private scheduleDependentNodes(completedNodeId: string): void {
    // Get nodes that depend on the completed node
    const dependentNodeIds = this.dag.getOutgoingEdges(completedNodeId);
    
    for (const nodeId of dependentNodeIds) {
      const node = this.dag.getNode(nodeId);
      if (node && this.areDependenciesMet(node)) {
        this.scheduler.insert(node);
      }
    }
  }
  
  private async processNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Process node based on its type
    switch (node.type) {
      case ThoughtNodeType.QUESTION:
        return this.processQuestionNode(node);
      case ThoughtNodeType.RESEARCH:
        return this.processResearchNode(node);
      case ThoughtNodeType.ANALYSIS:
        return this.processAnalysisNode(node);
      case ThoughtNodeType.HYPOTHESIS:
        return this.processHypothesisNode(node);
      case ThoughtNodeType.EVIDENCE:
        return this.processEvidenceNode(node);
      case ThoughtNodeType.CONCLUSION:
        return this.processConclusionNode(node);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
  
  private calculatePriority(node: ThoughtNode): number {
    // Calculate priority based on multiple factors
    let priority = 0;
    
    // Base priority by node type
    switch (node.type) {
      case ThoughtNodeType.QUESTION:
        priority += 10;
        break;
      case ThoughtNodeType.RESEARCH:
        priority += 20;
        break;
      case ThoughtNodeType.ANALYSIS:
        priority += 30;
        break;
      case ThoughtNodeType.HYPOTHESIS:
        priority += 25;
        break;
      case ThoughtNodeType.EVIDENCE:
        priority += 35;
        break;
      case ThoughtNodeType.CONCLUSION:
        priority += 40;
        break;
    }
    
    // Age factor - older nodes get higher priority
    const age = (Date.now() - node.metadata.createdAt) / 1000; // in seconds
    priority -= Math.min(10, age / 60); // max 10 points for 10 minutes
    
    // Dependent count - nodes with more dependents get higher priority
    const dependentCount = this.dag.getOutgoingEdges(node.id).length;
    priority -= dependentCount * 2;
    
    return priority;
  }
  
  // Node processing implementations...
  private async processQuestionNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Implementation details...
    return node;
  }
  
  private async processResearchNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Implementation details...
    return node;
  }
  
  private async processAnalysisNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Implementation details...
    return node;
  }
  
  private async processHypothesisNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Implementation details...
    return node;
  }
  
  private async processEvidenceNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Implementation details...
    return node;
  }
  
  private async processConclusionNode(node: ThoughtNode): Promise<ThoughtNode> {
    // Implementation details...
    return node;
  }
}
```

### 2. Fibonacci Heap Scheduler

```typescript
// Example: Fibonacci heap scheduler implementation in TypeScript
// src/tasks/scheduler/fibonacci-heap-scheduler.ts

export class FibonacciHeapNode<T> {
  data: T;
  key: number;
  degree: number = 0;
  marked: boolean = false;
  parent: FibonacciHeapNode<T> | null = null;
  child: FibonacciHeapNode<T> | null = null;
  left: FibonacciHeapNode<T>;
  right: FibonacciHeapNode<T>;
  
  constructor(data: T, key: number) {
    this.data = data;
    this.key = key;
    this.left = this;
    this.right = this;
  }
}

export class FibonacciHeapScheduler<T> {
  private min: FibonacciHeapNode<T> | null = null;
  private nodesCount: number = 0;
  private comparator: (a: T, b: T) => number;
  private nodeMap = new Map<string, FibonacciHeapNode<T>>();
  
  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
  }
  
  isEmpty(): boolean {
    return this.nodesCount === 0;
  }
  
  insert(item: T): FibonacciHeapNode<T> {
    const key = this.getKey(item);
    const node = new FibonacciHeapNode<T>(item, key);
    
    // Store reference to node for O(1) lookups
    if ('id' in item && typeof (item as any).id === 'string') {
      this.nodeMap.set((item as any).id, node);
    }
    
    if (this.min === null) {
      // First node
      this.min = node;
    } else {
      // Insert into root list
      this.insertIntoRootList(node);
      
      // Update min if needed
      if (node.key < this.min.key) {
        this.min = node;
      }
    }
    
    this.nodesCount++;
    return node;
  }
  
  extractMin(): T | null {
    if (this.min === null) {
      return null;
    }
    
    const min = this.min;
    
    // Remove from nodeMap
    if ('id' in min.data && typeof (min.data as any).id === 'string') {
      this.nodeMap.delete((min.data as any).id);
    }
    
    // If there are children, add them to the root list
    if (min.child !== null) {
      let child = min.child;
      let nextChild;
      
      do {
        nextChild = child.right;
        
        // Add to root list
        this.insertIntoRootList(child);
        
        // Clear parent reference
        child.parent = null;
        
        child = nextChild;
      } while (child !== min.child);
    }
    
    // Remove min from root list
    this.removeFromRootList(min);
    
    if (min === min.right) {
      // Was the only node
      this.min = null;
    } else {
      this.min = min.right;
      this.consolidate();
    }
    
    this.nodesCount--;
    return min.data;
  }
  
  decreaseKey(node: FibonacciHeapNode<T>, newKey: number): void {
    if (newKey > node.key) {
      throw new Error('New key is greater than current key');
    }
    
    node.key = newKey;
    const parent = node.parent;
    
    if (parent !== null && node.key < parent.key) {
      // Cut from parent and move to root list
      this.cut(node, parent);
      this.cascadingCut(parent);
    }
    
    if (node.key < this.min!.key) {
      this.min = node;
    }
  }
  
  update(itemId: string, updatedItem: T): boolean {
    const node = this.nodeMap.get(itemId);
    if (!node) {
      return false;
    }
    
    const newKey = this.getKey(updatedItem);
    node.data = updatedItem;
    
    if (newKey < node.key) {
      this.decreaseKey(node, newKey);
    } else if (newKey > node.key) {
      // For Fibonacci heap, increasing key requires removal and reinsertion
      this.removeNode(node);
      this.insert(updatedItem);
    }
    
    return true;
  }
  
  private getKey(item: T): number {
    // Use comparator to get a numeric key
    // This is a simple approach; real implementation would be more sophisticated
    return this.comparator(item, item);
  }
  
  private insertIntoRootList(node: FibonacciHeapNode<T>): void {
    if (this.min === null) {
      this.min = node;
      return;
    }
    
    // Insert between min and min.right
    node.right = this.min.right;
    node.left = this.min;
    this.min.right.left = node;
    this.min.right = node;
  }
  
  private removeFromRootList(node: FibonacciHeapNode<T>): void {
    if (node.right === node) {
      // Only one node
      return;
    }
    
    node.left.right = node.right;
    node.right.left = node.left;
  }
  
  private consolidate(): void {
    // Consolidate trees to ensure no two roots have the same degree
    const maxDegree = Math.floor(Math.log2(this.nodesCount)) + 1;
    const degreeArray: Array<FibonacciHeapNode<T> | null> = new Array(maxDegree).fill(null);
    
    // Gather all roots
    const roots: FibonacciHeapNode<T>[] = [];
    let current = this.min!;
    do {
      roots.push(current);
      current = current.right;
    } while (current !== this.min);
    
    // Process each root
    for (const root of roots) {
      let x = root;
      let degree = x.degree;
      
      // Link trees of the same degree
      while (degreeArray[degree] !== null) {
        let y = degreeArray[degree]!;
        
        // Ensure x is the smaller key
        if (x.key > y.key) {
          const temp = x;
          x = y;
          y = temp;
        }
        
        // Link y under x
        this.linkHeap(y, x);
        
        // Clear degree array entry and move to next degree
        degreeArray[degree] = null;
        degree++;
      }
      
      degreeArray[degree] = x;
    }
    
    // Reset min pointer
    this.min = null;
    
    // Reconstruct root list from degree array
    for (let i = 0; i < maxDegree; i++) {
      if (degreeArray[i] !== null) {
        if (this.min === null) {
          // Create a new root list with just this node
          this.min = degreeArray[i];
          this.min.left = this.min;
          this.min.right = this.min;
        } else {
          // Add to existing root list
          this.insertIntoRootList(degreeArray[i]!);
          
          // Update min if needed
          if (degreeArray[i]!.key < this.min.key) {
            this.min = degreeArray[i];
          }
        }
      }
    }
  }
  
  private linkHeap(y: FibonacciHeapNode<T>, x: FibonacciHeapNode<T>): void {
    // Remove y from root list
    this.removeFromRootList(y);
    
    // Make y a child of x
    if (x.child === null) {
      x.child = y;
      y.left = y;
      y.right = y;
    } else {
      y.left = x.child;
      y.right = x.child.right;
      x.child.right.left = y;
      x.child.right = y;
    }
    
    // Update parent reference and degree
    y.parent = x;
    x.degree++;
    
    // Clear marked flag
    y.marked = false;
  }
  
  private cut(node: FibonacciHeapNode<T>, parent: FibonacciHeapNode<T>): void {
    // Remove node from child list of parent
    if (node.right === node) {
      // Only child
      parent.child = null;
    } else {
      parent.child = node.right;
      node.left.right = node.right;
      node.right.left = node.left;
    }
    
    // Decrement parent's degree
    parent.degree--;
    
    // Add node to root list
    this.insertIntoRootList(node);
    
    // Update parent reference and marked flag
    node.parent = null;
    node.marked = false;
  }
  
  private cascadingCut(node: FibonacciHeapNode<T>): void {
    const parent = node.parent;
    
    if (parent !== null) {
      if (!node.marked) {
        // Mark the node for first cut
        node.marked = true;
      } else {
        // Already marked, cut from parent
        this.cut(node, parent);
        
        // Continue cascading cuts
        this.cascadingCut(parent);
      }
    }
  }
  
  private removeNode(node: FibonacciHeapNode<T>): void {
    // Set node's key to negative infinity to make it the minimum
    this.decreaseKey(node, Number.NEGATIVE_INFINITY);
    
    // Extract it
    this.extractMin();
  }
}
```

### 3. Task Management System

```typescript
// Example: Task management system in TypeScript
// src/tasks/manager.ts
import { GraphOfThought, ThoughtNode, ThoughtNodeType, NodeStatus } from './graph/graph-of-thought';
import { FibonacciHeapScheduler } from './scheduler/fibonacci-heap-scheduler';
import { MCPClient } from '../storage/ipfs/mcp-client';

export interface Task {
  id: string;
  description: string;
  priority: number;
  dependencies: string[];
  status: TaskStatus;
  data?: any;
  result?: any;
  metadata: {
    created: number;
    updated: number;
    completed?: number;
  };
}

export enum TaskStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class TaskManager {
  private tasks = new Map<string, Task>();
  private graphOfThought: GraphOfThought;
  private mcpClient: MCPClient;
  
  constructor(mcpClient: MCPClient) {
    this.graphOfThought = new GraphOfThought();
    this.mcpClient = mcpClient;
  }
  
  async createTask(description: string, priority: number = 5, dependencies: string[] = [], data?: any): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const task: Task = {
      id: taskId,
      description,
      priority,
      dependencies,
      status: TaskStatus.PENDING,
      data,
      metadata: {
        created: Date.now(),
        updated: Date.now()
      }
    };
    
    // Store task in local map
    this.tasks.set(taskId, task);
    
    // If task has data, store it in IPFS
    if (data) {
      try {
        const cid = await this.mcpClient.addContent(JSON.stringify(data));
        task.data = { cid };
      } catch (error) {
        console.error(`Failed to store task data in IPFS:`, error);
      }
    }
    
    // Check if dependencies are met
    const canSchedule = this.areDependenciesMet(task);
    
    if (canSchedule) {
      // Create a node in the graph
      this.scheduleTask(task);
    }
    
    return taskId;
  }
  
  async decomposeTask(taskId: string): Promise<string[]> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Create a question node in the Graph-of-Thought
    const questionNode = this.graphOfThought.createNode(
      ThoughtNodeType.QUESTION,
      `How to decompose task: ${task.description}`,
      []
    );
    
    // Process the decomposition using Graph-of-Thought
    while (this.graphOfThought.hasUnprocessedNodes()) {
      await this.graphOfThought.executeNextTask();
    }
    
    // Find the conclusion node
    const conclusionNode = this.graphOfThought.findNodeByType(ThoughtNodeType.CONCLUSION);
    if (!conclusionNode) {
      throw new Error(`Failed to decompose task: No conclusion reached`);
    }
    
    // Extract subtasks from conclusion
    const subtasks: string[] = [];
    
    if (conclusionNode.result && Array.isArray(conclusionNode.result.subtasks)) {
      // Create a task for each subtask
      for (const subtaskDesc of conclusionNode.result.subtasks) {
        const subtaskId = await this.createTask(
          subtaskDesc,
          task.priority,
          [taskId]  // Make the original task a dependency
        );
        subtasks.push(subtaskId);
      }
      
      // Update the original task to depend on subtasks
      task.dependencies = [...task.dependencies, ...subtasks];
      task.metadata.updated = Date.now();
      this.tasks.set(taskId, task);
    }
    
    return subtasks;
  }
  
  async processNextTask(): Promise<Task | null> {
    try {
      // Execute next task in the Graph-of-Thought
      const node = await this.graphOfThought.executeNextTask();
      if (!node) {
        return null;
      }
      
      // Find the corresponding task
      const taskId = node.id.replace('node-', 'task-');
      const task = this.tasks.get(taskId);
      
      if (!task) {
        return null;
      }
      
      // Update task status based on node status
      if (node.status === NodeStatus.COMPLETED) {
        task.status = TaskStatus.COMPLETED;
        task.result = node.result;
        task.metadata.completed = Date.now();
        task.metadata.updated = Date.now();
        
        // Store result in IPFS if present
        if (node.result) {
          try {
            const cid = await this.mcpClient.addContent(JSON.stringify(node.result));
            task.result = { cid, ...task.result };
          } catch (error) {
            console.error(`Failed to store task result in IPFS:`, error);
          }
        }
        
        // Check dependents that can now be scheduled
        this.checkDependents(taskId);
      } else if (node.status === NodeStatus.FAILED) {
        task.status = TaskStatus.FAILED;
        task.metadata.updated = Date.now();
      } else {
        task.status = TaskStatus.PROCESSING;
        task.metadata.updated = Date.now();
      }
      
      // Update task in map
      this.tasks.set(taskId, task);
      
      return task;
    } catch (error) {
      console.error(`Error processing next task:`, error);
      return null;
    }
  }
  
  private scheduleTask(task: Task): void {
    // Create a node in the Graph-of-Thought
    this.graphOfThought.createNode(
      ThoughtNodeType.ANALYSIS,
      task.description,
      task.dependencies.map(depId => `node-${depId.replace('task-', '')}`)
    );
    
    // Update task status
    task.status = TaskStatus.SCHEDULED;
    task.metadata.updated = Date.now();
    this.tasks.set(task.id, task);
  }
  
  private areDependenciesMet(task: Task): boolean {
    for (const depId of task.dependencies) {
      const dependency = this.tasks.get(depId);
      if (!dependency || dependency.status !== TaskStatus.COMPLETED) {
        return false;
      }
    }
    return true;
  }
  
  private checkDependents(completedTaskId: Task): void {
    // Find tasks that depend on the completed task
    for (const [id, task] of this.tasks.entries()) {
      if (task.dependencies.includes(completedTaskId) && task.status === TaskStatus.PENDING) {
        // Check if all dependencies are now met
        if (this.areDependenciesMet(task)) {
          this.scheduleTask(task);
        }
      }
    }
  }
  
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }
  
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}
```

## Project Structure

The unified project structure organizes code by domain rather than by source component:

```
/src
├── ai/                      # AI capabilities domain
│   ├── agent/               # Core agent functionality
│   ├── tools/               # Tool system and implementations
│   ├── models/              # Model providers and execution
│   └── thinking/            # Enhanced thinking patterns
│
├── cli/                     # CLI and UI components
│   ├── commands/            # Command definitions
│   ├── ui/                  # React/Ink components
│   ├── screens/             # Screen definitions
│   └── formatters/          # Output formatting
│
├── ml/                      # Machine learning acceleration
│   ├── tensor/              # Tensor operations
│   ├── optimizers/          # Model optimization
│   ├── hardware/            # Hardware acceleration
│   └── inference/           # Inference execution
│
├── tasks/                   # Task processing system
│   ├── scheduler/           # Fibonacci heap scheduler
│   ├── decomposition/       # Task decomposition
│   ├── delegation/          # Task delegation
│   └── graph/               # Graph-of-thought implementation
│
├── storage/                 # Storage systems
│   ├── local/               # Local storage
│   ├── ipfs/                # IPFS client integration with MCP server
│   ├── cache/               # Multi-tier caching
│   └── indexing/            # Content indexing
│
├── workers/                 # Worker thread system
├── config/                  # Configuration system
├── utils/                   # Shared utilities
└── types/                   # Shared TypeScript types
```

## Implementation Details

### 1. Tiered Cache Implementation

```typescript
// Example: Tiered cache implementation in TypeScript
// src/storage/cache/tiered-cache.ts
export interface CacheOptions {
  memoryCacheSize?: number;  // in bytes
  memoryCacheTTL?: number;   // in milliseconds
  diskCacheSize?: number;    // in bytes
  diskCacheTTL?: number;     // in milliseconds
  mmfCacheSize?: number;     // in bytes
  mmfCacheTTL?: number;      // in milliseconds
  promotionThreshold?: number; // size threshold for promotion between tiers
}

export interface CacheEntry {
  key: string;
  data: Buffer;
  size: number;
  metadata?: any;
  created: number;
  expires: number;
}

export class TieredCache {
  private options: CacheOptions;
  private memoryCache: MemoryCache;
  private diskCache: DiskCache;
  private mmfCache: MMFCache;
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      memoryCacheSize: 100 * 1024 * 1024, // 100 MB
      memoryCacheTTL: 30 * 60 * 1000,     // 30 minutes
      diskCacheSize: 1024 * 1024 * 1024,  // 1 GB
      diskCacheTTL: 24 * 60 * 60 * 1000,  // 24 hours
      mmfCacheSize: 512 * 1024 * 1024,    // 512 MB
      mmfCacheTTL: 12 * 60 * 60 * 1000,   // 12 hours
      promotionThreshold: 1024 * 1024,    // 1 MB
      ...options
    };
    
    this.memoryCache = new MemoryCache({
      maxSize: this.options.memoryCacheSize!,
      ttl: this.options.memoryCacheTTL!
    });
    
    this.diskCache = new DiskCache({
      maxSize: this.options.diskCacheSize!,
      ttl: this.options.diskCacheTTL!,
      directory: './.cache/disk'
    });
    
    this.mmfCache = new MMFCache({
      maxSize: this.options.mmfCacheSize!,
      ttl: this.options.mmfCacheTTL!,
      directory: './.cache/mmf'
    });
  }
  
  async get(key: string): Promise<Buffer | null> {
    // Try memory cache first (fastest)
    let entry = await this.memoryCache.get(key);
    if (entry) {
      return entry.data;
    }
    
    // Try memory-mapped cache next (fast for large files)
    entry = await this.mmfCache.get(key);
    if (entry) {
      // Promote to memory cache if small enough
      if (entry.size <= this.options.promotionThreshold!) {
        await this.memoryCache.set(key, entry.data, entry.metadata);
      }
      return entry.data;
    }
    
    // Try disk cache last
    entry = await this.diskCache.get(key);
    if (entry) {
      // Promote to appropriate cache tier
      if (entry.size <= this.options.promotionThreshold!) {
        await this.memoryCache.set(key, entry.data, entry.metadata);
      } else {
        await this.mmfCache.set(key, entry.data, entry.metadata);
      }
      return entry.data;
    }
    
    // Cache miss
    return null;
  }
  
  async set(key: string, data: Buffer, metadata?: any): Promise<boolean> {
    const size = data.length;
    
    // Determine which cache tiers to use based on size
    if (size <= this.options.promotionThreshold!) {
      // Small data goes to memory cache
      await this.memoryCache.set(key, data, metadata);
    } else if (size <= this.options.mmfCacheSize! / 10) { // Limit MMF cache entries to 1/10th of total size
      // Medium data goes to memory-mapped cache
      await this.mmfCache.set(key, data, metadata);
    }
    
    // All data goes to disk cache as the final tier
    await this.diskCache.set(key, data, metadata);
    
    return true;
  }
  
  async delete(key: string): Promise<boolean> {
    // Delete from all cache tiers
    const memoryResult = await this.memoryCache.delete(key);
    const mmfResult = await this.mmfCache.delete(key);
    const diskResult = await this.diskCache.delete(key);
    
    // If any cache had the item, return true
    return memoryResult || mmfResult || diskResult;
  }
  
  async clear(): Promise<void> {
    // Clear all cache tiers
    await this.memoryCache.clear();
    await this.mmfCache.clear();
    await this.diskCache.clear();
  }
}
```

### 2. AI Agent Integration

```typescript
// Example: AI agent implementation in TypeScript
// src/ai/agent/agent.ts
import { Tool, ToolCall, ToolCallResult } from '../tools/tool';
import { Model, ModelProvider, ModelResponse } from '../models/model';
import { ThinkingManager } from '../thinking/manager';

export interface AgentOptions {
  model: Model;
  tools?: Tool[];
  maxTokens?: number;
  temperature?: number;
  thinking?: boolean;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallResults?: ToolCallResult[];
  name?: string;
}

export class Agent {
  private model: Model;
  private tools: Map<string, Tool> = new Map();
  private thinkingManager: ThinkingManager;
  private history: AgentMessage[] = [];
  private maxTokens?: number;
  private temperature?: number;
  private useThinking: boolean;
  
  constructor(options: AgentOptions) {
    this.model = options.model;
    this.maxTokens = options.maxTokens;
    this.temperature = options.temperature;
    this.useThinking = options.thinking || false;
    this.thinkingManager = new ThinkingManager();
    
    // Register default system message
    this.history.push({
      role: 'system',
      content: 'You are a helpful AI assistant.'
    });
    
    // Register tools if provided
    if (options.tools) {
      for (const tool of options.tools) {
        this.registerTool(tool);
      }
    }
  }
  
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  async processMessage(message: string): Promise<string> {
    // Add user message to history
    this.history.push({
      role: 'user',
      content: message
    });
    
    // Generate thinking process if enabled
    let thinkingContext: AgentMessage[] = [];
    if (this.useThinking) {
      thinkingContext = await this.thinkingManager.generateThinking(
        this.history, 
        Array.from(this.tools.values())
      );
    }
    
    // Generate response from model
    const modelResponse = await this.model.generate({
      messages: [...this.history, ...thinkingContext],
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      tools: Array.from(this.tools.values())
    });
    
    // Handle tool calls if present
    if (modelResponse.toolCalls && modelResponse.toolCalls.length > 0) {
      return await this.handleToolCalls(modelResponse);
    }
    
    // Add assistant response to history
    this.history.push({
      role: 'assistant',
      content: modelResponse.content
    });
    
    return modelResponse.content;
  }
  
  private async handleToolCalls(response: ModelResponse): Promise<string> {
    // Add assistant response with tool calls to history
    this.history.push({
      role: 'assistant',
      content: response.content,
      toolCalls: response.toolCalls
    });
    
    // Execute each tool call
    const toolCallResults: ToolCallResult[] = [];
    
    for (const toolCall of response.toolCalls || []) {
      const tool = this.tools.get(toolCall.name);
      
      if (!tool) {
        toolCallResults.push({
          toolCallId: toolCall.id,
          result: { error: `Tool not found: ${toolCall.name}` }
        });
        continue;
      }
      
      try {
        // Execute the tool
        const result = await tool.execute(toolCall.arguments);
        
        // Add result to results array
        toolCallResults.push({
          toolCallId: toolCall.id,
          result
        });
      } catch (error) {
        // Handle tool execution error
        toolCallResults.push({
          toolCallId: toolCall.id,
          result: { error: `Error executing tool: ${error.message}` }
        });
      }
    }
    
    // Add tool results to history
    this.history.push({
      role: 'tool',
      content: '',
      toolCallResults
    });
    
    // Generate final response based on tool results
    const finalResponse = await this.model.generate({
      messages: this.history,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      tools: Array.from(this.tools.values())
    });
    
    // Add final assistant response to history
    this.history.push({
      role: 'assistant',
      content: finalResponse.content
    });
    
    return finalResponse.content;
  }
  
  getHistory(): AgentMessage[] {
    return [...this.history];
  }
  
  clearHistory(keepSystemMessage: boolean = true): void {
    if (keepSystemMessage && this.history.length > 0 && this.history[0].role === 'system') {
      const systemMessage = this.history[0];
      this.history = [systemMessage];
    } else {
      this.history = [];
    }
  }
}
```

### 3. IPFS Integration via MCP Server

```typescript
// Example: IPFS Kit MCP client integration in TypeScript
// src/storage/ipfs/mcp-client.ts
import axios from 'axios';
import WebSocket from 'ws';

export interface MCPClientOptions {
  baseUrl: string;
  authentication?: {
    type: 'apiKey' | 'token';
    value: string;
  };
  timeout?: number;
  reconnect?: boolean;
  maxRetries?: number;
}

export class MCPClient {
  private options: MCPClientOptions;
  private httpClient: any;
  private wsClient: WebSocket | null = null;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor(options: MCPClientOptions) {
    this.options = {
      timeout: 30000, // 30 seconds default
      reconnect: true,
      maxRetries: 3,
      ...options
    };
    
    this.httpClient = axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout,
      headers: this.getAuthHeaders()
    });
  }
  
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.options.authentication) {
      if (this.options.authentication.type === 'apiKey') {
        headers['X-API-Key'] = this.options.authentication.value;
      } else {
        headers['Authorization'] = `Bearer ${this.options.authentication.value}`;
      }
    }
    
    return headers;
  }
  
  // Basic IPFS operations
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    try {
      const formData = new FormData();
      const blob = content instanceof Buffer 
        ? new Blob([content]) 
        : new Blob([Buffer.from(content)]);
      formData.append('file', blob);
      
      const response = await this.httpClient.post('/api/v0/add', formData);
      return { cid: response.data.Hash };
    } catch (error) {
      console.error('Error adding content to IPFS:', error);
      throw error;
    }
  }
  
  async getContent(cid: string): Promise<Buffer> {
    try {
      const response = await this.httpClient.get(`/api/v0/cat?arg=${cid}`, {
        responseType: 'arraybuffer'
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Error retrieving content for CID ${cid}:`, error);
      throw error;
    }
  }
  
  async pinContent(cid: string): Promise<{ cid: string, pinned: boolean }> {
    try {
      const response = await this.httpClient.post(`/api/v0/pin/add?arg=${cid}`);
      return {
        cid,
        pinned: true
      };
    } catch (error) {
      console.error(`Error pinning content with CID ${cid}:`, error);
      throw error;
    }
  }
  
  async unpinContent(cid: string): Promise<{ cid: string, unpinned: boolean }> {
    try {
      const response = await this.httpClient.post(`/api/v0/pin/rm?arg=${cid}`);
      return {
        cid,
        unpinned: true
      };
    } catch (error) {
      console.error(`Error unpinning content with CID ${cid}:`, error);
      throw error;
    }
  }
  
  // WebSocket event handling for real-time updates
  async connectWebSocket(): Promise<void> {
    if (this.wsClient) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const wsUrl = this.options.baseUrl.replace(/^http/, 'ws') + '/ws';
      this.wsClient = new WebSocket(wsUrl);
      
      this.wsClient.onopen = () => {
        console.log('WebSocket connection established');
        resolve();
      };
      
      this.wsClient.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      };
      
      this.wsClient.onclose = () => {
        console.log('WebSocket connection closed');
        this.wsClient = null;
        
        if (this.options.reconnect) {
          console.log('Attempting to reconnect WebSocket...');
          setTimeout(() => {
            this.connectWebSocket().catch(err => {
              console.error('Failed to reconnect WebSocket:', err);
            });
          }, 5000);
        }
      };
      
      this.wsClient.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          
          // Emit event to registered handlers
          if (data.event && this.eventHandlers.has(data.event)) {
            const handlers = this.eventHandlers.get(data.event)!;
            handlers.forEach(handler => handler(data));
          }
          
          // Emit to wildcard handlers
          if (this.eventHandlers.has('*')) {
            const handlers = this.eventHandlers.get('*')!;
            handlers.forEach(handler => handler(data));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    });
  }
  
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(handler);
  }
  
  off(event: string, handler: (data: any) => void): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.delete(handler);
    }
  }
  
  // Advanced operations
  async storeJson(data: any): Promise<{ cid: string }> {
    return this.addContent(JSON.stringify(data));
  }
  
  async retrieveJson<T = any>(cid: string): Promise<T> {
    const content = await this.getContent(cid);
    return JSON.parse(content.toString('utf-8'));
  }
  
  async storeAndPin(content: string | Buffer): Promise<{ cid: string }> {
    const { cid } = await this.addContent(content);
    await this.pinContent(cid);
    return { cid };
  }
}
```

## Data Flow Patterns

The unified architecture implements several key data flow patterns to ensure efficient and consistent operation across domains:

### 1. Command Flow

```
User Input → Command Parser → Command Handler → Domain Services → IPFS Kit MCP Server → Response Formatter → User Output
```

For example, when a user runs an IPFS command in the CLI:

1. User enters command: `swissknife ipfs add file.txt`
2. Command parser extracts command and arguments
3. Command handler processes the command and parameters
4. Storage domain services handle the file operations
5. IPFS Kit MCP client makes API calls to the MCP Server
6. MCP Server performs the actual IPFS operations
7. Result is returned through the client back to the handler
8. Response is formatted and displayed to the user

```typescript
// Example command flow in TypeScript
// src/cli/commands/ipfs-commands.ts
import { CommandRegistry } from './registry';
import { MCPClient } from '../../storage/ipfs/mcp-client';
import { ConfigManager } from '../../config/manager';
import * as fs from 'fs';

export function registerIPFSCommands() {
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'ipfs.add',
    name: 'ipfs add',
    description: 'Add content to IPFS via MCP Server',
    args: [
      {
        name: 'path',
        description: 'Path to file or content to add',
        required: true
      }
    ],
    handler: async (args, context) => {
      const path = args.path;
      
      try {
        // Initialize MCP client from configuration
        const config = ConfigManager.getInstance();
        const mcpClient = new MCPClient({
          baseUrl: config.get('storage.mcp.baseUrl'),
          authentication: {
            type: config.get('storage.mcp.authType'),
            value: config.get('storage.mcp.authValue')
          }
        });
        
        // Check if path is a file or direct content
        let content;
        if (fs.existsSync(path)) {
          context.ui.info(`Adding file: ${path}`);
          content = fs.readFileSync(path);
        } else {
          context.ui.info('Adding content directly');
          content = path;
        }
        
        // Add content to IPFS via MCP Server
        const result = await mcpClient.addContent(content);
        
        // Format and display result
        context.ui.success(`Added content with CID: ${result.cid}`);
        return 0;
      } catch (error) {
        context.ui.error(`Failed to add content: ${error.message}`);
        return 1;
      }
    }
  });
}
```

### 2. AI Agent Flow

```
User Query → AI Agent → Model Provider → Tool Selection → Tool Execution → IPFS Storage → Result Processing → User Response
```

For example, when a user interacts with the AI agent:

1. User asks: "Add this document to IPFS and analyze it"
2. Agent processes the query through the model
3. Model identifies required tools and generates tool calls
4. Agent executes the IPFS storage tool
5. Tool makes API calls to the MCP Server via the client
6. Agent receives storage result and continues processing
7. Result is formatted and returned to the user

```typescript
// Example AI agent flow in TypeScript
// src/ai/tools/implementations/ipfs-tool.ts
import { Tool } from '../tool';
import { MCPClient } from '../../../storage/ipfs/mcp-client';
import { ConfigManager } from '../../../config/manager';

export class IPFSStorageTool implements Tool {
  name = 'ipfs.store';
  description = 'Store content in IPFS';
  parameters = {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Content to store in IPFS'
      },
      pin: {
        type: 'boolean',
        description: 'Whether to pin the content',
        default: false
      }
    },
    required: ['content']
  };
  
  private getMCPClient(): MCPClient {
    const config = ConfigManager.getInstance();
    return new MCPClient({
      baseUrl: config.get('storage.mcp.baseUrl'),
      authentication: {
        type: config.get('storage.mcp.authType'),
        value: config.get('storage.mcp.authValue')
      }
    });
  }
  
  async execute(args: any): Promise<any> {
    try {
      const { content, pin = false } = args;
      const mcpClient = this.getMCPClient();
      
      let result;
      if (pin) {
        result = await mcpClient.storeAndPin(content);
      } else {
        result = await mcpClient.addContent(content);
      }
      
      return {
        cid: result.cid,
        success: true,
        message: `Content stored with CID: ${result.cid}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### 3. Task Graph Flow

```
Task Creation → Graph Node Creation → Fibonacci Heap Scheduling → Task Execution → Result Storage → Dependent Task Activation
```

For example, when a complex task is processed:

1. User creates a complex task
2. Task manager decomposes it into subtasks using Graph-of-Thought
3. Node relationships are established with dependencies
4. Fibonacci heap schedules nodes based on priority
5. Nodes are executed in optimal order
6. Results are stored in IPFS via MCP Server
7. Completion triggers dependent task execution

```typescript
// Example task flow in TypeScript
// Example usage of task system
import { TaskManager } from '../../tasks/manager';
import { MCPClient } from '../../storage/ipfs/mcp-client';
import { ConfigManager } from '../../config/manager';

async function processComplexTask(description: string) {
  // Initialize dependencies
  const config = ConfigManager.getInstance();
  const mcpClient = new MCPClient({
    baseUrl: config.get('storage.mcp.baseUrl'),
    authentication: {
      type: config.get('storage.mcp.authType'),
      value: config.get('storage.mcp.authValue')
    }
  });
  
  // Create task manager
  const taskManager = new TaskManager(mcpClient);
  
  // Create the main task
  const mainTaskId = await taskManager.createTask(description, 5);
  console.log(`Created main task: ${mainTaskId}`);
  
  // Decompose into subtasks
  const subtaskIds = await taskManager.decomposeTask(mainTaskId);
  console.log(`Decomposed into ${subtaskIds.length} subtasks: ${subtaskIds.join(', ')}`);
  
  // Process all tasks until completion
  let completedTasks = 0;
  let task;
  
  while ((task = await taskManager.processNextTask()) !== null) {
    if (task.status === 'COMPLETED') {
      completedTasks++;
      console.log(`Task ${task.id} completed (${completedTasks}/${subtaskIds.length + 1})`);
      
      if (task.id === mainTaskId) {
        console.log(`Main task completed with result:`, task.result);
      }
    } else if (task.status === 'FAILED') {
      console.error(`Task ${task.id} failed`);
    }
  }
  
  return taskManager.getTask(mainTaskId);
}
```

## Component Relationships

### Direct TypeScript Integration

In the unified architecture, components communicate directly through TypeScript imports and well-defined interfaces:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     TypeScript Direct Integration                         │
│                                                                           │
│  ┌────────────┐      Direct Import       ┌────────────┐                   │
│  │    CLI     │◄─────────────────────────►│    AI      │                   │
│  │  Domain    │                          │  Domain    │                   │
│  └──────┬─────┘                          └──────┬─────┘                   │
│         │                                       │                         │
│         │                                       │                         │
│         ▼                                       ▼                         │
│  ┌────────────┐      Type-Safe         ┌────────────┐                   │
│  │   Tasks    │◄─────Interface─────────►│    ML      │                   │
│  │  Domain    │                          │  Domain    │                   │
│  └──────┬─────┘                          └──────┬─────┘                   │
│         │                                       │                         │
│         │                                       │                         │
│         ▼                                       ▼                         │
│  ┌────────────┐      Shared Config      ┌────────────┐                   │
│  │  Storage   │◄─────────────────────────►│   Config   │                   │
│  │  Domain    │                          │  Domain    │                   │
│  └──────┬─────┘                          └────────────┘                   │
│         │                                                                 │
└─────────┼─────────────────────────────────────────────────────────────────┘
          │
          │ API Integration
          ▼
┌───────────────────────────────────────────┐
│         IPFS Kit MCP Server (Python)      │
└───────────────────────────────────────────┘
```

### Type-Safe Interface Definition

Components communicate through well-defined TypeScript interfaces that establish strict contracts between domains:

```typescript
// Example: Storage provider interface in TypeScript
// src/types/storage.ts
export interface StorageProvider {
  add(content: Buffer | string): Promise<string>;
  get(id: string): Promise<Buffer>;
  list(options?: ListOptions): Promise<string[]>;
  delete(id: string): Promise<boolean>;
}

// Implementation by IPFS storage domain
// src/storage/ipfs/ipfs-storage.ts
import { StorageProvider } from '../../types/storage';
import { MCPClient } from './mcp-client';

export class IPFSStorage implements StorageProvider {
  private client: MCPClient;
  
  constructor(client: MCPClient) {
    this.client = client;
  }
  
  async add(content: Buffer | string): Promise<string> {
    const result = await this.client.addContent(content);
    return result.cid;
  }
  
  async get(id: string): Promise<Buffer> {
    return this.client.getContent(id);
  }
  
  async list(options?: ListOptions): Promise<string[]> {
    // Implementation using MCP client
    return [];
  }
  
  async delete(id: string): Promise<boolean> {
    // Implementation using MCP client
    return true;
  }
}

// Usage by AI domain
// src/ai/tools/implementations/storage-tool.ts
import { Tool } from '../tool';
import { StorageProvider } from '../../../types/storage';

export class StorageTool implements Tool {
  name = 'storage.add';
  description = 'Store content in the storage system';
  
  constructor(private storageProvider: StorageProvider) {}
  
  async execute(args: any): Promise<any> {
    try {
      const cid = await this.storageProvider.add(args.content);
      return { cid, success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### Dependency Injection

The architecture uses dependency injection to provide loosely coupled components:

```typescript
// Example: Dependency injection in TypeScript
// src/cli/app.ts
import { CommandRegistry } from './commands/registry';
import { ModelRegistry } from '../ai/models/registry';
import { Agent } from '../ai/agent/agent';
import { OpenAIProvider } from '../ai/models/providers/openai';
import { AnthropicProvider } from '../ai/models/providers/anthropic';
import { MCPClient } from '../storage/ipfs/mcp-client';
import { IPFSStorage } from '../storage/ipfs/ipfs-storage';
import { StorageTool } from '../ai/tools/implementations/storage-tool';
import { ShellTool } from '../ai/tools/implementations/shell-tool';
import { ConfigManager } from '../config/manager';

export class Application {
  private commandRegistry: CommandRegistry;
  private modelRegistry: ModelRegistry;
  private mcpClient: MCPClient;
  private storageProvider: IPFSStorage;
  private agent: Agent;
  
  constructor() {
    // Initialize config first
    const config = ConfigManager.getInstance();
    
    // Create registries
    this.commandRegistry = CommandRegistry.getInstance();
    this.modelRegistry = ModelRegistry.getInstance();
    
    // Register model providers
    this.modelRegistry.registerProvider(new OpenAIProvider({
      apiKey: config.get('ai.openai.apiKey')
    }));
    
    this.modelRegistry.registerProvider(new AnthropicProvider({
      apiKey: config.get('ai.anthropic.apiKey')
    }));
    
    // Create MCP client
    this.mcpClient = new MCPClient({
      baseUrl: config.get('storage.mcp.baseUrl'),
      authentication: {
        type: config.get('storage.mcp.authType'),
        value: config.get('storage.mcp.authValue')
      }
    });
    
    // Create storage provider
    this.storageProvider = new IPFSStorage(this.mcpClient);
    
    // Create and configure agent
    const defaultModel = this.modelRegistry.getDefaultModel();
    this.agent = new Agent({ model: defaultModel });
    
    // Register tools with the agent
    this.agent.registerTool(new StorageTool(this.storageProvider));
    this.agent.registerTool(new ShellTool());
    
    // Initialize command system
    this.initializeCommands();
  }
  
  private initializeCommands(): void {
    // Register command modules
    import('./commands/model-commands').then(module => {
      module.registerModelCommands(this.modelRegistry);
    });
    
    import('./commands/agent-commands').then(module => {
      module.registerAgentCommands(this.agent);
    });
    
    import('./commands/ipfs-commands').then(module => {
      module.registerIPFSCommands(this.mcpClient);
    });
  }
  
  async start(): Promise<void> {
    // Start the application
    console.log('Application started');
    // Implementation details...
  }
}
```

### Singleton Pattern for Global Access

The architecture uses the Singleton pattern for globally accessible components:

```typescript
// Example: Singleton pattern in TypeScript
// src/config/manager.ts
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any> = {};
  
  private constructor() {
    // Private constructor to prevent direct instantiation
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        return defaultValue as T;
      }
      current = current[parts[i]];
    }
    
    return (current[parts[parts.length - 1]] ?? defaultValue) as T;
  }
  
  set<T>(key: string, value: T): void {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }
}
```

## Extension Mechanisms

The unified architecture provides several extension mechanisms to allow for customization and expansion without modifying core code:

### 1. Plugin System

The plugin system allows external functionality to be integrated into the core application:

```typescript
// Example: Plugin system in TypeScript
// src/types/plugin.ts
export interface Plugin {
  id: string;
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<boolean>;
  shutdown?(): Promise<void>;
}

export interface PluginContext {
  agent: Agent;
  modelRegistry: ModelRegistry;
  commandRegistry: CommandRegistry;
  storageProvider: StorageProvider;
  configManager: ConfigManager;
  registerTool(tool: Tool): void;
  registerCommand(command: Command): void;
  registerModelProvider(provider: ModelProvider): void;
}

// src/plugins/manager.ts
export class PluginManager {
  private static instance: PluginManager;
  private plugins = new Map<string, Plugin>();
  private agent: Agent;
  private modelRegistry: ModelRegistry;
  private commandRegistry: CommandRegistry;
  private storageProvider: StorageProvider;
  private configManager: ConfigManager;
  
  private constructor() {
    // Private constructor for singleton pattern
    this.agent = new Agent({
      model: ModelRegistry.getInstance().getDefaultModel()
    });
    this.modelRegistry = ModelRegistry.getInstance();
    this.commandRegistry = CommandRegistry.getInstance();
    this.storageProvider = new IPFSStorage(
      new MCPClient(ConfigManager.getInstance().get('storage.mcp'))
    );
    this.configManager = ConfigManager.getInstance();
  }
  
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
  
  async registerPlugin(plugin: Plugin): Promise<boolean> {
    // Check if already registered
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with ID '${plugin.id}' is already registered`);
    }
    
    // Create plugin context
    const context: PluginContext = {
      agent: this.agent,
      modelRegistry: this.modelRegistry,
      commandRegistry: this.commandRegistry,
      storageProvider: this.storageProvider,
      configManager: this.configManager,
      registerTool: (tool: Tool) => this.agent.registerTool(tool),
      registerCommand: (command: Command) => this.commandRegistry.registerCommand(command),
      registerModelProvider: (provider: ModelProvider) => this.modelRegistry.registerProvider(provider)
    };
    
    // Initialize plugin
    try {
      const initialized = await plugin.initialize(context);
      
      if (initialized) {
        this.plugins.set(plugin.id, plugin);
        console.log(`Plugin '${plugin.name}' (${plugin.id}) v${plugin.version} registered successfully`);
        return true;
      } else {
        console.error(`Failed to initialize plugin '${plugin.name}' (${plugin.id})`);
        return false;
      }
    } catch (error) {
      console.error(`Error initializing plugin '${plugin.name}' (${plugin.id}):`, error);
      return false;
    }
  }
  
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      return false;
    }
    
    // Call shutdown if implemented
    if (plugin.shutdown) {
      try {
        await plugin.shutdown();
      } catch (error) {
        console.error(`Error shutting down plugin '${plugin.name}' (${plugin.id}):`, error);
      }
    }
    
    // Remove plugin
    this.plugins.delete(pluginId);
    console.log(`Plugin '${plugin.name}' (${plugin.id}) unregistered`);
    
    return true;
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

// Example plugin implementation
// example-plugin.ts
import { Plugin, PluginContext } from '../types/plugin';
import { Tool } from '../ai/tools/tool';

export class ExamplePlugin implements Plugin {
  id = 'com.example.plugin';
  name = 'Example Plugin';
  version = '1.0.0';
  
  async initialize(context: PluginContext): Promise<boolean> {
    // Register a custom tool
    const exampleTool: Tool = {
      name: 'example.tool',
      description: 'Example tool from plugin',
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Input to process'
          }
        },
        required: ['input']
      },
      execute: async (args) => {
        return {
          result: `Processed: ${args.input}`,
          success: true
        };
      }
    };
    
    context.registerTool(exampleTool);
    
    // Register a custom command
    context.registerCommand({
      id: 'example.command',
      name: 'example',
      description: 'Example command from plugin',
      handler: async (args, commandContext) => {
        commandContext.ui.success('Example command executed!');
        return 0;
      }
    });
    
    return true;
  }
  
  async shutdown(): Promise<void> {
    // Cleanup when plugin is unregistered
    console.log('Example plugin shutting down');
  }
}
```

### 2. Custom Tool Registration

The architecture allows for custom AI tool registration:

```typescript
// Example: Custom tool registration in TypeScript
// src/ai/tools/registry.ts
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools = new Map<string, Tool>();
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }
  
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' is already registered`);
    }
    
    this.tools.set(tool.name, tool);
  }
  
  unregisterTool(toolName: string): boolean {
    return this.tools.delete(toolName);
  }
  
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

// Custom tool implementation example
// src/custom/special-tool.ts
import { Tool } from '../ai/tools/tool';
import { ToolRegistry } from '../ai/tools/registry';

export class SpecialTool implements Tool {
  name = 'custom.special';
  description = 'Special tool with custom functionality';
  parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Query to process'
      },
      format: {
        type: 'string',
        description: 'Output format',
        enum: ['json', 'text', 'markdown'],
        default: 'text'
      }
    },
    required: ['query']
  };
  
  async execute(args: any): Promise<any> {
    const { query, format = 'text' } = args;
    
    // Process query with custom logic
    const processedResult = `Processed: ${query}`;
    
    // Format result based on requested format
    switch (format) {
      case 'json':
        return { result: processedResult, format: 'json' };
      case 'markdown':
        return { result: `**Result**: ${processedResult}`, format: 'markdown' };
      case 'text':
      default:
        return { result: processedResult, format: 'text' };
    }
  }
}

// Register the custom tool
ToolRegistry.getInstance().registerTool(new SpecialTool());
```

### 3. Model Provider Extension

The architecture allows for custom AI model providers:

```typescript
// Example: Custom model provider in TypeScript
// src/ai/models/providers/custom-provider.ts
import { ModelProvider, Model, ModelResponse, GenerateOptions } from '../../types/model';

export interface CustomProviderOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export class CustomProvider implements ModelProvider {
  id = 'custom-provider';
  name = 'Custom AI Provider';
  
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  
  constructor(options: CustomProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.customprovider.com';
    this.defaultModel = options.defaultModel || 'standard';
  }
  
  getAvailableModels(): string[] {
    return ['standard', 'advanced', 'expert'];
  }
  
  createModel(modelId: string): Model {
    // Create and return a model instance
    return {
      id: modelId,
      provider: this.id,
      name: `${this.name} ${modelId}`,
      
      async generate(options: GenerateOptions): Promise<ModelResponse> {
        try {
          // Implementation of API call to custom provider
          const response = await fetch(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model: modelId,
              messages: options.messages,
              max_tokens: options.maxTokens,
              temperature: options.temperature,
              tools: options.tools?.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
              }))
            })
          });
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const data = await response.json();
          
          return {
            content: data.content,
            toolCalls: data.tool_calls?.map(tc => ({
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments
            }))
          };
        } catch (error) {
          console.error('Error generating content with custom provider:', error);
          throw error;
        }
      }
    };
  }
  
  getDefaultModel(): Model {
    return this.createModel(this.defaultModel);
  }
}

// Register the custom provider
import { ModelRegistry } from '../registry';
import { ConfigManager } from '../../../config/manager';

const config = ConfigManager.getInstance();
const customProviderApiKey = config.get('ai.customProvider.apiKey');

if (customProviderApiKey) {
  ModelRegistry.getInstance().registerProvider(new CustomProvider({
    apiKey: customProviderApiKey
  }));
}
```

### 4. Storage Backend Extension

The architecture supports custom storage backends:

```typescript
// Example: Custom storage backend in TypeScript
// src/storage/backends/custom-storage.ts
import { StorageProvider } from '../../types/storage';

export interface CustomStorageOptions {
  apiKey: string;
  baseUrl?: string;
  bucket?: string;
}

export class CustomStorage implements StorageProvider {
  private apiKey: string;
  private baseUrl: string;
  private bucket: string;
  
  constructor(options: CustomStorageOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.customstorage.com';
    this.bucket = options.bucket || 'default';
  }
  
  async add(content: Buffer | string): Promise<string> {
    const formData = new FormData();
    const blob = content instanceof Buffer
      ? new Blob([content])
      : new Blob([Buffer.from(content)]);
    
    formData.append('file', blob);
    formData.append('bucket', this.bucket);
    
    const response = await fetch(`${this.baseUrl}/store`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to store content: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.id;
  }
  
  async get(id: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/retrieve/${id}?bucket=${this.bucket}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve content: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  async list(options?: ListOptions): Promise<string[]> {
    const queryParams = new URLSearchParams({
      bucket: this.bucket,
      ...options
    });
    
    const response = await fetch(`${this.baseUrl}/list?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list content: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items;
  }
  
  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/delete/${id}?bucket=${this.bucket}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    return response.ok;
  }
}

// Register with storage provider factory
import { StorageFactory } from '../factory';
import { ConfigManager } from '../../config/manager';

const config = ConfigManager.getInstance();
const customStorageApiKey = config.get('storage.customStorage.apiKey');

if (customStorageApiKey) {
  StorageFactory.registerProvider('custom-storage', (options) => {
    return new CustomStorage({
      apiKey: customStorageApiKey,
      baseUrl: config.get('storage.customStorage.baseUrl'),
      bucket: config.get('storage.customStorage.bucket')
    });
  });
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. MCP Server Connection Issues

**Problem**: The application fails to connect to the IPFS Kit MCP Server.

**Diagnostic Steps**:
- Check if the server URL is correct in configuration
- Verify that the MCP Server is running
- Check network connectivity
- Review authentication credentials

**Solutions**:
```typescript
// Example: MCP server connection troubleshooting utility
// src/utils/diagnostics/mcp-diagnostics.ts
import { MCPClient } from '../../storage/ipfs/mcp-client';
import { ConfigManager } from '../../config/manager';

export async function diagnoseMCPConnection(): Promise<{
  success: boolean;
  issues: string[];
  details: Record<string, any>;
}> {
  const config = ConfigManager.getInstance();
  const baseUrl = config.get('storage.mcp.baseUrl');
  const authType = config.get('storage.mcp.authType');
  const authValue = config.get('storage.mcp.authValue');
  
  const issues: string[] = [];
  const details: Record<string, any> = {
    baseUrl,
    authType,
    hasAuthValue: !!authValue
  };
  
  // Validate configuration
  if (!baseUrl) {
    issues.push('MCP Server base URL is not configured');
  }
  
  if (!authType || !authValue) {
    issues.push('MCP Server authentication is not properly configured');
  }
  
  // If config is valid, test connection
  if (baseUrl) {
    try {
      // Test basic connectivity without auth
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET'
      });
      
      details.serverResponding = response.ok;
      
      if (!response.ok) {
        issues.push(`MCP Server not responding properly: ${response.status} ${response.statusText}`);
      } else {
        // If server responds, test auth
        if (authType && authValue) {
          try {
            const mcpClient = new MCPClient({
              baseUrl,
              authentication: {
                type: authType as 'apiKey' | 'token',
                value: authValue
              }
            });
            
            // Try a simple authenticated operation
            await mcpClient.getContent('QmTest');
          } catch (error) {
            if (error.message.includes('401') || error.message.includes('403')) {
              issues.push('Authentication failed with MCP Server');
              details.authError = error.message;
            } else if (error.message.includes('not found')) {
              // This is expected since QmTest doesn't exist
              details.authSuccess = true;
            } else {
              issues.push(`Unexpected error during authenticated request: ${error.message}`);
              details.unexpectedError = error.message;
            }
          }
        }
      }
    } catch (error) {
      issues.push(`Cannot connect to MCP Server: ${error.message}`);
      details.connectionError = error.message;
    }
  }
  
  return {
    success: issues.length === 0,
    issues,
    details
  };
}
```

#### 2. Model Provider Integration Issues

**Problem**: Model provider integration not working properly or returning errors.

**Diagnostic Steps**:
- Verify API keys are correct
- Check model provider service status
- Review request formats and parameters
- Verify network connectivity

**Solutions**:
```typescript
// Example: Model provider diagnostics utility
// src/utils/diagnostics/model-diagnostics.ts
import { ModelRegistry } from '../../ai/models/registry';
import { ConfigManager } from '../../config/manager';

export async function diagnoseModelProviders(): Promise<{
  success: boolean;
  issues: string[];
  details: Record<string, any>;
}> {
  const modelRegistry = ModelRegistry.getInstance();
  const config = ConfigManager.getInstance();
  
  const issues: string[] = [];
  const details: Record<string, any> = {};
  
  // Get registered providers
  const providers = modelRegistry.getAllProviders();
  details.registeredProviders = providers.map(p => p.id);
  
  if (providers.length === 0) {
    issues.push('No model providers are registered');
  }
  
  // Test each provider
  for (const provider of providers) {
    try {
      details[provider.id] = {
        name: provider.name,
        availableModels: provider.getAvailableModels()
      };
      
      // Try to create a default model
      const model = provider.getDefaultModel();
      
      if (!model) {
        issues.push(`Provider ${provider.id} failed to create default model`);
        continue;
      }
      
      // Test a simple generation (with small token limit)
      try {
        const response = await model.generate({
          messages: [{ role: 'user', content: 'Hello, are you working?' }],
          maxTokens: 10
        });
        
        details[provider.id].testGeneration = {
          success: true,
          responsePreview: response.content.substring(0, 20) + (response.content.length > 20 ? '...' : '')
        };
      } catch (error) {
        issues.push(`Provider ${provider.id} generation test failed: ${error.message}`);
        details[provider.id].testGeneration = {
          success: false,
          error: error.message
        };
      }
    } catch (error) {
      issues.push(`Error testing provider ${provider.id}: ${error.message}`);
      details[provider.id] = {
        error: error.message
      };
    }
  }
  
  return {
    success: issues.length === 0,
    issues,
    details
  };
}
```

#### 3. Graph-of-Thought and Fibonacci Heap Issues

**Problem**: Task management system not functioning correctly, scheduling inefficient, or task execution failing.

**Diagnostic Steps**:
- Check if Graph-of-Thought initialization is successful
- Verify Fibonacci heap is correctly managing priorities
- Examine task dependencies for circular references
- Inspect failed task execution errors

**Solutions**:
```typescript
// Example: Task system diagnostics
// src/utils/diagnostics/task-diagnostics.ts
import { GraphOfThought } from '../../tasks/graph/graph-of-thought';
import { FibonacciHeapScheduler } from '../../tasks/scheduler/fibonacci-heap-scheduler';
import { TaskManager } from '../../tasks/manager';

export async function diagnoseTaskSystem(taskManager: TaskManager): Promise<{
  success: boolean;
  issues: string[];
  details: Record<string, any>;
}> {
  const issues: string[] = [];
  const details: Record<string, any> = {};
  
  // Check Graph-of-Thought system
  try {
    const graphStats = taskManager.getGraphStatistics();
    details.graph = graphStats;
    
    if (graphStats.cycleDetected) {
      issues.push('Circular dependency detected in task graph');
      details.graph.cycle = graphStats.cyclePath;
    }
  } catch (error) {
    issues.push(`Error accessing Graph-of-Thought: ${error.message}`);
    details.graphError = error.message;
  }
  
  // Check Fibonacci Heap
  try {
    const heapStats = taskManager.getSchedulerStatistics();
    details.scheduler = heapStats;
    
    if (heapStats.corruptedHeap) {
      issues.push('Fibonacci heap structure corrupted');
    }
    
    if (heapStats.potentiallyStuckTasks > 0) {
      issues.push(`${heapStats.potentiallyStuckTasks} tasks may be stuck in the scheduler`);
    }
  } catch (error) {
    issues.push(`Error accessing scheduler: ${error.message}`);
    details.schedulerError = error.message;
  }
  
  // Check recent task failures
  try {
    const failedTasks = taskManager.getRecentFailedTasks();
    details.failedTasks = failedTasks.map(t => ({
      id: t.id,
      error: t.error?.message || 'Unknown error',
      timestamp: t.metadata.updated
    }));
    
    if (failedTasks.length > 0) {
      issues.push(`${failedTasks.length} tasks failed recently`);
    }
  } catch (error) {
    issues.push(`Error accessing failed tasks: ${error.message}`);
    details.failedTasksError = error.message;
  }
  
  return {
    success: issues.length === 0,
    issues,
    details
  };
}
```

#### 4. TypeScript Import and Module Resolution Issues

**Problem**: TypeScript import errors or unexpected module resolution problems.

**Diagnostic Steps**:
- Check TypeScript configuration
- Verify import paths are correct
- Review module resolution strategy
- Check for circular dependencies

**Solutions**:
```typescript
// Example: Module diagnostics utility
// src/utils/diagnostics/module-diagnostics.ts
import * as path from 'path';
import * as fs from 'fs';

export function diagnoseModuleImports(basePath: string = process.cwd()): {
  success: boolean;
  issues: string[];
  details: Record<string, any>;
} {
  const issues: string[] = [];
  const details: Record<string, any> = {
    circularDependencies: [],
    missingFiles: [],
    invalidImports: []
  };
  
  // Load tsconfig.json
  let tsConfig;
  try {
    const tsConfigPath = path.join(basePath, 'tsconfig.json');
    const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
    tsConfig = JSON.parse(tsConfigContent);
    details.tsConfig = {
      baseUrl: tsConfig.compilerOptions?.baseUrl,
      paths: tsConfig.compilerOptions?.paths,
      moduleResolution: tsConfig.compilerOptions?.moduleResolution
    };
  } catch (error) {
    issues.push(`Failed to load tsconfig.json: ${error.message}`);
    details.tsConfigError = error.message;
  }
  
  // Check if source directory exists
  const srcPath = path.join(basePath, 'src');
  if (!fs.existsSync(srcPath)) {
    issues.push('Source directory does not exist');
    return { success: false, issues, details };
  }
  
  // Implement more detailed checks here, such as:
  // - Parse TypeScript files and check imports
  // - Detect circular dependencies
  // - Validate path mappings
  
  return {
    success: issues.length === 0,
    issues,
    details
  };
}
```

### Performance Optimization

#### 1. Tiered Cache Tuning

Optimize cache performance for different types of operations:

```typescript
// Example: Cache performance tuning
// src/storage/cache/cache-optimizer.ts
import { TieredCache } from './tiered-cache';
import { PerformanceProfiler } from '../../utils/performance/profiler';
import { ConfigManager } from '../../config/manager';

export async function optimizeCacheSettings(): Promise<{
  recommendations: Record<string, any>;
  metrics: Record<string, any>;
}> {
  const profiler = new PerformanceProfiler();
  const config = ConfigManager.getInstance();
  
  // Get current cache settings
  const currentSettings = {
    memoryCacheSize: config.get('storage.cache.memory.size', 100 * 1024 * 1024),
    memoryCacheTTL: config.get('storage.cache.memory.ttl', 30 * 60 * 1000),
    diskCacheSize: config.get('storage.cache.disk.size', 1024 * 1024 * 1024),
    diskCacheTTL: config.get('storage.cache.disk.ttl', 24 * 60 * 60 * 1000),
    mmfCacheSize: config.get('storage.cache.mmf.size', 512 * 1024 * 1024),
    mmfCacheTTL: config.get('storage.cache.mmf.ttl', 12 * 60 * 60 * 1000),
    promotionThreshold: config.get('storage.cache.promotionThreshold', 1024 * 1024)
  };
  
  // Get system memory info
  const systemInfo = await getSystemInfo();
  
  // Run performance tests with different cache configurations
  const metrics: Record<string, any> = {};
  
  // Test 1: Current configuration
  const currentCache = new TieredCache(currentSettings);
  metrics.current = await profileCachePerformance(currentCache, profiler);
  
  // Test 2: Memory-optimized configuration (larger memory cache)
  const memoryOptimized = new TieredCache({
    ...currentSettings,
    memoryCacheSize: Math.min(systemInfo.freeMemory * 0.5, 500 * 1024 * 1024),
    promotionThreshold: 2 * 1024 * 1024
  });
  metrics.memoryOptimized = await profileCachePerformance(memoryOptimized, profiler);
  
  // Test 3: Disk-optimized configuration (larger disk cache)
  const diskOptimized = new TieredCache({
    ...currentSettings,
    diskCacheSize: 2 * 1024 * 1024 * 1024,
    mmfCacheSize: 768 * 1024 * 1024,
    promotionThreshold: 512 * 1024
  });
  metrics.diskOptimized = await profileCachePerformance(diskOptimized, profiler);
  
  // Analyze results and make recommendations
  const recommendations: Record<string, any> = {
    suggested: {} as Record<string, any>,
    reasoning: {} as Record<string, string>
  };
  
  // Determine which configuration performed best
  let bestConfig = 'current';
  if (metrics.memoryOptimized.overallScore > metrics.current.overallScore && 
      metrics.memoryOptimized.overallScore > metrics.diskOptimized.overallScore) {
    bestConfig = 'memoryOptimized';
  } else if (metrics.diskOptimized.overallScore > metrics.current.overallScore && 
             metrics.diskOptimized.overallScore > metrics.memoryOptimized.overallScore) {
    bestConfig = 'diskOptimized';
  }
  
  // Create recommendations based on best performing config
  switch (bestConfig) {
    case 'memoryOptimized':
      recommendations.suggested = {
        memoryCacheSize: Math.min(systemInfo.freeMemory * 0.5, 500 * 1024 * 1024),
        promotionThreshold: 2 * 1024 * 1024
      };
      recommendations.reasoning.memoryCacheSize = 'Increased memory cache size improves performance for frequently accessed content';
      recommendations.reasoning.promotionThreshold = 'Larger promotion threshold reduces cache thrashing';
      break;
    case 'diskOptimized':
      recommendations.suggested = {
        diskCacheSize: 2 * 1024 * 1024 * 1024,
        mmfCacheSize: 768 * 1024 * 1024,
        promotionThreshold: 512 * 1024
      };
      recommendations.reasoning.diskCacheSize = 'Larger disk cache improves hit rates for infrequently accessed content';
      recommendations.reasoning.mmfCacheSize = 'Increased MMF cache size balances memory usage and performance';
      recommendations.reasoning.promotionThreshold = 'Smaller promotion threshold optimizes memory usage';
      break;
    default:
      recommendations.suggested = {};
      recommendations.reasoning.current = 'Current configuration is already optimal';
      break;
  }
  
  return { recommendations, metrics };
}

// Helper functions
async function profileCachePerformance(cache: TieredCache, profiler: PerformanceProfiler): Promise<Record<string, any>> {
  // Implementation details...
  return {
    overallScore: 0,
    readLatency: 0,
    writeLatency: 0,
    hitRate: 0,
    // Other metrics...
  };
}

async function getSystemInfo(): Promise<{ totalMemory: number, freeMemory: number }> {
  // Implementation details...
  return {
    totalMemory: 0,
    freeMemory: 0
  };
}
```

### Security Best Practices

1. **API Key Management**: 
   - Store API keys securely using environment variables
   - Implement key rotation mechanisms
   - Never hardcode sensitive values

2. **Content Validation**:
   - Validate all user input
   - Implement content type checking
   - Scan uploads for malicious content

3. **Authentication**:
   - Use secure token-based authentication
   - Implement proper session management
   - Follow OAuth 2.0 best practices

```typescript
// Example: API key security utilities
// src/security/api-key-manager.ts
import { ConfigManager } from '../config/manager';
import { CryptoUtils } from '../utils/crypto';

export class APIKeyManager {
  private static instance: APIKeyManager;
  private encryptedKeys = new Map<string, string>();
  private configManager = ConfigManager.getInstance();
  
  private constructor() {
    // Initialize from secure storage
    this.loadEncryptedKeys();
  }
  
  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }
  
  getAPIKey(provider: string): string | null {
    // First try environment variable
    const envKey = process.env[`SWISSKNIFE_${provider.toUpperCase()}_API_KEY`];
    if (envKey) {
      return envKey;
    }
    
    // Then try encrypted storage
    const encryptedKey = this.encryptedKeys.get(provider);
    if (encryptedKey) {
      try {
        return CryptoUtils.decrypt(encryptedKey);
      } catch (error) {
        console.error(`Failed to decrypt API key for ${provider}:`, error);
        return null;
      }
    }
    
    // Finally try config (not recommended for production)
    return this.configManager.get(`ai.${provider}.apiKey`, null);
  }
  
  async setAPIKey(provider: string, apiKey: string, encrypt: boolean = true): Promise<boolean> {
    try {
      if (encrypt) {
        const encryptedKey = CryptoUtils.encrypt(apiKey);
        this.encryptedKeys.set(provider, encryptedKey);
        await this.saveEncryptedKeys();
      } else {
        // Store in config (not recommended for production)
        this.configManager.set(`ai.${provider}.apiKey`, apiKey);
        await this.configManager.save();
      }
      return true;
    } catch (error) {
      console.error(`Failed to store API key for ${provider}:`, error);
      return false;
    }
  }
  
  private async loadEncryptedKeys(): Promise<void> {
    // Implementation details...
  }
  
  private async saveEncryptedKeys(): Promise<void> {
    // Implementation details...
  }
}
```

## Conclusion

This architecture document provides a comprehensive overview of the unified SwissKnife system. The architecture is built on the following core principles:

1. **Unified TypeScript Codebase**: All functionality is implemented in a single TypeScript codebase with clear domain boundaries, eliminating the complexity of cross-language integration.

2. **Domain-Driven Design**: Code is organized by domain rather than by source, creating a more maintainable and understandable system.

3. **Direct Module Integration**: Components communicate directly through TypeScript imports and well-defined interfaces, providing type safety and performance benefits.

4. **API-Based IPFS Integration**: The Python-based IPFS Kit MCP Server is integrated via a well-defined API interface, providing robust storage capabilities.

5. **Advanced Task Management**: The Graph-of-Thought and Fibonacci Heap Scheduler provide sophisticated reasoning and task prioritization capabilities.

The unified architecture offers significant advantages:

- **Simplicity**: Eliminating cross-language bridges reduces complexity and potential failure points
- **Maintainability**: Standardized TypeScript patterns and domain organization improve code maintainability
- **Performance**: Direct TypeScript integration reduces serialization overhead and communication latency
- **Extensibility**: Plugin system and extension mechanisms allow for customization without modifying core code
- **Developer Experience**: Consistent TypeScript patterns and tooling across all domains

By implementing all functionality in TypeScript with a single external integration point (IPFS Kit MCP Server), SwissKnife provides a robust, high-performance platform for AI-powered tools and workflows.