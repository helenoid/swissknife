# Phase 2: Cross-Domain Interfaces & Integration

**Timeline:** Week 6 of Phase 2 (Aligned with Roadmap)

This document focuses on verifying the initial integration points between the core domains implemented during Phase 2 (Agent, Storage, Models, ML, basic Task/CLI). It outlines how these services communicate via their defined interfaces, primarily orchestrated through the `ExecutionContext` and demonstrated via basic CLI commands and tools.

## Goals (Phase 2 Integration)

-   Validate that core services (Agent, Storage, Model Registry, ML Engine, Task Manager) can be accessed and interact via the `ExecutionContext`.
-   Implement and test specific cross-domain interactions:
    -   An AI Agent `Tool` that utilizes the `StorageOperations` service.
    -   A basic `Task` type that utilizes the `MLEngine` service for inference.
    -   A CLI command that orchestrates a simple workflow involving multiple services (e.g., `agent execute` using a specific model and potentially a storage tool).
-   Establish patterns for integration testing that verify these cross-domain interactions.

## Implementation Details (Phase 2 Integration Examples)

### 1. AI-Storage Integration via Tool (Week 6, Day 1-2)

-   **`StorageTool` (`src/agent/tools/definitions/storage-tool.ts`):**
    -   Implement a tool adhering to the `Tool` interface (defined in `api_specifications.md`).
    -   The `execute` method will receive the `ExecutionContext`.
    -   Inside `execute`, obtain the `StorageOperations` service: `const storage = context.getService<StorageOperations>('storage');`
    -   Perform storage actions (`readFile`, `writeFile`, `list`) based on validated tool parameters (`params`) by calling methods on the `storage` service instance (e.g., `await storage.writeFile(params.path, params.content)`).
    -   Return the result or throw a `ToolError`.
-   **Registration:** Register an instance of `StorageTool` with the `ToolRegistry` used by the `AgentService`.
-   **Testing:** Write integration tests where the `AgentService` (or `ToolExecutor`) is invoked with input designed to trigger the `StorageTool`, verifying that the `StorageOperations` service (potentially using a mock filesystem backend like `memfs`) is called correctly.

### 2. Task-ML Integration via Task Type (Week 6, Day 3)

-   **Define ML Task Type:** Define a specific task `type` string (e.g., `'ml:inference'`) and its expected `input` structure (e.g., `{ modelId: string; inputTensors: InputTensors }`).
-   **Task Execution Logic:** Within the `TaskExecutor` (or the code executed by the `WorkerPool` for this task type):
    -   Receive the `Task` object.
    -   Obtain the `MLEngine` service (potentially passed during worker initialization or via context).
    -   Call `mlEngine.runInference(task.input.modelId, task.input.inputTensors)`.
    -   Return the inference result to be stored by the `TaskManager`.
-   **Testing:** Write integration tests that:
    -   Use `TaskManager.createTask` to create an `'ml:inference'` task.
    -   Ensure the `TaskScheduler` and `TaskExecutor` pick it up.
    -   Verify that the `MLEngine.runInference` method (using a mock `MLEngine` or a simple test model) is called with the correct inputs.
    -   Verify the task status is updated correctly (`Succeeded` or `Failed`).

### 3. CLI Command Orchestration (Week 6, Day 4-5)

-   **`ExecutionContext` Integration:** Ensure the `createExecutionContext` factory correctly instantiates or provides access to the core services implemented in Phase 2 (`AgentService`, `StorageOperations`, `ModelRegistry`, `MLEngine`, `TaskManager`, `TaskScheduler`, `Logger`, `OutputFormatter`, `ConfigurationManager`).
-   **Example Command (`agent execute`):**
    -   The command's `action` handler receives the `ExecutionContext`.
    -   It retrieves the `AgentService`: `const agent = context.getService<AgentService>('agent');`
    -   It retrieves the prompt and options from `context.args`.
    -   It calls `agent.processMessage(prompt, { model: options.model /* etc */ })`.
    -   It uses `context.formatter.data()` or `context.formatter.info()` to display the result.
    -   Error handling relies on the central executor catching errors thrown by the service and using `formatter.error()`.
