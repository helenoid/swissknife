# Phase 4: Cross-Component Integration

**Timeline:** Week 12 of Phase 4

This document outlines the strategies and implementation details for ensuring the various core services (Agent, Storage, Task, Model, ML, etc.) integrate and communicate effectively within the SwissKnife CLI application. The primary mechanism for this integration is the `ExecutionContext`, which provides command handlers access to shared service instances and configuration.

## Goals

-   Validate and refine the `ExecutionContext` as the central point for service access and context sharing.
-   Implement and test key cross-component workflows demonstrating seamless interaction between services (e.g., Agent using Storage, Task using ML, CLI piping).
-   Establish and enforce consistent error handling patterns across service boundaries, utilizing standardized error types and the `OutputFormatter`.
-   Implement initial performance optimizations related to cross-component communication (e.g., lazy loading, data passing strategies).
-   Document common integration patterns and best practices for developers building new commands or features.

## Architecture

The core architectural pattern for integration is **Dependency Injection via Context**.

1.  **Service Instantiation:** Core services (`AgentService`, `StorageOperations`, `TaskManager`, etc.) are instantiated centrally, typically when the `ExecutionContext` is created or upon first request via `ExecutionContext.getService`.
2.  **ExecutionContext:** This object is created for each command invocation and holds references to the shared service instances, parsed arguments (`args`), configuration (`config`), logger (`logger`), and formatter (`formatter`).
3.  **Command Handlers:** The action handler for each CLI command receives the `ExecutionContext` as its primary argument.
4.  **Service Access:** Inside the handler, services are retrieved using `context.getService<ServiceName>('serviceName')`.
5.  **Orchestration:** The handler orchestrates the workflow by calling methods on the retrieved services, passing necessary data (arguments, results from previous service calls, often CIDs for large data).
6.  **Output:** The handler uses `context.formatter` to display results or errors.

```mermaid
graph TD
    A[CLI Framework invokes Command Handler] --> B{Handler(context: ExecutionContext)};
    subgraph ExecutionContext Instance
        direction LR
        CtxArgs[args: ParsedArgs]
        CtxCfg[config: ConfigManager]
        CtxLog[logger: Logger]
        CtxFmt[formatter: OutputFormatter]
        CtxServices[getService<T>()]
    end
    B -- Uses --> CtxArgs;
    B -- Uses --> CtxCfg;
    B -- Uses --> CtxLog;
    B -- Uses --> CtxFmt;
    B -- Uses --> CtxServices;

    CtxServices -- Returns Instance --> SvcAgent(AgentService);
    CtxServices -- Returns Instance --> SvcStore(StorageOperations);
    CtxServices -- Returns Instance --> SvcTask(TaskManager);
    CtxServices -- Returns Instance --> SvcModel(ModelRegistry);
    CtxServices -- Returns Instance --> SvcML(MLEngine);
    CtxServices -- Returns Instance --> SvcAuth(AuthService);
    CtxServices -- Returns Instance --> SvcMCP(MCPService);
    CtxServices -- Returns Instance --> SvcVector(VectorService);

    B -- Calls Methods --> SvcAgent;
    B -- Calls Methods --> SvcStore;
    B -- Calls Methods --> SvcTask;
    B -- Calls Methods --> SvcModel;
    B -- Calls Methods --> SvcML;
    B -- Calls Methods --> SvcAuth;
    B -- Calls Methods --> SvcMCP;
    B -- Calls Methods --> SvcVector;

    SvcAgent -- Uses --> SvcStore; # Example internal dependency
    SvcTask -- Uses --> SvcStore; # Example internal dependency
    SvcTask -- Uses --> SvcAgent; # Example internal dependency

    B -- Results/Status --> CtxFmt;
    CtxFmt -- Output --> H[stdout/stderr];

    style ExecutionContext Instance fill:#eee, stroke:#333
```
*The `ExecutionContext` acts as a broker, providing the command handler with access to all necessary shared services.*

## Implementation Details

### 1. Unified Workflows (`src/cli/workflows/` or within command handlers)

