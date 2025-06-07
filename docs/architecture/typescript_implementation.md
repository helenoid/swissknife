# TypeScript Implementation Architecture

This document provides a detailed architectural overview of the TypeScript implementation of Goose features in the SwissKnife project. It covers the core design patterns, class hierarchies, and component relationships that will guide development.

## Core Architecture Principles

1. **TypeScript-First Design**: Built from the ground up with TypeScript's type system in mind
2. **Component-Based Architecture**: Modular components with clear responsibilities
3. **Interface-Driven Development**: Clear interfaces defining component boundaries
4. **Progressive Enhancement**: Core functionality works with fallbacks for optional features
5. **Asynchronous by Default**: All operations support asynchronous execution patterns

## Component Overview

The TypeScript implementation consists of these primary components:

1. **TypeScript Agent**: Core AI agent functionality
2. **Tool System**: Extensible tool framework
3. **Model Providers**: LLM integration layer
4. **Memory Management**: Context and history handling
5. **IPFS Integration**: Storage and retrieval layer
6. **Task System**: Enhanced task processing
7. **CLI Interface**: Command line user interface

## TypeScript Agent

The TypeScript Agent is the central component, orchestrating interactions between user inputs, models, tools, and responses.

### Class Hierarchy

```
Agent (Abstract)
├── TypeScriptAgent
├── StreamingAgent
└── MultiModalAgent
```

### Key Interfaces

```typescript
interface AgentOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  memory?: MemoryProvider;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AgentResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: string;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
}

interface AgentContext {
  messages: AgentMessage[];
  systemPrompt?: string;
  tools: Tool[];
  user?: UserInfo;
  state: Record<string, any>;
}
```

### Core Class: TypeScriptAgent

```typescript
class TypeScriptAgent implements Agent {
  private options: AgentOptions;
  private tools: Map<string, Tool> = new Map();
  private memory: MemoryProvider;
  private modelProvider: ModelProvider;
  
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
    this.memory = options.memory || new DefaultMemory();
    
    // Initialize model provider
    this.modelProvider = this.createModelProvider(options.model);
  }
  
  async processMessage(message: string, context?: AgentContext): Promise<AgentResponse> {
    // Implementation details
  }
  
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  // Additional methods
}
```

## Tool System

The Tool System provides a framework for defining, registering, and executing tools that the AI agent can use.

### Class Hierarchy

```
Tool (Interface)
├── FileTool
├── WebTool
├── CalculatorTool
├── IPFSTool
└── CustomTool
```

### Key Interfaces

```typescript
interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(params: Record<string, any>, context: ToolContext): Promise<ToolResult>;
}

interface ToolCall {
  id: string;
  tool: string;
  params: Record<string, any>;
  timestamp: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface ToolContext {
  agent: Agent;
  user?: UserInfo;
  message: AgentMessage;
  state: Record<string, any>;
}
```

### Example Tool Implementation

```typescript
class FileTool implements Tool {
  name = 'file';
  description = 'Read or write files on the filesystem';
  
  parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform (read, write, list)',
      required: true,
      enum: ['read', 'write', 'list']
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
  
  async execute(params: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const { action, path, content } = params;
    
    try {
      switch (action) {
        case 'read':
          // Read file implementation
          return { success: true, data: 'File content' };
        case 'write':
          // Write file implementation
          return { success: true, data: { bytesWritten: content.length } };
        case 'list':
          // List directory implementation
          return { success: true, data: { files: ['file1.txt', 'file2.txt'] } };
        default:
          return { success: false, error: `Unsupported action: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## Model Providers

The Model Providers layer abstracts different language model APIs behind a consistent interface.

### Class Hierarchy

```
ModelProvider (Interface)
├── OpenAIProvider
├── AnthropicProvider
├── MistralProvider
└── LlamaCppProvider
```

### Key Interfaces

```typescript
interface ModelOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

interface ModelProvider {
  name: string;
  models: string[];
  createCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  createChatCompletion(messages: AgentMessage[], options?: ChatCompletionOptions): Promise<AgentResponse>;
  getTokenCount(text: string): number;
}

interface CompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  topP?: number;
}

interface ChatCompletionOptions extends CompletionOptions {
  tools?: Tool[];
  systemPrompt?: string;
}

interface CompletionResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### Example Provider Implementation

```typescript
class OpenAIProvider implements ModelProvider {
  name = 'openai';
  models = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
  private apiKey: string;
  private baseUrl: string;
  private client: any; // HTTP client
  
