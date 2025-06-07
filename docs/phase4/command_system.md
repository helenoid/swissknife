# Phase 4: Command System Implementation

**Timeline:** Week 10 of Phase 4

This document details the implementation plan and architecture for the core Command System of SwissKnife, a central piece of the CLI integration phase. It provides the foundation for user interaction with all underlying functionalities.

## Goals

-   Implement a robust and extensible command registration and execution system.
-   Develop a powerful argument parsing system with validation.
-   Automate help message generation based on command definitions.
-   Implement essential base commands (`help`, `version`, `config`).
-   Create an interactive shell (REPL) for an enhanced user experience.
-   Define and implement standardized, rich output formatting.

## Architecture

The Command System serves as the primary interface between the user and the application's backend services. Its core responsibilities include parsing command-line arguments (`process.argv`), identifying the requested command, validating inputs, executing the corresponding logic (command handler), and presenting results or errors to the user via standard output streams.

**Framework Choice:** We will leverage a mature CLI framework like `commander` or `yargs`.
*   **Rationale:** These frameworks handle the complexities of argument parsing (options, flags, positional args, type coercion), validation, automatic help generation (`--help`), version handling (`--version`), and subcommand routing. This significantly reduces boilerplate code and ensures adherence to common CLI conventions. The choice between `commander` (simpler API) and `yargs` (more features like command completion builders) will be finalized based on specific needs.

**Core Flow:**
1.  **Entry Point (`cli.ts`):** Initializes services, configures the CLI framework (e.g., `commander`), registers command modules.
2.  **Framework Parsing:** The framework parses `process.argv`.
3.  **Command Identification:** The framework identifies the target command (and subcommands).
4.  **Argument Validation:** The framework validates provided arguments/options against the command's definition (types, required, choices). Generates errors for invalid input.
5.  **Context Creation:** Before executing the handler, an `ExecutionContext` is created, providing access to parsed arguments and necessary application services.
6.  **Handler Execution:** The framework invokes the command's registered handler function, passing the `ExecutionContext`.
7.  **Service Interaction:** The handler uses services obtained from the `ExecutionContext` to perform its logic.
8.  **Output Formatting:** The handler uses the `OutputFormatter` (from the context) to display results or status messages.
9.  **Error Handling:** Errors thrown by the handler or services are caught (either by the handler or a global handler) and formatted for display using the `OutputFormatter`.
10. **Exit Code:** The process exits with an appropriate code (0 for success, non-zero for errors).

```mermaid
graph TD
    A[User Input (process.argv)] --> B{CLI Framework (commander/yargs)};
    B -- Register Commands --> C(Command Modules);
    B -- Parse & Validate Args --> B;
    B -- Invalid Input --> G(Output Formatter: Error);
    B -- Valid Input --> D(Context Factory: Create ExecutionContext);
    D -- Provides Services --> E[Command Handler Logic];
    B -- Invoke Handler --> E;
    E -- Uses --> F(Core Services: Agent, Storage, etc.);
    E -- Results --> G;
    G -- Formats Output --> H[stdout/stderr];

    style B fill:#f9f, stroke:#333
    style E fill:#ccf, stroke:#333
```
*The CLI Framework orchestrates parsing and execution, calling the specific Command Handler with an ExecutionContext that provides access to Core Services.*

## Implementation Details

### 1. Command Architecture (`src/cli/command.ts`, `src/cli/registry.ts`, `src/cli/parser.ts`, `src/cli/executor.ts`)

-   **Command Definition (`src/cli/commands/**/*.ts`):**
    -   Each command (or group of related subcommands) will be defined in its own module.
    -   Each module exports a `register(program: Command)` function (using the type from the chosen framework, e.g., `commander.Command`).
    -   Inside `register`, use the framework's API to define the command name, description, arguments, options (with types, defaults, validation), and the action handler.
    -   The action handler should be an `async` function that accepts the parsed arguments/options provided by the framework.
-   **Action Handler Logic:**
    -   The primary role of the action handler is orchestration.
    -   It should first obtain an `ExecutionContext` instance.
    -   It retrieves necessary services from the context (`context.getService(...)`).
    -   It calls methods on those services, passing validated arguments.
    -   It uses the `context.formatter` to display results or progress.
    -   It should contain minimal business logic itself; complex logic resides in the services.
    -   It should allow errors from services to propagate up to be caught by a global error handler (or handle specific errors if custom behavior is needed).
    -   It should ideally influence `process.exitCode` rather than calling `process.exit()` directly, allowing for graceful shutdown.
-   **`ExecutionContext` (`src/cli/context.ts`):**
    -   **Purpose:** Acts as a dependency injection container and context provider for command handlers. It decouples handlers from the specifics of service instantiation and global state.
    -   **Implementation:** Can be a class or created by a factory function. It receives parsed arguments (`args`) and potentially global configuration.
    -   **Service Location:** The `getService<T>(serviceName: string): T` method is crucial. It should instantiate services lazily on first request and return the same instance subsequently (singleton pattern within the context scope). It might use a simple map internally or a more sophisticated DI container library if needed later. Service instances themselves receive necessary dependencies (like `ConfigurationManager` or other services) during their construction by the context factory.
    -   **Contents:** Provides access to:
        -   `args`: Parsed and validated command-line arguments/options.
        -   `config`: The `ConfigurationManager` instance.
        -   `logger`: A configured logger instance.
        -   `formatter`: The `OutputFormatter` instance.
        -   `getService`: Method to retrieve shared service instances (Agent, Storage, Tasks, etc.).
        -   Potentially other contextual info like `cwd`, `env`.
