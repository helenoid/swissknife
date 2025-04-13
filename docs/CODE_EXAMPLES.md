# SwissKnife Code Examples

This document provides concrete code examples for key domains in the SwissKnife unified architecture.

## Table of Contents
- [AI Domain Examples](#ai-domain-examples)
- [ML Acceleration Examples](#ml-acceleration-examples)
- [Task Processing Examples](#task-processing-examples)
- [Storage Domain Examples](#storage-domain-examples)
- [CLI Domain Examples](#cli-domain-examples)
- [Cross-Domain Integration Examples](#cross-domain-integration-examples)

## AI Domain Examples

### Agent Implementation

```typescript
// src/ai/agent/agent.ts
import { Tool } from '../tools/tool';
import { Model } from '../models/model';
import { ToolExecutor } from '../tools/executor';
import { ThinkingManager } from '../thinking/manager';
import { AgentMessage, AgentContext, AgentOptions } from '../../types/ai';

export class Agent {
  private model: Model;
  private tools: Map<string, Tool> = new Map();
  private toolExecutor: ToolExecutor;
  private thinkingManager: ThinkingManager;
  private memory: AgentMessage[] = [];
  private options: AgentOptions;
  
  constructor(options: AgentOptions) {
    this.model = options.model;
    this.options = {
      maxTokens: 1000,
      temperature: 0.7,
      ...options
    };
    
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
  
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  async processMessage(message: string, context?: AgentContext): Promise<AgentMessage> {
    // Add user message to memory
    this.memory.push({
      role: 'user',
      content: message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    
    // Create thinking graph for complex reasoning
    const thinkingGraph = await this.thinkingManager.createThinkingGraph(message, this.model);
    
    // Process thinking graph
    const processedGraph = await this.thinkingManager.processGraph(thinkingGraph, this.model);
    
    // Identify tools to use
    const toolsToUse = this.thinkingManager.identifyTools(processedGraph, Array.from(this.tools.values()));
    
    // Execute tools
    const toolResults = [];
    for (const toolRequest of toolsToUse) {
      try {
        const result = await this.toolExecutor.execute(toolRequest.name, toolRequest.args);
        toolResults.push({ tool: toolRequest.name, result });
      } catch (error) {
        toolResults.push({ tool: toolRequest.name, error: error.message });
      }
    }
    
    // Generate final response
    const responseContent = await this.thinkingManager.generateResponse(
      processedGraph, 
      this.model, 
      toolResults
    );
    
    // Create agent message
    const agentMessage: AgentMessage = {
      role: 'assistant',
      content: responseContent,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      toolResults: toolResults
    };
    
    // Add to memory
    this.memory.push(agentMessage);
    
    return agentMessage;
  }
  
  getMemory(): AgentMessage[] {
    return [...this.memory];
  }
  
  clearMemory(): void {
    this.memory = [];
  }
}
```

### Tool System

```typescript
// src/ai/tools/tool.ts
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(args: any): Promise<any>;
}

// src/ai/tools/executor.ts
import { Tool } from './tool';

export class ToolExecutor {
  private tools: Map<string, Tool> = new Map();
  
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  async execute(toolName: string, args: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // Validate parameters
    this.validateParameters(tool, args);
    
    // Execute tool
    return await tool.execute(args);
  }
  
  private validateParameters(tool: Tool, args: any): void {
    for (const param of tool.parameters) {
      if (param.required && (args[param.name] === undefined || args[param.name] === null)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }
  }
}

// Example tool implementation (shell command tool)
// src/ai/tools/implementations/shell.ts
import { Tool, ToolParameter } from '../tool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const shellTool: Tool = {
  name: 'shell',
  description: 'Execute a shell command and return the output',
  parameters: [
    {
      name: 'command',
      type: 'string',
      description: 'The command to execute',
      required: true
    },
    {
      name: 'cwd',
      type: 'string',
      description: 'The working directory for the command',
      required: false
    }
  ],
  
  async execute(args: { command: string; cwd?: string }): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: args.cwd || process.cwd()
      });
      
      return {
        success: true,
        stdout,
        stderr,
        command: args.command
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        command: args.command
      };
    }
  }
};
```

### Graph of Thought Implementation

```typescript
// src/ai/thinking/graph.ts
export enum NodeType {
  QUESTION = 'question',
  HYPOTHESIS = 'hypothesis',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  CONCLUSION = 'conclusion'
}

export interface ThoughtNode {
  id: string;
  content: string;
  type: NodeType;
  children: string[];
  completed: boolean;
  result?: any;
}

export class ThoughtGraph {
  private nodes: Map<string, ThoughtNode> = new Map();
  private rootId: string | null = null;
  
  constructor() {}
  
  addNode(node: ThoughtNode): string {
    if (!this.rootId) {
      this.rootId = node.id;
    }
    
    this.nodes.set(node.id, node);
    return node.id;
  }
  
  getNode(id: string): ThoughtNode | undefined {
    return this.nodes.get(id);
  }
  
  getRoot(): ThoughtNode | null {
    return this.rootId ? this.nodes.get(this.rootId) || null : null;
  }
  
  addChild(parentId: string, childId: string): void {
    const parent = this.nodes.get(parentId);
    if (!parent) {
      throw new Error(`Parent node not found: ${parentId}`);
    }
    
    if (!parent.children.includes(childId)) {
      parent.children.push(childId);
    }
  }
  
  traverse(visitor: (node: ThoughtNode, depth: number) => void): void {
    if (!this.rootId) return;
    
    const visited = new Set<string>();
    
    const visit = (nodeId: string, depth: number) => {
      if (visited.has(nodeId)) return;
      
      const node = this.nodes.get(nodeId);
      if (!node) return;
      
      visited.add(nodeId);
      visitor(node, depth);
      
      for (const childId of node.children) {
        visit(childId, depth + 1);
      }
    };
    
    visit(this.rootId, 0);
  }
  
  setNodeResult(nodeId: string, result: any): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    node.result = result;
    node.completed = true;
  }
}
```

## ML Acceleration Examples

### Tensor Implementation

```typescript
// src/ml/tensor/tensor.ts
export class Tensor {
  private data: Float32Array;
  private shape: number[];
  
  constructor(data: number[] | Float32Array, shape: number[]) {
    // Validate shape matches data length
    const totalSize = shape.reduce((a, b) => a * b, 1);
    if (data.length !== totalSize) {
      throw new Error(`Data length (${data.length}) doesn't match shape (${shape.join('x')} = ${totalSize})`);
    }
    
    this.data = data instanceof Float32Array ? data : new Float32Array(data);
    this.shape = [...shape];
  }
  
  getData(): Float32Array {
    return this.data;
  }
  
  getShape(): number[] {
    return [...this.shape];
  }
  
  getRank(): number {
    return this.shape.length;
  }
  
  getSize(): number {
    return this.data.length;
  }
  
  reshape(newShape: number[]): Tensor {
    const totalSize = newShape.reduce((a, b) => a * b, 1);
    if (totalSize !== this.data.length) {
      throw new Error(`Cannot reshape tensor of size ${this.data.length} to shape ${newShape.join('x')} (${totalSize})`);
    }
    
    return new Tensor(this.data, newShape);
  }
  
  // Basic operations
  add(other: Tensor): Tensor {
    // Check shape compatibility
    if (this.data.length !== other.data.length) {
      throw new Error('Tensors must have the same size for addition');
    }
    
    const result = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      result[i] = this.data[i] + other.data[i];
    }
    
    return new Tensor(result, this.shape);
  }
  
  multiply(other: Tensor): Tensor {
    // Check shape compatibility
    if (this.data.length !== other.data.length) {
      throw new Error('Tensors must have the same size for element-wise multiplication');
    }
    
    const result = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      result[i] = this.data[i] * other.data[i];
    }
    
    return new Tensor(result, this.shape);
  }
  
  // More operations would be implemented here
}
```

### Hardware Acceleration

```typescript
// src/ml/hardware/accelerator.ts
import { Tensor } from '../tensor/tensor';
import { Model } from '../models/model';

export interface AcceleratorCapabilities {
  webGPU: boolean;
  webNN: boolean;
  wasm: boolean;
  threads: boolean;
}

export abstract class HardwareAccelerator {
  abstract getName(): string;
  abstract getCapabilities(): AcceleratorCapabilities;
  abstract isAvailable(): Promise<boolean>;
  abstract execute(model: Model, inputs: Tensor | Tensor[]): Promise<Tensor | Tensor[]>;
  
  static detect(): HardwareAccelerator {
    // Try to detect available accelerators in order of preference
    if (WebGPUAccelerator.isSupported()) {
      return new WebGPUAccelerator();
    } else if (WebNNAccelerator.isSupported()) {
      return new WebNNAccelerator();
    } else if (WasmAccelerator.isSupported()) {
      return new WasmAccelerator();
    } else {
      return new CPUAccelerator();
    }
  }
}

// src/ml/hardware/webgpu.ts
export class WebGPUAccelerator extends HardwareAccelerator {
  private device: GPUDevice | null = null;
  
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && navigator.gpu !== undefined;
  }
  
  getName(): string {
    return 'WebGPU';
  }
  
  getCapabilities(): AcceleratorCapabilities {
    return {
      webGPU: true,
      webNN: false,
      wasm: false,
      threads: false
    };
  }
  
  async isAvailable(): Promise<boolean> {
    if (!WebGPUAccelerator.isSupported()) {
      return false;
    }
    
    try {
      const adapter = await navigator.gpu.requestAdapter();
      this.device = await adapter?.requestDevice();
      return !!this.device;
    } catch (error) {
      console.error('WebGPU initialization failed:', error);
      return false;
    }
  }
  
  async execute(model: Model, inputs: Tensor | Tensor[]): Promise<Tensor | Tensor[]> {
    // Implementation would use WebGPU for acceleration
    // This is a simplified example
    
    if (!this.device) {
      throw new Error('WebGPU device not initialized');
    }
    
    // Example WebGPU implementation would go here
    // This would include:
    // 1. Creating shader modules
    // 2. Setting up buffers
    // 3. Creating compute pipelines
    // 4. Dispatching compute operations
    // 5. Reading results back
    
    // For now, we'll return a mock result
    const inputTensor = Array.isArray(inputs) ? inputs[0] : inputs;
    return new Tensor(new Float32Array(inputTensor.getSize()), inputTensor.getShape());
  }
}
```

## Task Processing Examples

### Fibonacci Heap Scheduler

```typescript
// src/tasks/scheduler/fibonacci-heap.ts
export interface FibHeapNode<T> {
  key: number;
  value: T;
  degree: number;
  marked: boolean;
  parent: FibHeapNode<T> | null;
  child: FibHeapNode<T> | null;
  left: FibHeapNode<T>;
  right: FibHeapNode<T>;
}

