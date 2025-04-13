# Phase 1: Foundation & Architecture

This document outlines the first phase of the SwissKnife integration project, focusing on establishing the foundation and architecture for the unified TypeScript codebase, with the Python-based IPFS Kit MCP Server as the only external component.

## Duration

**2 Weeks**

## Goals

1. Create unified project structure with clear domain boundaries
2. Establish core TypeScript interfaces and type definitions
3. Define API interface for IPFS Kit MCP Server integration
4. Design cross-domain communication patterns
5. Create comprehensive build and testing infrastructure

## Detailed Implementation Plan

### Week 1: Analysis and Design

#### Day 1-2: Unified Architecture Design

1. **Domain Organization**
   - Define key domains (AI, ML, Tasks, Storage, CLI, etc.)
   - Establish domain boundaries and responsibilities
   - Define cross-domain communication patterns
   - Document domain-specific data structures and algorithms

2. **Project Structure Design**
   ```
   /src
   ├── ai/                      # AI capabilities domain
   │   ├── agent/               # Agent implementation
   │   ├── tools/               # Tool system
   │   ├── models/              # Model providers and execution
   │   └── thinking/            # Advanced thinking patterns
   │
   ├── cli/                     # CLI and UI components
   │   ├── commands/            # Command definitions
   │   ├── ui/                  # React/Ink components
   │   ├── screens/             # Screen definitions
   │   └── formatters/          # Output formatting
   │
   ├── ml/                      # Machine learning acceleration
   │   ├── tensor/              # Tensor operations
   │   ├── hardware/            # Hardware acceleration
   │   ├── inference/           # Inference execution
   │   └── optimizers/          # Model optimization
   │
   ├── tasks/                   # Task processing system
   │   ├── scheduler/           # Fibonacci heap scheduler
   │   ├── decomposition/       # Task decomposition
   │   ├── delegation/          # Task delegation
   │   └── graph/               # Graph-of-thought implementation
   │
   ├── storage/                 # Storage systems
   │   ├── local/               # Local storage
   │   ├── ipfs/                # IPFS client integration
   │   ├── cache/               # Multi-tier caching
   │   └── indexing/            # Content indexing
   │
   ├── config/                  # Configuration system
   ├── utils/                   # Shared utilities
   └── types/                   # Shared TypeScript types
   ```

3. **Interface Definitions**
   - Define shared TypeScript interfaces for cross-domain communication
   - Create type definitions for core domain objects
   - Establish error handling and result types
   - Document interface contracts and usage patterns

#### Day 3-4: Core Domain Design

1. **AI Domain Design**
   ```typescript
   // Core agent interface
   export interface Agent {
     processMessage(message: string, context?: any): Promise<AgentMessage>;
     registerTool(tool: Tool): void;
     getTools(): Tool[];
     getMemory(): AgentMessage[];
   }
   
   // Tool system interfaces
   export interface Tool {
     name: string;
     description: string;
     parameters: ToolParameter[];
     execute(args: any): Promise<any>;
   }
   
   // Thinking system interfaces
   export interface ThoughtNode {
     id: string;
     content: string;
     type: NodeType;
     children: string[];
     completed: boolean;
     result?: any;
   }
   
   export interface ThoughtGraph {
     addNode(node: ThoughtNode): string;
     getNode(id: string): ThoughtNode | undefined;
     addChild(parentId: string, childId: string): void;
     traverse(visitor: (node: ThoughtNode, depth: number) => void): void;
   }
   ```

2. **ML Domain Design**
   ```typescript
   // Tensor interface
   export interface Tensor {
     getData(): Float32Array;
     getShape(): number[];
     getRank(): number;
     getSize(): number;
     reshape(newShape: number[]): Tensor;
   }
   
   // Hardware acceleration interfaces
   export interface HardwareAccelerator {
     getName(): string;
     getCapabilities(): AcceleratorCapabilities;
     isAvailable(): Promise<boolean>;
     execute(model: Model, inputs: Tensor | Tensor[]): Promise<Tensor | Tensor[]>;
   }
   
   // Inference engine interfaces
   export interface InferenceEngine {
     loadModel(modelData: Buffer): Promise<Model>;
     runInference(model: Model, input: Tensor): Promise<Tensor>;
   }
   ```

