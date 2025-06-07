# Phase 2: Task System Implementation (Foundation)

**Timeline:** Week 7-9 (Aligned with Roadmap - Phase 3 Focus)
*(Note: While the roadmap places TaskNet enhancements in Phase 3, this document outlines the foundational components likely started or designed alongside Phase 2 core services, setting the stage for Phase 3.)*

This document outlines the implementation plan for the foundational components of the enhanced Task System (TaskNet) domain. Phase 2 focuses on establishing the core structures for task definition, basic management, and scheduling, preparing for the advanced GoT, decomposition, and distribution features in Phase 3.

## Goals (Phase 2 Foundation)

-   Define the core `Task` interface and `TaskResult` structure.
-   Implement an efficient priority queue mechanism, likely starting with a simpler queue before the full `FibonacciHeap` (which is complex and part of Phase 3 optimization/scaling).
-   Develop a basic `TaskManager` service for creating tasks, tracking status (in-memory initially), and managing simple dependencies.
-   Define interfaces for `GraphProcessor` and `TaskDelegator` but implement only basic stubs or simple versions in Phase 2, deferring full implementation to Phase 3.
-   Establish integration points with other core services (Agent, Storage).

## Implementation Details (Phase 2 Focus)

### 1. Task Definition & Basic Management (`src/tasks/types.ts`, `src/tasks/manager.ts`) (Week 7)

-   **`Task` Interface (`src/tasks/types.ts`):** Define the core structure including `id`, `type`, `input`, `status`, `dependencies`, `priority`, timestamps. Keep `status` simple initially (`Pending`, `Ready`, `Running`, `Succeeded`, `Failed`).
-   **`TaskResult` Interface (`src/tasks/types.ts`):** Define the structure for task outcomes, including `taskId`, `status`, `data` (on success), `error` (on failure), timing info.
-   **`TaskManager` Service (`src/tasks/manager.ts`):**
    -   Manages an in-memory store (`Map<string, Task>`) of tasks.
    -   `createTask(type: string, input: any, options?: TaskCreationOptions)`: Generates a unique ID, creates the `Task` object, stores it, and adds it to the basic scheduler/queue. Returns the `taskId`.
    -   `updateTaskStatus(taskId: string, status: TaskStatus, result?: any, error?: Error)`: Updates the task's status in the store. If status is `Succeeded` or `Failed`, store result/error. Trigger dependency checks.
    -   `getTask(taskId: string)`: Retrieves task info.
    -   `getTaskStatus(taskId: string)`: Retrieves current task status.
    -   `_checkDependencies(taskId: string)`: Internal helper called after a task completes to check if dependent tasks are now ready. If ready, update their status and notify the scheduler.
    -   **Dependency Tracking:** Store dependencies (`string[]`) on the task object. Maintain a reverse map (`Map<string, string[]>`, i.e., `dependencyId -> dependentTaskIds`) for efficient checking upon completion.

### 2. Basic Task Scheduling (`src/tasks/scheduler.ts`) (Week 7)

-   **`TaskScheduler` Service:**
    -   **Phase 2:** Implement using a *simple* in-memory priority queue (e.g., an array sorted by priority, or a basic heap library if readily available, *not* the full Fibonacci Heap yet).
    -   `scheduleReadyTask(task: Task)`: Adds a task (marked as `Ready` by the `TaskManager`) to the queue.
    -   `getNextTaskToRun(): Promise<Task | null>`: Retrieves and removes the highest priority task from the queue. Returns `null` if the queue is empty.
    -   Integrates with `TaskManager` (e.g., `TaskManager` calls `scheduleReadyTask` when dependencies are met).
-   **Fibonacci Heap (Phase 3):** The full implementation (`src/tasks/scheduler/fibonacci-heap.ts`) and integration into `TaskScheduler` (replacing the simple queue) is deferred to Phase 3 for advanced performance and `decreaseKey` support.

### 3. GoT / Decomposition / Synthesis Stubs (Week 8)

-   **Interfaces:** Define the interfaces for `GraphProcessor`, `DecompositionEngine`, `SynthesisEngine` as planned for Phase 3.
-   **Basic Stubs:** Implement placeholder classes/functions for these services in Phase 2.
    -   `GraphProcessor.decomposeTask`: Might return an empty array or a single subtask representing the original task.
    -   `DecompositionEngine.decompose`: Placeholder implementation.
    -   `SynthesisEngine.synthesize`: Placeholder implementation.
-   **Integration:** The `TaskManager` can have optional dependencies on these stubbed services, allowing the core task lifecycle to function without the full Phase 3 implementation. Full integration happens in Phase 3.

### 4. Task Execution & Delegation Stubs (Week 8-9)

-   **`TaskExecutor` Service (`src/tasks/execution/executor.ts`):**
    -   Responsible for taking a `Task` from the `TaskScheduler` and actually running it.
    -   **Phase 2:** Implement basic local execution logic. It might directly execute registered task functions based on `task.type` or use a simple `WorkerPool` (see below).
    -   Defer complex delegation logic (checking if distribution is needed, interacting with Merkle Clocks) to Phase 3.
-   **`WorkerPool` Interface/Stub (`src/tasks/workers/pool.ts`):**
    -   Define the interface for submitting tasks to local workers (`submitTask`).
    -   **Phase 2:** Implement a very basic version, perhaps even one that runs tasks sequentially in the main process initially, or uses a single worker thread, to satisfy the `TaskExecutor` dependency. Full `worker_threads` pool implementation is a Phase 3 goal.
-   **`TaskDelegator` / Coordination Stubs (`src/tasks/coordination/`):**
    -   Define interfaces.
    -   Implement stubs that always decide *not* to delegate, forcing local execution via `TaskExecutor`. Full implementation in Phase 3.