-   **Identify Key Workflows:** Define and document common multi-step user scenarios. Examples:
    -   **Generate & Store:** Use `agent execute` to generate code/text, pipe (`|`) the output to `ipfs add -` to store it and get a CID.
        ```bash
        swissknife agent execute "Write a python function for fibonacci" --output text | swissknife ipfs add --pin -
        ```
    -   **Retrieve & Analyze:** Use `ipfs get <cid> -` to retrieve content, pipe it to `agent execute -` (using stdin) with a prompt asking for analysis or summary.
        ```bash
        swissknife ipfs get QmExample... - | swissknife agent execute "Summarize this document:" -
        ```
    -   **Plan & Execute Task:** Use `agent execute` to generate a task definition (JSON), pipe it to `task create --input-file -`. Monitor with `task status --watch`. Retrieve results using `ipfs get`.
        ```bash
        swissknife agent execute "Create a task definition JSON to process data at CID QmInput..." --output json | swissknife task create process-data --input-file -
        # Returns TaskID=task-123
        swissknife task status task-123 --watch
        # ... task completes, result CID is QmResult...
        swissknife ipfs get QmResult... result.json
        ```
    -   **VFS Copy:** Copy between different storage backends using `file copy`.
        ```bash
        swissknife file copy /local/mydata.csv /ipfs/archive/mydata.csv
        ```
-   **Implementation Strategies:**
    -   **Shell Piping:** Enable simple workflows by ensuring commands adhere to standard Unix philosophy: read from stdin (`-`), write primary results (IDs, CIDs, JSON) to stdout, write logs/errors/prompts to stderr.
    -   **Scripting:** Document how users can combine commands in shell scripts for complex automation.
    -   **Workflow Commands (Optional):** Consider creating dedicated higher-level commands (e.g., `swissknife workflow run <definition>`) that internally orchestrate calls to multiple services if certain workflows are very common and complex to script.
    -   **Task System / GoT:** Leverage the TaskNet system (Phase 3) for orchestrating complex, potentially long-running or distributed workflows defined as tasks or GoT graphs. This is the most robust approach for complex internal orchestration.

### 2. Shared Context (`src/cli/context.ts`, `src/cli/session.ts`)

-   **`ExecutionContext` (`src/cli/context.ts`):**
    -   **Role:** Central hub for accessing shared resources and services within a single command execution.
    -   **Instantiation:** Created by a factory function (`createExecutionContext`) invoked by the CLI framework just before the command handler runs. Receives parsed `args`.
    -   **Service Instantiation:** Implements `getService<T>(serviceName)` using lazy instantiation (create on first request) and memoization (return the same instance on subsequent requests *within the same execution context*). Services are constructed with their own dependencies (e.g., `AgentService` gets `ModelExecutor`, `ToolRegistry`, etc.).
    -   **State:** Primarily holds references to *singleton* services (`ConfigurationManager`, `Logger`, `Formatter`, potentially `TaskManager`, `ModelRegistry`). Request-specific state (like parsed `args`) is also included. Avoid storing mutable state directly in the context that needs to persist across commands unless specifically for the REPL session.
-   **REPL Session Management (`src/cli/shell.ts`):**
    -   The REPL loop needs to manage state that persists *between* command executions within that interactive session.
    -   This might include:
        -   The `AgentService` instance (to maintain conversation history).
        -   Potentially storing the last used Task ID or CID in a session variable accessible via special REPL commands (e.g., `$LAST_TASK_ID`).
    -   This session state is distinct from the `ExecutionContext` created for each individual command run within the REPL.
-   **Configuration (`ConfigurationManager`):** Provides persistent shared settings across *all* CLI invocations (REPL or single command).
-   **Credentials (`AuthService` / `CredentialManager`):** Securely stored credentials (API keys, tokens) should be accessed via a dedicated service obtained through the `ExecutionContext`, ensuring consistent and secure access for all components needing them (e.g., `IPFSKitClient`, `ModelProvider` adapters).

