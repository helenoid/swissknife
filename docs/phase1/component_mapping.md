# Component Mapping Document

This document maps components from source repositories (`swissknife_old`, `ipfs_accelerate_js`, and `ipfs_accelerate_py`) to the SwissKnife CLI architecture. It provides a comprehensive reference for how each source component will be integrated into the CLI-first architecture.

## 1. Mapping Overview

The mapping process follows these principles:

1. **CLI Compatibility**: Components are mapped based on their compatibility with CLI environments
2. **Functional Grouping**: Related functionalities are mapped to logical CLI component groups
3. **Dependency Management**: Dependencies between components inform integration sequence
4. **Refactoring Level**: Components are categorized by the level of refactoring required
5. **Implementation Priority**: High-value, low-complexity components are prioritized

## 2. Source-to-Target Component Mapping

### 2.1 Model Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ModelRegistry` | swissknife_old | `src/models/registry.ts` | Low | High |
| `ModelProvider` | swissknife_old | `src/models/providers/index.ts` | Low | High |
| `ModelSelector` | swissknife_old | `src/models/selector.ts` | Medium | High |
| `ModelVersioning` | swissknife_old | `src/models/versioning.ts` | Medium | Medium |
| `ModelMetadata` | ipfs_accelerate_js | `src/models/metadata.ts` | Medium | Medium |
| `ModelCache` | ipfs_accelerate_js | `src/models/cache.ts` | High | Medium |
| `TensorOps` | ipfs_accelerate_py | `src/models/tensor/index.ts` | High | Low |

**Integration Notes**:
- Model components are generally well-suited for CLI environments
- Model provider abstraction allows for consistent interface across different model sources
- Cache implementation will be adapted to use filesystem instead of browser storage
- Python tensor operations will be reimplemented in TypeScript

### 2.2 Command System Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `CommandRegistry` | swissknife_old | `src/commands/registry.ts` | Low | High |
| `CommandExecutor` | swissknife_old | `src/commands/executor.ts` | Low | High |
| `CommandParser` | swissknife_old | `src/commands/parser.ts` | Low | High |
| `CommandValidation` | swissknife_old | `src/commands/validation.ts` | Low | High |
| `CommandHelp` | swissknife_old | `src/commands/help.ts` | Medium | High |
| `CommandContext` | swissknife_old | `src/commands/context.ts` | Medium | High |
| `CommandHistory` | swissknife_old | `src/commands/history.ts` | Medium | Medium |
| `CommandSuggestions` | ipfs_accelerate_js | `src/commands/suggestions.ts` | High | Low |

**Integration Notes**:
- Command system forms the core of the CLI architecture
- Minimal refactoring needed for basic command functionality
- Command history will be adapted to use filesystem storage
- Command suggestions will require significant adaptation for CLI environment

### 2.3 Tool System Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ToolRegistry` | swissknife_old | `src/tools/registry.ts` | Low | High |
| `ToolExecutor` | swissknife_old | `src/tools/executor.ts` | Low | High |
| `ToolValidation` | swissknife_old | `src/tools/validation.ts` | Low | High |
| `PermissionManager` | swissknife_old | `src/tools/permissions.ts` | Medium | High |
| `ToolContext` | swissknife_old | `src/tools/context.ts` | Medium | High |
| `ToolDefinitions` | swissknife_old | `src/tools/definitions/index.ts` | Medium | High |
| `ToolCache` | ipfs_accelerate_js | `src/tools/cache.ts` | High | Medium |
| `ToolTelemetry` | ipfs_accelerate_js | `src/tools/telemetry.ts` | High | Low |

**Integration Notes**:
- Tool system will leverage existing CLI command infrastructure
- Permission management will be adapted for CLI security model
- Tool caching will use filesystem instead of IndexedDB
- Telemetry will be optional and require explicit consent