export class FibonacciHeap<T> {
  private min: FibHeapNode<T> | null = null;
  private nodeCount: number = 0;
  
  insert(key: number, value: T): FibHeapNode<T> {
    const node: FibHeapNode<T> = {
      key,
      value,
      degree: 0,
      marked: false,
      parent: null,
      child: null,
      left: null as any,
      right: null as any
    };
    
    // Set circular references to self
    node.left = node;
    node.right = node;
    
    // Insert node into root list
    if (this.min === null) {
      this.min = node;
    } else {
      this.insertIntoRootList(node);
      
      if (node.key < this.min.key) {
        this.min = node;
      }
    }
    
    this.nodeCount++;
    return node;
  }
  
  extractMin(): T | null {
    if (this.min === null) {
      return null;
    }
    
    const minNode = this.min;
    
    // Add children of min to root list
    if (minNode.child !== null) {
      let child = minNode.child;
      const firstChild = child;
      
      do {
        const next = child.right;
        this.insertIntoRootList(child);
        child.parent = null;
        child = next;
      } while (child !== firstChild);
    }
    
    // Remove min from root list
    this.removeFromRootList(minNode);
    
    if (minNode === minNode.right) {
      // It was the only node
      this.min = null;
    } else {
      this.min = minNode.right;
      this.consolidate();
    }
    
    this.nodeCount--;
    
    return minNode.value;
  }
  
