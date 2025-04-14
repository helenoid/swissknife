# Phase 3 TaskNet Test Plan

This document outlines the testing strategy for the components introduced or significantly enhanced in Phase 3, focusing on the TaskNet system, Graph-of-Thought (GoT), scheduling, coordination, decomposition, and synthesis.

## 1. Overall Goals

*   Verify the functional correctness of each core TaskNet component in isolation (Unit Tests).
*   Verify the interactions and data flow between TaskNet components (Integration Tests).
*   Verify the integration of TaskNet with other systems like Storage (for persistence) and potentially the Agent (for triggering GoT or providing task logic).
*   Ensure the distributed coordination mechanisms (Merkle Clock, Hamming Distance) function correctly in simulated multi-peer scenarios.
*   Validate the efficiency and correctness of the Fibonacci Heap scheduler.
*   Ensure robust error handling and state management throughout the task lifecycle.

## 2. Component-Specific Test Plans

### 2.1 Graph-of-Thought (GoT) Engine (`src/tasks/graph/`)

*   **Unit Tests (`test/unit/tasks/graph/`):**
    *   **`ThoughtGraph`:**
        *   Test node/edge addition, removal, retrieval.
        *   Verify DAG properties are maintained (no cycles allowed).
        *   Test graph traversal algorithms (DFS, BFS, topological sort) on various graph structures.
        *   Test serialization/deserialization logic (mocking IPLD block storage/retrieval via `StorageOperations`).
    *   **`ThoughtNode` Subclasses:** Test any specific logic within different node types (e.g., input validation, result formatting).
    *   **`NodeProcessors`:**
        *   Test individual processors in isolation.
        *   Mock dependencies heavily (e.g., `AgentService` for LLM calls, `ToolExecutor`, `StorageOperations`).
        *   Verify correct state transitions (`Pending` -> `Running` -> `Succeeded`/`Failed`).
        *   Verify correct result generation or subtask creation based on inputs.
    *   **`ReasoningStrategies`:**
        *   Test different strategies (DFS, BFS, Parallel, etc.) on sample graphs.
        *   Verify the order of node processing/expansion.
        *   Verify correct triggering of node processors.
    *   **`GraphPersistence`:**
        *   Test saving graph structure and individual nodes to a mocked `StorageOperations`.
        *   Test loading graph structure and nodes from the mocked `StorageOperations`.
        *   Verify correct CID linking and data integrity after save/load cycles.

*   **Integration Tests (`test/integration/tasks/graph/`):**
    *   Test `GoTEngine.processQuery` orchestrating the creation, expansion (using mocked `NodeProcessors` or simplified task handlers), and persistence of a simple graph via mocked `StorageOperations`.
    *   Test the interaction loop: `GoTEngine` -> `TaskManager.createTask` (for node processing) -> `TaskExecutor` (runs mock handler) -> `TaskManager.updateTaskStatus` -> `GoTEngine` (reacts to node completion).
    *   Test `GraphPersistence` interacting correctly with the mocked `StorageOperations` for saving/loading full graphs.

### 2.2 Fibonacci Heap Scheduler (`src/tasks/scheduler/`)

*   **Unit Tests (`test/unit/tasks/scheduler/`):**
    *   **`FibonacciHeap`:**
        *   Implement comprehensive tests covering all core operations: `insert`, `extractMin`, `decreaseKey`, `merge`, `isEmpty`, `size`.
        *   Test edge cases: empty heap, single node heap, multiple nodes with same key.
        *   Test complex scenarios involving multiple `decreaseKey` calls leading to `cut` and `cascadingCut`.
        *   Verify heap properties are maintained after each operation.
        *   Include benchmarks (e.g., using `benchmark.js` or Jest benchmarks) to approximate amortized time complexities against large datasets.
    *   **`PriorityCalculation` (`priority.ts`):**
        *   Test the `calculatePriority` function with diverse mock `TaskInfo` and `SystemState` inputs.
        *   Verify that changes in factors (dependencies, wait time, retries, complexity) correctly influence the resulting priority value.
        *   Test edge cases and boundary conditions for priority calculation.

*   **Integration Tests (`test/integration/tasks/scheduler/`):**
    *   Test `TaskScheduler` receiving mock `Task` objects, correctly calculating initial priority, inserting into the heap, and returning the correct task via `getNextTask`.
    *   Test `updateTaskPriority` correctly finds the task's heap node (via `nodeMap`) and calls `decreaseKey` on the heap.
    *   Simulate interaction with a mock `DependencyManager`: Ensure tasks only become eligible for `getNextTask` (or have their priority appropriately boosted) after their dependencies are marked as met.

### 2.3 Merkle Clock Coordination & Responsibility (`src/tasks/coordination/`)

*   **Unit Tests (`test/unit/tasks/coordination/`):**
    *   **`MerkleClock` (`merkle_clock.test.ts`):**
        *   Verify `tick()` increments local timestamp and updates head correctly.
        *   Verify `merge()` combines timestamps using max rule and updates head. Test idempotency.
        *   Verify `compare()` accurately returns 'before', 'after', 'concurrent', 'equal' for various clock states.
        *   Verify `getHead()` produces consistent, deterministic hashes based on timestamps (using `merkletreejs` and `crypto`).
        *   Verify `toJSON()` and `fromJSON()` correctly serialize and deserialize the clock state.
        *   Test edge cases (empty clock, single peer).
    *   **`Responsibility` (`responsibility.test.ts`):**
        *   Verify `normalizeId()` produces fixed-length buffers and consistent hashes. Test edge cases like empty input.
        *   Verify `calculateHammingDistance()` returns correct bit differences for various buffer inputs, including 0 for identical buffers and errors for different lengths.
        *   Verify `determineResponsibility()` correctly identifies the responsible peer based on minimum Hamming distance using mocked distance calculations.
        *   Verify `determineResponsibility()` correctly applies lexicographical tie-breaking when multiple peers have the same minimum distance.
        *   Test edge cases (single active peer, empty peer list if applicable).

