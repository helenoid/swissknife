# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) and developers when working with code in this repository. It serves as a quick reference to the project's structure, standards, and key architectural concepts.

**For detailed information, always refer to the primary documentation in the `/docs` directory.**

## Table of Contents
- [SwissKnife Overview](#swissknife-overview)
- [Quick Start for Developers](#quick-start-for-developers)
- [Key Commands](#key-commands)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Core Architecture & Key Components](#core-architecture--key-components)
- [Code Style & Standards](#code-style--standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Common Issues & Debugging](#common-issues--debugging)
- [Contributing](#contributing)

## SwissKnife Overview

SwissKnife is a powerful, terminal-based AI toolkit built entirely in TypeScript for the Node.js environment. It provides a unified interface to interact with various AI models, manage complex tasks, interact with decentralized storage (IPFS), and extend capabilities via the Model Context Protocol (MCP).

**Core Features:**
- **AI Agent**: Manages conversations, uses tools, and orchestrates complex reasoning (including Graph-of-Thought).
- **TaskNet**: Advanced task processing system with priority scheduling, decomposition, synthesis, local parallelism (worker threads), and distributed coordination (Merkle Clock/Hamming Distance).
- **Storage (VFS)**: Unified interface over local filesystem and IPFS backends.
- **IPFS Integration**: Client for interacting with IPFS Kit MCP Server or other IPFS HTTP APIs.
- **Local ML**: Supports local model inference via `MLEngine` using Node.js runtimes (ONNX, TFJS).
- **MCP Integration**: Can host and connect to MCP servers.
- **Rich CLI**: Consistent command structure, interactive prompts, formatted output.

**Key Principles:**
- **Clean Room TypeScript**: No direct Rust code usage; functionality reimplemented based on requirements. See [docs/CLEAN_ROOM_IMPLEMENTATION.md](docs/CLEAN_ROOM_IMPLEMENTATION.md).
- **Node.js Native**: Optimized for CLI execution, avoiding browser APIs.
- **Modular & Service-Oriented**: Functionality organized into distinct services accessed via `ExecutionContext`.

## Quick Start for Developers

1.  **Setup Environment**:
    *   Ensure prerequisites are met (Node.js 18 LTS, pnpm, Git, Build Tools). See [docs/phase1/cli_dev_environment.md](docs/phase1/cli_dev_environment.md).
    *   **Recommended:** Use the provided Dev Container (`.devcontainer/devcontainer.json`) with VS Code for a consistent, pre-configured environment.
    *   **Manual Setup:**
        ```bash
        git clone <repo-url> swissknife
        cd swissknife
        # Ensure Node 18 & pnpm are active (use nvm if needed)
        pnpm install # Install dependencies
        pnpm husky install # Setup git hooks
        cp .env.example .env # Create local environment file
        # Edit .env with API keys (OPENAI_API_KEY, etc.)
        pnpm build # Perform initial build
        ```
2.  **Run in Dev Mode:**
    ```bash
    pnpm dev -- --help # Runs CLI using ts-node
    pnpm dev -- agent chat # Example: Start agent chat
    ```
3.  **Run Tests:**
    ```bash
    pnpm test # Run all tests
    pnpm test:watch # Run tests in watch mode
    ```
4.  **Explore Docs:**
    *   Start with `README.md`, `docs/GETTING_STARTED.md`, `docs/DEVELOPER_GUIDE.md`.
    *   Refer to `docs/UNIFIED_ARCHITECTURE.md` and specific phase/component documents in `/docs`.

## Key Commands (`package.json` scripts)

-   `pnpm dev -- [args...]`: Run CLI in development mode using `ts-node`.
-   `pnpm build`: Compile TypeScript to JavaScript (`dist/`).
-   `pnpm watch`: Watch for changes and recompile TypeScript.
-   `pnpm start -- [args...]`: Run the compiled CLI from `dist/`.
-   `pnpm lint`: Check code style using ESLint.
-   `pnpm format`: Format code using Prettier.
-   `pnpm typecheck`: Check for TypeScript errors without building.
-   `pnpm test`: Run all unit and integration tests.
-   `pnpm test:unit`: Run only unit tests.
-   `pnpm test:integration`: Run only integration tests.
-   `pnpm test:e2e`: Run end-to-end CLI tests (requires build).
-   `pnpm test:cov`: Run tests and generate coverage report.
-   `pnpm clean`: Remove build artifacts (`dist/`, `coverage/`).
-   `pnpm docs:generate:api`: Generate API documentation using TypeDoc.

## Development Environment

-   **Node.js:** v18 LTS (Required)
-   **Package Manager:** pnpm v8+ (Required)
-   **OS:** Linux, macOS, Windows (WSL2 Recommended)
-   **Editor:** VS Code (Recommended) with ESLint, Prettier extensions.
-   **Build Tools:** C++ Compiler, Python 3.8+ (Required for native Node modules).
-   **Dev Container:** Recommended for consistency (`.devcontainer/devcontainer.json`).
-   See [docs/phase1/cli_dev_environment.md](docs/phase1/cli_dev_environment.md) for full details.

## Project Structure

(See `docs/PROJECT_STRUCTURE.md` for full details)

-   `src/`: Main source code.
    -   `ai/`: Agent, Models, Tools, Thinking (GoT).
    -   `auth/`: Authentication, API Keys (`api-key-manager.ts`), UCANs.
    -   `cli/`: Core CLI framework (parsing, execution, context, formatting).
    -   `commands/`: Specific CLI command implementations.
    -   `components/`: Reusable Ink/React UI components.
    -   `config/`: Configuration management (`manager.ts`).
    -   `mcp/`: MCP client/server logic (using SDK).
    -   `ml/`: Local ML Engine (`engine.ts`).
    -   `network/`: Network services (e.g., LibP2P wrapper).
    -   `storage/`: VFS Abstraction (`operations.ts`) & Backends (`filesystem.ts`, `ipfs.ts`).
    -   `tasks/`: TaskNet system (Scheduler, Executor, Workers, Coordination, GoT, Decomp/Synth).
    -   `types/`: Shared TypeScript interfaces/types.
    -   `utils/`: Common utility functions.
    -   `cli.ts`: Main CLI entry point.
-   `docs/`: Project documentation.
-   `test/`: Automated tests (unit, integration, e2e).
-   `scripts/`: Utility scripts.
-   `.github/`: CI/CD workflows, issue/PR templates.
-   Configuration files (`.eslintrc.js`, `.prettierrc`, `tsconfig.json`, `jest.config.cjs`, `pnpm-lock.yaml`, etc.).

## Core Architecture & Key Components

-   **Architecture:** Service-oriented, modular TypeScript codebase. See `docs/UNIFIED_ARCHITECTURE.md`.
-   **Entry Point:** `src/cli.ts` initializes the command framework (e.g., `commander`).
-   **Command Handling:**
    -   Commands defined in `src/commands/`.
    -   `src/cli/parser.ts` (or framework) parses `argv`.
    -   `src/cli/executor.ts` finds the command handler.
    -   `src/cli/context.ts` defines `ExecutionContext` providing access to services.
    -   Handlers receive `ExecutionContext` and perform actions by calling services.
    -   `src/cli/formatter.ts` handles output presentation.
-   **Key Services (Examples - access via `ExecutionContext.getService('<ServiceName>')`):**
    -   `AgentService` (`src/ai/agent/`): Orchestrates AI interactions.
    -   `ModelService` (`src/ai/models/`): Manages model registry, selection, execution via providers.
    -   `ToolService` (`src/ai/tools/`): Manages tool registry and execution.
    -   `StorageOperations` (`src/storage/operations.ts`): Provides unified VFS API.
    -   `TaskManager` (`src/tasks/manager.ts`): Interface for creating/monitoring tasks.
    -   `ConfigManager` (`src/config/manager.ts`): Accesses configuration.
    -   `ApiKeyManager` (`src/auth/api-key-manager.ts`): Handles secure API key retrieval.
    -   `Logger` (`src/utils/logger.ts`): For logging.
    -   `OutputFormatter` (`src/cli/formatter.ts`): For user output.

## Code Style & Standards

-   **Language:** TypeScript (Strict Mode).
-   **Formatting:** Prettier (config: `.prettierrc`). Run `pnpm format`.
-   **Linting:** ESLint (config: `.eslintrc.js`). Run `pnpm lint`.
-   **Naming:** camelCase (functions/vars), PascalCase (classes/types/interfaces/enums), kebab-case (filenames).
-   **Modules:** ES Modules (`import`/`export`). Use path aliases (`@/`) defined in `tsconfig.json`.
-   **Commits:** Conventional Commits standard.
-   **Git Hooks:** Husky + lint-staged enforce formatting/linting on commit.
-   See `docs/CONTRIBUTING.md` and `docs/phase1/cli_documentation_standards.md`.

## Testing Guidelines

-   **Framework:** Jest (`jest.config.cjs`).
-   **Types:** Unit (`test/unit/`), Integration (`test/integration/`), E2E (`test/e2e/`).
-   **Coverage:** Aim for >80% (unit/integration). Check via `pnpm test:cov`.
-   **Mocks:** Use Jest mocks (`jest.mock`, `jest.fn`) for isolation. Mock external APIs in integration tests (`nock`/`msw`).
-   **E2E:** Use `child_process` helpers (`test/utils/cli-executor.ts`) to run the compiled CLI.
-   See `docs/phase1/cli_test_strategy.md` for full details.

## Documentation Guidelines

-   **Primary Source:** `/docs` directory using Markdown.
-   **API Docs:** Use TSDoc comments (`/** ... */`) in source code. Generate via `pnpm docs:generate:api`.
-   **Standards:** Follow `docs/phase1/cli_documentation_standards.md` (structure, style, templates, glossary).
-   **Updates:** Update relevant docs in the same PR as code changes.

## Common Issues & Debugging

-   **Module Resolution Errors:** Often due to Jest/TS config mismatch for path aliases or missing `.js` extensions in relative imports (required by NodeNext). Check `jest.config.cjs` (`moduleNameMapper`) and `tsconfig.json`. Ensure `pnpm build` is run before tests needing `dist/` files.
-   **Native Module Errors:** Ensure build tools (Python, C++) are installed correctly. Try `pnpm install --force` or remove `node_modules` and reinstall. Check `node-gyp` logs.
-   **API Key Errors:** Verify keys are set correctly (environment variables `OPENAI_API_KEY`, etc. take precedence) or stored securely via `apikey add`. Use `apikey list` or `config get ...` to check. Check for typos or expired keys.
-   **Debugging:**
    -   Use VS Code debugger with configurations in `.vscode/launch.json` (Debug CLI, Debug Current Jest File).
    -   Use `console.log` for simple tracing.
    -   Use the `debug` library with namespaces (e.g., `DEBUG=swissknife:agent pnpm dev ...`).
    -   Check detailed logs (level controlled by `LOG_LEVEL` env var).

## Contributing

-   Follow the workflow outlined in `docs/CONTRIBUTING.md`.
-   Use the PR template. Ensure CI checks pass and code is reviewed.
-   Adhere to code style and commit message conventions.
-   Update tests and documentation along with code changes.