3. **Task Domain Design**
   ```typescript
   // Task interfaces
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
   
   // Fibonacci heap scheduler interfaces
   export interface TaskScheduler {
     addTask(task: Task): void;
     getNextTask(): Promise<Task | null>;
     updateTaskPriority(taskId: string, priority: number): boolean;
   }
   
   // Graph-of-thought interfaces
   export interface GraphProcessor {
     createGraph(rootContent: string): Promise<string>; // Returns graph ID
     processGraph(graphId: string): Promise<any>;
     decomposeTask(task: Task): Promise<string[]>; // Returns subtask IDs
   }
   ```

4. **Storage Domain Design**
   ```typescript
   // Storage provider interface
   export interface StorageProvider {
     add(content: Buffer | string, options?: any): Promise<string>;
     get(id: string): Promise<Buffer>;
     list(query?: any): Promise<string[]>;
     delete(id: string): Promise<boolean>;
   }
   
   // MCP client interface
   export interface MCPClient {
     addContent(content: string | Buffer): Promise<{ cid: string }>;
     getContent(cid: string): Promise<Buffer>;
     pinContent(cid: string): Promise<boolean>;
     listPins(): Promise<string[]>;
     connectWebSocket(): Promise<WebSocket>;
     isConnected(): boolean;
     disconnect(): void;
   }
   ```

#### Day 5-6: IPFS Kit MCP Server Integration Design

1. **API Client Design**
   ```typescript
   // API client for IPFS Kit MCP Server
   export class MCPClient {
     constructor(options: MCPClientOptions) {
       // Initialize HTTP client and WebSocket connection
     }
     
     // Content operations
     async addContent(content: string | Buffer): Promise<{ cid: string }> {
       // Implementation uses HTTP POST to /api/v0/add
     }
     
     async getContent(cid: string): Promise<Buffer> {
       // Implementation uses HTTP GET to /api/v0/cat
     }
     
     // Advanced operations
     async executeModel(modelCid: string, input: any): Promise<any> {
       // Implementation for ML model execution
     }
     
     // WebSocket operations
     connectWebSocket(): Promise<WebSocket> {
       // Connect to WebSocket endpoint
     }
   }
   ```

2. **Communication Protocol Design**
   - Define RESTful API endpoints and methods
   - Design WebSocket message format for real-time updates
   - Establish serialization formats for data exchange
   - Document authentication and security mechanisms

3. **Integration Patterns**
   - Design storage abstraction layer over MCP client
   - Create content addressing and retrieval patterns
   - Define caching strategies for improved performance
   - Document error handling and recovery mechanisms

#### Day 7-8: CLI and Command System Design

1. **Command System Design**
   ```typescript
   // Command interfaces
   export interface Command {
     id: string;
     name: string;
     description: string;
     subcommands?: Command[];
     options?: CommandOption[];
     handler: (args: any, context: ExecutionContext) => Promise<number>;
   }
   
   // Command registry
   export class CommandRegistry {
     private static instance: CommandRegistry;
     private commands: Map<string, Command> = new Map();
     
     static getInstance(): CommandRegistry {
       // Singleton implementation
     }
     
     registerCommand(command: Command): void {
       // Validate and register command
     }
     
     getCommand(id: string): Command | undefined {
       // Retrieve command by ID
     }
     
     async executeCommand(id: string, args: any, context: ExecutionContext): Promise<number> {
       // Execute command handler
     }
   }
   ```

2. **Terminal UI Design**
   - Design React/Ink component hierarchy
   - Create screen navigation system
   - Design user input handling mechanisms
   - Define output formatting standards

