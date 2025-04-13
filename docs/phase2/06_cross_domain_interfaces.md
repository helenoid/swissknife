# Phase 2: Cross-Domain Interfaces & Integration

**Timeline:** Week 4 of Phase 2 (Days 5-7)

This document focuses on the critical aspect of integrating the different domains implemented during Phase 2. It outlines how components from various domains (AI, ML, Task, Storage, CLI) will communicate and work together through well-defined interfaces and basic workflows.

## Goals

-   Implement and test the communication pathways between different domains using the interfaces defined in Phase 1 and refined during Phase 2 implementation.
-   Develop concrete examples of cross-domain functionality, such as AI tools interacting with the storage system or the task system utilizing ML capabilities.
-   Ensure the CLI system can orchestrate basic workflows involving multiple domains.
-   Establish integration testing practices to verify cross-domain interactions.

## Implementation Details

### 1. AI-Storage Integration (Day 5)

-   **`StorageTool` (`src/ai/tools/implementations/storage-tool.ts`):**
    -   An AI tool that implements the `Tool` interface.
    -   Takes an instance of a `StorageProvider` (e.g., `FileStorage` or `IPFSStorage`) during creation.
    -   Allows the AI Agent to perform storage actions (`store`, `retrieve`, `list`) by calling the `StorageProvider` methods based on tool arguments.
    -   Demonstrates how the AI domain can leverage the Storage domain's capabilities.

### 2. ML-Task Integration (Day 6)

-   **`MLTaskExecutor` (`src/ml/task-integration/ml-task-executor.ts`):**
    -   A component designed to execute ML-specific tasks received from the `TaskManager`.
    -   Interacts with the `InferenceEngine` to load models and run inference based on task data.
    -   Takes a `Task` object, extracts ML-specific parameters (model info, input tensor data), performs inference, and returns the result (output tensor data).
    -   Shows how the Task system can delegate ML computations to the ML domain.

### 3. Basic Workflow & Command System Integration (Day 7)

-   **Cross-Component Workflows:**
    -   Implement simple end-to-end scenarios, e.g., an AI agent decomposing a task description (`TaskManager` + `GraphProcessor`), storing the result (`StorageProvider`), and reporting back via the CLI.
-   **CLI Integration (`src/cli/commands/*`):**
    -   Commands like `ai run` or `task create` will instantiate and utilize components from multiple domains (e.g., `Agent`, `StorageProvider`, `TaskManager`).
    -   The `AppContext` passed to command handlers provides access to shared domain managers/providers.

## Key Interface Contracts (Summary)

Effective integration relies on adhering to the defined interfaces for each domain's primary components:

```typescript
// AI Domain
export interface Agent { /* ... processMessage, registerTool ... */ }
export interface Tool { /* ... name, description, parameters, execute ... */ }
export interface Model { /* ... getId, getName, getProvider ... */ }
export interface ModelRegistry { /* ... registerModel, getModel ... */ }

// ML Domain
export interface Tensor { /* ... getData, getShape, add, multiply ... */ }
export interface HardwareAccelerator { /* ... execute, isAvailable ... */ }
export interface InferenceEngine { /* ... loadModel, runInference ... */ }

// Task Domain
export interface Task { /* ... id, description, status, priority ... */ }
export interface TaskManager { /* ... createTask, getNextTask, completeTask, decomposeTask ... */ }
export interface TaskScheduler { /* ... addTask, getNextTask ... */ }

// Storage Domain
export interface StorageProvider { /* ... add, get, list, delete ... */ }
export interface MCPClient { /* ... addContent, getContent, pinContent ... */ }

// CLI Domain
export interface Command { /* ... id, name, handler, options, subcommands ... */ }
export interface CommandRegistry { /* ... registerCommand, execute ... */ }
export interface AppContext { /* ... access to managers/providers ... */ }
```

## Deliverables

-   Functional `StorageTool` integrated with the `Agent`.
-   Basic `MLTaskExecutor` capable of running inference for a task.
-   At least one CLI command demonstrating a workflow involving 2+ domains (e.g., AI + Storage).
-   Integration tests covering the implemented cross-domain interactions (e.g., Agent using StorageTool, TaskManager triggering MLTaskExecutor).
-   Documentation updates reflecting the established integration patterns.