  private insertIntoRootList(node: FibHeapNode<T>): void {
    if (this.min === null) {
      this.min = node;
      node.left = node;
      node.right = node;
      return;
    }
    
    // Insert between min and min.right
    node.right = this.min.right;
    node.left = this.min;
    this.min.right.left = node;
    this.min.right = node;
  }
  
  private removeFromRootList(node: FibHeapNode<T>): void {
    if (node.right === node) {
      // It's the only node
      this.min = null;
      return;
    }
    
    node.left.right = node.right;
    node.right.left = node.left;
  }
  
  private consolidate(): void {
    // Implementation of Fibonacci heap consolidation
    // This would combine trees of the same degree
  }
  
  size(): number {
    return this.nodeCount;
  }
  
  isEmpty(): boolean {
    return this.min === null;
  }
}
```

### Task Manager

```typescript
// src/tasks/manager.ts
import { FibonacciHeap } from './scheduler/fibonacci-heap';
import { GraphOfThought } from './graph/graph';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  description: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  data: any;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private taskHeap: FibonacciHeap<string>;
  private graphManager: GraphOfThought;
  
  constructor() {
    this.taskHeap = new FibonacciHeap<string>();
    this.graphManager = new GraphOfThought();
  }
  
  async createTask(description: string, data: any = {}, options: {
    priority?: number;
    dependencies?: string[];
  } = {}): Promise<string> {
    const priority = options.priority ?? 5; // Default priority
    const dependencies = options.dependencies ?? [];
    
    // Create task
    const taskId = uuidv4();
    const task: Task = {
      id: taskId,
      description,
      priority,
      status: 'pending',
      dependencies,
      data,
      createdAt: Date.now()
    };
    
    // Store task
    this.tasks.set(taskId, task);
    
    // Add to heap if no dependencies
    if (dependencies.length === 0) {
      this.taskHeap.insert(priority, taskId);
    }
    
    return taskId;
  }
  
  async getNextTask(): Promise<Task | null> {
    const taskId = this.taskHeap.extractMin();
    if (!taskId) {
      return null;
    }
    
    const task = this.tasks.get(taskId);
    if (!task) {
      // This shouldn't happen, but let's handle it anyway
      return this.getNextTask();
    }
    
    // Update status
    task.status = 'running';
    task.startedAt = Date.now();
    
    return task;
  }
  
  async completeTask(taskId: string, result: any): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    
    // Update task
    task.status = 'completed';
    task.result = result;
    task.completedAt = Date.now();
    
    // Check for dependent tasks
    this.checkDependentTasks(taskId);
    
    return true;
  }
  
  async failTask(taskId: string, error: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    
    // Update task
    task.status = 'failed';
    task.error = error;
    task.completedAt = Date.now();
    
    return true;
  }
  
  private checkDependentTasks(completedTaskId: string): void {
    // Find tasks that depend on this one
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'pending' && task.dependencies.includes(completedTaskId)) {
        // Remove the dependency
        task.dependencies = task.dependencies.filter(id => id !== completedTaskId);
        
        // If no more dependencies, add to heap
        if (task.dependencies.length === 0) {
          this.taskHeap.insert(task.priority, taskId);
        }
      }
    }
  }
  
  async decomposeTask(taskId: string): Promise<string[]> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Use the graph manager to decompose the task
    const subtaskIds = await this.graphManager.decomposeTask(task);
    
    // Add the subtasks as dependencies of the original task
    task.dependencies = [...task.dependencies, ...subtaskIds];
    
    return subtaskIds;
  }
  
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }
  
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}
```

## Storage Domain Examples

### IPFS Kit MCP Client

```typescript
// src/storage/ipfs/mcp-client.ts
import axios from 'axios';
import WebSocket from 'ws';

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
  private wsConnection: WebSocket | null = null;
  
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
    if (!this.options.authentication) return {};
    
    if (this.options.authentication.type === 'apiKey') {
      return {
        'X-API-Key': this.options.authentication.value
      };
    } else {
      return {
        'Authorization': `Bearer ${this.options.authentication.value}`
      };
    }
  }
  
  // Content operations
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    const formData = new FormData();
    formData.append('file', new Blob([content]));
    
    const response = await this.httpClient.post('/api/v0/add', formData);
    return { cid: response.data.Hash };
  }
  
  async getContent(cid: string): Promise<Buffer> {
    const response = await this.httpClient.get(`/api/v0/cat?arg=${cid}`, {
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  }
  
  async pinContent(cid: string): Promise<boolean> {
    const response = await this.httpClient.post(`/api/v0/pin/add?arg=${cid}`);
    return response.data.Pins.includes(cid);
  }
  
  async listPins(): Promise<string[]> {
    const response = await this.httpClient.get('/api/v0/pin/ls');
    return Object.keys(response.data.Keys || {});
  }
  
  // WebSocket operations
  connectWebSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.options.baseUrl.replace(/^http/, 'ws') + '/ws';
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        resolve(this.wsConnection);
      };
      
      this.wsConnection.onerror = (error) => {
        reject(error);
      };
    });
  }
  
  // Helper method to check if connected
  isConnected(): boolean {
    return this.wsConnection !== null && 
      this.wsConnection.readyState === WebSocket.OPEN;
  }
  
  // Disconnect
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}
```

### Storage Provider Implementation

```typescript
// src/storage/provider.ts
export interface StorageProvider {
  add(content: Buffer | string, options?: any): Promise<string>;
  get(id: string): Promise<Buffer>;
  list(query?: any): Promise<string[]>;
  delete(id: string): Promise<boolean>;
}