### 2.4 Storage Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `StorageBackend` | ipfs_accelerate_js | `src/storage/backend.ts` | Medium | High |
| `FilesystemStorage` | ipfs_accelerate_js | `src/storage/backends/filesystem.ts` | Medium | High |
| `IPFSStorage` | ipfs_accelerate_js | `src/storage/backends/ipfs.ts` | Medium | High |
| `StorageRegistry` | ipfs_accelerate_js | `src/storage/registry.ts` | Medium | High |
| `PathResolver` | ipfs_accelerate_js | `src/storage/path-resolver.ts` | Medium | High |
| `FileOperations` | ipfs_accelerate_js | `src/storage/operations.ts` | Medium | High |
| `ContentAddressing` | ipfs_accelerate_js | `src/storage/addressing.ts` | Medium | Medium |
| `MetadataStorage` | ipfs_accelerate_js | `src/storage/metadata.ts` | High | Medium |

**Integration Notes**:
- Storage components require adaptation from browser to Node.js environment
- Storage backend interface remains largely unchanged
- IPFS integration will use Node.js IPFS libraries
- Metadata storage will use structured files instead of IndexedDB

### 2.5 Worker System Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `WorkerPool` | swissknife_old | `src/workers/pool.ts` | Medium | High |
| `WorkerManager` | swissknife_old | `src/workers/manager.ts` | Medium | High |
| `TaskQueue` | swissknife_old | `src/workers/task-queue.ts` | Medium | High |
| `TaskDistributor` | swissknife_old | `src/workers/task-distributor.ts` | Medium | High |
| `TaskMonitor` | swissknife_old | `src/workers/task-monitor.ts` | Medium | Medium |
| `WorkerThreads` | ipfs_accelerate_js | `src/workers/threads.ts` | High | High |
| `TaskPrioritization` | ipfs_accelerate_py | `src/workers/prioritization.ts` | High | Medium |
| `ResultAggregation` | ipfs_accelerate_py | `src/workers/aggregation.ts` | High | Low |

**Integration Notes**:
- Worker implementation will use Node.js worker_threads instead of Web Workers
- Core worker pool and task queue require moderate adaptation
- Task prioritization system will be reimplemented in TypeScript
- Result aggregation will be simplified for CLI use cases

### 2.6 Authentication Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `KeyManager` | ipfs_accelerate_js | `src/auth/key-manager.ts` | Medium | High |
| `IdentityManager` | ipfs_accelerate_js | `src/auth/identity-manager.ts` | Medium | High |
| `CredentialStore` | ipfs_accelerate_js | `src/auth/credential-store.ts` | High | High |
| `UCANProvider` | ipfs_accelerate_js | `src/auth/ucan-provider.ts` | Medium | Medium |
| `TokenExchange` | ipfs_accelerate_js | `src/auth/token-exchange.ts` | Medium | Medium |
| `AuthorizationChecker` | ipfs_accelerate_js | `src/auth/authorization.ts` | Medium | Medium |
| `CapabilityProvider` | ipfs_accelerate_js | `src/auth/capability-provider.ts` | Medium | Low |
| `AuthenticationCommands` | ipfs_accelerate_js | `src/commands/auth/index.ts` | Medium | High |

**Integration Notes**:
- Authentication components will be adapted for CLI environment
- Credential storage will use secure local storage with encryption
- UCAN implementation remains largely unchanged
- CLI-specific auth commands will be created for management

### 2.7 MCP Integration Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `MCPServer` | swissknife_old | `src/mcp/server.ts` | Low | High |
| `MCPClient` | swissknife_old | `src/mcp/client.ts` | Low | High |
| `MCPRegistry` | swissknife_old | `src/mcp/registry.ts` | Low | High |
| `MCPToolHandler` | swissknife_old | `src/mcp/tool-handler.ts` | Low | High |
| `MCPTransport` | ipfs_accelerate_js | `src/mcp/transport/index.ts` | Medium | High |
| `HTTPTransport` | ipfs_accelerate_js | `src/mcp/transport/http.ts` | Medium | High |
| `WebSocketTransport` | ipfs_accelerate_js | `src/mcp/transport/websocket.ts` | Medium | Medium |
| `P2PTransport` | ipfs_accelerate_js | `src/mcp/transport/p2p.ts` | High | Low |

**Integration Notes**:
- MCP server components require minor adaptation
- Transport implementations will be adapted for Node.js environment
- P2P transport will be implemented using Node.js libraries
- CLI commands for MCP management will be enhanced

