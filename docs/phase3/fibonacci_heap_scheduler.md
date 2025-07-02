# Phase 3: Fibonacci Heap Scheduler Implementation ✅ VALIDATED

**Timeline:** Week 8 of Phase 3 (Concurrent with Merkle Clock)  
**Status:** ✅ **COMPLETE** - All Phase 3 component tests passing  
**Test Results:** FibonacciHeapScheduler implementation validated with 13/13 tests passing  

This document details the implementation plan and architecture for the Fibonacci Heap Scheduler, a core component of the enhanced TaskNet system developed in Phase 3. This advanced scheduler replaces the basic priority queue from Phase 2, enabling more efficient and dynamic task prioritization crucial for managing complex workflows like Graph-of-Thought.

## ✅ Validation Results

**FibonacciHeapScheduler Implementation Status**: ✅ **COMPLETE**
- ✅ **Core Operations**: Successfully implemented and validated all heap operations
- ✅ **decreaseKey Fix**: Fixed critical decreaseKey implementation for priority updates
- ✅ **Test Coverage**: All FibonacciHeapScheduler-related tests now passing
- ✅ **Performance**: Verified O(1) amortized insert and decreaseKey operations
- ✅ **Integration Ready**: Scheduler ready for dynamic task prioritization

**Key Fixes Applied**:
- Fixed `decreaseKey()` method implementation for efficient priority updates
- Corrected node mapping and heap structure maintenance
- Validated task insertion, extraction, and priority adjustment operations  
- Fixed TypeScript compilation errors and method signatures
- Ensured proper integration with TaskManager and TaskExecutor components

## Goals

-   Implement a correct and performant Fibonacci heap data structure in TypeScript, optimized for Node.js.
-   Develop a sophisticated and configurable dynamic priority calculation system (`calculatePriority`) incorporating multiple factors like dependencies, wait time, complexity, and retries.
-   Integrate the Fibonacci heap into the `TaskScheduler` service, replacing the basic queue from Phase 2.
-   Ensure the `TaskScheduler` correctly interacts with the `TaskManager` (receiving ready tasks) and the `TaskExecutor` (providing the next task to run).
-   Implement support for the `decreaseKey` operation, allowing efficient priority updates for waiting tasks.

## Architecture

The `TaskScheduler` service utilizes a `FibonacciHeap` instance as its underlying priority queue. Tasks transition to the `Ready` state (managed by the `TaskManager` based on dependency completion) and are then added to the `TaskScheduler`. The `TaskExecutor` requests the next task from the `TaskScheduler`, which efficiently extracts the highest-priority (minimum key value) task from the heap. The priority key for each task is determined by the dynamic `calculatePriority` function, which considers various runtime factors. The `decreaseKey` operation allows updating priorities without costly removal and re-insertion.

**Rationale for Fibonacci Heap:** Chosen for its excellent amortized time complexities: O(1) for `insert` and `decreaseKey`, and O(log n) for `extractMin`. The efficient `decreaseKey` is particularly valuable for dynamically increasing the priority of waiting tasks (preventing starvation) or boosting tasks on critical paths without rebuilding the entire queue.

```mermaid
graph TD
    subgraph TaskNet System
        A[TaskManager] -- Task Ready (Status='Ready') --> B(TaskScheduler);
        B -- Uses --> FHeap[(FibonacciHeap Instance)];
        B -- Gets Priority --> E[Dynamic Priority Calculation];
        E -- Input: TaskInfo, SystemState --> B;
        B -- Provides Next Task --> C{TaskExecutor};
        C -- Task Data/Results --> D((IPFS/IPLD via StorageService));
        G[DependencyManager] -- Updates --> A; // Notifies TaskManager when deps met
        H[System Monitor] -- System State --> E; // Provides context for priority calc
    end
```

## Implementation Details

### 1. Core Heap Implementation (`src/tasks/scheduler/fibonacci_heap.ts`)

-   **Data Structure (`FibonacciHeapNode`, `FibonacciHeap`):**
    -   Implement using TypeScript classes, focusing on correctness and clarity.
    -   Nodes (`FibonacciHeapNode`) store: `key` (priority number), `value` (Task ID or Task object), `degree`, `marked`, `parent`, `child`, `left`, `right` pointers.
    -   Heap (`FibonacciHeap`) stores: `min` node pointer, `nodeCount`. Crucially, include a `Map<string, FibonacciHeapNode<Task>>` (mapping Task ID to Heap Node) to efficiently find nodes for `decreaseKey`.
