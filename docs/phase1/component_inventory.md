# Component Inventory for CLI Integration

This document catalogs all components from the source repositories (`swissknife_old`, `ipfs_accelerate_js`, and `ipfs_accelerate_py`) and assesses their compatibility with SwissKnife's CLI architecture.

## Compatibility Assessment Criteria

Each component is evaluated against the following criteria:

- **Compatible**: Can be integrated with minimal changes, already works in Node.js/CLI environment
- **Requires Adaptation**: Can be integrated but needs significant modifications for CLI compatibility
- **Incompatible**: Cannot be reasonably adapted for CLI use, typically due to browser dependencies

## Priority Levels

- **High**: Core functionality needed in the near term
- **Medium**: Important but not immediately critical
- **Low**: Nice-to-have features or experimental

## Complexity Assessment

- **High**: Significant technical challenges, dependencies, or architectural changes
- **Medium**: Moderate effort required, some challenges expected
- **Low**: Straightforward integration with minimal challenges

## swissknife_old Components

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| Models | Model definitions and basic LLM interaction logic. | Compatible | High | Low | Core functionality. Assumes models run externally (API) or via compatible Node.js libraries. No direct browser dependencies. |
| Master Control | Orchestration logic for CLI command execution flow. | Compatible | High | Medium | Conceptually maps to the new `CommandExecutor` and `ExecutionContext`. Requires refactoring to fit the new architecture, but logic is relevant. |
| Registry | Mechanisms for registering commands, models, or other entities. | Compatible | High | Medium | Needs adaptation to the new centralized `CommandRegistry` and potentially `ModelRegistry`. Core concepts are reusable. |
| Worker | Basic task assignment and execution logic (likely single-threaded). | Requires Adaptation | High | Medium | Concept needs significant enhancement for TaskNet. Can serve as inspiration for Node.js `worker_threads` implementation or distributed task logic, but not directly usable. |
| Configuration | Loading and parsing TOML configuration files. | Compatible | Medium | Low | Easily adaptable. Current system uses JSON via `ConfigurationManager`. Can add TOML support or migrate existing TOML settings if needed. |

## ipfs_accelerate_js Components

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| Core API | Wrapper around IPFS core APIs (e.g., `add`, `get`, `ls`). | Compatible | High | Medium | Node.js compatible parts are directly relevant for the `IPFSKitClient`. Requires careful extraction to avoid browser-specific code paths if any exist. |
| Server Storage | Utilities for interacting with server-side filesystem. | Compatible | High | Medium | Useful for tools (`FileTool`) and commands (`ipfs add`, `ipfs get`) interacting with the local filesystem. Relies on Node.js `fs` module. |
| P2P Networking | Libp2p setup and communication logic for Node.js. | Compatible | Medium | High | Relevant for Phase 3 (Merkle Clock/Distribution). Integration requires careful handling of peer discovery, PubSub, and potential direct connections within the CLI context. |
| Worker Threads | Implementation using Node.js `worker_threads`. | Compatible | High | Medium | Directly applicable for implementing the local worker pool in the Task Distribution System (Phase 1/3). |
| IPFS Optimization | Techniques for optimizing IPFS operations in Node.js (e.g., batching, caching). | Compatible | Medium | Medium | Concepts can be applied within the `IPFSKitClient` or caching layers (Phase 5). |
| CLI Utilities | Helper functions for command-line argument parsing, output formatting. | Compatible | High | Low | Can be directly reused or adapted for the new Command System (`CommandParser`, `OutputFormatter`). |
| Neural Network Acceleration | WASM/GPU acceleration bindings (e.g., ONNX Runtime Web). | Requires Adaptation | High | Medium | Core logic needs adaptation. Focus shifts from browser WebGPU/WebNN to Node.js bindings (e.g., `onnxruntime-node`, potential custom native modules, or WASM execution in Node). |
| ML Model Execution | Running inference using loaded models. | Requires Adaptation | High | Medium | Needs integration with the adapted acceleration layer and the `MLEngine` architecture. Focus on server-side/CLI inference flow. |
| Hardware Detection | Detecting GPU/CPU capabilities for ML. | Requires Adaptation | Medium | Medium | Browser APIs (`navigator.gpu`) are irrelevant. Need Node.js equivalents or libraries (e.g., `systeminformation`) to detect CPU features, potentially GPU via native bindings if used. |
| Tensor Operations | Libraries for matrix/tensor math (e.g., `ndarray`). | Compatible | High | Low | Core math is environment-agnostic. Ensure chosen library works well in Node.js. Crucial for `MLEngine`. |
| Browser Storage | Using IndexedDB, LocalStorage. | Incompatible | Low | N/A | Relies entirely on browser APIs. Not applicable. Configuration/caching will use local files or dedicated stores. |

