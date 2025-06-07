# Phase 4: Task System Commands Implementation

**Timeline:** Week 12 of Phase 4

This document details the implementation plan for the Command Line Interface (CLI) commands designed to interact with the enhanced TaskNet system (implemented in Phase 3). These commands provide users with the ability to create, monitor, and manage complex tasks, including those involving Graph-of-Thought (GoT) reasoning, decomposition, and scheduling.

## Goals

-   Implement core task lifecycle commands: `task create`, `task status`, `task list`, `task cancel`.
-   Develop commands for interacting with GoT processes: `task graph create`, `task graph visualize`, `task graph export`.
-   Create inspection commands for debugging and understanding task structure: `task dependencies`, `task decompose` (view subtasks).
-   Implement commands to monitor the scheduler: `task scheduler status`.
-   Ensure seamless integration with TaskNet services (`TaskManager`, `TaskScheduler`, `GoT Engine`, `DecompositionEngine`, `DependencyManager`) via the `ExecutionContext`.
-   Provide clear feedback to the user about asynchronous task execution.

## Command Structure

Commands will be organized under the `task` namespace:

```bash
# Task Lifecycle Management
swissknife task create <type> [--input <data>] [--input-cid <cid>] [--input-file <path>] [--priority <num>] [--dependency <task_id>...] [--output json]
swissknife task status <task_id> [--details] [--watch] [--output json]
swissknife task list [--status <status>] [--type <type>] [--limit <num>] [--all] [--output json]
swissknife task cancel <task_id> [--force]

# Graph-of-Thought Interaction
swissknife task graph create "<prompt>" [--strategy <name>] [--output json] # Creates GoT task
swissknife task graph visualize <task_id> [--format <dot|mermaid|json>] [--output <file>]
swissknife task graph export <task_id> [--format <json|ipld>] [--output <file>]

# Inspection & Debugging
swissknife task dependencies <task_id> [--recursive] [--visualize <dot|mermaid>]
swissknife task decompose <task_id> # View subtasks created by decomposition

# Scheduler Monitoring
swissknife task scheduler status [--output json]
# swissknife task scheduler update-priority <task_id> <new_priority> # Lower priority for now
```

## Implementation Details

### 1. Task Management Commands (`src/cli/commands/task/management/`)

-   **`task create <type> ...`:**
    -   Input: Task `type` (string identifying the task logic), input data (via `--input`, `--input-cid`, or `--input-file`), optional `--priority`, optional `--dependency <task_id>` (can be specified multiple times).
    -   Action: Gets `TaskManager` from context. Constructs `TaskCreationOptions`. Calls `taskManager.createTask(type, inputData, options)`.
    -   Output: Prints the new `taskId`. Supports `--output json` to print `{ taskId: string }`.
-   **`task status <task_id>`:**
    -   Input: `task_id`.
    -   Action: Gets `TaskManager`. Calls `taskManager.getTask(taskId)`. If `--details`, potentially fetch subtask statuses or related GoT node info. If `--watch`, poll `getTaskStatus` periodically.
    -   Output: Displays task status, timestamps, potentially result/error summary. Uses `formatter.info` or `formatter.data` (for JSON).
    -   Options: `--details`, `--watch`, `--output json`.
-   **`task list`:**
    -   Input: Optional filters.
    -   Action: Gets `TaskManager`. Calls `taskManager.listTasks({ status: options.status, type: options.type, limit: options.limit, all: options.all })`.
    -   Output: Uses `formatter.table` to display tasks (ID, Type, Status, CreatedAt). Supports `--output json`.
    -   Options: `--status <Pending|Ready|Running|...>`. `--type <type>`. `--limit <number>`. `--all` (include completed/failed). `--output json`.
-   **`task cancel <task_id>`:**
    -   Input: `task_id`.
    -   Action: Gets `TaskManager`. Calls `taskManager.cancelTask(taskId)`.
    -   Output: Reports success/failure of the cancellation *request* using `formatter.success` or `formatter.warn`.
    -   Options: `--force` (potentially skip confirmation).

### 2. Graph-of-Thought Commands (`src/cli/commands/task/graph/`)

-   **`task graph create "<prompt>"`:**
    -   Input: Initial prompt string.
    -   Action: Gets `TaskManager`. Creates a specific task type (e.g., `'got:process'`) whose handler interacts with the `GoT Reasoning Engine`. Calls `taskManager.createTask('got:process', { prompt: prompt, strategy: options.strategy }, options)`.
    -   Output: Prints the `taskId` of the main GoT processing task.
    -   Options: `--strategy <bfs|dfs|heuristic>` (Specify GoT reasoning strategy), `--priority <num>`.