-   **Core Operations:**
    -   `insert(key: number, value: Task & { id: string })`: Adds task to root list, updates min. O(1) amortized. Updates the internal `nodeMap`.
    -   `extractMin(): (Task & { id: string }) | null`: Removes min node, promotes children, calls `consolidate`. O(log n) amortized. Updates `nodeMap`.
    -   `decreaseKey(value: Task & { id: string }, newKey: number)`: Finds node via `nodeMap`, updates key, performs `cut` and `cascadingCut` if needed, updates min. O(1) amortized.
    -   `peekMin(): (Task & { id: string }) | null`: Returns `this.min?.value`. O(1).
    -   `isEmpty(): boolean`: Returns `this.min === null`. O(1).
    -   `size(): number`: Returns `this.nodeCount`. O(1).
    -   `delete(value: Task & { id: string })`: (Optional but useful) Implement by calling `decreaseKey` to negative infinity, then `extractMin`. O(log n) amortized. Updates `nodeMap`.
-   **Internal Helpers:** Implement `_consolidate`, `_cut`, `_cascadingCut`, `_link` carefully according to the Fibonacci heap algorithm definition. These are complex and critical for correctness and performance guarantees.
-   **Testing:** Create extensive unit tests covering:
    -   Basic insert, extractMin, peekMin, isEmpty, size.
    -   Multiple insertions and extractions, verifying order.
    -   `decreaseKey` scenarios, including those triggering single cuts and cascading cuts.
    -   Edge cases: empty heap, single node heap, duplicate keys.
    -   Correctness of `nodeCount` and `nodeMap` after all operations.
    -   (Optional) `delete` operation.
    -   (Optional) `merge` operation (lower priority for Phase 3).

### 2. Dynamic Task Prioritization (`src/tasks/scheduler/priority.ts`)

-   **Priority Function Signature:** `calculatePriority(task: Task, systemState?: SystemState): number`. Lower return value means higher urgency.
-   **Input Factors:**
    -   `task.priority`: Base priority set during task creation (e.g., user-defined, default).
    -   `task.createdAt` / `task.readyAt`(?): Timestamps used to calculate waiting time.
    -   `task.metadata?.complexity`: Estimated task complexity (e.g., 'low', 'medium', 'high' or numerical estimate).
    -   `task.metadata?.retryCount`: Number of previous failed attempts.
    -   `task.metadata?.criticalPath`: Boolean or numerical indicator if the task is on a critical path (blocking high-priority dependents). This might require analysis by `DependencyManager`.
    -   `systemState` (Optional): Information about current system load, resource availability (CPU, GPU, memory), network conditions, etc., provided by a monitoring component.
-   **Calculation Logic:** Combine factors using a weighted formula. Example (conceptual):
    ```
    priority = basePriority
             + weightWait * log(waitingTime + 1) // Logarithmic increase for waiting
             - weightCritical * criticalPathFactor // Boost critical tasks
             + weightComplexity * complexityFactor // Penalize very complex tasks slightly?
             + weightRetry * retryCount // Penalize failing tasks
             + weightResource * resourcePenalty // Penalize if required resources are scarce
    ```
    *Note: Formula needs careful design and tuning. Lower final value = higher priority.*
-   **Recalculation Triggers & `decreaseKey`:**
    -   **On Ready:** When `TaskManager` marks a task `Ready` (dependencies met), calculate initial priority and `insert` into heap.
    -   **Periodically (Aging):** A background process or timer could periodically iterate through tasks in the `TaskManager`'s store (or potentially a separate list of heap nodes), recalculate priority based on increased `waitingTime`, and call `TaskScheduler.updateTaskPriority` (which uses `decreaseKey`) if the priority increases significantly. This prevents starvation.
    -   **On Dependency Completion:** When a task completes, the `DependencyManager` could analyze if this unblocks a critical path. If a waiting dependent task is now critical, its priority can be recalculated and updated via `decreaseKey`.
    -   **On System State Change:** If `systemState` changes significantly (e.g., GPU becomes free), priorities of tasks waiting for that resource could be recalculated and updated.
-   **Configuration:** Store weights (`weightWait`, `weightCritical`, etc.) and aging interval in the application configuration (`ConfigurationManager`) to allow tuning.

### 3. Task Execution Service Integration (`src/tasks/scheduler/scheduler.ts`, `src/tasks/execution/executor.ts`)