// src/storage/ipfs/ipfs-storage.ts
import { StorageProvider } from '../provider';
import { MCPClient, MCPClientOptions } from './mcp-client';

export class IPFSStorage implements StorageProvider {
  private client: MCPClient;
  
  constructor(options: MCPClientOptions) {
    this.client = new MCPClient(options);
  }
  
  async add(content: Buffer | string, options?: any): Promise<string> {
    const result = await this.client.addContent(content);
    
    // Pin content if requested
    if (options?.pin) {
      await this.client.pinContent(result.cid);
    }
    
    return result.cid;
  }
  
  async get(id: string): Promise<Buffer> {
    return this.client.getContent(id);
  }
  
  async list(query?: any): Promise<string[]> {
    return this.client.listPins();
  }
  
  async delete(id: string): Promise<boolean> {
    // This would call the unpin API
    // Not implemented in the example client
    return true;
  }
}
```

## CLI Domain Examples

### Command System

```typescript
// src/cli/commands/registry.ts
export interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  subcommands?: Command[];
  options?: CommandOption[];
  handler: (args: any, context: ExecutionContext) => Promise<number>;
}

export interface ExecutionContext {
  cwd: string;
  env: Record<string, string>;
  interactive: boolean;
  // Additional context properties would be here
}

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, Command> = new Map();
  
  private constructor() {}
  
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }
  
  registerCommand(command: Command): void {
    this.commands.set(command.id, command);
  }
  
  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }
  
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
  
  async executeCommand(id: string, args: any, context: ExecutionContext): Promise<number> {
    const command = this.commands.get(id);
    if (!command) {
      console.error(`Command not found: ${id}`);
      return 1;
    }
    
    try {
      return await command.handler(args, context);
    } catch (error) {
      console.error(`Error executing command ${id}:`, error);
      return 1;
    }
  }
}