## ipfs_accelerate_py Components (for Node.js adaptation)

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| Worker Inference | Python code for running ML inference within task workers. | Requires Adaptation | High | High | Logic needs complete porting to TypeScript/JavaScript to run within Node.js workers, using the adapted `MLEngine`. Significant effort. |
| Task Queue | Python implementation (e.g., Celery, RQ). | Requires Adaptation | High | Medium | Conceptually relevant for TaskNet, but implementation needs rewriting using Node.js-friendly queue (e.g., BullMQ, RabbitMQ if external) or the custom Fibonacci Heap scheduler. |
| IPFS Client | Python client library for IPFS interaction. | Requires Adaptation | Medium | Medium | Functionality is needed, but must use Node.js IPFS libraries (`ipfs-http-client` or the custom `IPFSKitClient`). Python code serves only as a reference. |
| Model Loading | Python utilities for loading ML models (e.g., from Hugging Face). | Requires Adaptation | High | Medium | Needs reimplementation in TypeScript using Node.js-compatible libraries (e.g., ONNX Runtime Node, TensorFlow.js Node) or custom loaders integrated with `MLEngine`. |
| Vector Operations | Python libraries (e.g., NumPy, SciPy) for vector math. | Requires Adaptation | Medium | Medium | Needs reimplementation using suitable Node.js libraries (e.g., `ndarray`, `mathjs`, or specialized vector libraries) for the Vector Search component. |

## Core SwissKnife CLI Components to Enhance

| Component | Current Implementation | Enhancement Source | Priority | Complexity | Notes |
|-----------|------------------------|-------------------|----------|------------|-------|
| Command System | `src/cli/` (parser, registry, executor) | Master Control (swissknife_old), CLI Utilities (ipfs_accelerate_js) | High | Medium | Enhance registry, parser validation, add subcommands, integrate help generation based on patterns from sources. |
| Model Selection | `src/models/registry.ts` | Models (swissknife_old), Model Loading (ipfs_accelerate_py) | High | Medium | Integrate model definitions. Enhance registry with loading/validation logic adapted from Python source. |
| Configuration | `src/config/manager.ts` (JSON) | Configuration (swissknife_old - TOML) | Medium | Low | Add optional TOML support or migration path. Enhance schema validation and hierarchical loading inspired by source. |
| Tools | `src/agent/tools/` (registry, executor) | Worker (swissknife_old), CLI Utilities (ipfs_accelerate_js) | High | Medium | Extend `Tool` interface and `ToolExecutor`. Implement core tools (file, shell) inspired by sources. Integrate worker concepts for async tools. |
| Cost Tracking | `src/cost-tracker.ts` (Basic) | TaskNet concepts (Goose/ipfs_accelerate) | Medium | Medium | Enhance to track costs across distributed tasks if TaskNet distribution is implemented. Requires integration with task lifecycle events. |
| Context Management | `src/cli/context.ts` (`ExecutionContext`) | Registry (swissknife_old) | Medium | Medium | Ensure `ExecutionContext` provides robust access to registered services (Agent, IPFS, TaskMgr) similar to how the old registry provided access. |