3. **Cross-Domain Integration**
   - Design command implementations that use domain services
   - Create context object for command execution
   - Design CLI interaction with storage system
   - Establish progress reporting mechanisms

### Week 2: Infrastructure Setup

#### Day 9-10: Project Initialization

1. **Repository Setup**
   - Initialize Git repository with appropriate structure
   - Create package.json with dependencies
   - Configure TypeScript compiler settings
   - Set up linting and code formatting

2. **Build System Configuration**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "node",
       "esModuleInterop": true,
       "strict": true,
       "outDir": "dist",
       "declaration": true,
       "sourceMap": true,
       "baseUrl": "src",
       "paths": {
         "@ai/*": ["ai/*"],
         "@cli/*": ["cli/*"],
         "@ml/*": ["ml/*"],
         "@tasks/*": ["tasks/*"],
         "@storage/*": ["storage/*"],
         "@config/*": ["config/*"],
         "@utils/*": ["utils/*"],
         "@types/*": ["types/*"]
       }
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **Package Dependencies**
   ```json
   // package.json dependencies
   {
     "dependencies": {
       "axios": "^1.4.0",
       "chalk": "^5.2.0",
       "commander": "^10.0.1",
       "ink": "^4.1.0",
       "react": "^18.2.0",
       "uuid": "^9.0.0",
       "ws": "^8.13.0"
     },
     "devDependencies": {
       "@types/node": "^18.16.0",
       "@types/react": "^18.2.0",
       "@types/uuid": "^9.0.1",
       "@types/ws": "^8.5.4",
       "typescript": "^5.0.4",
       "jest": "^29.5.0",
       "ts-jest": "^29.1.0"
     }
   }
   ```

#### Day 11-12: Core Infrastructure Implementation

1. **Type Definitions Implementation**
   - Implement shared TypeScript type definitions
   - Create domain-specific interfaces
   - Build utility types for common patterns
   - Set up type guards for runtime validation

2. **Configuration System Implementation**
   ```typescript
   // Configuration manager implementation
   export class ConfigurationManager {
     private static instance: ConfigurationManager;
     private config: Record<string, any> = {};
     
     static getInstance(): ConfigurationManager {
       if (!ConfigurationManager.instance) {
         ConfigurationManager.instance = new ConfigurationManager();
       }
       return ConfigurationManager.instance;
     }
     
     async initialize(): Promise<void> {
       // Load configuration from file
     }
     
     get<T>(key: string, defaultValue?: T): T {
       // Get configuration using dot notation
     }
     
     set<T>(key: string, value: T): void {
       // Set configuration using dot notation
     }
     
     async save(): Promise<void> {
       // Save configuration to file
     }
   }
   ```

3. **Utility Functions Implementation**
   - Implement logging utilities
   - Create async helpers
   - Build serialization utilities
   - Implement error handling helpers

#### Day 13-14: Testing Framework

1. **Unit Test Setup**
   ```javascript
   // jest.config.js
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src', '<rootDir>/test'],
     testMatch: ['**/*.test.ts'],
     transform: {
       '^.+\\.tsx?$': ['ts-jest', {
         tsconfig: 'tsconfig.json',
       }],
     },
     moduleNameMapper: {
       '^@ai/(.*)$': '<rootDir>/src/ai/$1',
       '^@cli/(.*)$': '<rootDir>/src/cli/$1',
       '^@ml/(.*)$': '<rootDir>/src/ml/$1',
       '^@tasks/(.*)$': '<rootDir>/src/tasks/$1',
       '^@storage/(.*)$': '<rootDir>/src/storage/$1',
       '^@config/(.*)$': '<rootDir>/src/config/$1',
       '^@utils/(.*)$': '<rootDir>/src/utils/$1',
       '^@types/(.*)$': '<rootDir>/src/types/$1'
     },
     coverageDirectory: 'coverage',
     collectCoverageFrom: [
       'src/**/*.ts',
       '!src/**/*.d.ts',
       '!src/**/index.ts'
     ]
   };
   ```