// Helper function to register commands
export function registerCommand(command: Command): void {
  CommandRegistry.getInstance().registerCommand(command);
}
```

### Command Implementation Example

```typescript
// src/cli/commands/definitions/agent.ts
import { Command, registerCommand } from '../registry';
import { Agent } from '../../../ai/agent/agent';
import { ModelRegistry } from '../../../ai/models/model';

// Register agent commands
export function registerAgentCommands(): void {
  // Main agent command
  const agentCommand: Command = {
    id: 'agent',
    name: 'agent',
    description: 'Interact with the AI agent',
    subcommands: [
      {
        id: 'agent:chat',
        name: 'chat',
        description: 'Start an interactive chat with the agent',
        options: [
          {
            name: 'model',
            alias: 'm',
            type: 'string',
            description: 'Model to use',
            required: false,
            default: 'default'
          }
        ],
        handler: async (args, context) => {
          // Implementation of chat command
          const modelRegistry = ModelRegistry.getInstance();
          const model = modelRegistry.getModel(args.model);
          
          const agent = new Agent({ model });
          
          // Implementation would set up interactive chat
          console.log('Starting chat with agent...');
          
          // This would be a more complex implementation with interactive input/output
          
          return 0;
        }
      },
      {
        id: 'agent:run',
        name: 'run',
        description: 'Run a single prompt through the agent',
        options: [
          {
            name: 'model',
            alias: 'm',
            type: 'string',
            description: 'Model to use',
            required: false,
            default: 'default'
          },
          {
            name: 'prompt',
            alias: 'p',
            type: 'string',
            description: 'Prompt to send to the agent',
            required: true
          }
        ],
        handler: async (args, context) => {
          // Implementation of run command
          const modelRegistry = ModelRegistry.getInstance();
          const model = modelRegistry.getModel(args.model);
          
          const agent = new Agent({ model });
          
          // Process message
          const response = await agent.processMessage(args.prompt);
          
          // Display response
          console.log(response.content);
          
          return 0;
        }
      }
    ],
    handler: async (args, context) => {
      // Main agent command handler - display help
      console.log('Agent Commands:');
      console.log('  chat - Start an interactive chat');
      console.log('  run - Run a single prompt');
      console.log('\nUse --help for more information about a command');
      return 0;
    }
  };
  
  // Register command
  registerCommand(agentCommand);
}
```

## Cross-Domain Integration Examples

### Model with IPFS Storage Integration

```typescript
// Example of cross-domain integration between AI and Storage domains
import { Model } from '../ai/models/model';
import { IPFSStorage } from '../storage/ipfs/ipfs-storage';
import { ConfigurationManager } from '../config/manager';