### 2.8 Vector Search Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `VectorIndex` | ipfs_accelerate_py | `src/vector/index.ts` | High | Medium |
| `VectorStorage` | ipfs_accelerate_py | `src/vector/storage.ts` | High | Medium |
| `SimilaritySearch` | ipfs_accelerate_py | `src/vector/similarity.ts` | High | Medium |
| `VectorOperations` | ipfs_accelerate_py | `src/vector/operations.ts` | High | Medium |
| `VectorCommands` | ipfs_accelerate_py | `src/commands/vector/index.ts` | High | Medium |
| `VectorTools` | ipfs_accelerate_py | `src/tools/vector/index.ts` | High | Medium |
| `EmbeddingManager` | ipfs_accelerate_py | `src/vector/embedding.ts` | High | Low |
| `DistanceMetrics` | ipfs_accelerate_py | `src/vector/metrics.ts` | Medium | Low |

**Integration Notes**:
- Vector search components will be reimplemented in TypeScript from Python
- Core vector operations will be optimized for Node.js environment
- Embedding generation will use TypeScript ML libraries
- CLI commands will be created for vector operations

### 2.9 Neural Network Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ModelLoader` | ipfs_accelerate_js | `src/ml/loader.ts` | High | High |
| `ModelInference` | ipfs_accelerate_js | `src/ml/inference.ts` | High | High |
| `ModelOptimization` | ipfs_accelerate_js | `src/ml/optimization.ts` | High | Medium |
| `HardwareDetection` | ipfs_accelerate_js | `src/ml/hardware.ts` | High | High |
| `TensorflowBinding` | ipfs_accelerate_py | `src/ml/tensorflow/index.ts` | High | Medium |
| `ONNXBinding` | ipfs_accelerate_py | `src/ml/onnx/index.ts` | High | Medium |
| `MLCommands` | ipfs_accelerate_py | `src/commands/ml/index.ts` | High | Medium |
| `ModelConversion` | ipfs_accelerate_py | `src/ml/conversion.ts` | High | Low |

**Integration Notes**:
- ML components will be adapted to use Node.js TensorFlow.js or ONNX Runtime
- Hardware detection will be reimplemented for Node.js environment
- Model loading will use filesystem storage
- CLI commands will be created for ML operations

### 2.10 Configuration Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ConfigManager` | swissknife_old | `src/config/manager.ts` | Low | High |
| `ConfigStorage` | swissknife_old | `src/config/storage.ts` | Low | High |
| `ConfigValidation` | swissknife_old | `src/config/validation.ts` | Low | High |
| `ConfigCommands` | swissknife_old | `src/commands/config/index.ts` | Low | High |
| `DefaultConfig` | swissknife_old | `src/config/defaults.ts` | Low | High |
| `ConfigMigration` | ipfs_accelerate_js | `src/config/migration.ts` | Medium | Medium |
| `ConfigSchema` | ipfs_accelerate_js | `src/config/schema.ts` | Medium | Medium |
| `EnvVarIntegration` | ipfs_accelerate_js | `src/config/env.ts` | Medium | Medium |

**Integration Notes**:
- Configuration components from swissknife_old are already CLI-compatible
- Configuration storage will use filesystem instead of localStorage
- Schema validation will be enhanced for hierarchical configuration
- Migration utilities will handle configuration format changes

## 3. Integration Architecture

The following diagram illustrates how the mapped components fit into the SwissKnife CLI architecture:

