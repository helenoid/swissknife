# SwissKnife Unified Project Structure

This document outlines the domain-driven project structure of SwissKnife, organized as a single unified TypeScript codebase with clear domain boundaries.

## Directory Structure

```
/
├── src/                                # Main source code directory
│   ├── ai/                            # AI capabilities domain
│   │   ├── agent/                     # Agent implementation
│   │   │   ├── agent.ts               # Core agent implementation
│   │   │   ├── context.ts             # Agent context management
│   │   │   ├── memory.ts              # Message history and memory
│   │   │   └── index.ts               # Agent module exports
│   │   │
│   │   ├── tools/                     # Tool system
│   │   │   ├── tool.ts                # Tool interface definition
│   │   │   ├── registry.ts            # Tool registration system
│   │   │   ├── executor.ts            # Tool execution system
│   │   │   ├── implementations/       # Built-in tools
│   │   │   │   ├── shell.ts           # Shell command tool
│   │   │   │   ├── filesystem.ts      # File system tool
│   │   │   │   ├── search.ts          # Code search tool
│   │   │   │   └── web.ts             # Web-related tools
│   │   │   └── index.ts               # Tool system exports
│   │   │
│   │   ├── models/                    # Model providers and execution
│   │   │   ├── model.ts               # Model interface definition
│   │   │   ├── registry.ts            # Model registration and lookup
│   │   │   ├── providers/             # Model provider implementations
│   │   │   │   ├── openai.ts          # OpenAI provider
│   │   │   │   ├── anthropic.ts       # Anthropic provider
│   │   │   │   ├── local.ts           # Local model provider
│   │   │   │   └── custom.ts          # Custom provider implementation
│   │   │   └── index.ts               # Model system exports
│   │   │
│   │   ├── thinking/                  # Advanced thinking capabilities
│   │   │   ├── graph.ts               # Graph-of-thought implementation
│   │   │   ├── patterns.ts            # Thinking patterns
│   │   │   ├── strategies.ts          # Reasoning strategies
│   │   │   └── index.ts               # Thinking module exports
│   │   │
│   │   └── index.ts                   # AI domain exports
│   │
│   ├── cli/                           # CLI and UI components
│   │   ├── commands/                  # Command system
│   │   │   ├── registry.ts            # Command registration system
│   │   │   ├── parser.ts              # Command line parser
│   │   │   ├── context.ts             # Command execution context
│   │   │   ├── definitions/           # Command implementations
│   │   │   │   ├── agent.ts           # Agent-related commands
│   │   │   │   ├── model.ts           # Model-related commands
│   │   │   │   ├── task.ts            # Task-related commands
│   │   │   │   ├── storage.ts         # Storage-related commands
│   │   │   │   └── config.ts          # Configuration commands
│   │   │   └── index.ts               # Command system exports
│   │   │
│   │   ├── ui/                        # Terminal UI components
│   │   │   ├── components/            # Reusable UI components
│   │   │   │   ├── message.tsx        # Message display component
│   │   │   │   ├── input.tsx          # Input component
│   │   │   │   ├── selection.tsx      # Selection component
│   │   │   │   └── progress.tsx       # Progress indicator component
│   │   │   ├── screens/               # Screen definitions
│   │   │   │   ├── chat.tsx           # Chat interface screen
│   │   │   │   ├── config.tsx         # Configuration screen
│   │   │   │   ├── model.tsx          # Model selection screen
│   │   │   │   └── help.tsx           # Help screen
│   │   │   └── index.ts               # UI module exports
│   │   │
│   │   ├── formatters/                # Output formatting
│   │   │   ├── code.ts                # Code formatting
│   │   │   ├── markdown.ts            # Markdown formatting
│   │   │   └── table.ts               # Table formatting
│   │   │
│   │   └── index.ts                   # CLI domain exports
│   │
│   ├── ml/                            # ML acceleration domain
│   │   ├── tensor/                    # Tensor operations
│   │   │   ├── tensor.ts              # Tensor data structure
│   │   │   ├── operations.ts          # Tensor operations
│   │   │   └── index.ts               # Tensor module exports
│   │   │
│   │   ├── hardware/                  # Hardware acceleration
│   │   │   ├── accelerator.ts         # Hardware accelerator interface
│   │   │   ├── webgpu.ts              # WebGPU accelerator
│   │   │   ├── webnn.ts               # WebNN accelerator
│   │   │   ├── wasm.ts                # WASM accelerator
│   │   │   └── index.ts               # Hardware module exports
│   │   │
│   │   ├── inference/                 # Model inference
│   │   │   ├── engine.ts              # Inference engine
│   │   │   ├── executor.ts            # Model execution
│   │   │   └── index.ts               # Inference module exports
│   │   │
│   │   ├── optimizers/                # Model optimization
│   │   │   ├── quantization.ts        # Model quantization
│   │   │   ├── pruning.ts             # Model pruning
│   │   │   └── index.ts               # Optimizer module exports
│   │   │
│   │   └── index.ts                   # ML domain exports
│   │
│   ├── tasks/                         # Task processing domain
│   │   ├── scheduler/                 # Task scheduling
│   │   │   ├── fibonacci-heap.ts      # Fibonacci heap implementation
│   │   │   ├── scheduler.ts           # Task scheduler
│   │   │   └── index.ts               # Scheduler module exports
│   │   │
│   │   ├── decomposition/             # Task decomposition
│   │   │   ├── decomposer.ts          # Task decomposition engine
│   │   │   ├── strategies.ts          # Decomposition strategies
│   │   │   └── index.ts               # Decomposition module exports
│   │   │
│   │   ├── delegation/                # Task delegation
│   │   │   ├── delegator.ts           # Task delegation engine
│   │   │   ├── assignment.ts          # Task assignment logic
│   │   │   └── index.ts               # Delegation module exports
│   │   │
│   │   ├── graph/                     # Graph-of-thought implementation
│   │   │   ├── graph.ts               # Graph data structure
│   │   │   ├── traversal.ts           # Graph traversal algorithms
│   │   │   ├── visualization.ts       # Graph visualization
│   │   │   └── index.ts               # Graph module exports
│   │   │
│   │   ├── manager.ts                 # Task management system
│   │   └── index.ts                   # Tasks domain exports
│   │
│   ├── storage/                       # Storage domain
│   │   ├── local/                     # Local storage
│   │   │   ├── file-storage.ts        # File-based storage
│   │   │   ├── metadata.ts            # Metadata management
│   │   │   └── index.ts               # Local storage exports
│   │   │
│   │   ├── ipfs/                      # IPFS integration
│   │   │   ├── mcp-client.ts          # MCP client implementation
│   │   │   ├── content.ts             # Content management
│   │   │   ├── cid.ts                 # CID utilities
│   │   │   └── index.ts               # IPFS module exports
│   │   │
│   │   ├── cache/                     # Caching system
│   │   │   ├── memory-cache.ts        # Memory cache
│   │   │   ├── disk-cache.ts          # Disk cache
│   │   │   ├── mmf-cache.ts           # Memory-mapped file cache
│   │   │   └── index.ts               # Cache module exports
│   │   │
│   │   ├── indexing/                  # Content indexing
│   │   │   ├── index-engine.ts        # Indexing engine
│   │   │   ├── search.ts              # Search functionality
│   │   │   └── index.ts               # Indexing module exports
│   │   │
│   │   ├── provider.ts                # Storage provider interface
│   │   └── index.ts                   # Storage domain exports
│   │
│   ├── workers/                       # Worker thread domain
│   │   ├── pool.ts                    # Worker pool management
│   │   ├── thread.ts                  # Worker thread implementation
│   │   ├── queue.ts                   # Task queue
│   │   └── index.ts                   # Worker domain exports
│   │
│   ├── config/                        # Configuration domain
│   │   ├── manager.ts                 # Configuration manager
│   │   ├── schema.ts                  # JSON schema validation
│   │   ├── persistence.ts             # Configuration persistence
│   │   ├── migration.ts               # Configuration migration
│   │   └── index.ts                   # Configuration domain exports
│   │
│   ├── utils/                         # Utility functions
│   │   ├── async.ts                   # Async utilities
│   │   ├── logging.ts                 # Logging system
│   │   ├── performance.ts             # Performance monitoring
│   │   ├── serialization.ts           # Data serialization
│   │   └── index.ts                   # Utilities exports
│   │
│   ├── types/                         # Shared TypeScript types
│   │   ├── ai.ts                      # AI-related types
│   │   ├── storage.ts                 # Storage-related types
│   │   ├── task.ts                    # Task-related types
│   │   ├── config.ts                  # Configuration types
│   │   └── index.ts                   # Types exports
│   │
│   └── index.ts                       # Main entry point
│
├── test/                              # Test directory
│   ├── unit/                         # Unit tests
│   │   ├── ai/                       # AI domain tests
│   │   ├── cli/                      # CLI domain tests
│   │   ├── ml/                       # ML domain tests
│   │   ├── tasks/                    # Tasks domain tests
│   │   └── storage/                  # Storage domain tests
│   │
│   ├── integration/                  # Integration tests
│   │   ├── ai-storage.test.ts        # AI and storage integration test
│   │   ├── ml-tasks.test.ts          # ML and tasks integration test
│   │   └── end-to-end.test.ts        # End-to-end workflow test
│   │
│   ├── mocks/                        # Mock implementations
│   │   ├── mcp-server.ts             # Mock MCP server
│   │   ├── model-provider.ts         # Mock model provider
│   │   └── storage-provider.ts       # Mock storage provider
│   │
│   └── fixtures/                     # Test fixtures
│       ├── models/                   # Model fixtures
│       ├── content/                  # Content fixtures
│       └── configs/                  # Configuration fixtures
│
├── docs/                              # Documentation
│   ├── unified_integration_plan.md   # Unified integration plan
│   ├── UNIFIED_ARCHITECTURE.md       # Unified architecture overview
│   ├── PROJECT_STRUCTURE.md          # This document
│   ├── CLEAN_ROOM_IMPLEMENTATION.md  # Clean room implementation details
│   ├── domains/                      # Domain-specific documentation
│   │   ├── ai.md                     # AI domain documentation
│   │   ├── ml.md                     # ML domain documentation
│   │   ├── tasks.md                  # Tasks domain documentation
│   │   └── storage.md                # Storage domain documentation
│   │
│   ├── guides/                       # User and developer guides
│   │   ├── getting-started.md        # Getting started guide
│   │   ├── configuration.md          # Configuration guide
│   │   ├── extending.md              # Extension guide
│   │   └── contributing.md           # Contribution guide
│   │
│   └── api/                          # API documentation
│       ├── ai.md                     # AI API documentation
│       ├── ml.md                     # ML API documentation
│       ├── tasks.md                  # Tasks API documentation
│       └── storage.md                # Storage API documentation
│
├── scripts/                           # Build and utility scripts
│   ├── build.js                      # Build script
│   ├── install.sh                    # Installation script
│   └── release.js                    # Release script
│
├── package.json                       # Package configuration
├── tsconfig.json                      # TypeScript configuration
├── jest.config.js                     # Jest configuration
└── README.md                          # Main README file
```