## Virtual Filesystem Components (to be implemented)

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| Filesystem Abstraction | Core VFS interface defining common operations (read, write, ls, etc.). | Compatible | High | High | Design a clean TypeScript interface. Implementation uses Node.js `fs` for local backend. Complex due to abstraction layer. |
| Storage Backends | Pluggable implementations for different storage (local, IPFS, potentially S3 etc.). | Compatible | Medium | High | Focus on local (`fs`) and IPFS (`IPFSKitClient`) backends initially. Requires careful interface design for backend registration. |
| IPFS Integration | VFS backend using `IPFSKitClient` to interact with IPFS. | Compatible | Medium | Medium | Maps VFS operations to IPFS operations (e.g., `ls` -> `ipfs ls`, `read` -> `ipfs get`). Needs handling of immutable nature of IPFS. |
| Filecoin API | Integration with Filecoin network for archival storage/retrieval (e.g., via Estuary). | Compatible | Low | High | Requires interacting with Filecoin APIs/clients (likely external HTTP APIs). Complex API interactions and deal management. CLI compatible. |
| Cache System | Caching layer for VFS operations (e.g., caching IPFS reads). | Compatible | Medium | Medium | Implement caching strategies (in-memory, disk) specifically for VFS reads/listings to improve performance, especially for remote backends like IPFS. |
| CLI Commands | Commands like `vfs ls`, `vfs cp`, `vfs read`, `vfs write` using the VFS. | Compatible | High | Low | Straightforward implementation using the VFS abstraction layer via `ExecutionContext`. |

## Task Distribution System Components (to be implemented)

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| Task Queue | Central queue holding tasks ready for execution. | Compatible | High | Medium | To be implemented using the Fibonacci Heap Scheduler (`src/tasks/scheduler/`). |
| Worker Pool | Manages a pool of Node.js `worker_threads` for local parallel execution. | Compatible | High | Medium | Implement using `worker_threads` API. Needs communication channel setup and task distribution logic within the pool. |
| Priority System | Logic for calculating and updating task priorities. | Compatible | Medium | Medium | Implement dynamic priority calculation (`src/tasks/scheduler/priority.ts`) considering factors like dependencies, wait time, etc. |
| Task Monitoring | Service/API to query task status, progress, and results. | Compatible | Medium | Medium | Implement a `TaskManager` or similar service storing task state (in memory or persistent store) accessible via CLI commands (`task status`, `task list`). |
| Failure Recovery | Mechanisms for handling task failures (e.g., retries, dead-letter queues). | Compatible | Medium | Medium | Implement retry logic within the `TaskExecutor`. Define failure states and potential recovery strategies. |
| Result Caching | Caching results of completed tasks to avoid re-computation. | Compatible | Low | Medium | Implement caching keyed by task definition hash or input CIDs. Needs integration with `TaskExecutor` and result storage. (Phase 5 focus). |

## Vector Search Components (to be implemented)

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| Vector Index | Data structure (e.g., HNSW, IVF) for efficient similarity search. | Compatible | Medium | High | Requires Node.js-compatible vector index library (e.g., `hnswlib-node`, `faiss-node` if available) or integration with external vector DB via API. Complex data structures. |
| Search API | Interface for performing vector searches (k-NN, range search). | Compatible | Medium | Medium | Design TypeScript API within a `VectorService`. Needs methods for querying the index. |
| Index Management | Creating, updating, saving, and loading the vector index. | Compatible | Medium | Medium | Implement methods for index lifecycle management. Requires handling persistence (saving index to disk/IPFS). |
| Similarity Metrics | Functions for calculating vector distances (cosine, euclidean). | Compatible | Medium | Low | Implement standard distance functions using Node.js math libraries or vector library primitives. |
| CLI Integration | Commands like `vector index create`, `vector add`, `vector search`. | Compatible | High | Low | Implement CLI commands using the `VectorService` API. |