```
SwissKnife CLI Architecture
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────┐ │
│ │ CLI Commands  │ │ Tool System   │ │ Storage       │ │ Auth   │ │
│ │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │ │        │ │
│ │ │  Registry  │ │ │  Registry  │ │ │ │  Backend  │ │ │        │ │
│ │ │  Executor  │ │ │  Executor  │ │ │ │  FS       │ │ │        │ │
│ │ │  Parser    │ │ │  Validation│ │ │ │  IPFS     │ │ │        │ │
│ │ │  Help      │ │ │  Definitions│ │ │ │  Operations│ │ │        │ │
│ │ └───────────┘ │ └───────────┘ │ └───────────┘ │ └────────┘ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └────────┘ │
│                                                                   │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────┐ │
│ │ Models        │ │ Workers       │ │ MCP           │ │ Vector  │ │
│ │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │ │        │ │
│ │ │  Registry  │ │ │  Pool      │ │ │ │  Server   │ │ │        │ │
│ │ │  Providers │ │ │  Manager   │ │ │ │  Client   │ │ │        │ │
│ │ │  Cache     │ │ │  Queue     │ │ │ │  Transport│ │ │        │ │
│ │ │  Selector  │ │ │  Distributor│ │ │ │  Registry │ │ │        │ │
│ │ └───────────┘ │ └───────────┘ │ └───────────┘ │ └────────┘ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └────────┘ │
│                                                                   │
│ ┌───────────────┐ ┌───────────────────────────────────────────┐  │
│ │ ML            │ │ Configuration                             │  │
│ │ ┌───────────┐ │ │ ┌───────────┐                             │  │
│ │ │  Loader   │ │ │ │  Manager  │                             │  │
│ │ │  Inference │ │ │ │  Storage  │                             │  │
│ │ │  Hardware  │ │ │ │  Validation│                            │  │
│ │ └───────────┘ │ └───────────┘                             │  │
│ └───────────────┘ └───────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## 4. Component Dependencies

This section outlines the dependencies between components to inform integration sequence.

### 4.1 Core Dependencies

The following components form the core foundation and should be integrated first:

1. **Configuration System**: Required by most other components
2. **Command System**: Provides the CLI interface foundation
3. **Storage System (Basic)**: Required for persistent storage

### 4.2 Secondary Dependencies

These components depend on the core components:

1. **Model Registry**: Depends on Configuration and Storage
2. **Tool System**: Depends on Command System and Configuration
3. **MCP Basic**: Depends on Command System

### 4.3 Tertiary Dependencies

These components have multiple dependencies:

1. **Worker System**: Depends on Configuration and Storage
2. **Authentication**: Depends on Configuration and Storage
3. **Vector Search**: Depends on Storage and Model components
4. **Neural Network**: Depends on Storage, Configuration, and Worker System

### 4.4 Dependency Graph

```
Configuration ─┬─► Command System ──┬─► Tool System ──────► MCP Full
               │                    │
               ├─► Storage ─────────┼─► Model Registry ─┬─► Vector Search
               │                    │                   │
               │                    └─► Auth System     └─► Neural Network
               │
               └─► Worker System ───────────────────────► Task Distribution