## Core Domains

The project is organized into the following functional domains, all implemented within a single TypeScript codebase:

### AI Domain (`src/ai/`)

Contains all AI-related functionality, including clean room implementations of Goose features:

- **Agent System**: Core agent functionality for processing messages and executing actions
- **Tool System**: Extensible registry for tool definitions and execution
- **Model Providers**: Integrations with various AI model providers
- **Advanced Thinking**: Graph-of-thought implementation and reasoning strategies

### CLI Domain (`src/cli/`)

Handles the command-line interface and user interaction:

- **Command System**: Registration, parsing, and execution of commands
- **UI Components**: Rich terminal UI built with React/Ink
- **Formatters**: Output formatting for code, markdown, and structured data
- **Screens**: Specialized UI screens for different functions

### ML Domain (`src/ml/`)

Provides machine learning acceleration capabilities:

- **Tensor Operations**: Core data structures for ML operations
- **Hardware Acceleration**: Leveraging available hardware (GPU, WebNN, etc.)
- **Inference Engine**: Executing ML models efficiently
- **Optimizers**: Techniques to optimize model performance

### Tasks Domain (`src/tasks/`)

Implements advanced task processing for complex problem solving:

- **Fibonacci Heap Scheduler**: Efficient priority-based task scheduling
- **Task Decomposition**: Breaking problems into manageable subtasks
- **Delegation System**: Assigning tasks to appropriate handlers
- **Graph-of-Thought**: Non-linear, graph-based reasoning structure