-   **Framework Integration (`src/cli.ts`):**
    -   The main entry point initializes the `commander`/`yargs` program.
    -   It imports and calls the `register` function from each command module.
    -   It configures global options (e.g., `--verbose`, `--output <format>`, `--config <path>`).
    -   It sets up global error handling for parsing errors or unhandled exceptions from commands.
    -   It calls the framework's `parseAsync(process.argv)` method to start the process.

### 2. Base Commands (`src/cli/commands/base/`)

-   **`help`, `version`:** These are typically provided automatically by `commander`/`yargs` based on the program and command definitions. Ensure descriptions and version (from `package.json`) are correctly configured. Customize help output format if needed using framework features.
-   **`config get|set|list|path`:** Implement these commands using the `ConfigurationManager` service obtained via the `ExecutionContext`. Ensure secure handling for sensitive values (e.g., masking API keys in `list` output). Add support for `--scope` option.
-   **(New) `completion install|uninstall`:** Implement command to install/uninstall shell autocompletion scripts (Bash, Zsh, Fish) using features provided by `commander`/`yargs`.

### 4. Interactive Shell (REPL) (`src/cli/shell.ts`, invoked via `swissknife shell`)

-   **Implementation:** Use Node.js `readline` for core input/output loop. Libraries like `inquirer` are better suited for specific prompts within commands, not necessarily the main REPL loop itself. `Vorpal` is a more comprehensive framework but might be overkill if `commander`/`yargs` is already used.
-   **Core Loop:**
    -   Display prompt (e.g., `swissknife> `).
    -   Read user input line using `readline.question`.
    -   Parse the input line as if it were `process.argv` (e.g., split into args, potentially using `string-argv`).
    -   Execute the command using the same `commander`/`yargs` instance's `parseAsync` method (or a dedicated execution function), passing the parsed args. Ensure errors are caught and displayed without exiting the REPL.
    -   Loop back to display prompt.
-   **Features:**
    -   **History:** Use `readline`'s history capabilities, persisting to a file (e.g., `~/.swissknife_history`). Load history on startup.
    -   **Autocompletion:** Implement a completer function for `readline` that suggests command names, subcommand names, and potentially option flags based on the current input line, using data from the command definitions (requires access to the registry/framework's command structure).
    -   **Context Persistence (Optional):** Decide if any state should persist between commands within a single REPL session (e.g., last used model, current directory within VFS). This adds complexity and might require modifications to `ExecutionContext` handling. Start simple.
    -   **Special Commands:** Implement REPL-specific commands like `.exit`, `.help`, `.clear`.
    -   **Error Handling:** Catch errors from command execution and display them without terminating the REPL session.
    -   **Signal Handling:** Handle Ctrl+C gracefully (cancel current input or exit REPL) and potentially Ctrl+D (exit REPL).

### 5. Output Formatting (`src/cli/formatter.ts`)

-   **`OutputFormatter` Service (`src/cli/formatter.ts`):**
    -   Implement as a class, instantiated once and provided via `ExecutionContext`.
    -   Constructor might take configuration (e.g., default format, color enabled).
    -   Relies on libraries like `chalk` (styling), `cli-table3` (tables), `ora` (spinners), `cli-progress` (progress bars), `yaml` (YAML output).
-   **Core Methods:**
    -   `info(message: string)`: Standard informational output (respects `--quiet`).
    -   `warn(message: string)`: Formatted warning (e.g., yellow text).
    -   `error(error: Error | string, exitCode?: number)`: Formats errors consistently (see Error Handling section in Contribution Guidelines). Includes logic for `--verbose` stack traces. Sets `process.exitCode`.
    -   `success(message: string)`: Formatted success message (e.g., green text).
    -   `data(data: any)`: Handles primary command output. Checks global `--output` flag (`json`, `yaml`, `table`, `text`) and formats accordingly. For `text`, might use a default table format or custom stringification.
    -   `table(...)`: Renders data using `cli-table3`.
    -   `json(data: any)`: Prints `JSON.stringify(data, null, 2)`.
    -   `yaml(data: any)`: Prints `yaml.dump(data)`.
    -   `spinner(...)`: Creates and returns an `ora` spinner instance.
    -   `progressBar(...)`: Creates and returns a `cli-progress` bar instance.
-   **Integration with Logging:** Decide if `OutputFormatter` methods should also write to the structured logger (`pino`/`winston`) at appropriate levels (e.g., `info` logs info, `error` logs error). This centralizes output control.
-   **Verbosity:** Methods like `info`, `warn`, `debug` (if added) should respect verbosity levels set by flags (`-v`, `-vv`, `--verbose`, `--quiet`) or configuration.
-   **Color Handling:** Use `chalk` for all styling. It automatically handles `NO_COLOR` and terminal capability detection.

## Deliverables (Phase 4)

-   Selected CLI framework (`commander` or `yargs`) fully integrated.
-   Well-defined `ExecutionContext` providing access to all core services.
-   Robust command registration pattern implemented.
-   Comprehensive suite of CLI commands covering all major features (Agent, Storage, Task, Model, Config, etc.) implemented with handlers using `ExecutionContext`.
-   Automated, accurate help generation for all commands and options.
-   Fully implemented `OutputFormatter` service supporting text, JSON, YAML, tables, colors, spinners, and progress bars, respecting global flags (`--output`, `--verbose`, `--quiet`, `NO_COLOR`).
-   Functional interactive REPL shell (`swissknife shell`) with history and basic autocompletion.
-   Shell completion setup command (`swissknife completion install`).
-   Comprehensive E2E tests for all commands and key user workflows.
-   Updated unit and integration tests for CLI components.