## Key Interfaces (Phase 2 Focus)

```typescript
// src/tasks/types.ts

/** Possible states of a task during its lifecycle. */
export type TaskStatus = 'Pending' | 'Ready' | 'Running' | 'Succeeded' | 'Failed' | 'Cancelled';

/** Represents a unit of work with input, output, and metadata. */
export interface Task<InputT = any, ResultT = any> {
  /** Unique identifier for this task instance. */
  readonly id: string;
  /** Type identifier mapping to executable logic. */
  readonly type: string;
  /** Input data required for the task. */
  readonly input: InputT;
  /** Current status of the task. */
  status: TaskStatus;
  /** Optional: Priority for scheduling (lower value = higher priority). */
  readonly priority: number; // Default to a standard value if not provided
  /** Optional: IDs of tasks that must complete successfully before this task can start. */
  readonly dependencies: readonly string[];
  /** Optional: Result data if status is 'Succeeded'. */
  result?: ResultT;
  /** Optional: Error details if status is 'Failed'. */
  error?: { message: string; stack?: string; code?: string };
  /** Timestamp (ms since epoch) when the task was created. */
  readonly createdAt: number;
  /** Optional: Timestamp when the task started running. */
  startedAt?: number;
  /** Optional: Timestamp when the task finished (succeeded or failed). */
  completedAt?: number;
  /** Optional: ID of the worker that executed/is executing the task. */
  assignedWorkerId?: string;
  /** Optional: Metadata for custom use cases. */
  readonly metadata?: Readonly<Record<string, any>>;
}

/** Options provided when creating a new task. */
export interface TaskCreationOptions {
  priority?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
  // Add other options like timeout, specific worker requirements later
}

/** Structure for task results. */
export interface TaskResult<ResultT = any> {
  readonly taskId: string;
  readonly status: 'Succeeded' | 'Failed' | 'Cancelled'; // Final statuses
  readonly data?: ResultT;
  readonly error?: { message: string; stack?: string; code?: string };
  readonly executionTimeMs: number;
  readonly timestamp: number;
}

// src/tasks/scheduler.ts

/** Basic interface for a task scheduler. */
export interface TaskScheduler {
  /** Adds a task that is ready to run to the queue. */
  scheduleReadyTask(task: Task): Promise<void>;
  /** Retrieves the next highest priority task to run. */
  getNextTaskToRun(): Promise<Task | null>;
  /** Gets the number of tasks currently waiting in the scheduler. */
  getQueueSize(): Promise<number>;
}

// src/tasks/manager.ts

/** Service for managing the lifecycle and dependencies of tasks. */
export interface TaskManager {
  /** Creates a new task, stores it, and schedules it if ready. */
  createTask<InputT>(
    type: string,
    input: InputT,
    options?: TaskCreationOptions
  ): Promise<string>; // Returns taskId

  /** Updates a task's status to Succeeded. */
  completeTask<ResultT>(taskId: string, resultData: ResultT): Promise<void>;

  /** Updates a task's status to Failed. */
  failTask(taskId: string, error: Error): Promise<void>;

  /** Attempts to cancel a pending or running task. */
  cancelTask(taskId: string): Promise<boolean>; // Returns true if cancellation initiated

  /** Retrieves task details by ID. */
  getTask(taskId: string): Promise<Task | null>;

  /** Retrieves the current status of a task. */
  getTaskStatus(taskId: string): Promise<TaskStatus | null>;

  /** Lists tasks, potentially with filtering/pagination. */
  listTasks(options?: { status?: TaskStatus; limit?: number; offset?: number }): Promise<Task[]>;

  // --- Methods primarily used internally or by other services ---

  /** Called by TaskExecutor to get the next task to run. */
  _requestNextTask(): Promise<Task | null>; // Internal convention

  /** Checks dependencies and schedules tasks that become ready. */
  _processDependentTasks(completedTaskId: string): Promise<void>; // Internal convention
}

// --- Stubs for Phase 3 Components ---

// src/tasks/graph/processor.ts (Phase 3 - Stub for Phase 2)
export interface GraphProcessor {
  decomposeTask?(task: Task): Promise<TaskCreationOptions[]>; // Returns options for subtasks
}

// src/tasks/delegation/delegator.ts (Phase 3 - Stub for Phase 2)
export interface WorkerInfo { id: string; status: string; capabilities: string[]; load: number; }
export interface TaskDelegator {
  findWorkerForTask?(task: Task): Promise<WorkerInfo | null>; // Phase 2: Always return null (local execution)
}

// src/tasks/execution/executor.ts (Phase 2/3)
export interface TaskExecutor {
   /** Starts the main loop to fetch and execute tasks. */
   start(): Promise<void>;
   /** Stops the execution loop. */
   stop(): Promise<void>;
}

```

## Deliverables (Phase 2 Foundation)

-   Defined `Task` and `TaskResult` interfaces.
-   Basic in-memory `TaskManager` implementation capable of:
    -   Creating tasks.
    -   Tracking status (Pending, Ready, Running, Succeeded, Failed).
    -   Managing simple dependencies (updating dependents to `Ready` on completion).
-   Basic `TaskScheduler` implementation using a simple in-memory queue (not full Fibonacci Heap).
-   Stub implementations for `GraphProcessor`, `TaskDelegator`, and `WorkerPool` interfaces.
-   Basic `TaskExecutor` that interacts with `TaskManager` and `TaskScheduler` to run tasks sequentially in the main process (or via a minimal worker pool stub).
-   Unit tests for `TaskManager` (dependency logic, status updates) and the basic `TaskScheduler`.
-   Initial integration tests for the create -> schedule -> execute (local) -> complete/fail lifecycle.