### Storage Domain (`src/storage/`)

Manages storage operations with both local and IPFS capabilities:

- **Local Storage**: File-based storage with metadata
- **IPFS Integration**: Client for Python IPFS Kit MCP Server
- **Caching System**: Multi-level caching for performance
- **Content Indexing**: Search and retrieval capabilities

### Support Domains

Additional domains that provide infrastructure and utilities:

- **Workers Domain**: Multi-threading support for background tasks
- **Configuration Domain**: Managing user and system settings
- **Utilities**: Shared helper functions across domains
- **Types**: TypeScript type definitions for cross-domain communication

## Key Implementation Principles

### 1. Single Unified Codebase

All functionality is implemented directly in TypeScript within a single coherent codebase:

- No separation between components originally from different sources
- Consistent coding patterns and style throughout
- Unified build and testing process
- Shared type system across all domains

### 2. Domain-Driven Design

Code organization focuses on functional domains rather than source origins:

- Clear separation of concerns between domains
- Well-defined interfaces for cross-domain communication
- Domain-specific testing and documentation
- Logical, self-contained modules within each domain

### 3. Clean Room Implementation

All functionality is independently implemented following clean room methodology:

- Features inspired by original designs but coded from scratch
- No direct porting of code from Rust or other sources
- Optimized for TypeScript and Node.js environment
- Enhanced with TypeScript-specific improvements

