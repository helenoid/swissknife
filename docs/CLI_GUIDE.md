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

SwissKnife is a unified CLI tool that provides AI agent capabilities, machine learning acceleration, task processing, and content storage through a consistent command-line interface. The CLI is built on a domain-driven architecture that combines all functionality in a single TypeScript codebase.

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

### AI Commands

Interact with the AI agent system for assisted coding, problem-solving, and more.

#### `agent chat`

Start an interactive chat session with the AI agent.

```bash
swissknife agent chat [options]
```

Options:
- `--model`, `-m`: Specify the model to use (default: configured default model)
- `--system`, `-s`: Provide a system prompt
- `--temperature`, `-t`: Set temperature (0.0-1.0, default: 0.7)
- `--max-tokens`, `-mt`: Maximum tokens to generate (default: 1000)

#### `agent run`

Execute a single prompt through the agent.

```bash
swissknife agent run "Your prompt here" [options]
```

Options:
- `--model`, `-m`: Specify the model to use
- `--temperature`, `-t`: Set temperature
- `--output`, `-o`: Output format (text, json, markdown)

#### `agent tools`

Manage available tools for the agent.

```bash
# List all available tools
swissknife agent tools list

# Get details about a specific tool
swissknife agent tools info <tool-name>

# Enable or disable a tool
swissknife agent tools enable <tool-name>
swissknife agent tools disable <tool-name>
```

#### `model`

Manage AI models.

```bash
# List available models
swissknife model list

# Set default model
swissknife model set-default <model-id>

# Add a new model
swissknife model add <name> --provider=<provider> --url=<url> [options]
```

### ML Acceleration Commands

Commands for machine learning operations with hardware acceleration.

#### `ml execute`

Run inference on a machine learning model.

```bash
swissknife ml execute <model-path> --input=<input-data> [options]
```

Options:
- `--accelerator`, `-a`: Specify the accelerator to use (webgpu, webnn, wasm, cpu)
- `--output`, `-o`: Output file path
- `--format`, `-f`: Input/output format (json, tensor, image)

#### `ml optimize`

Optimize a model for better performance.

```bash
swissknife ml optimize <model-path> [options]
```

Options:
- `--technique`, `-t`: Optimization technique (quantization, pruning, distillation)
- `--level`, `-l`: Optimization level (1-10)
- `--target`, `-tg`: Target device (mobile, desktop, server)

#### `ml benchmark`

Benchmark ML model performance.

```bash
swissknife ml benchmark <model-path> [options]
```

Options:
- `--iterations`, `-i`: Number of iterations (default: 100)
- `--warmup`, `-w`: Warmup iterations (default: 10)
- `--compare`, `-c`: Compare multiple accelerators

### Task Management Commands

Commands for managing complex task processing.

#### `task create`

Create a new task.

```bash
swissknife task create <description> [options]
```

Options:
- `--priority`, `-p`: Set priority (1-10, default: 5)
- `--data`, `-d`: Task data in JSON format
- `--dependencies`: Comma-separated list of task IDs this task depends on

#### `task list`

List all tasks.

```bash
swissknife task list [options]
```

Options:
- `--status`, `-s`: Filter by status (pending, running, completed, failed)
- `--format`, `-f`: Output format (table, json, yaml)

#### `task decompose`

Decompose a complex task into subtasks.

```bash
swissknife task decompose <task-id> [options]
```

Options:
- `--strategy`, `-s`: Decomposition strategy (recursive, parallel, sequential)
- `--depth`, `-d`: Maximum recursion depth

### Storage Commands

Commands for content storage and retrieval.

#### `storage add`

Add content to storage.

```bash
swissknife storage add <file-path> [options]
```

Options:
- `--provider`, `-p`: Storage provider (local, ipfs)
- `--pin`, `-P`: Pin content in IPFS
- `--metadata`, `-m`: Add metadata in JSON format

#### `storage get`

Retrieve content from storage.

```bash
swissknife storage get <content-id> [options]
```

Options:
- `--output`, `-o`: Output file path
- `--provider`, `-p`: Storage provider (local, ipfs)

#### `storage list`

List stored content.

```bash
swissknife storage list [options]
```

Options:
- `--provider`, `-p`: Storage provider
- `--format`, `-f`: Output format (table, json)
- `--filter`, `-F`: Filter by metadata

### Configuration Commands

Commands for managing configuration.

#### `config set`

Set a configuration value.

```bash
swissknife config set <key> <value>
```

Examples:
```bash
swissknife config set agent.defaultModel gpt-4
swissknife config set ipfs.mcpUrl http://localhost:5001
```

#### `config get`

Get a configuration value.

```bash
swissknife config get <key>
```

#### `config list`

List all configuration values.

```bash
swissknife config list [options]
```

Options:
- `--format`, `-f`: Output format (table, json, yaml)

## Advanced Features

### Interactive Mode

Start an interactive shell with SwissKnife:

```bash
swissknife shell
```

This provides a persistent environment for executing multiple commands without restarting the CLI.

### Pipeline Commands

Pipe commands together for complex workflows:

```bash
swissknife pipeline create agent:run "Generate test cases" | task:decompose | task:execute
```

### Scripting

Use SwissKnife in scripts for automation:

```bash
#!/usr/bin/env bash

# Generate documentation
swissknife agent run "Document the following code:" --input=src/main.ts --output=docs/main.md

# Optimize and benchmark the model
swissknife ml optimize models/text-gen.onnx --output=models/optimized.onnx
swissknife ml benchmark models/optimized.onnx --output=benchmark-results.json
```

## Environment Variables

SwissKnife respects the following environment variables:

- `SWISSKNIFE_CONFIG_PATH`: Path to the configuration file
- `SWISSKNIFE_MODELS_DIR`: Directory for storing ML models
- `SWISSKNIFE_CACHE_DIR`: Directory for cache data
- `SWISSKNIFE_LOG_LEVEL`: Logging level (debug, info, warn, error)
- `SWISSKNIFE_IPFS_MCP_URL`: URL for the IPFS Kit MCP Server
- `SWISSKNIFE_API_KEYS`: Path to API keys file

Model-specific API keys:
- `OPENAI_API_KEY`: API key for OpenAI models
- `ANTHROPIC_API_KEY`: API key for Anthropic models
- `MISTRAL_API_KEY`: API key for Mistral models

## Troubleshooting

### Common Issues

#### Command Not Found

If the `swissknife` command is not found after installation:

```bash
# Add to PATH manually
export PATH="$PATH:$(npm bin -g)"

# Or reinstall with correct permissions
sudo npm install -g swissknife
```

#### API Key Issues

If experiencing authentication errors:

```bash
# Set API key directly
swissknife config set apiKeys.openai "your-api-key-here"

# Or use environment variable
export OPENAI_API_KEY="your-api-key-here"
swissknife agent chat
```

#### Performance Issues

If ML acceleration is slow:

```bash
# Check available accelerators
swissknife ml accelerators list

# Force a specific accelerator
swissknife ml execute model.onnx --accelerator=webgpu
```

### Diagnostic Commands

```bash
# Check system information
swissknife system info

# Run diagnostics
swissknife diagnostics

# Check for updates
swissknife update check
```

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