*   **Integration Tests (`test/integration/tasks/coordination.test.ts`):**
    *   **`Coordinator` Service:**
        *   **Clock Sync:** Simulate 2-3 `Coordinator` instances with mocked `NetworkService`. Test peers exchanging clock heads via mock `publish/subscribe`, requesting full clocks when needed (mock direct comms or another topic), and correctly merging received clocks using `MerkleClock.merge`. Verify causal consistency is maintained after merges.
        *   **Task Distribution Workflow:**
            1.  Mock `TaskExecutor` to call `Coordinator.distributeTask`.
            2.  Verify `Coordinator` ticks local `MerkleClock` and calls `NetworkService.publish` with a correctly formatted "Task Announcement" message (including new head, target ID) on the appropriate topic. Use mock serialization if needed.
            3.  Simulate multiple `Coordinator` instances receiving the announcement via mocked `NetworkService.subscribe`.
            4.  Mock `determineResponsibility` for different peers (returning true for one, false for others).
            5.  Verify only the responsible `Coordinator` calls `TaskExecutor.executeRemoteTask`.
            6.  Simulate the responsible `TaskExecutor` completing the task and calling `Coordinator.handleLocalTaskCompletion`.
            7.  Verify the executing `Coordinator` ticks its clock and publishes a "Task Completion" message via `NetworkService.publish`.
            8.  Verify the originating `Coordinator` (and others) receive the completion message, merge the clock using `MerkleClock.merge`, and (for the originator) notify the mocked `TaskManager`.
            9.  Test failure scenarios (task execution fails, timeout waiting for completion).

### 2.4 Task Decomposition & Synthesis (`src/tasks/decomposition/`, `src/tasks/synthesis/`)

*   **Unit Tests (`test/unit/tasks/decomposition/`, `test/unit/tasks/synthesis/`):**
    *   **`DecompositionStrategies`:** Test each strategy (Recursive, Parallel, GoTBased, ModelBased) with mock parent tasks. Verify the structure, input data, and dependencies of the generated subtasks are correct. Mock `AgentService` for ModelBased strategy.
    *   **`SynthesisStrategies`:** Test each strategy (Concatenate, Merge, ModelBased, GraphBased) with various sets of mock subtask results. Verify the aggregated output is correct. Mock `AgentService` for ModelBased strategy.

*   **Integration Tests (`test/integration/tasks/decomposition-synthesis/`):**
    *   Test `DecompositionEngine` receiving a task, selecting a strategy, and correctly interacting with `TaskManager` (to create subtasks) and `DependencyManager` (to register dependencies).
    *   Test `SynthesisEngine` being triggered (e.g., by `TaskManager` upon completion of required dependencies), retrieving results (mocking `TaskManager.getTaskResult` or `StorageOperations.readFile`), applying a strategy, and updating the parent task's result/status (via `TaskManager`).
    *   **GoT Loop:** Test the full loop involving `GoTEngine`:
        1.  A `DecompositionNode` processor calls `DecompositionEngine`.
        2.  `DecompositionEngine` creates subtasks via `TaskManager`.
        3.  Subtasks run (mocked execution).
        4.  `SynthesisEngine` is triggered upon subtask completion.
        5.  `SynthesisEngine` aggregates results and updates the GoT graph (e.g., setting the result of a `SynthesisNode`).
        6.  Verify subsequent GoT nodes dependent on the `SynthesisNode` become ready.

## 3. Test Environment & Mocks

*   **Framework:** Jest.
*   **Language:** TypeScript (requires fixing project config for module resolution).
*   **Mocks:**
    *   **External APIs:** LLM APIs (`ModelExecutionService`), potentially external data sources.
    *   **Network:** LibP2P PubSub/Direct Connections for coordination tests.
    *   **Storage:** `StorageOperations` (using `createMockStorage` helper) for persistence tests (GoT, Caching).
    *   **Internal Services:** Mock dependencies *not* under test for specific integration scenarios (e.g., mock `AgentService` when testing `DecompositionEngine`, mock `TaskManager` when testing `GoTEngine` focus).
    *   **Configuration/Logging:** Use standard mocks (`ConfigurationManager`, `LogManager`).
*   **Helpers:**
    *   `testUtils.js`: `createTempTestDir`, `removeTempTestDir`, `mockEnv`, `waitFor`.
    *   `fixtures.js`: `generateTaskFixtures`, `generateGraphFixtures`.
    *   `mockStorage.js`: `createMockStorage`.
    *   Potentially new helpers for creating mock Tasks, TaskResults, GoT Nodes with specific states.

## 4. Execution & CI

*   Organize tests into `test/unit/tasks/`, `test/integration/tasks/`.
*   Use specific Jest configurations or naming conventions if needed to run subsets of tests.
*   Integrate tests into the CI pipeline (`github/workflows/`).
*   Include performance benchmarks for critical components like the Fibonacci Heap.

This plan provides a detailed roadmap for testing the Phase 3 TaskNet components. Actual implementation will depend on the final service APIs and fixing the TypeScript module resolution issues.