### 4. MCP Server Integration

The Python-based IPFS Kit MCP Server is the only external component:

- Well-defined client interface in the Storage domain
- REST and WebSocket API communication
- Clear separation through typed interfaces
- Fallback mechanisms for offline operation

## Cross-Domain Integration

Domains interact through well-defined TypeScript interfaces:

```typescript
// Example: AI domain using Storage domain
// src/ai/agent/agent.ts
import { StorageProvider } from '../../storage/provider';

export class Agent {
  private storage: StorageProvider;
  
  constructor(options: { storage: StorageProvider }) {
    this.storage = options.storage;
  }
  
  async processMessage(message: string): Promise<string> {
    // Store message in storage
    const messageId = await this.storage.add(message);
    
    // Process and generate response
    const response = "Generated response";
    
    // Store response
    const responseId = await this.storage.add(response);
    
    return response;
  }
}
```

```typescript
// Example: Tasks domain using Storage domain
// src/tasks/graph/graph.ts
import { StorageProvider } from '../../storage/provider';
import { CID } from '../../types/storage';

export class GraphOfThought {
  private storage: StorageProvider;
  
  constructor(options: { storage: StorageProvider }) {
    this.storage = options.storage;
  }
  
  async storeGraph(): Promise<CID> {
    const serialized = JSON.stringify(this.getSerializableGraph());
    return await this.storage.add(serialized);
  }
  
  async loadGraph(cid: CID): Promise<void> {
    const serialized = await this.storage.get(cid);
    this.deserializeGraph(JSON.parse(serialized.toString()));
  }
}
```

## Testing Approach

Tests follow the same domain-driven organization:

- **Unit Tests**: Test individual components within domains
- **Integration Tests**: Test interactions between domains
- **End-to-End Tests**: Test complete workflows across the system
- **Mock Implementations**: Provide test doubles for external dependencies

## Conclusion

The SwissKnife unified project structure creates a cohesive, maintainable system with clear domain boundaries and strong typing. By organizing code by functional domain rather than by original source, we create a more intuitive and maintainable codebase while ensuring all functionality works seamlessly together.