export class ModelRepository {
  private storage: IPFSStorage;
  private config: ConfigurationManager;
  
  constructor() {
    this.config = ConfigurationManager.getInstance();
    
    // Create IPFS storage client using configuration
    const mcpUrl = this.config.get('ipfs.mcpUrl', 'http://localhost:5001');
    const apiKey = this.config.get('ipfs.apiKey', '');
    
    this.storage = new IPFSStorage({
      baseUrl: mcpUrl,
      authentication: apiKey ? {
        type: 'apiKey',
        value: apiKey
      } : undefined
    });
  }
  
  async saveModel(model: Model): Promise<string> {
    // Serialize model to buffer
    const modelData = Buffer.from(JSON.stringify({
      id: model.getId(),
      name: model.getName(),
      provider: model.getProvider(),
      parameters: model.getParameters(),
      metadata: model.getMetadata(),
      // Don't save credentials
    }));
    
    // Store in IPFS
    return this.storage.add(modelData, { pin: true });
  }
  
  async loadModel(cid: string): Promise<Model> {
    // Get model data from IPFS
    const modelData = await this.storage.get(cid);
    
    // Parse model data
    const modelJson = JSON.parse(modelData.toString());
    
    // Create model instance
    return new Model({
      id: modelJson.id,
      name: modelJson.name,
      provider: modelJson.provider,
      parameters: modelJson.parameters,
      metadata: modelJson.metadata
    });
  }
  