-   **Testing:** Write E2E tests for the implemented commands (`agent execute`, `storage list`, `config get`) verifying they produce the expected output by correctly interacting with the underlying (potentially mocked at integration level) services.

## Key Interface Contracts (Summary - Phase 2 Focus)

Integration relies on stable interfaces defined in Phase 1/2 documentation:

```typescript
// AI Domain (Agent/Tools)
export interface AgentService { processMessage(...): Promise<AgentResponse>; registerTool(...): void; }
export interface Tool<InputT, OutputT> { name: string; description: string; parameters: ToolParameter[]; execute(params: InputT, context: ExecutionContext): Promise<OutputT>; }
export interface ToolRegistry { register(...): void; getTool(...): Tool | undefined; }
export interface ToolExecutor { execute(...): Promise<any>; }

// Model Domain
export interface ModelInfo { /* ... id, name, provider, capabilities ... */ }
export interface ModelProvider { generateCompletion(...): Promise<CompletionResult>; /* ... */ }
export interface ModelRegistry { getModel(...): ModelInfo | undefined; getProvider(...): ModelProvider | undefined; }
export interface ModelSelector { selectModel(...): ModelInfo | undefined; }
export interface ModelExecutor { execute(...): Promise<any>; } // Uses ModelProvider

// ML Domain
export interface TensorData { /* ... data, shape, dtype ... */ }
export interface HardwareManager { getPreferredProvider(...): string; }
export interface MLEngine { loadModel(...): Promise<{ modelId: string }>; runInference(...): Promise<OutputTensors>; }

// Task Domain (Foundation)
export interface Task<InputT, ResultT> { /* ... id, type, input, status, dependencies ... */ }
export interface TaskResult<ResultT> { /* ... taskId, status, data, error ... */ }
export interface TaskManager { createTask(...): Promise<string>; completeTask(...): Promise<void>; failTask(...): Promise<void>; getTask(...): Promise<Task | null>; _requestNextTask(): Promise<Task | null>; /* ... */ }
export interface TaskScheduler { scheduleReadyTask(...): Promise<void>; getNextTaskToRun(): Promise<Task | null>; }
// Stubs for: GraphProcessor, TaskDelegator, WorkerPool, TaskExecutor

// Storage Domain (VFS)
export interface StorageBackend { readFile(...): Promise<Buffer>; writeFile(...): Promise<void>; /* ... */ }
export interface StorageRegistry { mount(...): void; getBackendForPath(...): { backend: StorageBackend; ... }; }
export interface PathResolver { resolvePath(...): { backend: StorageBackend; ... }; }
export interface StorageOperations { readFile(...): Promise<Buffer>; writeFile(...): Promise<void>; /* ... */ }
export interface IPFSKitClient { addContent(...): Promise<{ cid: string }>; getContent(...): Promise<Buffer>; }

// CLI Domain
export interface Command { /* ... name, description, options, handler ... */ }
export interface ExecutionContext { args: ParsedArgs; config: ConfigurationManager; getService<T>(...): T; logger: Logger; formatter: OutputFormatter; /* ... */ }
export interface OutputFormatter { info(...): void; error(...): void; data(...): void; /* ... */ }
// CLI Framework (e.g., commander instance) handles registration/parsing/execution flow.
```

## Deliverables (Phase 2 Integration)

-   Functional `StorageTool` registered and usable by the `AgentService`.
-   Basic task execution flow where a specific task type (`'ml:inference'`) can trigger `MLEngine.runInference`.
-   Functional basic CLI commands (`agent execute`, `storage list`, `config get`) demonstrating orchestration of Phase 2 services via `ExecutionContext`.
-   Integration tests verifying:
    -   `AgentService` successfully uses `StorageTool` which calls `StorageOperations`.
    -   `TaskManager` -> `TaskScheduler` -> `TaskExecutor` -> `MLEngine` flow for the ML task type (using mocks where appropriate).
    -   CLI commands correctly invoke their respective services and produce basic output/errors.
-   Documentation updates outlining how services are accessed (`ExecutionContext`) and basic cross-domain workflow patterns established.