```

## 5. Component Interface Adaptations

This section outlines the interface changes required when adapting components from source repositories to the CLI architecture.

### 5.1 Browser-to-Node.js Adaptations

| Component Type | Original Interface | CLI Adaptation |
|----------------|-------------------|----------------|
| Storage | `localStorage`/`IndexedDB` | Node.js `fs` module |
| Workers | Web Workers | Node.js `worker_threads` |
| Networking | `fetch`/`XMLHttpRequest` | Node.js `http`/`https` modules |
| UI | DOM manipulation | Terminal output (`chalk`, `ink`) |
| Authentication | Browser secure storage | Encrypted file storage |

### 5.2 Python-to-TypeScript Adaptations

| Component Type | Original Interface | CLI Adaptation |
|----------------|-------------------|----------------|
| Vector Operations | NumPy arrays | TypedArrays / ML libraries |
| ML Models | PyTorch/TensorFlow (Python) | TensorFlow.js / ONNX Runtime |
| Task Queue | Python asyncio | Node.js async/await and promises |
| Data Processing | Pandas | Custom TypeScript implementations |

### 5.3 Common Adaptation Patterns

1. **Async Pattern Adaptation**: Converting Python async/await to JavaScript Promises
   ```typescript
   // Original Python
   async def process_data(data):
       result = await expensive_operation(data)
       return result
   
   // TypeScript Adaptation
   async function processData(data: Data): Promise<Result> {
       const result = await expensiveOperation(data);
       return result;
   }
   ```

2. **Storage Adaptation**: Converting browser storage to filesystem
   ```typescript
   // Original browser code
   localStorage.setItem('key', JSON.stringify(data));
   const data = JSON.parse(localStorage.getItem('key'));
   
   // Node.js adaptation
   import fs from 'fs/promises';
   import path from 'path';
   
   const storePath = path.join(configDir, 'storage.json');
   await fs.writeFile(storePath, JSON.stringify(data));
   const data = JSON.parse(await fs.readFile(storePath, 'utf8'));
   ```

3. **UI Adaptation**: Converting DOM manipulation to terminal output
   ```typescript
   // Original browser code
   document.getElementById('result').textContent = `Found ${results.length} items`;
   
   // CLI adaptation
   import chalk from 'chalk';
   
   console.log(chalk.green(`Found ${results.length} items`));
   ```

## 6. Integration Sequence

Based on dependencies and implementation priorities, the following integration sequence is recommended:

### Phase 1: Core Infrastructure (Weeks 1-3)

1. Configuration System
2. Command System
3. Basic Storage System
4. Core Model Registry

### Phase 2: Foundation Components (Weeks 4-6)

1. Tool System
2. Basic Worker System
3. Basic Authentication
4. MCP Server Framework

### Phase 3: Advanced Components (Weeks 7-9)

1. Advanced Storage with IPFS
2. Full Worker System with Task Distribution
3. Vector Search Core
4. Enhanced Authentication

### Phase 4: ML and Advanced Features (Weeks 10-12)

1. Neural Network Integration
2. Advanced MCP Features
3. Full Vector Search
4. ML Commands and Tools

## 7. Component-Specific Integration Guidelines

### 7.1 Command System Integration

1. Maintain existing command structure for backward compatibility
2. Extend command registry to support nested commands
3. Implement help system with examples
4. Integrate context management for commands

### 7.2 Storage System Integration

1. Implement abstract storage backend interface
2. Create filesystem backend implementation first
3. Add IPFS backend with appropriate fallbacks
4. Ensure consistent error handling across backends

### 7.3 Model Management Integration

1. Maintain model registry structure from swissknife_old
2. Enhance with model metadata from ipfs_accelerate_js
3. Implement model caching with filesystem storage
4. Add model selection logic based on task requirements

### 7.4 MCP Integration

1. Integrate existing MCP server implementation
2. Enhance with transport options from ipfs_accelerate_js
3. Implement command-line management interface
4. Add connection monitoring and diagnostics

## 8. Testing Strategy per Component

| Component Group | Unit Testing Approach | Integration Testing Approach |
|-----------------|----------------------|----------------------------|
| Command System | Test command parsing, execution, and output formatting | Test command interactions and workflow sequences |
| Storage System | Test CRUD operations with mock backends | Test actual file operations in isolated environments |
| Model Management | Test model selection and metadata handling | Test model loading and execution with small test models |
| Worker System | Test task queue and distribution logic | Test actual worker processes with non-trivial tasks |
| MCP Integration | Test protocol implementation and message handling | Test client-server communication with mock services |
| Vector Search | Test core algorithms and data structures | Test search operations with test vector datasets |
| ML Components | Test model loading and processing pipelines | Test inference with small test models |

## 9. Migration Considerations

### 9.1 User Impact

| Component | User Impact | Migration Approach |
|-----------|------------|-------------------|
| Command System | Minimal - enhanced capabilities | Maintain backward compatibility, phase in new features |
| Configuration | Medium - new hierarchical format | Provide automatic migration utility |
| Storage | Minimal - transparent to user | Internal implementation change only |
| Worker System | Minimal - performance improvement | Gradual adoption with fallback to single-threaded |
| MCP Integration | Medium - enhanced options | Documentation and command assistance |

### 9.2 Backward Compatibility

1. Command syntax will maintain backward compatibility
2. Configuration will include migration from flat to hierarchical
3. Storage paths will be preserved across implementation changes
4. API interfaces will support previous versions with deprecation warnings

## 10. Conclusion

This component mapping document provides a comprehensive plan for integrating components from source repositories into the SwissKnife CLI architecture. By following this mapping, the implementation team can:

1. Understand how source components map to target architecture
2. Prioritize implementation based on dependencies and value
3. Adapt interfaces appropriately for CLI environment
4. Maintain consistency across the codebase
5. Ensure backward compatibility where needed

The integration will proceed according to the provided sequence, with each phase building on the foundation laid by previous phases.