## Authentication Components (to be implemented)

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| UCAN Core | UCAN (User Controlled Authorization Network) token parsing, validation, delegation. | Compatible | Medium | High | Requires Node.js UCAN library (e.g., `ucans`, `ucan-storage`). Complex specification. Server-side validation logic. |
| Key Management | Generating, storing, and managing user cryptographic keys (e.g., Ed25519). | Compatible | Medium | Medium | Implement secure key storage (e.g., using OS keychain via `keytar`, or encrypted files). Needs CLI commands for key generation/import/export. |
| Authorization | Verifying capabilities/permissions based on UCAN proofs. | Compatible | Medium | Medium | Implement logic within services or middleware to check UCANs before performing actions. Requires integration with UCAN Core. |
| CLI Auth Flow | User workflow for authentication (e.g., device linking, key import). | Compatible | High | Medium | Design terminal-friendly flows. May involve displaying QR codes or links for browser interaction if external IdP is used, but core logic is CLI-driven. |
| Token Store | Secure storage for UCAN tokens or other auth credentials. | Compatible | Medium | Low | Implement using secure file storage or OS keychain, accessible via `ConfigurationManager` or dedicated service. |

## MCP Integration Components (to be implemented)

| Component | Description | CLI Compatibility | Priority | Complexity | Notes |
|-----------|-------------|-------------------|----------|------------|-------|
| MCP Server | Implementation of the Model Context Protocol server logic. | Compatible | High | Medium | Enhance existing `@modelcontextprotocol/sdk` server implementation if needed, or use it as is. Runs as a separate process managed by the CLI host. |
| HTTP Transport | Standard MCP transport over HTTP. | Compatible | High | Low | Default, well-suited for request/response interactions typical in CLI. Provided by SDK. |
| WebSocket Transport | MCP transport over WebSockets for persistent connections. | Compatible | Medium | Medium | Useful for streaming responses or long-running tasks initiated via CLI. Requires WebSocket client/server setup. |
| libp2p Transport | Experimental MCP transport over Libp2p streams. | Compatible | Low | High | Enables direct P2P communication between CLI instances or other MCP peers. Complex setup involving peer discovery and stream negotiation. |
| CLI Commands | Commands to manage local MCP servers (start, stop, list, configure). | Compatible | High | Low | Implement commands to interact with the MCP server lifecycle and configuration (`~/.config/.../cline_mcp_settings.json`). |

## Excluded Browser-Specific Components

The following components are modified or excluded based on CLI requirements:

1. **Modified**: GPU and neural network acceleration specifically adapted for CLI-based AI model execution
2. **Modified**: Hardware detection optimized for maximum neural network inference performance in CLI
3. **Excluded**: Browser-specific UI components that aren't applicable to CLI environments
4. **Modified**: Storage APIs focused on efficient neural network model handling in Node.js
5. **Excluded**: WebRTC communication in favor of CLI-appropriate communication protocols
6. **Excluded**: Browser rendering engines in favor of terminal-based output
7. **Modified**: Resource management specifically optimized for ML model execution in Node.js
8. **Excluded**: Cross-browser compatibility code in favor of CLI environment optimizations

The focus is on creating a highly optimized CLI tool that can run neural networks directly, providing powerful AI inference capabilities through a command-line interface rather than a browser environment.

## Integration Priority Summary

### Phase 1 (Highest Priority)
- Model Implementations
- Command System Enhancements
- Core Task Distribution
- Worker Implementation
- CLI Configuration

### Phase 2 (Medium Priority)
- Virtual Filesystem (Core)
- Authentication (Basic)
- IPFS Integration (Server-side)
- Task Monitoring
- Vector Search (Core)

### Phase 3 (Lower Priority)
- Advanced Authentication
- Filecoin Integration
- Advanced P2P Networking
- Full Vector Search
- Cache System Optimization

## Next Steps

1. Begin detailed analysis of high-priority CLI-compatible components
2. Create component-specific analysis documents
3. Develop CLI-focused architecture for integration
4. Begin technical specification for CLI commands and interfaces
