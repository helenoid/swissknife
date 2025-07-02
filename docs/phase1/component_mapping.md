# Component Mapping Document

This document maps components from source repositories (`swissknife_old`, `ipfs_accelerate_js`, and `ipfs_accelerate_py`) to the SwissKnife CLI architecture. It provides a comprehensive reference for how each source component will be integrated into the CLI-first architecture.

## 1. Mapping Overview

The mapping process follows these principles:

1. **CLI Compatibility**: Components are mapped based on their compatibility with CLI environments
2. **Functional Grouping**: Related functionalities are mapped to logical CLI component groups
3. **Dependency Management**: Dependencies between components inform integration sequence
4. **Refactoring Level**: Components are categorized by the level of refactoring required
5. **Implementation Priority**: High-value, low-complexity components are prioritized.

**Refactoring Level Definitions:**
*   **Low:** Component is largely compatible; requires minor updates, configuration changes, or integration wrappers.
*   **Medium:** Core concepts are reusable, but significant code changes, API adaptations, or architectural adjustments are needed for the CLI environment.
*   **High:** Component requires substantial rewriting or complete reimplementation in TypeScript, potentially using the original only as a functional reference.

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
| `TensorOps` | ipfs_accelerate_py | `src/ml/tensor/index.ts` | High | Low |

**Integration Notes**:
- Core concepts like the registry, provider abstraction, and selector are sound and largely reusable.
- Provider implementations need updating to use current Node.js SDKs (OpenAI, Anthropic) and configuration (API keys via `ConfigurationManager`).
- `ModelCache` requires complete reimplementation to replace browser storage (IndexedDB/localStorage) with a Node.js filesystem or database solution (e.g., SQLite, LevelDB). Cache key generation logic might be reusable.
- `ModelMetadata` and `ModelVersioning` concepts need integration into the new `ModelRegistry` structure.
- Python `TensorOps` require full reimplementation using Node.js-compatible libraries (e.g., TensorFlow.js Node, ONNX Runtime Node utilities, `ndarray`). This is lower priority unless local ML inference is implemented early.

### 2.2 Command System Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `CommandRegistry` | swissknife_old | `src/cli/registry.ts` | Low | High |
| `CommandExecutor` | swissknife_old | `src/cli/executor.ts` | Low | High |
| `CommandParser` | swissknife_old | `src/cli/parser.ts` | Medium | High |
| `CommandValidation` | swissknife_old | `src/cli/validation.ts` | Medium | High |
| `CommandHelp` | swissknife_old | `src/cli/help.ts` | Medium | High |
| `CommandContext` | swissknife_old | `src/cli/context.ts` | Medium | High |
| `CommandHistory` | swissknife_old | `src/cli/history.ts` | Medium | Medium |
| `CommandSuggestions` | ipfs_accelerate_js | `src/cli/suggestions.ts` | High | Low |

**Integration Notes**:
- The core concepts (Registry, Executor, Context) from `swissknife_old` map well to the target architecture.
- `CommandParser` and `CommandValidation` will likely be replaced or heavily adapted to use a standard library like `yargs` or `commander` for robustness and feature set (validation, type coercion, help generation).
- `CommandHelp` generation logic needs updating to work with the chosen parsing library and potentially support more formats (Markdown).
- `CommandContext` needs to evolve into the `ExecutionContext`, providing access to the new service-oriented architecture.
- `CommandHistory` needs adaptation to use filesystem storage instead of browser mechanisms.
- `CommandSuggestions` (likely for autocompletion) requires significant work to integrate with the chosen parsing library and shell completion scripts.

### 2.3 Tool System Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ToolRegistry` | swissknife_old | `src/agent/tools/registry.ts` | Low | High |
| `ToolExecutor` | swissknife_old | `src/agent/tools/executor.ts` | Low | High |
| `ToolValidation` | swissknife_old | `src/agent/tools/validation.ts` | Low | High |
| `PermissionManager` | swissknife_old | `src/permissions.ts` | Medium | High |
| `ToolContext` | swissknife_old | `src/agent/tools/context.ts` | Medium | High |
| `ToolDefinitions` | swissknife_old | `src/agent/tools/definitions/` | Medium | High |
| `ToolCache` | ipfs_accelerate_js | `src/agent/tools/cache.ts` | High | Medium |
| `ToolTelemetry` | ipfs_accelerate_js | `src/telemetry.ts` | High | Low |