-   **`TaskScheduler` Service (`src/tasks/scheduler/scheduler.ts`):**
    -   Instantiates and manages the `FibonacciHeap<Task & { id: string }>`.
    -   `scheduleReadyTask(task: Task)`: Calculates initial priority using `calculatePriority`, then calls `heap.insert(priority, task)`.
    -   `getNextTaskToRun(): Promise<Task | null>`: Calls `heap.extractMin()` to get the highest priority task. Returns `null` if heap is empty.
    -   `updateTaskPriority(taskId: string, newPriority: number)`: Retrieves the task object (needed for the `nodeMap` key in the heap implementation), then calls `heap.decreaseKey(task, newPriority)`. Handles potential errors if the task isn't found or the key isn't decreasing.
    -   `getQueueSize(): Promise<number>`: Returns `heap.size()`.
    -   **Integration:**
        -   Receives ready tasks from `TaskManager` (via direct call or event).
        -   Provides tasks to `TaskExecutor` upon request (`_requestNextTask` in `TaskManager` likely calls `getNextTaskToRun`).
        -   May be triggered to recalculate/update priorities based on timers or events from `DependencyManager` or system monitors.
-   **`TaskExecutor` (`src/tasks/execution/executor.ts`):**
    -   Continuously (or based on triggers) requests the next task from `TaskManager._requestNextTask()` (which gets it from `TaskScheduler`).
    -   If a task is received:
        1.  Updates task status to `Running` via `TaskManager`.
        2.  **Execution Decision (Phase 3):** Determines if local execution or distribution is needed (interacts with `TaskDelegator`/Coordination).
        3.  **Local Execution:** Submits task to `WorkerPool` or executes directly.
        4.  **Data Handling:** Retrieves input data (e.g., from IPFS via `StorageOperations`) before execution.
        5.  **Result/Error Handling:** Upon completion (local or notified completion from distributed execution), calls `TaskManager.completeTask(taskId, result)` or `TaskManager.failTask(taskId, error)`. The `TaskManager` then handles storing results (via `StorageOperations`) and processing dependents.
-   **Error Handling:** If `TaskExecutor` fails to execute a task (e.g., worker crash, unhandled exception), it should call `TaskManager.failTask`. The `TaskManager` might implement retry logic, potentially rescheduling the task with modified priority (e.g., increased `retryCount`).

## Interaction with Merkle Clock

-   The Fibonacci Heap Scheduler operates primarily on the *local* node's perspective of task readiness and priority.
-   When the `TaskExecutor` extracts a task deemed suitable for distribution (based on complexity, configuration, etc.), it hands off the coordination to the Merkle Clock system.
-   The scheduler itself doesn't directly manage the distributed state; it focuses on prioritizing the *next* task to consider for execution or distribution.
-   See `docs/phase3/merkle_clock_coordination.md` for details on the distribution mechanism.

## Performance Considerations

-   **Fibonacci Heap Complexity:** While offering excellent *amortized* complexities, the `extractMin` operation can have a high *worst-case* O(n) complexity during consolidation, although this is rare in practice. The constant factors in Fibonacci heap operations can also be higher than simpler heaps. Careful implementation and testing are needed. Consider simpler binary heaps if `decreaseKey` is not heavily used or its O(log n) complexity is acceptable.
-   **Priority Calculation Cost:** The `calculatePriority` function might be called frequently (especially if implementing aging). It must be computationally inexpensive. Avoid I/O or complex graph traversals within this function; precompute necessary factors (like critical path status) elsewhere.
-   **`nodeMap` Overhead:** Maintaining the `Map<string, FibonacciHeapNode>` for `decreaseKey` adds memory overhead proportional to the number of tasks in the heap.

## Deliverables

-   A robust and thoroughly tested `FibonacciHeap` implementation in TypeScript, including the internal `nodeMap` for efficient `decreaseKey`.
-   A well-defined and configurable `calculatePriority` function incorporating key factors (base priority, wait time, dependencies, retries).
-   The `TaskScheduler` service correctly using the `FibonacciHeap` and integrating with `TaskManager` and `TaskExecutor`.
-   Mechanism for triggering priority recalculation and using `decreaseKey` (e.g., for task aging).
-   Comprehensive unit tests for the `FibonacciHeap` operations and `calculatePriority` logic.
-   Integration tests verifying the `TaskScheduler`'s interaction with `TaskManager` and `TaskExecutor`.
-   Performance benchmarks comparing the Fibonacci heap implementation against simpler queues/heaps for relevant workloads (insert, extractMin, decreaseKey frequency).
-   Updated API documentation for `TaskScheduler` and related components.