  async listModels(): Promise<string[]> {
    // List models from IPFS
    return this.storage.list({ type: 'model' });
  }
}
```

### Task with ML Acceleration Integration

```typescript
// Example of cross-domain integration between Tasks and ML domains
import { Task } from '../tasks/manager';
import { InferenceEngine } from '../ml/inference/engine';
import { Tensor } from '../ml/tensor/tensor';

export class MLTaskExecutor {
  private inferenceEngine: InferenceEngine;
  
  constructor() {
    this.inferenceEngine = new InferenceEngine();
  }
  
  async executeMLTask(task: Task): Promise<any> {
    const { modelId, input } = task.data;
    
    // Load model
    const model = await this.inferenceEngine.loadModel(Buffer.from(task.data.modelData));
    
    // Convert input to tensor
    const inputTensor = new Tensor(
      new Float32Array(input.data),
      input.shape
    );
    
    // Run inference
    const outputTensor = await this.inferenceEngine.runInference(model, inputTensor);
    
    // Return result
    return {
      data: Array.from(outputTensor.getData()),
      shape: outputTensor.getShape()
    };
  }
}
```

### UI with Agent and Storage Integration

```typescript
// Example of cross-domain integration between CLI, AI, and Storage domains
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { Agent } from '../../../ai/agent/agent';
import { ModelRegistry } from '../../../ai/models/model';
import { StorageProvider } from '../../../storage/provider';
import { IPFSStorage } from '../../../storage/ipfs/ipfs-storage';

// Chat UI component
export const ChatUI = ({ modelId = 'default' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState(null);
  const [storage, setStorage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize agent and storage
  useEffect(() => {
    const modelRegistry = ModelRegistry.getInstance();
    const model = modelRegistry.getModel(modelId);
    
    // Create agent
    const newAgent = new Agent({ model });
    setAgent(newAgent);
    
    // Create storage
    const newStorage = new IPFSStorage({
      baseUrl: 'http://localhost:5001'
    });
    setStorage(newStorage);
  }, [modelId]);
  
  // Handle input
  useInput((input, key) => {
    if (key.return) {
      // Submit message
      if (input.trim() && !isProcessing) {
        sendMessage(input);
        setInput('');
      }
    } else if (key.backspace) {
      // Handle backspace
      setInput(input.slice(0, -1));
    } else if (!key.ctrl && !key.meta && !key.shift) {
      // Regular input
      setInput(prev => prev + input);
    }
  });
  
  // Send message to agent
  const sendMessage = async (text) => {
    // Update messages with user input
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // Process with agent
    setIsProcessing(true);
    
    try {
      const response = await agent.processMessage(text);
      
      // Store chat history in IPFS
      if (storage) {
        const chatHistory = [...messages, 
          { role: 'user', content: text },
          { role: 'assistant', content: response.content }
        ];
        
        const cid = await storage.add(
          JSON.stringify(chatHistory),
          { type: 'chat-history' }
        );
        
        // You could store the CID for later retrieval
        console.log('Chat history stored with CID:', cid);
      }
      
      // Update messages with response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.content 
      }]);
    } catch (error) {
      // Handle error
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `Error: ${error.message}` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Render UI
  return (
    <Box flexDirection="column">
      {/* Message history */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((message, i) => (
          <Box key={i} marginBottom={1}>
            <Text bold color={message.role === 'user' ? 'green' : 'blue'}>
              {message.role === 'user' ? 'You: ' : 'AI: '}
            </Text>
            <Text>{message.content}</Text>
          </Box>
        ))}
        
        {isProcessing && (
          <Box>
            <Text color="yellow">
              <Spinner type="dots" />
              {' Processing...'}
            </Text>
          </Box>
        )}
      </Box>
      
      {/* Input line */}
      <Box>
        <Text bold>> </Text>
        <Text>{input}</Text>
      </Box>
    </Box>
  );
};
```

These examples demonstrate the key components of each domain in the unified SwissKnife architecture, as well as how they integrate across domains to create a cohesive system.