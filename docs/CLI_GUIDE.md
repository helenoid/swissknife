# SwissKnife CLI Guide

This document provides comprehensive documentation for using the SwissKnife CLI, based on the unified architecture that combines all functionality in a single TypeScript codebase.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Command Structure](#command-structure)
- [Domain-Specific Commands](#domain-specific-commands)
  - [AI Commands](#ai-commands)
  - [ML Acceleration Commands](#ml-acceleration-commands)
  - [Task Management Commands](#task-management-commands)
  - [Storage Commands](#storage-commands)
  - [Configuration Commands](#configuration-commands)
- [Advanced Features](#advanced-features)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Overview

SwissKnife is a powerful, terminal-based AI coding tool built entirely in TypeScript. It provides a unified interface to interact with various AI models, manage complex tasks using Graph-of-Thought and advanced scheduling, utilize local ML acceleration, and interact with storage backends like the local filesystem and IPFS (via an IPFS client like the IPFS Kit MCP Server).

## Installation

### From NPM (recommended)

```bash
npm install -g swissknife
```

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/swissknife.git
cd swissknife

# Install dependencies and build
npm install
npm run build
npm install -g .
```

## Basic Usage

After installation, you can use the `swissknife` command from any terminal:

```bash
# Display help information
swissknife --help

# Check version
swissknife --version

# Start interactive AI chat
swissknife agent chat

# Execute a specific command
swissknife [command] [subcommand] [options]
```

## Command Structure

SwissKnife uses a hierarchical command structure:

```
swissknife [command] [subcommand] [options]
```

- **Commands**: Top-level functionality domains (e.g., `agent`, `model`, `task`)
- **Subcommands**: Specific operations within a domain (e.g., `agent chat`, `model list`)
- **Options**: Control behavior with flags (e.g., `--verbose`, `--output=json`)

## Domain-Specific Commands

### AI Commands (`agent`)

Interact with the AI agent for coding assistance, problem-solving, and executing tasks using tools.

#### `agent chat`

Starts an interactive chat session with the AI agent.

```bash
swissknife agent chat [options]
```

**Options:**
- `--model <model_id>`: Specify a model ID for this session.
- `--system-prompt <prompt>`: Provide a custom system prompt.
- `--temperature <value>`: Set the generation temperature (0.0-1.0).
- `--max-tokens <value>`: Set the maximum tokens for responses.
- `--no-history`: Start the session without loading previous history.

**In-Chat Commands:**
- `/help`: Show available chat commands.
- `/model`: View or change the current model.
- `/tools`: List available tools.
- `/clear`: Clear the current session history.
- `/exit`: Exit the chat session.

#### `agent execute`

Executes a single prompt non-interactively and prints the result.

```bash
swissknife agent execute "<prompt>" [options]
swissknife agent execute - [options] < file_with_prompt.txt
```

**Arguments:**
- `<prompt>`: The prompt string to send to the agent. Use `-` to read from stdin.

**Options:**
- `--model <model_id>`: Specify the model ID to use.
- `--system-prompt <prompt>`: Provide a custom system prompt.
- `--temperature <value>`: Set the generation temperature.
- `--max-tokens <value>`: Set the maximum tokens for the response.
- `--output <format>`: Output format (`text`, `json`, `yaml`). Default: `text`.

#### `agent tool`

Manage and interact with tools available to the agent.

```bash
# List available tools
swissknife agent tool list

# Show details for a specific tool
swissknife agent tool info <tool_name>

# Run a tool directly (for testing/debugging)
swissknife agent tool run <tool_name> [tool_args...] [options]
swissknife agent tool run <tool_name> --json-args '{"arg1": "value1", ...}'
```

#### `agent config`

Manage agent-specific configuration (shortcuts for `swissknife config get/set agent.*`).

```bash
# Get default agent model
swissknife agent config get defaultModel

# Set default agent model
swissknife agent config set defaultModel gpt-4-turbo

# List all agent configurations
swissknife agent config list
```

#### `model` (Alias/Related)

Manage AI models (often used by the agent).

```bash
# List available models (including local and provider-based)
swissknife model list [--provider <id>] [--capability <name>]

# Show details for a specific model
swissknife model info <model_id>

# Set the default model used by the agent
swissknife model set-default <model_id>

# Download a local model (if supported)
swissknife model download <model_id_or_url>

# Manage model cache
swissknife model cache clear
swissknife model cache stats
```

### ML Acceleration Commands (`ml`)

*(Note: These commands might be under development or subject to change based on Phase 2/5 implementation)*

Commands for machine learning operations, potentially with hardware acceleration.

```bash
swissknife agent chat [options]
```

Options:
- `--model`, `-m`: Specify the model to use (default: configured default model)
- `--system`, `-s`: Provide a system prompt
- `--temperature`, `-t`: Set temperature (0.0-1.0, default: 0.7)
- `--max-tokens`, `-mt`: Maximum tokens to generate (default: 1000)


#### `ml run` (Conceptual)

Run inference using a locally loaded model via the ML Engine.

```bash
# Example conceptual command
swissknife ml run <model_id_or_path> --input <input_data_path> [options]
```

**Options:**
- `--output <path>`: Save output tensor/data to a file.
- `--input-type <type>`: Specify input data type (e.g., `json`, `text`, `image_path`).
- `--accelerator <type>`: Hint for preferred accelerator (e.g., `cpu`, `gpu`, `auto`).

*(Further ML commands like `ml load`, `ml optimize`, `ml benchmark` depend on the specific implementation in `src/ml/`)*

### Task Management Commands (`task`)

Commands for creating, managing, and inspecting complex tasks processed by the TaskNet system (including GoT).

#### `task create`

Creates and schedules a new task.

```bash
# Create from description
swissknife task create "Analyze data in /ipfs/data.csv" [options]

# Create from definition file
swissknife task create --file ./task_definition.json [options]
```

**Options:**
- `--priority <1-10>`: Set initial task priority.
- `--input-cid <cid>`: Specify input data CID (if applicable).
- `--param <key=value>`: Set task-specific parameters (repeatable).
- `--parent-task <id>`: Link to a parent task.

#### `task list`

Lists tasks managed by the Task Manager.

```bash
swissknife task list [options]
```

**Options:**
- `--status <status>`: Filter by status (`Pending`, `Scheduled`, `InProgress`, `CompletedSuccess`, `CompletedFailure`, `Cancelled`).
- `--limit <n>`: Limit the number of tasks shown.
- `--all`: Show all historical tasks (may be performance intensive).
- `--format <format>`: Output format (`table`, `json`, `yaml`).

#### `task status`

Shows the current status and details of a specific task.

```bash
swissknife task status <task_id> [options]
```

**Options:**
- `--details`: Show more detailed information, including subtask status if applicable.
- `--watch`, `-w`: Poll and update the status periodically until completion or interruption.

#### `task cancel`

Requests cancellation of a pending or running task.

```bash
swissknife task cancel <task_id> [--force]
```

#### `task graph` (GoT Interaction)

Commands for interacting with the Graph-of-Thought associated with tasks.

```bash
# Initiate a GoT process for a prompt (returns graph/task ID)
swissknife task graph create "<prompt>" [--strategy <name>]

# Visualize the structure of a GoT graph
swissknife task graph visualize <graph_id_or_task_id> [--format <dot|mermaid|json>] [--output <file>]

# Export the graph data
swissknife task graph export <graph_id_or_task_id> [--format <json|ipld>] [--output <file>]
```

#### `task dependencies`

Inspect the dependency relationships for a task.

```bash
swissknife task dependencies <task_id> [--visualize] [--recursive]
```

### Storage Commands (`ipfs`, `storage`, `file`)

Commands for interacting with the Virtual Filesystem (VFS), including IPFS operations via the configured client (e.g., IPFS Kit MCP Server).

#### `ipfs` (IPFS-Specific Operations)

```bash
# Add a local file/directory to IPFS (returns CID)
swissknife ipfs add <local_path> [--pin] [--progress]

# Get content from IPFS by CID
swissknife ipfs get <cid> [output_local_path] [--progress]

# List contents of an IPFS directory CID
swissknife ipfs ls <cid> [--long]

# Pin a CID via the configured pinning service or IPFS node
swissknife ipfs pin add <cid> [--name <alias>]

# Unpin a CID
swissknife ipfs pin rm <cid>

# List pinned CIDs
swissknife ipfs pin ls [--status <status>]

# Get raw IPLD block data
swissknife ipfs dag get <cid> [--output <json|cbor-hex>]

# Resolve an IPFS path (e.g., /ipfs/cid/path)
swissknife ipfs dag resolve <ipfs_path>

# Check connection status to the configured IPFS API endpoint
swissknife ipfs server status
```

#### `storage` (VFS Management)

```bash
# List configured storage backends and mount points
swissknife storage mounts list

# Mount a backend (e.g., local filesystem) at a virtual path
swissknife storage mount <virtual_path> filesystem --path <local_base_dir_path>

# Mount the IPFS backend at a virtual path
swissknife storage mount <virtual_path> ipfs

# Unmount a virtual path
swissknife storage unmount <virtual_path>

# Show storage info (e.g., space usage if available)
swissknife storage info [virtual_path]
```

#### `file` (VFS Operations)

Operates on the virtual filesystem using paths like `/local/file.txt` or `/ipfs/data.csv`.

```bash
# List files/directories at a virtual path
swissknife file list <virtual_path> [--recursive] [--long]

# Read file content from a virtual path to stdout
swissknife file read <virtual_path>

# Write stdin or string content to a virtual path
swissknife file write <virtual_path> ["content"]

# Copy files/directories between virtual paths (can cross backends)
swissknife file copy <source_virtual_path> <dest_virtual_path> [--recursive]

# Move/Rename files/directories within the same backend
swissknife file move <source_virtual_path> <dest_virtual_path>

# Create a directory
swissknife file mkdir <virtual_path> [--parents]

# Delete a file or directory
swissknife file delete <virtual_path> [--recursive]

# Show file/directory status (metadata)
swissknife file stat <virtual_path>
```

### Configuration Commands (`config`)

Commands for managing application configuration.


#### `config set`

Sets a configuration value using dot notation for keys.

```bash
swissknife config set <key> <value>
```

**Examples:**
```bash
# Set the default AI model
swissknife config set ai.defaultModel gpt-4-turbo

# Set the IPFS API URL
swissknife config set storage.ipfs.apiUrl http://127.0.0.1:5001

# Set a nested property
swissknife config set ai.providers.openai.apiKey sk-...
```

#### `config get`

Gets a configuration value using dot notation.

```bash
swissknife config get <key>
```

#### `config list`

Lists all current configuration settings (merged from different sources).

```bash
swissknife config list [--format <table|json|yaml>]
```

#### `config path`

Shows the location of the user configuration file.

```bash
swissknife config path
```

### MCP Commands (`mcp`)

Manage local MCP servers and connections.

```bash
# View status of configured MCP servers
swissknife mcp status

# Start a local MCP server (typically used by extensions like VS Code)
swissknife mcp serve --cwd <project_directory>

# Add a server definition to the configuration
swissknife add-mcp-server <name> --command <cmd> [--args <arg1> <arg2>...] [--type <stdio|http>] [--url <url>]

# Remove a server definition
swissknife remove-mcp-server <name>
```


## Advanced Features

### Interactive Shell (`shell`)

Starts an interactive REPL environment for running multiple SwissKnife commands.

```bash
swissknife shell
```
Features include command history and potential autocompletion.

### Scripting & Piping

SwissKnife commands are designed to be scriptable and work with standard Unix pipes where applicable. Commands that output structured data often support `--output json` or `--output yaml`. Commands that accept input can often read from stdin using `-` as the input argument.

```bash
swissknife shell
```

This provides a persistent environment for executing multiple commands without restarting the CLI.

**Examples:**

```bash
# Generate code and add it directly to IPFS
swissknife agent execute "Generate a python function for fibonacci" --output json | jq -r .content | swissknife ipfs add -

# List files in IPFS and show details for the first one
CID=$(swissknife ipfs add ./my_dir --wrap-directory | tail -n 1) # Get dir CID
swissknife ipfs ls $CID --output json | jq -r '.[0].cid' | xargs swissknife file stat /ipfs/
```

## Environment Variables

SwissKnife respects the following environment variables (which often override configuration file settings):

- `OPENAI_API_KEY`: API key for OpenAI services.
- `ANTHROPIC_API_KEY`: API key for Anthropic services.
- `ANYSCALE_API_KEY`: API key for Anyscale services.
- `TOGETHER_API_KEY`: API key for Together AI services.
- `VOYAGE_API_KEY`: API key for Voyage AI services.
- `REPLICATE_API_KEY`: API key for Replicate services.
- `DEEPINFRA_API_KEY`: API key for DeepInfra services.
- `LOG_LEVEL`: Controls logging verbosity (e.g., `debug`, `info`, `warn`, `error`).
- `SWISSKNIFE_CONFIG_PATH`: Overrides the default path for user configuration file.
- `SWISSKNIFE_STORAGE_PATH`: Base path for local storage backend data (if configured).
- `SWISSKNIFE_CACHE_PATH`: Base path for disk cache.
- `NODE_OPTIONS=--max-old-space-size=<MB>`: May be needed to increase heap memory for large local models.

## Troubleshooting

### Common Issues

#### Command Not Found
Ensure the global npm/pnpm bin directory is in your system's `PATH`. You can find it using `npm bin -g` or `pnpm bin -g`. Add it to your shell profile (`.bashrc`, `.zshrc`, etc.).

#### API Key Errors
- Verify keys are set correctly either via `swissknife config set ai.providers.<provider>.apiKey ...` or the corresponding environment variable (e.g., `OPENAI_API_KEY`).
- Check for typos in keys or provider names.
- Ensure the key is valid and has necessary permissions/credits with the provider.

#### IPFS Connection Errors
- Ensure your IPFS node (e.g., IPFS Desktop, Kubo daemon, or IPFS Kit MCP Server) is running.
- Verify the API URL is correctly configured: `swissknife config get storage.ipfs.apiUrl` (or the relevant key). Default is often `http://127.0.0.1:5001`.
- Check for network issues or firewalls blocking access to the IPFS API port.

#### Local Model Errors
- Ensure the model was downloaded correctly (`swissknife model list --local`).
- Check if you have sufficient RAM and disk space.
- Verify necessary native dependencies for the ML runtime (e.g., ONNX Runtime) are installed correctly for your OS/architecture.

### Getting More Information

- Use the `--verbose` flag for more detailed command output.
- Use the `--debug` flag for extensive debug logging (sets `LOG_LEVEL=debug`).
- Check log files (location might be configurable or in a standard OS location).

### Getting Help

For additional help, use:

```bash
# General help
swissknife --help

# Command-specific help
swissknife <command> --help

# Get version information
swissknife --version
```

For more detailed documentation, visit the [SwissKnife Documentation](https://github.com/yourusername/swissknife/docs) repository.
