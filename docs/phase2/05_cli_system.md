# Phase 2: CLI System Implementation (Foundation)

**Timeline:** Integrated throughout Phase 2 (Weeks 3-6)

This document outlines the foundational implementation plan for the Command Line Interface (CLI) System during Phase 2. The focus is on setting up the basic structure using a chosen CLI framework (e.g., `commander`), defining core interfaces, and implementing a few initial commands to test integration with services developed in this phase (Agent, Storage, Models). The full suite of commands and advanced features (REPL, output formatting) are planned for Phase 4.

## Goals (Phase 2 Foundation)

-   Select and integrate a CLI framework (e.g., `commander`, `yargs`).
-   Define and implement the core `Command` and `CommandOption` interfaces (aligning with `api_specifications.md`).
-   Define and implement the `ExecutionContext` structure for passing dependencies to command handlers.
-   Implement the main CLI entry point (`src/cli.ts`) to initialize the framework and register commands.
-   Develop a few representative commands (e.g., `agent execute`, `storage list`, `config get`) to validate integration with Phase 2 services.
-   Establish basic error handling and exit code conventions.

## Implementation Details (Phase 2 Focus)

### 1. CLI Framework Setup & Core Interfaces (`src/cli/`, `src/types/cli.ts`) (Week 3-4)

-   **Select Framework:** Choose between `commander` (simpler, widely used) or `yargs` (more features). Assume `commander` for examples unless decided otherwise.
-   **`Command` & `CommandOption` Interfaces:** Implement these interfaces as defined in `docs/phase1/api_specifications.md`, ensuring they align with the chosen framework's capabilities for defining commands and options.
-   **`ExecutionContext` (`src/cli/context.ts`):**
    -   Define the `ExecutionContext` interface as specified in `api_specifications.md`.
    -   Implement a factory function or class (`createExecutionContext`) responsible for:
        -   Receiving parsed arguments/options from the CLI framework.
        -   Initializing and providing access to core services (Config, Logger, Formatter, and Phase 2 services like Agent, Storage, ModelRegistry) via a `getService` method (implementing basic service location/injection).
-   **Command Registration:** Define a pattern for registering command modules with the main `commander` program instance (e.g., each command module exports a `register(program)` function).

### 2. Initial Command Implementations (`src/cli/commands/`) (Week 5-6)

-   **Implement Foundational Commands:** Create implementations for essential commands needed early or for testing integrations:
    -   `config get/set/list`: To manage basic configuration needed by other services. Uses `ConfigurationManager`.
    -   `agent execute`: A basic version to test the `TypeScriptAgent` and `ModelProvider` integration. Takes a prompt, calls the agent, displays the result using a *basic* formatter.
    -   `storage list` / `file list`: To test the `StorageOperations` VFS layer and list files in a configured backend (e.g., local).
-   **Focus on Integration:** The primary goal of these Phase 2 commands is to verify that the CLI can correctly invoke the core services developed in this phase and handle basic input/output. Polished formatting, complex options, and comprehensive error handling are deferred to Phase 4.
-   **Use `ExecutionContext`:** Command handlers (`action` functions in `commander`) must receive and use the `ExecutionContext` to access services, config, logger, etc.

### 3. CLI Entry Point (`src/cli.ts`) (Week 3)

-   **Initialization:**
    -   Set up main async function.
    -   Initialize essential services needed early (e.g., `ConfigurationManager`, `Logger`, basic `OutputFormatter`).
    -   Instantiate the `commander` program.
-   **Command Registration:** Import and call registration functions for all command modules (e.g., `registerConfigCommand(program)`, `registerAgentCommand(program)`).
-   **Parsing & Execution:** Call `program.parseAsync(process.argv)` to trigger parsing and command execution based on user input.
-   **Global Error Handling:** Implement top-level `try/catch` around `parseAsync` to catch unhandled errors and format them using the `OutputFormatter`. Set appropriate exit codes.

## Key Interfaces (Align with `api_specifications.md`)

```typescript
// src/types/cli.ts or reference from api_specifications.md

/** Represents the definition of a single CLI command or subcommand. */
export interface Command {
  readonly name: string;
  readonly description: string;
  readonly aliases?: string[];
  readonly options?: CommandOption[];
  readonly subcommands?: Command[];
  readonly handler: (context: ExecutionContext) => Promise<number>; // Returns exit code
  readonly examples?: string[];
  readonly isHidden?: boolean;
  readonly isEnabled?: boolean;
}

/** Defines a command-line option (flag) or positional argument. */
export interface CommandOption {
  readonly name: string;
  readonly description: string;
  readonly alias?: string;
  readonly type: 'string' | 'number' | 'boolean' | 'array';
  readonly required?: boolean;
  readonly defaultValue?: any;
  readonly choices?: any[];
}

/** Represents parsed arguments (structure depends on framework). */
export type ParsedArgs = Record<string, any> & { _?: (string | number)[] };

/** Provides execution context to command handlers. */
export interface ExecutionContext {
  readonly args: ParsedArgs;
  readonly config: ConfigurationManager;
  getService<T>(serviceName: string): T;
  readonly logger: Logger;
  readonly formatter: OutputFormatter; // Basic version in Phase 2
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly argv: string[];
}

// Basic OutputFormatter interface for Phase 2
export interface OutputFormatter {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(error: Error | string, exitCode?: number): void;
  data(data: any): void; // Simple console.log or JSON.stringify initially
  // table, spinner, progressBar methods deferred to Phase 4
}
```

## Deliverables (Phase 2 Foundation)

-   Selected CLI framework (`commander` or `yargs`) integrated.
-   Core interfaces (`Command`, `CommandOption`, `ExecutionContext`) defined and implemented.
-   Basic `ExecutionContext` factory providing access to Phase 2 services.
-   CLI entry point (`src/cli.ts`) capable of parsing args and running commands.
-   Initial implementation of a few key commands (`config get/set`, `agent execute`, `storage list`) demonstrating service integration.
-   Basic console-based `OutputFormatter`.
-   Top-level error handling in the entry point.
-   Unit tests for argument parsing logic (if custom) and context creation.
-   Basic E2E tests verifying the implemented commands run and produce expected basic output/errors.