-   **`task graph visualize <task_id>`:**
    -   Input: `task_id` (likely the ID returned by `task graph create`).
    -   Action: Gets `GoT Engine` or `GraphPersistence` service. Retrieves the graph state associated with the task ID (potentially traversing links from the task's result CID). Generates visualization data.
    -   Output: Prints graph data in the specified format (DOT, Mermaid, JSON) to stdout or a file.
    -   Options: `--format <dot|mermaid|json>` (Default: `dot`), `--output <file_path>`.
-   **`task graph export <task_id>`:**
    -   Input: `task_id`.
    -   Action: Gets `GraphPersistence` service. Retrieves the graph state. Serializes it to the specified format (IPLD JSON or plain JSON).
    -   Output: Saves serialized graph to file or prints to stdout.
    -   Options: `--format <json|ipld>` (Default: `ipld`), `--output <file_path>`.

### 3. Decomposition & Dependency Commands (`src/cli/commands/task/decomposition/`)

-   **`task decompose <task_id>`:** (Inspection command)
    -   Input: `task_id`.
    -   Action: Gets `TaskManager` and `DependencyManager`. Finds the task. Uses `DependencyManager` to find direct subtasks created by this parent task (requires storing parent->child links or querying dependents where dependency is parentId). Retrieves subtask details via `TaskManager`.
    -   Output: Displays a list or tree of the direct subtasks generated by the specified parent task, including their IDs and statuses. Uses `formatter.table` or custom tree formatting.
-   **`task dependencies <task_id>`:** (Inspection command)
    -   Input: `task_id`.
    -   Action: Gets `DependencyManager`. Retrieves the list of tasks this task depends on (`taskDependencies`) and the list of tasks that depend on this task (`taskDependents`). Retrieves details via `TaskManager`.
    -   Output: Displays the lists of dependency IDs and dependent IDs. If `--visualize`, generates DOT/Mermaid graph representation of the local dependency neighborhood.
    -   Options: `--recursive` (Traverse dependencies/dependents further), `--visualize <dot|mermaid>`.

### 4. Scheduler Commands (`src/cli/commands/task/scheduler/`)

-   **`task scheduler status`:**
    -   Action: Gets `TaskScheduler` service. Calls methods like `getQueueSize()`. May also query `WorkerPool` status if integrated here.
    -   Output: Displays statistics like number of ready tasks in queue, number of active workers, etc. Supports `--output json`.
-   **`task scheduler update-priority <task_id> <new_priority>`:**
    -   Action: Gets `TaskScheduler`. Calls `taskScheduler.updateTaskPriority(taskId, newPriority)`. This is primarily a debug/admin tool.
    -   Output: Confirmation message.

## Integration Points

-   **`TaskManager`:** Central service used by most commands (`create`, `status`, `list`, `cancel`) for lifecycle and state management.
-   **`TaskScheduler`:** Used by `TaskManager` internally, and directly by `task scheduler status/update-priority`.
-   **`GoT Engine` / `GraphPersistence`:** Used by `task graph ...` commands.
-   **`DecompositionEngine`:** Used indirectly via `TaskManager` or `GoT`, and directly by `task decompose` for inspection.
-   **`DependencyManager`:** Used internally by `TaskManager`, and directly by `task dependencies` for inspection.
-   **`TaskExecutor` / `WorkerPool` / `Coordinator`:** Used internally by the TaskNet system loop, status potentially queried by `task scheduler status`.
-   **`OutputFormatter`:** Used by all commands for user output.
-   **`StorageOperations` / `IPFSKitClient`:** Used indirectly by tasks that require reading/writing data from/to storage backends.
-   **`ExecutionContext`:** Provides access to all necessary services within command handlers.

## User Experience Considerations

-   **Task IDs:** Ensure `task create` returns the ID clearly. Make IDs easy to copy/paste.
-   **Asynchronous Feedback:** Since tasks run asynchronously, `task create` should return immediately with the ID. Users *must* use `task status <id>` or `task list` to check progress. The `--watch` flag on `task status` can provide continuous updates.
-   **Status Clarity:** `task status` should provide clear, human-readable status information (Pending, Ready, Running, Succeeded, Failed, Cancelled). The `--details` flag can show subtask status or GoT node progress if applicable.
-   **Error Reporting:** Failed tasks should clearly indicate the error message in `task status --details`.
-   **Visualization:** Provide useful graph visualization (`--visualize dot|mermaid`) for `task dependencies` and `task graph visualize` to help users understand complex workflows.
-   **Input Methods:** Allow task input via direct argument (`--input`), file (`--input-file`), or CID (`--input-cid`) for flexibility.

## Deliverables

-   Functional `task create`, `task status`, `task list`, `task cancel` commands interacting correctly with `TaskManager`.
-   Functional `task graph create`, `task graph visualize`, `task graph export` commands interacting with the GoT system.
-   Functional inspection commands: `task dependencies`, `task decompose`.
-   Functional `task scheduler status` command.
-   Commands integrated via `ExecutionContext` to access TaskNet services.
-   Clear communication of asynchronous nature and use of `task status --watch`.
-   E2E tests validating the primary functionality, options, and output formats (including JSON) for each `task` command.
-   Comprehensive help text (`--help`) for all commands and options.
-   Updated user documentation (command reference, guides) for TaskNet features.