  constructor(options: ModelOptions) {
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    this.client = this.createClient(options);
  }
  
  async createChatCompletion(messages: AgentMessage[], options: ChatCompletionOptions): Promise<AgentResponse> {
    // Implementation details
  }
  
  // Additional methods
}
```

## Memory Management

The Memory Management system handles conversation history, context management, and persistence.

### Class Hierarchy

```
MemoryProvider (Interface)
├── DefaultMemory
├── PersistentMemory
└── SummarizingMemory
```

### Key Interfaces

```typescript
interface MemoryProvider {
  addMessage(message: AgentMessage): void;
  getMessages(): AgentMessage[];
  clear(): void;
  getContext(maxTokens?: number): AgentMessage[];
  persist?(): Promise<void>;
  load?(): Promise<void>;
}

interface MemoryOptions {
  maxMessages?: number;
  persistPath?: string;
  summarizeThreshold?: number;
}
```

### Example Memory Implementation

```typescript
class DefaultMemory implements MemoryProvider {
  private messages: AgentMessage[] = [];
  private options: MemoryOptions;
  
  constructor(options: MemoryOptions = {}) {
    this.options = {
      maxMessages: 100,
      ...options
    };
  }
  
  addMessage(message: AgentMessage): void {
    this.messages.push(message);
    
    // Trim messages if over limit
    if (this.messages.length > this.options.maxMessages) {
      this.messages = this.messages.slice(-this.options.maxMessages);
    }
  }
  
  getMessages(): AgentMessage[] {
    return [...this.messages];
  }
  
  clear(): void {
    this.messages = [];
  }
  
  getContext(maxTokens?: number): AgentMessage[] {
    // Implementation details for context window management
    return this.messages;
  }
}
```

## IPFS Integration

The IPFS Integration layer provides communication with the IPFS Kit MCP Server.

### Class Hierarchy

```
IPFSClient (Interface)
├── IPFSKitClient
├── IPFSHTTPClient
└── IPFSMockClient
```

### Key Interfaces

```typescript
interface IPFSClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

interface IPFSClient {
  add(content: string | Buffer): Promise<AddResult>;
  get(cid: string): Promise<GetResult>;
  pin(cid: string): Promise<PinResult>;
  unpin(cid: string): Promise<UnpinResult>;
  ls(cid: string): Promise<LsResult>;
}

interface AddResult {
  success: boolean;
  cid?: string;
  size?: number;
  error?: string;
}

// Additional result interfaces
```

### Example Client Implementation

```typescript
class IPFSKitClient implements IPFSClient {
  private baseUrl: string;
  private apiKey?: string;
  private httpClient: any; // HTTP client
  
  constructor(options: IPFSClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.httpClient = this.createHttpClient(options);
  }
  
  async add(content: string | Buffer): Promise<AddResult> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([content]));
      
      const response = await this.httpClient.post('/api/v0/add', formData);
      
      return {
        success: true,
        cid: response.data.Hash,
        size: response.data.Size
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Additional methods
}
```

## Task System

The Task System handles complex task decomposition, scheduling, and execution.

### Class Hierarchy

```
TaskManager (Interface)
├── GraphOfThoughtManager
└── FibonacciHeapScheduler
```

### Key Interfaces

```typescript
interface Task {
  id: string;
  description: string;
  priority: number;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  created: number;
  data: any;
}

interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface TaskManager {
  createTask(description: string, data: any, options?: TaskOptions): Promise<Task>;
  getTask(id: string): Promise<Task>;
  executeTask(id: string): Promise<TaskResult>;
  decompose(taskId: string, strategy: DecompositionStrategy): Promise<string[]>;
  scheduleTask(taskId: string, priority?: number): Promise<void>;
}

interface GraphNode {
  id: string;
  type: 'question' | 'hypothesis' | 'fact' | 'conclusion';
  content: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
}
```

### Example Graph-of-Thought Implementation

```typescript
class GraphOfThought {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private id: string;
  
  constructor(id?: string) {
    this.id = id || this.generateId();
  }
  
