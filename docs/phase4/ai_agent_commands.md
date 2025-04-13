# Phase 4: AI Agent Commands Implementation

**Timeline:** Week 11 of Phase 4

This document details the implementation plan for the Command Line Interface (CLI) commands specifically designed to interact with the AI Agent service (`TypeScriptAgent`) within SwissKnife. These commands provide the primary user interface for leveraging the agent's conversational, execution, and tool-using capabilities.

## Goals

-   Implement an interactive `agent chat` command for seamless, multi-turn conversations with the AI agent, including history and in-chat commands.
-   Create a non-interactive `agent execute` command for single-shot prompts and scriptable interactions.
-   Develop `agent tool` subcommands (`list`, `info`, `run`) for inspecting and directly invoking available agent tools.
-   Implement `agent config` subcommands (`get`, `set`, `list`) for managing agent-specific settings (e.g., default model, temperature).
-   Ensure robust integration with the `AgentService`, `ModelRegistry`, `ToolRegistry`, `ToolExecutor`, and `ConfigurationManager` via the `ExecutionContext`.
-   Provide a user-friendly experience with clear output, streaming responses, and informative error handling.

## Command Structure

Commands will be organized under the `agent` namespace for clarity:

```bash
# Interactive chat session
swissknife agent chat [--model <id>] [--system <prompt>] [--temp <num>] [--no-history]

# Single-shot execution
swissknife agent execute "<prompt>" [--model <id>] [--system <prompt>] [--temp <num>] [--output <format>] [-] # '-' reads prompt from stdin

# Tool management
swissknife agent tool list
swissknife agent tool info <tool_name>
swissknife agent tool run <tool_name> [args...] [--json-args <json>]

# Agent configuration
swissknife agent config get <key>
swissknife agent config set <key> <value>
swissknife agent config list
```
*(Note: `agent config` commands might be aliases or integrated directly into the main `config` command structure, e.g., `swissknife config get agent.defaultModel`)*

## Implementation Details

### 1. `agent chat` Command (`src/cli/commands/agent/chat.ts`)

-   **Functionality:** Starts an interactive Read-Eval-Print Loop (REPL) for multi-turn conversations with the configured AI agent.
-   **Implementation:**
    -   Use Node.js `readline` for the main input loop, prompt display, and history management. `inquirer` is less suitable for a continuous chat loop.
    -   Instantiate an `AgentService` instance at the start, configured with options from CLI flags (`--model`, `--system-prompt`, `--temp`) or defaults from `ConfigurationManager`.
    -   **Input Loop:**
        -   Display prompt (e.g., `You: `).
        -   Read user input (handle multi-line input, e.g., ending with `;;`).
        -   Check for special in-chat commands (e.g., `/exit`, `/clear`, `/model <id>`, `/help`).
        -   If not a special command, call `agentService.processMessage(input, /* session context */)`.
        -   **Streaming Output:** If the model/provider supports streaming, iterate through the async generator returned by the agent/provider. Use `process.stdout.write` (or a low-level formatter method) to print chunks as they arrive, providing immediate feedback. Use `ora` spinner while waiting for the first chunk.
        -   **Non-Streaming Output:** Display a spinner (`ora`) while waiting for the `processMessage` promise to resolve. Print the final response using `formatter.info` or similar.
        -   **Tool Calls:** Intercept or format agent messages/responses to clearly indicate when a tool is being called and display its result (e.g., `[Tool Call: storage.readFile(...)] -> [Result: ...]`).
    -   **History:** Load history from `~/.swissknife_agent_history` on start (unless `--no-history`) and append new user inputs. Use `readline` history features.
    -   **Context:** Maintain the conversation history (`Message[]`) within the `AgentService` instance for the duration of the chat session.
-   **Options:**
    -   `--model <id>`: Override the default agent model for this session.
    -   `--system <prompt>`: Provide a custom system prompt.
    -   `--temp <number>`: Override the model's temperature setting.
    -   `--no-history`: Do not load or save chat history for this session.

### 2. `agent execute <prompt>` Command (`src/cli/commands/agent/execute.ts`)

-   **Functionality:** Sends a single prompt to the agent, waits for the complete response (including any tool calls), and prints the final result to stdout. Designed for scripting.
-   **Implementation:**
    -   Read prompt from the required positional argument `<prompt>` or from `process.stdin` if `-` is provided.
    -   Get `AgentService` from `ExecutionContext`.
    -   Get `OutputFormatter` from `ExecutionContext`.
    -   Construct initial messages (system prompt + user prompt).
    -   Call `agentService.processMessage()` using appropriate model/options from CLI flags or config.
    -   **No Streaming:** Await the final `AgentResponse`.
    -   Use `formatter.data()` to output the final response content, respecting the `--output` flag (text, json, yaml). Tool calls/results might be included in structured output or omitted in text output depending on design.
-   **Options:**
    -   `<prompt>`: The user prompt (required positional argument).
    -   `--model <id>`: Specify the model to use.
    -   `--system <prompt>`: Set a system prompt.
    -   `--temp <number>`: Override temperature.
    -   `--max-tokens <number>`: Override max tokens.
    -   `--output <format>`: Output format (`text`, `json`, `yaml`). Default: `text`.
    -   `-`: Read prompt from standard input instead of argument.