2. **Mock Implementations**
   - Create mock implementations for domain interfaces
   - Build test fixtures for complex objects
   - Implement mock MCP server for testing
   - Create test utilities for common patterns

3. **Integration Test Framework**
   ```typescript
   // Example integration test
   describe('AI and Storage Integration', () => {
     let agent: Agent;
     let storage: StorageProvider;
     
     beforeEach(() => {
       // Initialize components with mocks
       agent = createMockAgent();
       storage = createMockStorage();
     });
     
     it('should store agent results', async () => {
       // Test cross-domain integration
       const message = 'Test message';
       const response = await agent.processMessage(message);
       const cid = await storage.add(response.content);
       
       // Verify result
       expect(cid).toBeTruthy();
       const content = await storage.get(cid);
       expect(content.toString()).toEqual(response.content);
     });
   });
   ```

## Technical Design Details

### Core Interfaces

```typescript
// src/types/ai.ts
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  timestamp: string;
  toolResults?: Array<{
    tool: string;
    result?: any;
    error?: string;
  }>;
}

export interface AgentOptions {
  model: Model;
  maxTokens?: number;
  temperature?: number;
  tools?: Tool[];
}

// src/types/ml.ts
export interface TensorData {
  data: number[] | Float32Array;
  shape: number[];
}

export interface ModelOptions {
  name: string;
  provider: string;
  metadata?: Record<string, any>;
}

// src/types/task.ts
export interface TaskCreationOptions {
  priority?: number;
  dependencies?: string[];
  data?: any;
}

// src/types/storage.ts
export interface StorageMetadata {
  cid: string;
  size: number;
  created: string;
  mimeType?: string;
  name?: string;
  tags?: string[];
}

export interface StorageOptions {
  pin?: boolean;
  metadata?: Record<string, any>;
}
```

### API Communication

```typescript
// src/storage/ipfs/mcp-client.ts
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
  
  // More methods...
}
```

## Deliverables

1. **Project Structure**
   - Directory organization with domain boundaries
   - TypeScript configuration
   - Package configuration
   - Build pipeline setup

2. **Core Interfaces**
   - Domain-specific interfaces
   - Cross-domain communication types
   - Error handling patterns
   - Utility types

3. **Infrastructure Components**
   - Configuration system
   - Logging system
   - Build system
   - Test framework

4. **Documentation**
   - Architecture overview
   - Interface documentation
   - API specifications
   - Design decisions

## Success Criteria

1. **Project Initialization**
   - Directory structure matches domain organization
   - TypeScript compilation succeeds
   - Linting passes
   - Basic CLI can be executed

2. **Interface Completeness**
   - All domain interfaces are defined
   - Cross-domain communication patterns are established
   - Type definitions are comprehensive
   - Test fixtures can be created

3. **MCP Integration Design**
   - API client design is complete
   - Communication protocol is defined
   - Authentication mechanism is established
   - Error handling is comprehensive

4. **Testing Framework**
   - Unit tests can be executed
   - Mock implementations are functional
   - Integration tests are properly structured
   - Coverage reports are generated

## Dependencies

- Node.js and TypeScript development environment
- Access to IPFS Kit MCP Server API documentation
- React/Ink for terminal UI components
- Testing libraries (Jest, etc.)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Domain boundaries become unclear | Enforce strict interface contracts and documentation |
| Cross-domain communication becomes complex | Use well-defined types and minimal dependencies |
| IPFS Kit MCP Server API changes | Build flexible client with version handling |
| TypeScript type complexity becomes unwieldy | Use utility types and simplify where possible |
| Testing becomes difficult across domains | Create comprehensive mock system |

## Next Steps

After completing this phase, the project will move to Phase 2: Core Implementation, which will focus on building the domain-specific functionality based on the architecture defined in this phase.