  addNode(node: GraphNode): string {
    this.nodes.set(node.id, node);
    return node.id;
  }
  
  addEdge(source: string, target: string, type: string, weight: number = 1): void {
    this.edges.push({ source, target, type, weight });
  }
  
  // Additional methods for graph traversal and manipulation
}
```

## CLI Interface

The CLI Interface provides command-line access to all system functionality.

### Class Hierarchy

```
Command (Interface)
├── AgentCommands
├── IPFSCommands
├── TaskCommands
└── SystemCommands
```

### Key Interfaces

```typescript
interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

interface Command {
  id: string;
  name: string;
  description: string;
  subcommands?: Command[];
  options?: CommandOption[];
  handler: (args: any, context: ExecutionContext) => Promise<number>;
}

interface ExecutionContext {
  config: ConfigurationManager;
  agent: TypeScriptAgent;
  ipfs: IPFSClient;
  tasks: TaskManager;
  // Additional context properties
}
```

### Example Command Implementation

```typescript
const chatCommand: Command = {
  id: 'chat',
  name: 'chat',
  description: 'Start an interactive chat with the AI agent',
  options: [
    {
      name: 'model',
      alias: 'm',
      type: 'string',
      description: 'Model to use',
      required: false,
      default: 'gpt-4o'
    }
  ],
  handler: async (args, context) => {
    // Implementation details
    return 0; // Success exit code
  }
};
```

## Data Flow

The following diagram illustrates the data flow between components during a typical operation:

```
User Input → CLI Command → TypeScript Agent → Model Provider
                 ↑                  ↓
                 ↑                  ↓
              Storage ← IPFS Client ← Tool System
                 ↑                  ↓
                 ↑                  ↓
               Result ← Task System ← Graph-of-Thought
```

## Configuration

Configuration is handled through a central ConfigurationManager that provides typed access to settings:

```typescript
interface TypeScriptAgentConfig {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  tools: {
    enabled: string[];
    timeout: number;
  };
}

interface IPFSConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
}

interface TaskConfig {
  graphOfThought: {
    maxNodes: number;
    maxEdges: number;
    defaultThinkingDepth: number;
  };
  scheduler: {
    maxTasks: number;
    priorityLevels: number;
  };
}
```

## Error Handling

Error handling follows a consistent pattern throughout the system:

1. **Typed Errors**: Specific error classes for different scenarios
2. **Result Objects**: Operations return result objects with success flag
3. **Async/Await**: Proper error propagation in async code
4. **Comprehensive Logging**: Error details captured for debugging

```typescript
class ToolExecutionError extends Error {
  constructor(public toolName: string, public params: any, message: string) {
    super(`Error executing tool ${toolName}: ${message}`);
    this.name = 'ToolExecutionError';
  }
}

// Error handling example
try {
  const result = await tool.execute(params, context);
  if (!result.success) {
    throw new ToolExecutionError(tool.name, params, result.error);
  }
  return result.data;
} catch (error) {
  logger.error('Tool execution failed', { tool: tool.name, error });
  throw error;
}
```

## Testing Strategy

The TypeScript implementation includes a comprehensive testing strategy:

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Cross-component interaction testing
3. **Type Tests**: TypeScript type checking
4. **Mocking**: Mock implementations of external dependencies
5. **Performance Tests**: Benchmarking for critical operations

```typescript
// Example test
describe('TypeScriptAgent', () => {
  let agent: TypeScriptAgent;
  let mockTool: jest.Mocked<Tool>;
  
  beforeEach(() => {
    mockTool = {
      name: 'test',
      description: 'Test tool',
      parameters: [],
      execute: jest.fn()
    };
    
    agent = new TypeScriptAgent({
      model: 'test-model',
      tools: [mockTool]
    });
  });
  
  it('should process messages', async () => {
    mockTool.execute.mockResolvedValue({ success: true, data: 'result' });
    
    const response = await agent.processMessage('Use the test tool');
    
    expect(response.content).toBeTruthy();
    expect(mockTool.execute).toHaveBeenCalled();
  });
});
```

## Conclusion

This TypeScript Implementation Architecture provides a comprehensive blueprint for reimplementing Goose features in TypeScript. By following this architecture, the project will create a tightly integrated, type-safe system that leverages the strengths of TypeScript while maintaining the functionality of the original Goose implementation.