### 3. `agent tool` Subcommands (`src/cli/commands/agent/tool/`)

-   **`agent tool list`:**
    -   Get `ToolRegistry` service from `ExecutionContext`.
    -   Call `toolRegistry.getTools()`.
    -   Use `formatter.table()` to display tool names and descriptions.
-   **`agent tool info <tool_name>`:**
    -   Get `ToolRegistry` service.
    -   Call `toolRegistry.getTool(tool_name)`.
    -   If found, display detailed information (description, parameters with types/descriptions) using `formatter.info()` or dedicated formatting.
    -   If not found, use `formatter.error()`.
-   **`agent tool run <tool_name> [args...]`:**
    -   Get `ToolExecutor` service.
    -   Get `ToolRegistry` to find the tool definition and its parameter schema.
    -   **Argument Parsing:** Parse the positional `[args...]` based on the tool's parameter schema. This requires custom logic or integration with the main CLI framework's parsing if possible. Alternatively, enforce using `--json-args`.
    -   **JSON Arguments:** If `--json-args` is provided, parse the JSON string into an arguments object.
    -   **Validation:** Validate the parsed arguments against the tool's parameter schema (required fields, types).
    -   Call `toolExecutor.execute(tool_name, validated_args, context)`.
    -   Display the result using `formatter.data()` (respecting `--output` format). Handle potential errors from `execute`.
    -   **Options:** `--json-args <json_string>` (Alternative input method). `--output <format>`.

### 4. `agent config` Subcommands (`src/cli/commands/agent/config.ts`)

-   **Functionality:** Provides a convenient way to manage agent-specific settings stored within the main application configuration (likely under an `agent` key, e.g., `agent.defaultModel`).
-   **Implementation:** These commands will likely be implemented as subcommands of the main `config` command (e.g., `swissknife config get agent.defaultModel`). They simply use the `ConfigurationManager` service, prefixing the key with `agent.`.
    -   `config get agent.<key>`: Calls `configManager.get('agent.<key>')`.
    -   `config set agent.<key> <value>`: Calls `configManager.set('agent.<key>', value)`. May add validation specific to agent keys (e.g., check if model ID exists via `ModelRegistry`).
    -   `config list [--prefix agent]` : Calls `configManager.list()` potentially filtered to the `agent.` prefix.

## Integration Points

-   **`AgentService` (`TypeScriptAgent`):** The primary dependency for `agent chat` and `agent execute`.
-   **`ToolRegistry`:** Used by `agent tool list/info` and potentially by `AgentService` itself.
-   **`ToolExecutor`:** Used by `agent tool run` and internally by `AgentService`.
-   **`ModelRegistry`:** Used by `AgentService` (via `ModelSelector`/`ModelExecutor`) and potentially for validating `--model` options.
-   **`ConfigurationManager`:** Used by `agent config` commands and to provide default settings (model, temp) to `AgentService`.
-   **`OutputFormatter`:** Used by all commands for displaying output and errors.
-   **`ExecutionContext`:** Provides access to all the above services within command handlers.
-   **CLI Framework (`commander`/`yargs`):** Used for defining commands, parsing arguments, and generating help.

## User Experience Considerations

-   **Streaming in `chat`:** Essential for good UX. Use `stdout.write` for chunks and update spinner text.
-   **Tool Call Feedback:** In `chat` mode, clearly print messages like `[Calling tool: file.write(...)]` and `[Tool Result: Success]` or `[Tool Error: ...]`. In `execute` mode, structured output (JSON/YAML) should ideally include a log of tool calls and results.
-   **Error Handling:** Catch errors from `AgentService` (model errors, tool errors) and format them clearly using `OutputFormatter.error`, suggesting potential causes (e.g., invalid API key, tool permission denied, model unavailable).
-   **Configuration Feedback:** Commands should implicitly use the configured defaults (model, temp). Consider adding a way for users to easily view the *effective* settings being used for a given command execution (perhaps via a high verbosity level `-vvv`). The `agent config list` command helps here.
-   **Multi-line Input:** Ensure `agent chat` handles multi-line input gracefully (e.g., using a specific terminator sequence like `;;` or Shift+Enter detection if using more advanced TUI libraries).

## Deliverables

-   Functional `agent chat` command with history, streaming (if supported by provider), and basic in-chat commands (`/exit`, `/help`).
-   Functional `agent execute` command supporting prompt argument, stdin, and structured output (`--output json`).
-   Functional `agent tool list`, `agent tool info`, and `agent tool run` commands (supporting at least `--json-args`).
-   Functional `agent config` subcommands (or integration into main `config` command).
-   Verified integration: Commands correctly use `AgentService`, `ToolRegistry`/`Executor`, `ModelRegistry`, `ConfigurationManager` via `ExecutionContext`.
-   E2E tests covering primary use cases and options for each `agent` command.
-   Unit tests for any complex argument parsing or logic within command handlers (though most logic should be in services).
-   Comprehensive help text (`--help`) for all implemented commands and options.
-   Updated user documentation (command reference, guides) for agent features.