**Integration Notes**:
- The core Tool Registry/Executor/Validation concepts are directly applicable to the `TypeScriptAgent`'s tool system.
- `PermissionManager` needs adaptation for a CLI context – permissions might be based on configuration, user roles (if implemented), or command-line flags rather than browser origins. Needs careful design.
- `ToolContext` needs to integrate with the main `ExecutionContext` to provide tools access to necessary services (config, storage, etc.).
- `ToolDefinitions` (specific tool implementations like file access, web search) need review and potential reimplementation using Node.js APIs.
- `ToolCache` requires reimplementation using Node.js storage (filesystem/database).
- `ToolTelemetry` needs careful consideration regarding privacy and opt-in mechanisms suitable for a CLI tool. May be deferred or made opt-in via configuration.

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
- The core abstraction (`StorageBackend` interface, `StorageRegistry`, `PathResolver`, `StorageOperations`) is sound but implementations need significant Node.js adaptation.
- `FilesystemStorage` needs to use Node.js `fs/promises` and robust, cross-platform path handling (see `storage_system_analysis.md`).
- `IPFSStorage` needs to use the `IPFSKitClient` and requires a Node.js-based `MappingStore` implementation (e.g., SQLite, filesystem). Browser-specific IPFS client code is irrelevant.
- `MetadataStorage` (if separate from `MappingStore`) needs reimplementation using Node.js storage.
- Path resolution logic needs thorough testing across platforms.
- Browser-specific caching or utilities must be removed/replaced.

### 2.5 Worker System Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `WorkerPool` | swissknife_old | `src/tasks/workers/pool.ts` | Medium | High |
| `WorkerManager` | swissknife_old | `src/tasks/workers/manager.ts` | Medium | High |
| `TaskQueue` | swissknife_old | `src/tasks/scheduler/` (Replaced by Heap) | High | High |
| `TaskDistributor` | swissknife_old | `src/tasks/execution/executor.ts` / `src/tasks/coordination/` | High | High |
| `TaskMonitor` | swissknife_old | `src/tasks/monitoring/monitor.ts` | Medium | Medium |
| `WorkerThreads` | ipfs_accelerate_js | `src/tasks/workers/threads.ts` | Medium | High |
| `TaskPrioritization` | ipfs_accelerate_py | `src/tasks/scheduler/priority.ts` | High | Medium |
| `ResultAggregation` | ipfs_accelerate_py | `src/tasks/synthesis/engine.ts` | High | Low |

