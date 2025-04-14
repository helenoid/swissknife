# SwissKnife

![SwissKnife Logo](https://github.com/user-attachments/assets/7a9253a7-8bb0-40d5-a3f3-5e6096d7c789)

SwissKnife is a powerful, terminal-based AI toolkit built entirely in TypeScript for the Node.js environment. It provides a unified interface to interact with various AI models, manage complex tasks, interact with decentralized storage (IPFS), and extend capabilities via the Model Context Protocol (MCP).

## Key Features

- **Unified TypeScript Architecture**: A cohesive system built entirely in TypeScript, integrating AI, task management, storage, and CLI components. Follows clean room principles based on original Goose concepts. See [docs/UNIFIED_ARCHITECTURE.md](docs/UNIFIED_ARCHITECTURE.md).
- **Advanced AI Agent**: Features sophisticated reasoning, tool usage, and memory management.
- **Graph-of-Thought (GoT) Engine**: Enables complex problem decomposition and non-linear reasoning paths for advanced tasks.
- **Enhanced TaskNet System**: Includes a high-performance Fibonacci Heap scheduler for dynamic task prioritization and Merkle Clock coordination for potential distributed task execution.
- **ML Engine Integration**: Supports local ML model execution with hardware acceleration detection (via Node.js bindings like ONNX Runtime).
- **Virtual Filesystem (VFS)**: Provides a unified interface over multiple storage backends, including local filesystem and IPFS.
- **IPFS Integration**: Leverages content-addressable storage via an IPFS client (connecting to IPFS Kit MCP Server or other IPFS nodes) integrated into the VFS.
- **Rich Terminal UI**: Consistent command structure, interactive prompts, progress indicators, and formatted output (including tables, JSON, YAML). Uses Ink/React for some components.
- **Model Context Protocol (MCP)**: Can act as an MCP server and includes services for managing MCP server connections and tools.

See our [Unified Architecture Documentation](docs/UNIFIED_ARCHITECTURE.md) for a high-level overview. Detailed phase documentation is available in the `/docs` directory.

## Installation

### Prerequisites

- **Node.js**: Version 18.x LTS (Required). We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions.
- **pnpm**: Version 8.x or 9.x (Required). Install globally via `npm install -g pnpm`.
- **Git**: Latest version.
- **(Optional) Build Tools**: If installing native dependencies (e.g., for local ML models, keychain access) or building from source on some platforms, you may need:
    - C++ Compiler (Build Tools for Visual Studio on Windows, Xcode Command Line Tools on macOS, `build-essential` on Debian/Ubuntu).
    - Python (v3.8-v3.11) for `node-gyp`.
    - `make`.
    *(See [Development Environment Docs](docs/phase1/cli_dev_environment.md) for details)*

### Option 1: Install from NPM (Recommended for Users)

*(Assuming the package is published as `swissknife`)*

```bash
# Install globally using pnpm
pnpm add -g swissknife

# Verify installation
swissknife --version
```

### Option 2: Install from Source (for Development/Latest)

```bash
# 1. Clone the repository
git clone https://github.com/organization/swissknife.git # Replace with actual URL
cd swissknife

# 2. Install dependencies
pnpm install

# 3. Build the project
pnpm build

# 4. Link the package globally for testing
pnpm link --global

# Verify installation
swissknife --version

# Or run directly during development without linking:
pnpm dev -- --help
```

*(Note: The previous `install.sh` script seems outdated and relied on `bun` and `npm`. Using `pnpm` directly is preferred.)*

## Quick Start

1.  **Install:** Follow the installation instructions above.
2.  **Configure API Keys:** Securely add API keys for AI providers:
    ```bash
    # Example for OpenAI (will prompt securely or use keychain)
    swissknife apikey add openai <your-openai-api-key>

    # Or set environment variables (e.g., OPENAI_API_KEY)
    export OPENAI_API_KEY="sk-..."
    ```
    See `docs/API_KEY_MANAGEMENT.md` for details.
3.  **Basic Usage:**
    ```bash
    # Get help
    swissknife --help
    swissknife agent --help

    # Start an interactive chat
    swissknife agent chat

    # Execute a single prompt
    swissknife agent execute "Write a TypeScript function to calculate factorial"

    # Add a file to IPFS (assuming IPFS backend is configured)
    echo "hello world" > hello.txt
    swissknife ipfs add hello.txt
    ```
4.  **Explore Documentation:** See the `/docs` directory, starting with `docs/GETTING_STARTED.md` and `docs/CLI_GUIDE.md`.

## Project Phases Overview

The development and integration process is structured into five phases:

1.  **Phase 1: Analysis & Planning**: Focused on analyzing source components, defining the CLI-first architecture, mapping components, and establishing integration strategies. See [Phase 1 Docs](./docs/phase1/).
2.  **Phase 2: Core Implementation**: Building the foundational TypeScript implementations for key domains: AI Agent, ML Engine, Task System (basic scheduler/GoT structure), Storage System (VFS, IPFS Client), and CLI command system. See [Phase 2 Docs](./docs/phase2/).
3.  **Phase 3: TaskNet Enhancement**: Implementing advanced task processing features, including the full Graph-of-Thought engine, Fibonacci Heap scheduler with dynamic prioritization, Merkle Clock coordination for distribution, and sophisticated task decomposition/synthesis logic. See [Phase 3 Docs](./docs/phase3/).
4.  **Phase 4: CLI Integration**: Developing comprehensive CLI commands (`agent`, `ipfs`, `task`, `model`, etc.) to expose all backend functionality. Focuses on integrating components into seamless user workflows, shared context, and consistent error handling. See [Phase 4 Docs](./docs/phase4/).
5.  **Phase 5: Optimization & Finalization**: Performance profiling and optimization, implementing caching strategies, completing comprehensive testing (unit, integration, E2E), finalizing all documentation, polishing the user experience, and preparing for release. See [Phase 5 Docs](./docs/phase5/).

## Use as MCP Server

To run SwissKnife as an MCP server (e.g., for use with the Claude VS Code Extension):

1.  Find the full path to the compiled entry point (usually after `pnpm build`):
    ```bash
    # Example: Find where pnpm installed the global link or use the local build
    which swissknife
    # OR use the path within the project's dist folder:
    # /path/to/swissknife/dist/cli.js
    ```
2.  Add the configuration to your MCP client settings (e.g., Claude VS Code Extension settings):

    ```json
    {
      "mcpServers": {
        "swissknife-local": {
          "command": "node", // Use node to run the JS file
          "args": [
            "/path/to/swissknife/dist/cli.js", // Use the FULL path to the compiled cli.js
            "mcp",
            "serve"
            // Add any other args needed for the serve command, like --port if applicable
          ],
          "env": {
            // Add any necessary environment variables like API keys if not using keychain
            // "OPENAI_API_KEY": "sk-..."
          }
        }
      }
    }
    ```
    *Replace `/path/to/swissknife/dist/cli.js` with the actual path.*

## Developer Documentation

-   **Getting Started:** [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
-   **Developer Guide:** [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
-   **Project Structure:** [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
-   **Architecture:** [docs/UNIFIED_ARCHITECTURE.md](docs/UNIFIED_ARCHITECTURE.md)
-   **API Specifications:** [docs/phase1/api_specifications.md](docs/phase1/api_specifications.md)
-   **Testing Strategy:** [docs/phase1/cli_test_strategy.md](docs/phase1/cli_test_strategy.md)
-   **Contribution Guidelines:** [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
-   **Phase Details:** See subdirectories within `/docs` (e.g., `docs/phase1/`, `docs/phase2/`).

### Development Workflow

```bash
# Install dependencies (use pnpm)
pnpm install

# Run in development mode (uses ts-node)
pnpm dev -- [cli arguments]
# Example: pnpm dev -- agent chat --verbose

# Run tests
pnpm test
pnpm test:watch

# Build for production
pnpm build

# Run compiled version
pnpm start -- [cli arguments]
```

Get more logs while debugging:
```bash
# Set log level and/or debug namespaces
export LOG_LEVEL=debug
export DEBUG=swissknife:*
pnpm dev -- --verbose
```

## Bug Reporting

Please report bugs using GitHub Issues. Use the `/bug` command within the app (if functional) or manually create an issue following the Bug Report template. Provide clear steps to reproduce, environment details, and any relevant logs.

## Privacy

-   SwissKnife primarily processes data locally.
-   No telemetry is collected by default.
-   Interaction with external AI providers is subject to their respective privacy policies. API keys are stored securely using your OS keychain or environment variables.

## Uninstallation

```bash
# Uninstall the global package (if installed globally)
pnpm remove -g swissknife

# If installed from source, remove the cloned directory
# cd ..
# rm -rf swissknife
```

## License

Distributed under the [MIT License](LICENSE.md).
