# Phase 2: Task System Implementation

**Timeline:** Week 3 of Phase 2

This document covers the implementation plan for the Task System domain during Phase 2. The focus is on building the core components for task scheduling, management, decomposition using Graph-of-Thought, and delegation.

## Goals

-   Implement an efficient `FibonacciHeap` and use it within a `TaskScheduler`.
-   Develop a `TaskManager` to handle task creation, status updates, and dependency management.
-   Integrate the `GraphProcessor` for task decomposition based on Graph-of-Thought principles.
-   Create a `TaskDelegator` system for assigning tasks to available workers.

## Implementation Details

### 1. Fibonacci Heap Scheduler (Day 1-2)

-   **`FibonacciHeap` Class (`src/tasks/scheduler/fibonacci-heap.ts`):**
    -   Implements the Fibonacci heap data structure for efficient priority queue operations.
    -   Supports `insert`, `extractMin`, `decreaseKey` (if needed later), `isEmpty`, `size`.
    -   Manages `FibHeapNode` objects containing key (priority) and value (task ID).
    -   Includes internal logic for `consolidate`, linking/cutting nodes, etc.
-   **`TaskScheduler` Class (`src/tasks/scheduler/scheduler.ts`):**
    -   Uses `FibonacciHeap` to manage schedulable tasks based on priority.
    -   `addTask`: Adds a task to internal storage and potentially to the heap if dependencies are met (`canSchedule`).
    -   `getNextTask`: Extracts the highest priority task (lowest key) from the heap.
    -   `updateTaskPriority`: (Requires node tracking) Updates a task's priority in the heap.
    -   `canSchedule`: Checks if a task's dependencies are completed.

### 2. Task Manager (Day 3-4)

-   **`TaskManager` Class (`src/tasks/manager.ts`):**
    -   Central class for managing the lifecycle of tasks.
    -   `createTask`: Creates a new `Task` object, stores it, and adds it to the scheduler. Uses `TaskCreationOptions`.
    -   `getNextTask`: Retrieves the next task from the scheduler.
    -   `completeTask`: Updates task status to 'completed', stores the result, and processes dependent tasks.
    -   `failTask`: Updates task status to 'failed' and stores the error.
    -   `decomposeTask`: Uses `GraphProcessor` to break down a task into subtasks and updates dependencies.
    -   `processDependentTasks`: Checks and potentially schedules tasks whose dependencies have just been met.
    -   `getTask`, `getAllTasks`: Provide access to task data.

### 3. Graph of Thought Implementation (Day 5-6)

-   **`GraphProcessor` Class (`src/tasks/graph/processor.ts`):**
    -   Integrates with the `ThoughtGraph` structure from the AI domain.
    -   `createGraph`: Initializes a `ThoughtGraph` for a given task or concept.
    -   `processGraph`: Orchestrates the processing of the graph (potentially involving AI model calls).
    -   `decomposeTask`: Analyzes a `Task` object, potentially using an AI model via the `ThoughtGraph`, to generate `SubtaskData` (description, data).

### 4. Task Delegation System (Day 7)

-   **`TaskDelegator` Class (`src/tasks/delegation/delegator.ts`):**
    -   Manages a pool of `Worker` objects (defined with `id`, `capabilities`, `load`, `status`).
    -   `registerWorker`, `updateWorkerStatus`: Manage worker lifecycle.
    -   `findWorkerForTask`: Selects a suitable worker based on task requirements, worker capabilities, status, and load.
    -   `assignTask`: Assigns a task to a worker, updates worker load, and records the `TaskAssignment`.
    -   `getAssignment`, `releaseAssignment`: Manage task assignments and worker load.
    -   `hasRequiredCapabilities`: Helper to match task needs with worker capabilities.

## Key Interfaces

```typescript
// src/types/task.ts
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'scheduled';

export interface Task {
  id: string;
  description: string;
  priority: number;
  status: TaskStatus;
  dependencies: string[];
  data: any; // Input data for the task
  result?: any; // Output data upon completion
  error?: string; // Error message if failed
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  // Potentially add assignedWorkerId, progress, etc.
}

export interface TaskCreationOptions {
  priority?: number;
  dependencies?: string[];
  data?: any;
}

// src/tasks/scheduler/fibonacci-heap.ts
export declare class FibonacciHeap<T> {
  insert(key: number, value: T): any; // Returns node representation
  extractMin(): T | null;
  // ... other methods
}

// src/tasks/scheduler/scheduler.ts
export declare class TaskScheduler {
  addTask(task: Task): void;
  getNextTask(): Promise<Task | null>;
  // ... other methods
}

// src/tasks/manager.ts
export declare class TaskManager {
  createTask(description: string, options?: TaskCreationOptions): Promise<string>;
  getNextTask(): Promise<Task | null>;
  completeTask(taskId: string, result: any): Promise<boolean>;
  failTask(taskId: string, error: string): Promise<boolean>;
  decomposeTask(taskId: string): Promise<string[]>; // Returns subtask IDs
  getTask(taskId: string): Task | undefined;
  // ... other methods
}

// src/tasks/graph/processor.ts
export interface SubtaskData {
  description: string;
  data: any;
}
export declare class GraphProcessor {
  decomposeTask(task: Task): Promise<SubtaskData[]>;
  // ... other methods
}

// src/tasks/delegation/delegator.ts
export interface Worker { /* ... */ }
export interface TaskAssignment { /* ... */ }
export declare class TaskDelegator {
  findWorkerForTask(task: Task): Worker | null;
  assignTask(task: Task, worker: Worker): TaskAssignment;
  releaseAssignment(taskId: string): boolean;
  // ... other methods
}
```

## Deliverables

-   Functional `FibonacciHeap` and `TaskScheduler`.
-   Working `TaskManager` capable of managing task lifecycle and dependencies.
-   `GraphProcessor` integrated for basic task decomposition.
-   `TaskDelegator` capable of assigning tasks based on simple criteria.
-   Unit tests for the scheduler, manager, and delegator components.
-   Integration tests for task creation, scheduling, and completion workflow.
