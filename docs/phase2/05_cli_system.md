# Phase 2: CLI System Implementation

**Timeline:** Week 4 of Phase 2 (Integrated with other domains)

This document outlines the implementation plan for the Command Line Interface (CLI) System during Phase 2. The focus is on establishing the command registration mechanism and implementing basic commands that integrate with the core functionality developed in other domains (AI, Storage, etc.).

## Goals

-   Implement a `CommandRegistry` to manage available CLI commands.
-   Define the structure for `Command` objects, including subcommands, options, and handlers.
-   Develop initial commands that demonstrate cross-domain integration (e.g., an AI chat command using the Agent and Storage).
-   Integrate the command system with the main application entry point.

## Implementation Details

### 1. Command Registry and Structure (Integrated throughout Week 4)

-   **`Command` Interface (`src/cli/registry.ts` or `src/types/cli.ts`):**
    -   Defines the structure for a command: `id`, `name`, `description`, `options`, `subcommands`, `handler`.
    -   `CommandOption`: Defines structure for options (`name`, `alias`, `type`, `description`, `required`, `default`).
    -   `CommandHandler`: Defines the function signature for command handlers `(args: ParsedArgs, context: AppContext) => Promise<number | void>`.
-   **`CommandRegistry` Class (`src/cli/registry.ts`):**
    -   Manages registration and retrieval of commands.
    -   `registerCommand(command: Command)`: Adds a command (potentially with subcommands) to the registry.
    -   `findCommand(commandPath: string[])`: Finds a command or subcommand based on input arguments.
    -   Handles parsing of command line arguments (potentially using a library like `yargs-parser` or similar).
    -   Executes the appropriate command handler with parsed arguments and application context.

### 2. Basic Command Implementations (Day 7 of Week 4)

-   **Example: AI Command (`src/cli/commands/ai-command.ts`):**
    -   Demonstrates integration with `Agent`, `ModelRegistry`, and `StorageProvider`.
    -   Includes subcommands like `chat` (interactive) and `run` (single-turn).
    -   Registers tools (e.g., `shellTool`, `storageTool`) with the `Agent` instance used by the command.
    -   Parses command-specific options (e.g., `--model`, `--prompt`).
    -   Calls the `Agent.processMessage` method and displays the result.
-   **Other Potential Commands:**
    -   Task management commands (create, list, view status) interacting with `TaskManager`.
    -   Storage commands (add, get, list) interacting with `StorageProvider`.
    -   Configuration commands interacting with `ConfigManager`.

### 3. CLI Entry Point (`src/cli.ts` or `src/main.ts`)

-   Initializes core components (ConfigManager, ModelRegistry, StorageProvider, TaskManager, etc.).
-   Instantiates the `CommandRegistry`.
-   Registers all defined commands (e.g., `createAICommand`, `createTaskCommand`).
-   Parses `process.argv` to get command line arguments.
-   Uses the `CommandRegistry` to find and execute the requested command.

## Key Interfaces

```typescript
// src/cli/registry.ts or src/types/cli.ts
export interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required?: boolean;
  default?: any;
}

export interface ParsedArgs {
  _: string[]; // Positional arguments
  [key: string]: any; // Options
}

// Application context might include instances of managers/providers
export interface AppContext {
  configManager: ConfigManager;
  modelRegistry: ModelRegistry;
  storageProvider: StorageProvider;
  taskManager: TaskManager;
  // ... other shared resources
}

export type CommandHandler = (args: ParsedArgs, context: AppContext) => Promise<number | void>; // Return exit code or void

export interface Command {
  id: string; // Unique identifier (e.g., 'ai:chat')
  name: string; // Name used in CLI (e.g., 'chat')
  description: string;
  options?: CommandOption[];
  subcommands?: Command[];
  handler: CommandHandler;
}

export declare class CommandRegistry {
  registerCommand(command: Command): void;
  execute(argv: string[]): Promise<number | void>; // Parses argv and runs command
  findCommand(commandPath: string[]): Command | undefined;
  // ... other methods
}
```

## Deliverables

-   Functional `CommandRegistry` capable of parsing arguments and executing handlers.
-   Defined `Command` and `CommandOption` interfaces.
-   At least one functional command demonstrating cross-domain integration (e.g., `ai run`).
-   Basic CLI entry point that initializes the system and runs commands.
-   Unit tests for the `CommandRegistry` argument parsing.
-   Integration tests for the example cross-domain command.