### 3. Consistent Error Handling (`src/cli/errors.ts`, `src/cli/formatter.ts`)

-   **Standardized Error Types (`src/errors/`):** Define a hierarchy of custom error classes extending a base `SwissKnifeError`. Examples:
    -   `ConfigurationError`
    -   `ValidationError` (for invalid user input/args)
    -   `AuthenticationError`
    -   `NetworkError` (wrapping fetch/axios errors)
    -   `ServiceError` (base for service-specific errors)
        -   `AgentError`, `StorageError`, `TaskError`, `ModelError`, `IPFSError`
    -   Include properties like `code` (machine-readable string), `context` (relevant data like IDs), and `cause` (original wrapped error).
-   **Error Propagation:** Services should catch low-level errors (e.g., network timeouts, filesystem errors, API errors from SDKs) and re-throw them as appropriate standardized `SwissKnifeError` subclasses, preserving the original error in the `cause` property.
-   **Centralized Handling:** The main CLI entry point (`cli.ts`) or a global middleware layer should wrap command execution in a `try...catch` block.
-   **Formatting (`OutputFormatter.error`):** This method receives the caught error.
    -   It inspects the error type (checking `instanceof SwissKnifeError` and specific subclasses).
    -   It formats a user-friendly message based on the error type, message, code, and context.
    -   It logs the full error details (including `cause` and stack trace) internally using the `Logger`.
    -   It prints the user-friendly message (and stack trace if `--verbose`) to `stderr`.
    -   It sets an appropriate `process.exitCode` based on the error type/code.

### 4. Performance Optimization

-   **Data Passing:**
    -   **Small Data:** Pass simple configuration values, IDs, or small results directly as arguments/return values between service calls within a command handler.
    -   **Large Data:** For large payloads (file content, complex task results, model inputs/outputs), use the Storage Service (VFS). Store the data (e.g., on IPFS via `StorageOperations.writeFile`) and pass the resulting identifier (e.g., CID or virtual path like `/ipfs/Qm...`) between services or tasks. The receiving service then uses `StorageOperations.readFile` to retrieve the data. Rationale: Avoids high memory usage, leverages content addressing, facilitates distributed tasks.
-   **Service Instantiation:** Implement lazy loading within `ExecutionContext.getService`. Instantiate services only when first requested during a command's execution. Rationale: Improves CLI startup time by avoiding unnecessary initialization for commands that don't use all services.
-   **Asynchronous Execution:** Use `Promise.all` within command handlers *only* for independent, non-conflicting operations that can genuinely run concurrently (e.g., fetching status for multiple unrelated tasks). Be cautious about potential rate limits or resource contention.
-   **Batching:** Design service methods and corresponding CLI commands to accept arrays of inputs where appropriate (e.g., `ipfs pin add <cid1> <cid2>...`, `task cancel <id1> <id2>...`) and implement batching internally if the underlying API supports it. Rationale: Reduces network overhead and can improve throughput.
-   **Caching:** Implement caching strategies (as detailed in Phase 5) within individual services (`ModelCache`, `StorageCache`, `TaskResultCache`) rather than at the cross-component level, keeping cache logic close to the data source.

## Deliverables (Phase 4 Integration Focus)

-   Refined `ExecutionContext` implementation demonstrating lazy service loading and consistent service access for command handlers.
-   Implementation and documentation of key cross-component workflow patterns (e.g., Agent->Storage, Storage->Agent, Agent->Task->Storage) using shell piping and/or internal service calls within command handlers.
-   Defined hierarchy of `SwissKnifeError` subclasses used consistently across services.
-   Centralized error handling mechanism integrated with `OutputFormatter` providing user-friendly messages and verbose details.
-   Demonstration of large data passing via CIDs/VFS paths between services in relevant commands (e.g., `task create --input-cid`).
-   Integration tests specifically validating cross-service interactions for the key workflows identified (e.g., test `agent execute` triggering a `StorageTool` which interacts with a mock `StorageOperations`).
-   Documentation section outlining integration patterns, `ExecutionContext` usage, and error handling philosophy.