**Integration Notes**:
- The concept of a worker pool (`WorkerPool`, `WorkerManager`) is relevant but needs implementation using Node.js `worker_threads` (drawing inspiration from `ipfs_accelerate_js`'s `WorkerThreads`).
- The original `TaskQueue` is replaced by the more sophisticated `FibonacciHeap` scheduler (`src/tasks/scheduler/`).
- `TaskDistributor` logic is split: local execution is handled by the `TaskExecutor` interacting with the `WorkerPool`, while distributed logic moves to the Merkle Clock/Hamming distance components (`src/tasks/coordination/`).
- `TaskPrioritization` logic from Python needs reimplementation in TypeScript (`src/tasks/scheduler/priority.ts`).
- `ResultAggregation` logic from Python needs reimplementation in TypeScript as part of the `ResultSynthesisEngine` (`src/tasks/synthesis/engine.ts`).

### 2.6 Authentication Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `KeyManager` | ipfs_accelerate_js | `src/auth/key-manager.ts` | Medium | High |
| `IdentityManager` | ipfs_accelerate_js | `src/auth/identity-manager.ts` | Medium | High |
| `CredentialStore` | ipfs_accelerate_js | `src/auth/credential-store.ts` | High | High |
| `UCANProvider` | ipfs_accelerate_js | `src/auth/ucan/provider.ts` | Medium | Medium |
| `TokenExchange` | ipfs_accelerate_js | `src/auth/token-exchange.ts` | Medium | Medium |
| `AuthorizationChecker` | ipfs_accelerate_js | `src/auth/authorization.ts` | Medium | Medium |
| `CapabilityProvider` | ipfs_accelerate_js | `src/auth/capability-provider.ts` | Medium | Low |
| `AuthenticationCommands` | ipfs_accelerate_js | `src/cli/commands/auth/` | Medium | High |

**Integration Notes**:
- Core UCAN logic (`UCANProvider`, `AuthorizationChecker`) using libraries like `ucans` should be largely compatible.
- `KeyManager` needs adaptation for secure key generation and storage in a Node.js environment (OS keychain, encrypted files).
- `CredentialStore` requires complete reimplementation to replace browser storage (likely `IndexedDB`) with secure Node.js storage (keychain, encrypted files). This is critical.
- `IdentityManager` and `TokenExchange` logic needs review for CLI suitability; browser-based OAuth flows are not directly possible. CLI flows might involve device codes or manual token pasting.
- `AuthenticationCommands` need to be designed specifically for CLI interaction (e.g., `login`, `logout`, `keys manage`).

### 2.7 MCP Integration Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `MCPServer` | swissknife_old | `@modelcontextprotocol/sdk/server` | Low | High |
| `MCPClient` | swissknife_old | `@modelcontextprotocol/sdk/client` | Low | High |
| `MCPRegistry` | swissknife_old | (Integrated into SDK/Server) | Low | High |
| `MCPToolHandler` | swissknife_old | (Integrated into SDK/Server) | Low | High |
| `MCPTransport` | ipfs_accelerate_js | `@modelcontextprotocol/sdk/transport` | Medium | High |
| `HTTPTransport` | ipfs_accelerate_js | `@modelcontextprotocol/sdk/transport/http` | Medium | High |
| `WebSocketTransport` | ipfs_accelerate_js | `@modelcontextprotocol/sdk/transport/websocket` | Medium | Medium |
| `P2PTransport` | ipfs_accelerate_js | `@modelcontextprotocol/sdk/transport/libp2p` (If exists) | High | Low |

**Integration Notes**:
- Leverage the official `@modelcontextprotocol/sdk` for core server, client, and transport implementations where possible, rather than reimplementing from `swissknife_old` or `ipfs_accelerate_js` unless necessary for specific features not in the SDK.
- Ensure transport implementations (HTTP, WebSocket) use Node.js APIs (`http`, `ws` libraries) correctly.
- P2P transport using Libp2p requires integration with a Node.js Libp2p instance.
- Enhance CLI commands (`mcp server start/stop/list`, `mcp config`) for managing local MCP server processes defined in the settings file.

### 2.8 Vector Search Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `VectorIndex` | ipfs_accelerate_py | `src/vector/index/` | High | Medium |
| `VectorStorage` | ipfs_accelerate_py | `src/vector/storage.ts` | High | Medium |
| `SimilaritySearch` | ipfs_accelerate_py | `src/vector/search.ts` | High | Medium |
| `VectorOperations` | ipfs_accelerate_py | `src/vector/operations.ts` | High | Medium |
| `VectorCommands` | ipfs_accelerate_py | `src/cli/commands/vector/` | High | Medium |
| `VectorTools` | ipfs_accelerate_py | `src/agent/tools/vector/` | High | Medium |
| `EmbeddingManager` | ipfs_accelerate_py | `src/vector/embedding.ts` | High | Low |
| `DistanceMetrics` | ipfs_accelerate_py | `src/vector/metrics.ts` | Medium | Low |

**Integration Notes**:
- This entire subsystem requires reimplementation from Python to TypeScript.
- `VectorIndex` needs a Node.js-compatible library (e.g., `hnswlib-node`) or integration with an external vector database (e.g., Pinecone, Weaviate via API).
- `VectorStorage` needs to handle persistence of index data using the Storage System (local file or IPFS).
- `SimilaritySearch` implements querying logic against the chosen index.
- `VectorOperations` and `DistanceMetrics` need reimplementation using Node.js math/vector libraries.
- `EmbeddingManager` needs integration with the Model System to generate embeddings using appropriate models.
- `VectorCommands` and `VectorTools` provide CLI and Agent access, respectively.

### 2.9 Neural Network Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ModelLoader` | ipfs_accelerate_js | `src/ml/loader.ts` | High | High |
| `ModelInference` | ipfs_accelerate_js | `src/ml/inference.ts` | High | High |
| `ModelOptimization` | ipfs_accelerate_js | `src/ml/optimization.ts` | High | Medium |
| `HardwareDetection` | ipfs_accelerate_js | `src/ml/hardware.ts` | High | High |
| `TensorflowBinding` | ipfs_accelerate_py | `src/ml/tensorflow/` | High | Medium |
| `ONNXBinding` | ipfs_accelerate_py | `src/ml/onnx/` | High | Medium |
| `MLCommands` | ipfs_accelerate_py | `src/cli/commands/ml/` | High | Medium |
| `ModelConversion` | ipfs_accelerate_py | `src/ml/conversion.ts` | High | Low |

**Integration Notes**:
- This forms the basis of the `MLEngine` layer.
- Requires significant adaptation from browser-focused (`ipfs_accelerate_js`) and Python (`ipfs_accelerate_py`) implementations.
- Core task is integrating Node.js bindings for ML runtimes like `onnxruntime-node` and/or `tensorflow.js-node`.
- `ModelLoader` needs to load models from the filesystem (via Storage System).
- `HardwareDetection` needs reimplementation using Node.js methods (checking CPU features, using runtime APIs to detect GPU execution providers like CUDA/DirectML).
- `ModelInference` provides the core execution loop using the chosen runtime.
- `ModelOptimization` and `ModelConversion` are advanced features, likely lower priority, requiring Node.js-compatible tooling.
- `MLCommands` provide CLI access to loading, running, and potentially optimizing models.

### 2.10 Configuration Components

| Source Component | Source Repository | Target Component | Refactoring Level | Priority |
|------------------|-------------------|------------------|-------------------|----------|
| `ConfigManager` | swissknife_old | `src/config/manager.ts` | Low | High |
| `ConfigStorage` | swissknife_old | `src/config/storage.ts` | Medium | High |
| `ConfigValidation` | swissknife_old | `src/config/validation.ts` | Medium | High |
| `ConfigCommands` | swissknife_old | `src/cli/commands/config/` | Low | High |
| `DefaultConfig` | swissknife_old | `src/config/defaults.ts` | Low | High |
| `ConfigMigration` | ipfs_accelerate_js | `src/config/migration.ts` | Medium | Medium |
| `ConfigSchema` | ipfs_accelerate_js | `src/config/schema.ts` | Medium | Medium |
| `EnvVarIntegration` | ipfs_accelerate_js | `src/config/env.ts` | Medium | Medium |

**Integration Notes**:
- The core `ConfigManager` logic from `swissknife_old` is largely reusable.
- `ConfigStorage` needs adaptation to use Node.js `fs` for reading/writing user config files (e.g., `~/.config/swissknife/config.json`) instead of browser `localStorage`. Hierarchical loading (defaults, global, user, project) should be implemented.
- `ConfigValidation` can be enhanced using JSON Schema validation (`ajv`).
- `ConfigMigration` logic from `ipfs_accelerate_js` might be useful for handling changes between versions.
- `EnvVarIntegration` allows overriding config values with environment variables, a common CLI pattern.

## 3. Integration Architecture Diagram

The following diagram illustrates how the mapped components fit into the target SwissKnife CLI architecture:

```mermaid
graph TD
    subgraph SwissKnife CLI Application
        A[CLI Interface (Commands, Parser, Help)] --> B(Execution Context);

        subgraph Core Services accessible via Context
            C[Agent Service]
            D[Tool Service]
            E[Storage Service (VFS)]
            F[Task Service (Scheduler, Executor)]
            G[Model Service (Registry, Selector)]
            H[ML Service (Engine)]
            I[Auth Service]
            J[MCP Service (Client/Server Mgmt)]
            K[Vector Service]
            L[Config Service (Manager)]
            M[Logging Service]
        end

        B --> C; B --> D; B --> E; B --> F; B --> G;
        B --> H; B --> I; B --> J; B --> K; B --> L; B --> M;

        C --> D; C --> G; C --> F; # Agent uses Tools, Models, Tasks(GoT)
        E --> IPFSClient((IPFS Kit Client)); # Storage uses IPFS Client
        F --> E; F --> C; # Tasks use Storage, Agent(GoT)
        G --> H; G --> E; # Models use ML, Storage
        H --> E; # ML uses Storage (for models)
        I --> L; # Auth uses Config (for keys)
        J --> L; # MCP uses Config
        K --> G; K --> E; # Vector uses Models(Embed), Storage

    end

    style IPFSClient fill:#ddd, stroke:#333
```
*This diagram shows major service interactions. The `Execution Context` provides access from the `CLI Interface` to all core services.*

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

### 4.4 High-Level Dependency Graph

```mermaid
graph LR
    Config --> CmdSys(Command System);
    Config --> Storage;
    Config --> Models;
    Config --> Auth;
    Config --> Workers;
    Config --> MCP;

    Storage --> IPFSClient((IPFS Client));

    CmdSys --> Tools;
    CmdSys --> Agent;

    Agent --> Tools;
    Agent --> Models;
    Agent --> Tasks(Task System);

    Models --> ML(ML Engine);
    Models --> Storage; # For local models

    ML --> Storage;

    Tasks --> Agent; # For GoT nodes using Agent
    Tasks --> Storage;
    Tasks --> Workers;

    Vector --> Models; # For embeddings
    Vector --> Storage; # For index persistence

    Auth --> Storage; # For key storage

    MCP --> Tools; # MCP Servers provide tools

    subgraph Task System
        direction TB
        Scheduler --> Executor;
        Executor --> Workers;
        Executor --> Coordinator(Coordination);
        Decomposition --> Scheduler;
        Synthesis --> Decomposition;
        GoT --> Decomposition;
        GoT --> Synthesis;
    end

```
*Arrows indicate a dependency (A --> B means A depends on B). Core services depend heavily on Configuration.*

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
   async function processData(data: DataType): Promise<ResultType> { // Use specific types
       const result: ResultType = await expensiveOperation(data);
       // Add error handling if expensiveOperation can fail
       return result;
   }
   ```

2. **Storage Adaptation**: Converting browser storage to filesystem
   ```typescript
   // Original browser code
   localStorage.setItem('key', JSON.stringify(data));
   const data = JSON.parse(localStorage.getItem('key'));
   
   // Node.js adaptation (using user config directory)
   import fs from 'fs/promises';
   import path from 'path';
   // Assume getUserConfigDir() returns the appropriate OS-specific path
   const configDir = getUserConfigDir();
   
   const storePath = path.join(configDir, 'my-app-storage.json');
   try {
       // Ensure directory exists
       await fs.mkdir(configDir, { recursive: true });
       // Write data
       await fs.writeFile(storePath, JSON.stringify(data, null, 2)); // Use indentation
   } catch (error) {
       console.error("Failed to write config:", error);
       // Handle error appropriately
   }

   try {
       // Read data
       const fileContent = await fs.readFile(storePath, 'utf8');
       const loadedData = JSON.parse(fileContent);
   } catch (error) {
       console.error("Failed to read config:", error);
       // Handle error (e.g., file not found, invalid JSON)
       return null; // Or default value
   }
   ```

3. **UI Adaptation**: Converting DOM manipulation to terminal output
   ```typescript
   // Original browser code
   document.getElementById('result').textContent = `Found ${results.length} items`;
   
   // CLI adaptation (using OutputFormatter)
   // Within a command handler:
   // context: ExecutionContext (contains formatter)
   context.formatter.success(`Found ${results.length} items`);

   // Or for more complex output:
   if (results.length > 0) {
       context.formatter.table(results, ['ID', 'Name', 'Status']);
   } else {
       context.formatter.info("No items found.");
   }
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
