# CLI Development Environment Specification

This document specifies the recommended hardware, operating systems, runtime environments, tools, and configurations for developing the SwissKnife CLI application. Adhering to these specifications ensures a consistent and efficient development experience across the team.

## 1. System Requirements

### 1.1 Hardware Recommendations

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| CPU | 2 cores | 4+ cores | More cores improve build/test times. |
| RAM | 8 GB | 16+ GB | Node.js builds, TS Server, and running tests can be memory intensive. More RAM needed if running local ML models. |
| Storage | 5 GB free SSD | 20+ GB free SSD | SSD strongly recommended for performance. Space needed for Node modules, build artifacts, potential local models/cache. |
| Network | Stable internet connection | High-speed internet connection | Required for dependency downloads, API access, Git operations. |

### 1.2 Operating System Support

| OS | Version | Support Level | Notes |
|----|---------|--------------|-------|
| Linux | Ubuntu 22.04+ / Debian 12+ / Fedora 38+ | **Primary** | Recommended development environment. Best support for native dependencies. |
| Linux | Other recent major distributions | Good | Most features expected to work, but may require additional setup for native dependencies (compilers, Python). |
| macOS | 12.0 (Monterey)+ (x64 & ARM64) | **Primary** | Fully supported on both Intel and Apple Silicon. Native dependencies generally work well. |
| Windows | 10 / 11 (x64) | **Good (WSL2 Recommended)** | **WSL2 (Windows Subsystem for Linux 2) with Ubuntu is strongly recommended** for a consistent Linux-like environment, better performance, and easier native dependency management. Native Windows development is possible but may encounter more compatibility hurdles with paths and native builds. |

## 2. Runtime Environment

### 2.1 Node.js Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | **18.x LTS** | **Primary target version.** Use `nvm` (Node Version Manager) or similar to manage versions. Ensure consistency across the team. |
| Node.js | 20.x LTS | Secondary supported version. Ensure compatibility via CI testing. |
| npm | Bundled with Node.js | Used *only* for installing `pnpm` globally. |
| **pnpm** | **^8.x or ^9.x** | **Required package manager** for managing dependencies via `pnpm install`. Ensures efficient disk usage and consistent installs via lockfile (`pnpm-lock.yaml`). |

### 2.2 Python Requirements (Optional - Build Tools & ML)

| Component | Version | Notes |
|-----------|---------|-------|
| Python | 3.8 - 3.11 | Required by `node-gyp` for building native Node modules. Also needed if contributing to Python-based ML utilities or external components. Ensure it's in the system PATH. |
| pip | Bundled | For installing Python packages if needed. |
| virtualenv / venv | Recommended | For isolating Python environments if doing Python development. |

### 2.3 Build Tools (for Native Modules)

| Component | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| C++ Compiler | `gcc`/`g++` (Linux/macOS) or MS Visual C++ Build Tools (Windows) | Latest stable | Required by `node-gyp` for compiling native Node.js modules (e.g., `keytar`, `onnxruntime-node`, `better-sqlite3`). Installation varies by OS. |
| `make` | Latest stable | Common build utility used by some native modules. | Often included with build tools (e.g., `build-essential` on Debian/Ubuntu, Xcode Command Line Tools on macOS). |
| `node-gyp` | latest | Tool for compiling native addon modules for Node.js. Usually installed automatically as a dependency of `pnpm` or native modules. | Ensure it's configured correctly (e.g., `pnpm config set python /path/to/python3`, `pnpm config set msvs_version 2022` on Windows if needed). |

*Note: If only using pre-built binaries for native modules, these build tools might not be strictly necessary for all developers, but are required for CI and potentially for developers on less common platforms.*

## 3. Development Tools

### 3.1 Version Control

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Git | 2.34+ | Version control | Essential. |
| Git LFS | 3.0+ | For managing large binary files (e.g., ML models if checked in - **avoid if possible**) | Install via `git lfs install`. Check if project actually uses LFS. |
| GitHub CLI (`gh`) | latest | Optional: For interacting with GitHub (PRs, issues) from the CLI | Useful for streamlined workflow. |

**Recommended Git Configuration**:
```bash
# Ensure consistent line endings (check project's .gitattributes)
git config --global core.autocrlf input # Linux/macOS
# git config --global core.autocrlf true # Windows (if not using WSL2 primarily)

# Optional: Simplify rebasing
git config --global pull.rebase true
git config --global rebase.autoStash true
```

### 3.2 Code Editor

| Editor | Version | Notes |
|--------|---------|-------|
| **VS Code** | Latest | **Primary recommended editor** due to excellent TypeScript/Node.js support and extension ecosystem. Use with recommended extensions. |
| JetBrains IDEs (WebStorm, IntelliJ IDEA Ultimate) | Latest | Supported alternative with good TypeScript support. Ensure ESLint/Prettier integration. |
| Other editors (Vim, Neovim, Sublime Text, etc.) | - | Supported, provided they have robust TypeScript language server integration (for intellisense/errors) and ESLint/Prettier integration configured. |

**VS Code Extensions (Recommended)**:
- `dbaeumer.vscode-eslint` (ESLint)
- `esbenp.prettier-vscode` (Prettier - Code formatter)
- `vscode.typescript-language-features` (Built-in TS/JS support)
- `orta.vscode-jest` (Jest Runner)
- `EditorConfig.EditorConfig` (EditorConfig for VS Code)
- `GitHub.vscode-pull-request-github` (GitHub Pull Requests and Issues)
- `eamodio.gitlens` (GitLens — Git supercharged)
- `yzhang.markdown-all-in-one` (Markdown All in One)
- `ms-vscode-remote.remote-containers` (Dev Containers - Recommended)

**VS Code Workspace Settings (`.vscode/settings.json`)**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit" // Use "explicit" or true based on preference
  },
  "typescript.tsdk": "node_modules/typescript/lib", // Use workspace version of TS
  "typescript.updateImportsOnFileMove.enabled": "always",
  "javascript.updateImportsOnFileMove.enabled": "always",
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "files.eol": "\n", // Enforce LF line endings
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}
```

### 3.3 Code Quality Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| ESLint | ^8.x | Static code analysis, enforcing coding style | Configured via `.eslintrc.js`. Run via `pnpm lint`. |
| Prettier | ^3.x | Automatic code formatting | Configured via `.prettierrc`. Integrated with ESLint (`eslint-config-prettier`). Run via `pnpm format`. |
| TypeScript | ^5.x | Language, type checking | Configured via `tsconfig.json`. Run via `pnpm typecheck` or `pnpm build`. |
| Jest | ^29.x | Unit and integration testing framework | Configured via `jest.config.cjs`. Run via `pnpm test`. |
| Husky | ^8.x / ^9.x | Git hooks management (e.g., pre-commit, pre-push) | Configured in `package.json` or `.husky/`. |
| lint-staged | ^15.x | Run linters/formatters on staged files before commit | Configured in `package.json` or `.lintstagedrc.js`. Used with Husky pre-commit hook. |

## 4. Containerization

### 4.1 Docker Environment

| Component | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Docker Engine | 23.0+ | Container runtime | For running services (e.g., mock IPFS), build environments, or the dev container. |
| Docker Compose | v2.15+ | Container orchestration | For defining and running multi-container setups (if needed, e.g., for integration tests). |
| BuildKit | Enabled | Docker build feature | Should be enabled by default in recent Docker versions for faster, more efficient builds. |

### 4.2 Standard Images

| Image | Purpose |
|-------|---------|
| `node:18-alpine` | Lightweight Node.js runtime for production containers. |
| `node:18` / `node:18-bookworm` | Full Node.js environment for development/build containers. |
| `python:3.9-slim` | Python environment if needed for build tools or external components. |

### 4.3 Development Container (Recommended)

A `.devcontainer/devcontainer.json` configuration is provided for use with VS Code Dev Containers or GitHub Codespaces. This ensures a fully pre-configured and consistent Linux-based development environment with all necessary tools (Node.js, pnpm, Python, build tools, VSCode extensions) pre-installed. **Using the Dev Container is the recommended way to ensure consistency.**

```json
// .devcontainer/devcontainer.json (Example Snippet)
{
  "name": "SwissKnife Dev Container",
  // Use a pre-built image with Node.js and essential tools
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18", // Specify Node 18 LTS

  // Add features needed for development (e.g., Python, Docker, GitHub CLI, common utils)
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": { // Installs git, curl, etc.
        "installZsh": "false",
        "configureZshAsDefaultShell": "false"
    },
    "ghcr.io/devcontainers/features/python:1": { // For node-gyp
      "version": "3.9"
    },
    "ghcr.io/devcontainers/features/github-cli:1": {}, // Optional GitHub CLI
    // Add features for native dependencies if needed, e.g., specific build tools
    // "ghcr.io/rockylinux-mirror/rockylinux:9": {} // Example for specific OS base if needed
  },

  // Forward necessary ports (if running services like mock servers)
  // "forwardPorts": [3000],

  // Set container environment variables if needed
  // "containerEnv": { "MY_VARIABLE": "value" },

  // Run commands after container is created (install pnpm, dependencies, husky)
  "postCreateCommand": "sudo apt-get update && sudo apt-get install -y build-essential python3-dev || echo 'apt failed, continuing...' && npm install -g pnpm && pnpm install && pnpm husky install",

  // Configure VS Code settings and extensions within the container
  "customizations": {
    "vscode": {
      "settings": {
        // Settings from .vscode/settings.json will often be picked up automatically
        // Add any container-specific overrides here
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "orta.vscode-jest",
        "EditorConfig.EditorConfig",
        "GitHub.vscode-pull-request-github",
        "eamodio.gitlens",
        "yzhang.markdown-all-in-one",
        "ms-vscode-remote.remote-containers" // Dev Containers extension itself
        // Add other useful extensions
      ]
    }
  },

  // Use non-root user provided by the base image
  "remoteUser": "node"
}
```

## 5. Environment Setup

Steps to set up the development environment manually (if **not** using Dev Containers).

### 5.1 Initial Setup Steps

1.  **Install Git:** Ensure Git is installed and configured.
2.  **Install Node.js:** Install Node.js LTS version 18.x. Using a version manager like `nvm` is highly recommended:
    ```bash
    # Example using nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    nvm alias default 18
    ```
3.  **Install pnpm:** Install the required package manager globally:
    ```bash
    npm install -g pnpm
    ```
4.  **Install Build Tools:** Ensure necessary build tools (C++ compiler, make, Python 3.8+) are installed for native module compilation (refer to `node-gyp` documentation and library requirements for platform specifics).
    *   **Ubuntu/Debian:** `sudo apt-get update && sudo apt-get install -y build-essential python3`
    *   **macOS:** Install Xcode Command Line Tools (`xcode-select --install`). Ensure Python 3 is available.
    *   **Windows:** Install "Desktop development with C++" workload from Visual Studio Installer (includes MSVC) and Python 3 from python.org or Microsoft Store. Configure npm/pnpm: `pnpm config set msvs_version 2022` (or appropriate year), `pnpm config set python C:\path\to\python.exe`.
5.  **Clone Repository:** Clone the SwissKnife repository:
    ```bash
    git clone https://github.com/organization/swissknife.git # Replace with actual URL
    cd swissknife
    ```
6.  **Install Dependencies:** Install project dependencies using pnpm:
    ```bash
    pnpm install
    ```
7.  **Setup Git Hooks:** Initialize Husky git hooks:
    ```bash
    pnpm husky install
    ```
8.  **Build Project:** Perform an initial build to generate JavaScript files:
    ```bash
    pnpm build
    ```
9.  **Environment Variables:** Create a `.env` file (copied from `.env.example`) for local environment variables (API keys, etc.). **Do not commit `.env`**.
    ```bash
    cp .env.example .env
    # Edit .env with your specific settings/keys
    ```
10. **(Optional) Install Editor Extensions:** Install recommended VS Code extensions listed in Section 3.2.

### 5.2 Environment Variables

Key environment variables used during development (typically set in `.env` which is gitignored):

| Variable | Purpose | Example Value | Notes |
|----------|---------|---------------|-------|
| `NODE_ENV` | Sets runtime environment | `development` | Affects logging, potentially other behaviors. Use `test` for testing. |
| `LOG_LEVEL` | Controls logging verbosity | `debug` | e.g., `error`, `warn`, `info`, `debug`, `trace`. |
| `DEBUG` | Enables specific debug namespaces | `swissknife:*` | For use with the `debug` library. |
| `OPENAI_API_KEY` | API Key for OpenAI | `sk-...` | Loaded by `ApiKeyManager`. **Do not commit.** |
| `ANTHROPIC_API_KEY` | API Key for Anthropic | `sk-ant-...` | Loaded by `ApiKeyManager`. **Do not commit.** |
| `LILYPAD_API_KEY` | API Key for Lilypad | `your-key` | Loaded by `ApiKeyManager`. **Do not commit.** |
| `ANURA_API_KEY` | Alternative API Key for Lilypad | `your-key` | Loaded by `ApiKeyManager`. **Do not commit.** |
| `IPFS_API_URL` | URL for IPFS Kit Server API | `http://localhost:5001` | Loaded by `ConfigManager`. |
| `SWISSKNIFE_CONFIG_DIR` | Override default config dir | `/path/to/alt/config` | Optional override. |
| `SWISSKNIFE_CACHE_DIR` | Override default cache dir | `/path/to/alt/cache` | Optional override. |

*See `.env.example` for a full list.*

## 6. Build System

### 6.1 Build Scripts (`package.json`)

| Script | Purpose | Notes |
|-------------------------|---------|-------|
| `pnpm build` | Compile TypeScript to JavaScript (`dist/`) for production. | Uses `tsc`. |
| `pnpm build:dev` | Compile TypeScript with source maps for development/debugging. | Uses `tsc`. |
| `pnpm watch` | Run `tsc` in watch mode for continuous compilation. | Useful during development. |
| `pnpm clean` | Remove the `dist/` directory and other build artifacts. | Uses `rimraf` or similar. |
| `pnpm lint` | Run ESLint to check for code style issues and potential errors. | Checks `src/` and `test/`. |
| `pnpm format` | Run Prettier to automatically format code. | Formats `src/` and `test/`. |
| `pnpm typecheck` | Run TypeScript compiler without emitting files to check types. | Uses `tsc --noEmit`. |
| `pnpm test` | Run Jest test suite (unit, integration). | Runs all `*.test.ts` files. |
| `pnpm test:watch` | Run Jest in watch mode. | Useful during TDD. |
| `pnpm test:unit` | Run only unit tests (e.g., matching `test/unit/**/*.test.ts`). | Faster feedback loop. |
| `pnpm test:integration` | Run only integration tests. | |
| `pnpm test:e2e` | Run End-to-End CLI tests (requires build). | Runs tests in `test/e2e/`. |
| `pnpm test:cov` | Run tests and generate code coverage report. | Uses Jest's `--coverage` flag. |
| `pnpm start` | Run the compiled CLI from the `dist/` folder. | Requires `pnpm build`. Usage: `pnpm start -- <cli args>`. |
| `pnpm dev` | Run the CLI directly using `ts-node` for development. | No build needed. Usage: `pnpm dev -- <cli args>`. |
| `pnpm husky install` | Setup Git hooks (run once after install). | Installs hooks defined in `.husky/`. |

### 6.2 Build Configuration

TypeScript configuration (`tsconfig.json`): *Ensure alignment with Node.js version and module system.*

```json
// tsconfig.json (Key Settings)
{
  "compilerOptions": {
    "target": "ES2022", // Target modern Node.js versions (align with Node 18+)
    "module": "NodeNext", // Use modern Node.js ES Module system
    "moduleResolution": "NodeNext", // Module resolution strategy for NodeNext
    "esModuleInterop": true, // Improve interoperability with CommonJS modules
    "sourceMap": true, // Generate source maps for debugging
    "declaration": true, // Generate .d.ts files for type checking
    "declarationMap": true, // Generate source maps for .d.ts files
    "strict": true, // Enable all strict type-checking options (recommended)
    "skipLibCheck": true, // Skip type checking of declaration files (speeds up build)
    "forceConsistentCasingInFileNames": true, // Prevent case-related import issues
    "outDir": "./dist", // Output directory for compiled JS
    "rootDir": "./src", // Root directory of source files
    "baseUrl": ".", // Base directory for path mapping
    "paths": { // Path aliases for cleaner imports
      "@/*": ["src/*"]
    },
    "lib": ["ES2022", "DOM"] // Include DOM lib for types used by some dependencies (like MCP SDK) even if not directly used in our code
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"], // Files to include in compilation
  "exclude": ["node_modules", "dist", "test", "**/*.test.ts", "**/*.spec.ts"] // Files/dirs to exclude
}
```

### 6.3 Package Configuration

Key `package.json` settings:

```json
// package.json (Key Settings)
{
  "name": "swissknife",
  "version": "0.1.0", // Use Semantic Versioning
  "type": "module", // Use ES Modules (aligns with tsconfig)
  "engines": {
    "node": ">=18.0.0" // Specify minimum Node.js version
  },
  "bin": { // Define the CLI command
    "swissknife": "./dist/cli.js" // Points to the compiled entry point
  },
  "scripts": {
    // Build scripts (build, build:dev, watch, clean)
    // Linting & Formatting (lint, format)
    // Testing (test, test:watch, test:unit, test:integration, test:e2e, test:cov)
    // Running (start, dev)
    // Git Hooks (prepare: husky install)
    // ... other scripts ...
  },
  "dependencies": {
    // Runtime dependencies (commander, axios, chalk, etc.)
  },
  "devDependencies": {
    // Build/test/dev dependencies (typescript, ts-node, jest, eslint, prettier, husky, etc.)
  },
  "optionalDependencies": {
    // Native modules with platform fallbacks (keytar, onnxruntime-node-...)
  },
  "files": [ // Files included when publishing to npm
    "dist", // Compiled JavaScript output
    "README.md",
    "LICENSE"
    // Add other necessary files (e.g., templates, schemas)
  ],
  "publishConfig": { // Optional: npm publish settings
    "access": "public"
  },
  // Lint-staged and Husky config might also be here or in separate files
}
```

## 7. Testing Environment

### 7.1 Testing Frameworks

| Framework | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Jest | ^29.x | Core test runner, assertions, mocking, coverage | Primary testing framework. |
| `ts-jest` | ^29.x | Jest transformer for TypeScript | Allows Jest to run TS tests directly. |
| `memfs` / `mock-fs` | Optional | Filesystem mocking | Useful for isolating storage tests. |
| `nock` / `msw` | Optional | HTTP request mocking | Useful for testing API clients (IPFS, Models). |
| `@testing-library/react` | ^13.x+ | React component testing (for Ink TUI) | Only needed if using Ink for TUI components. |
| `sinon` | Optional | Spies, stubs, mocks (alternative to Jest mocks) | Can be used alongside Mocha/Chai if preferred over Jest. |

### 7.2 Test Configuration

Jest configuration (`jest.config.cjs`):

```javascript
// jest.config.cjs (Example for ESM project)
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat TS/TSX as ESM
  moduleNameMapper: {
    // Handle path aliases defined in tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle potential issues with ESM module resolution if needed
    // Example: '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // Use ts-jest for TypeScript files, ensuring ESM compatibility
    '^.+\\.m?[tj]sx?$': [ // Match .ts, .tsx, .mts, .mjs, .js, .jsx
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8', // Use V8's built-in coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/cli.ts', // Exclude main entry point if simple
    '!src/entrypoints/**', // Exclude entry points
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/test/**',
  ],
  testMatch: [ // Patterns for test files
    '**/test/unit/**/*.test.[jt]s?(x)',
    '**/test/integration/**/*.test.[jt]s?(x)',
    // E2E tests might be run separately via a different config or script
  ],
  // setupFilesAfterEnv: ['./test/setup.ts'], // Optional setup file
  // testTimeout: 30000, // Increase timeout if needed
};

module.exports = config;
```

### 7.3 Test Organization

```
test/
├── unit/             # Unit tests (mock all dependencies)
│   ├── ai/
│   ├── auth/
│   ├── cli/
│   ├── commands/
│   ├── config/
│   ├── storage/
│   ├── tasks/
│   └── utils/
├── integration/      # Integration tests (mock external APIs only)
│   ├── ai/
│   ├── cli/
│   ├── storage/
│   └── tasks/
├── e2e/              # End-to-end CLI tests (run compiled code)
│   ├── commands/
│   └── workflows/
├── fixtures/         # Static test data (JSON, text files)
├── mocks/            # Manual mock implementations (e.g., MockModelProvider)
└── utils/            # Test helper functions (e.g., executeCli, generateTestData)
```

## 8. CI/CD Environment

### 8.1 GitHub Actions Workflows

| Workflow File | Trigger | Purpose | Key Steps |
|---------------|---------|---------|-----------|
| `ci.yml` | `pull_request` to `main`/`develop` | Core validation | Lint, Type Check, Build, Unit Tests, Integration Tests (Primary OS) |
| `main.yml` | `push` to `main`/`develop` | Full validation & Coverage | Lint, Type Check, Build, Unit/Integration/E2E Tests (Matrix: Linux, macOS, Win), Coverage Upload |
| `release.yml` | `push` tag `v*.*.*` | Create GitHub Release | Build Artifacts (Binaries/Installers), Generate Checksums, Upload Artifacts, Create Release Notes |
| `publish.yml` | `release` published | Publish to npm | Download Artifacts (optional), `pnpm publish` |

Example CI workflow (`.github/workflows/ci.yml` snippet):

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest # Use matrix for cross-platform
    strategy:
      matrix:
        node-version: [18.x] # Test primary LTS version
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2 # Setup pnpm
        with:
          version: 8 # Or 9
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm build # Needed for E2E
      - run: pnpm test:e2e
      - name: Upload coverage reports to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }} # Optional: for private repos
          files: ./coverage/lcov.info # Specify coverage file
```

### 8.2 Continuous Integration Requirements

- All tests (lint, typecheck, unit, integration, e2e) must pass before merging PRs.
- Code coverage must meet or exceed the defined threshold (e.g., 80%).
- Builds must succeed on all supported platforms defined in the matrix.

### 8.3 Release Process

1. Create release branch `release/vX.Y.Z` from `develop`.
2. Update version in `package.json` using `pnpm version patch|minor|major`.
3. Update `CHANGELOG.md` with changes for the release.
4. Create PR from `release/*` to `main` and `develop`.
5. After merging to `main`, create a Git tag `vX.Y.Z`.
6. Push the tag (`git push origin vX.Y.Z`).
7. CI `release.yml` workflow triggers, builds artifacts, creates GitHub Release.
8. CI `publish.yml` workflow triggers on release publication, publishes to npm.

## 9. Debugging Environment

### 9.1 Debug Configurations

VS Code debug configuration (`.vscode/launch.json`) for launching the CLI or running tests with the debugger attached:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI (ts-node)",
      "runtimeArgs": [
        "--loader", "ts-node/esm" // Use ESM loader for ts-node
      ],
      "program": "${workspaceFolder}/src/cli.ts", // Point to TS entry point
      "args": [ /* Add CLI args here, e.g., "agent", "chat" */ ],
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "sourceMaps": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Jest File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}", // Run only the current file
        "--config", "jest.config.cjs", // Use cjs extension for Jest config
        "--runInBand", // Run tests serially
        "--no-cache" // Disable cache for debugging
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    }
    // Add configurations for specific test suites or E2E tests if needed
  ]
}
```

### 9.2 Logging

| Level   | Use Case                                     | Controlled By | Default Level |
|---------|----------------------------------------------|---------------|---------------|
| `error` | Critical errors preventing operation.        | `LOG_LEVEL`   | `error`       |
| `warn`  | Potential issues, deprecated usage warnings. | `LOG_LEVEL`   | `warn`        |
| `info`  | General operational information (start/stop).| `LOG_LEVEL`   | `info`        |
| `debug` | Detailed information for developers.         | `LOG_LEVEL`   | `info`        |
| `trace` | Highly detailed tracing (e.g., API bodies).  | `LOG_LEVEL`   | `info`        |
| `*`     | Specific component debug logs.               | `DEBUG` env var| (disabled)    |

Configuration:
- Use a standard logging library like `pino` (performant) or `winston` configured based on `LOG_LEVEL`.
- Use the `debug` library for fine-grained component-level debugging, controllable via the `DEBUG` environment variable (e.g., `DEBUG=swissknife:agent,swissknife:storage*`).

```typescript
// Example using 'debug' library
import debug from 'debug';

const log = debug('swissknife:agent'); // Create namespaced logger

// Usage
log('Processing message with ID %s', messageId);
if (config.verbose) { // Example conditional logging based on app config
    log('Detailed context: %O', context);
}
```

## 10. Documentation Environment

### 10.1 Documentation Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| TypeDoc | ^0.25+ | Generate API reference from TSDoc comments | Configured via `typedoc.json`. |
| `markdownlint-cli` | latest | Lint Markdown files for style consistency | Configured via `.markdownlint.jsonc`. |
| Mermaid CLI (optional) | latest | Render Mermaid diagrams in CI/build | For validating diagrams. |
| Static Site Generator | Optional | e.g., Docusaurus, MkDocs, Docsify | For hosting browsable documentation online. |

### 10.2 Documentation Structure

*(See structure diagram in `cli_documentation_standards.md`)*

### 10.3 Documentation Generation

```bash
# Example scripts in package.json

"scripts": {
  // ... other scripts ...
  "docs:generate:api": "typedoc --options typedoc.json",
  "docs:lint": "markdownlint \"**/*.md\" --ignore node_modules",
  "docs:serve": "docsify serve docs" // If using Docsify
}
```

## 11. Dependency Management

### 11.1 Dependency Policy

- Use `pnpm` for package management.
- Keep `pnpm-lock.yaml` checked into Git.
- Specify compatible ranges (`^` or `~`) for most dependencies in `package.json`. Use exact versions only if necessary.
- Regularly update dependencies (`pnpm update`) and audit for vulnerabilities (`pnpm audit`).
- Major version upgrades require careful testing and coordination.

### 11.2 Recommended Libraries

*(See `cli_documentation_standards.md` for a more detailed list)*

| Category | Recommended Libraries |
|----------|-----------------------|
| CLI Framework | `commander` or `yargs` |
| Styling | `chalk` |
| Interactive | `inquirer` |
| Progress | `ora`, `cli-progress` |
| Filesystem | `fs-extra`, `globby` |
| HTTP Client | `axios` or built-in `fetch` |
| Testing | `jest`, `ts-jest` |
| Async/Concurrency | `p-queue`, `p-limit` |
| Utilities | `lodash` (specific methods), `date-fns` |
| Config | `conf`, `env-paths` |
| Logging | `pino` or `winston`, `debug` |
| Native Deps | `keytar`, `onnxruntime-node`, `better-sqlite3` (Use cautiously) |

### 11.3 Dependency Auditing

Regular security audit requirements:
- Run `pnpm audit` as part of CI pipeline.
- Address all high and critical vulnerabilities promptly.
- Document and plan for addressing medium vulnerabilities.
- Use `.pnpmfile.cjs` for dependency resolution overrides only as a last resort and document thoroughly.

## 12. Development Workflow

### 12.1 Branching Strategy

- `main`: Production-ready code (protected). Merges only from `develop` or `hotfix/*`.
- `develop`: Main integration branch for ongoing development. Features merged here.
- `feature/*`: Branches for developing new features (branched from `develop`).
- `bugfix/*`: Branches for fixing non-critical bugs (branched from `develop`).
- `hotfix/*`: Branches for fixing critical production bugs (branched from `main`, merged to `main` and `develop`).
- `release/*`: Branches for preparing releases (branched from `develop`).

### 12.2 Pull Request Process

1. Create feature/bugfix branch from `develop`.
2. Develop and test locally (including unit/integration tests).
3. Push branch to remote repository.
4. Create Pull Request (PR) targeting `develop`.
5. Ensure CI checks (lint, types, tests, build) pass.
6. Request code review from at least one other team member.
7. Address feedback and ensure CI passes again.
8. Merge PR to `develop` (typically squash merge).

### 12.3 Code Review Guidelines

- All code merged to `develop` or `main` must be reviewed.
- Reviews should focus on:
  - **Correctness:** Does the code meet requirements and function correctly?
  - **Architecture:** Does it align with the defined architecture and domain boundaries?
  - **Maintainability:** Is the code clear, concise, and easy to understand/modify?
  - **Testing:** Is there adequate test coverage (unit, integration)? Do tests pass?
  - **Documentation:** Are TSDoc comments sufficient? Is related Markdown documentation updated?
  - **Performance:** Are there obvious performance issues or inefficient patterns?
  - **Security:** Are potential security implications considered (input validation, credential handling)?
- Use PR templates to ensure reviewers have necessary context. Provide constructive feedback.

## 13. CLI-Specific Development Guidelines

### 13.1 Command Implementation

Commands should be implemented as modules exporting registration functions, using a standard CLI framework like `commander` or `yargs`.

```typescript
// Example using commander: src/commands/sample.ts
import { Command as CommanderCommand } from 'commander'; // Alias to avoid conflict
import type { ExecutionContext } from '@/cli/context.js'; // Use correct path
// Import necessary services

interface SampleCommandOptions {
  verbose?: boolean;
  count: number; // Example with default
}

// Function to register the command with the main program instance
export function registerSampleCommand(program: CommanderCommand): void {
  program
    .command('sample <input>') // Define command name and required arg
    .description('A sample command description.')
    .option('-v, --verbose', 'Enable verbose output', false) // Boolean flag, default false
    .option('-c, --count <number>', 'Specify a count', (value) => parseInt(value, 10), 1) // Number option with default
    .action(async (input: string, options: SampleCommandOptions /* Parsed options */, command: CommanderCommand) => {
      // Access services via a context factory or global mechanism
      // const context = createExecutionContext(options, command.optsWithGlobals()); // Pass global opts too
      // const logger = context.logger;
      // const myService = context.getService<MyService>('myService');

      console.log(`Executing sample command with input: ${input}`);
      console.log(`Options: ${JSON.stringify(options)}`);

      // --- Command Logic ---
      try {
        // await myService.doSomething(input, options.count);
        // context.formatter.success('Operation successful.');
        // process.exitCode = 0; // Let framework handle exit code on success
      } catch (error) {
        // context.formatter.error(error); // Use centralized error formatting
        console.error("Command failed:", error);
        process.exitCode = 1; // Set failure code explicitly on error
      }
      // --- End Command Logic ---
    });
}
```

### 13.2 Output Formatting

CLI output should follow these guidelines:
- Use the central `OutputFormatter` service accessed via `ExecutionContext`.
- Provide clear success/info/warning/error messages.
- Use colors appropriately via `chalk` (handled by formatter), respecting `NO_COLOR`.
- Offer structured output options (`--output json`, `--output yaml`) for machine consumption.
- Use progress indicators (`spinner`, `progressBar`) for long-running operations.

### 13.3 Error Handling

CLI error handling should be centralized where possible, typically in the `CommandExecutor` or via the `OutputFormatter`. Command handlers should generally let specific, typed errors propagate up.

```typescript
// Within CommandExecutor.execute() or similar central point:
try {
  // ... find command, parse args, create context ...
  await command.handler(context);
  // If handler completes without error, exit code is implicitly 0 unless set otherwise
} catch (error) {
  context.formatter.error(error as Error); // Delegate formatting to the formatter
  // formatter.error should set process.exitCode = 1 (or other code) by default
} finally {
  // Cleanup resources if necessary
}

// Within OutputFormatter.error():
error(error: Error | string, exitCode: number = 1): void {
    let message: string;
    let details: string | undefined;
    let stack: string | undefined;

    if (error instanceof SwissKnifeError) { // Use custom error type
        message = `Error [${error.code}]: ${error.message}`;
        details = error.context ? JSON.stringify(error.context) : undefined;
        stack = error.cause?.stack ?? error.stack;
    } else if (error instanceof Error) {
        message = `Error: ${error.message}`;
        stack = error.stack;
    } else {
        message = `Error: ${error}`;
    }

    console.error(chalk.red(message)); // Use chalk via formatter's internal methods
    if (details) {
        console.error(chalk.gray(`  Details: ${details}`));
    }
    // Check global verbose flag from config or args
    const isVerbose = /* context.args.verbose || context.config.get('verbose') */;
    if (isVerbose && stack) {
        console.error(chalk.dim(stack));
    }
    // Set exit code if not already set to a different non-zero value
    if (!process.exitCode || process.exitCode === 0) {
        process.exitCode = exitCode;
    }
}
```

## 14. Environment Setup Instructions

*(These are simplified examples; refer to official tool documentation for details)*

### 14.1 Linux Setup (Debian/Ubuntu Example)

```bash
# Install Node.js (using NVM recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install 18 && nvm use 18 && nvm alias default 18

# Install build tools (for native modules)
sudo apt-get update && sudo apt-get install -y build-essential python3 git

# Install pnpm
npm install -g pnpm

# Clone repository & Install Dependencies
git clone <repo-url> swissknife && cd swissknife
pnpm install
pnpm husky install

# Setup Environment File
cp .env.example .env
# nano .env # Edit with your API keys etc.

# Initial Build
pnpm build
```

### 14.2 macOS Setup

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install NVM & Node.js
brew install nvm
export NVM_DIR="$HOME/.nvm" && . "$(brew --prefix nvm)/nvm.sh" && nvm install 18 && nvm use 18 && nvm alias default 18

# Install pnpm
npm install -g pnpm

# Install Xcode Command Line Tools (for native modules)
xcode-select --install

# Clone repository & Install Dependencies
git clone <repo-url> swissknife && cd swissknife
pnpm install
pnpm husky install

# Setup Environment File
cp .env.example .env
# nano .env # Edit with your API keys etc.

# Initial Build
pnpm build
```

### 14.3 Windows Setup (WSL2 Recommended)

1.  **Install WSL2:** Follow Microsoft's official guide. Choose a Linux distribution like Ubuntu.
2.  **Open WSL Terminal:** Launch your installed Linux distribution (e.g., Ubuntu).
3.  **Follow Linux Setup:** Execute the Linux setup steps above within the WSL terminal.
4.  **VS Code Integration:** Install the "WSL" extension in VS Code and open the project folder from within WSL (`code .` in the WSL terminal within the project directory).

*(Native Windows setup without WSL2 is possible but more complex due to build tool configuration and path differences; follow Node.js and node-gyp instructions for Windows carefully if attempting this.)*

## 15. Troubleshooting Common Issues

### 15.1 Build Issues

| Issue | Resolution |
|-------|------------|
| TypeScript errors (`tsc`) | Check `tsconfig.json`. Ensure types are installed (`pnpm install`). Fix type errors in code. |
| Missing dependencies | Run `pnpm install`. Check `pnpm-lock.yaml` consistency. |
| Native module build failures (`node-gyp`) | Ensure Python, C++ compiler, `make` are installed correctly and in PATH. Check module's specific prerequisites. Clean install (`pnpm install --force` or remove `node_modules` and reinstall). Check `node-gyp` configuration (`pnpm config list`). |

### 15.2 Runtime Issues

| Issue | Resolution |
|-------|------------|
| Permission errors (`EACCES`, `EPERM`) | Check file/directory permissions for config files, cache dirs, or target files. Avoid running with `sudo` unless necessary. |
| Missing environment variables / API Keys | Verify `.env` file is loaded correctly (or variables are set in shell). Check `ApiKeyManager` logic. Use `swissknife config get ...` or `swissknife apikey list ...` to verify stored keys. |
| Network errors (`ECONNREFUSED`, `ETIMEDOUT`) | Check connectivity to external APIs (IPFS, AI Models). Verify URLs in configuration. Check proxy settings. |
| Command not found | Ensure `pnpm build` was successful. If installed globally or linked, check system `PATH`. |
| Module not found (`ERR_MODULE_NOT_FOUND`) | Check `tsconfig.json` (`paths`, `baseUrl`). Ensure `pnpm install` completed. Verify import paths use `.js` extension for relative imports if needed by NodeNext module resolution. |

### 15.3 Testing Issues

| Issue | Resolution |
|-------|------------|
| Failing tests | Check test logic, mock setup, and component code. Run with `jest --verbose` for more details. |
| Timeout errors (`jest.setTimeout`) | Increase timeout in `jest.config.cjs` or for specific slow tests (`it('...', async () => {...}, 60000)`). Optimize slow tests. |
| Coverage issues | Ensure tests cover all critical code paths, including error conditions and branches. Review HTML coverage report. |
| Flaky tests | Identify source of non-determinism (e.g., timing issues, unmocked external state, race conditions). Refactor tests or code for reliability. |

## Conclusion

This development environment specification provides a comprehensive guide for setting up and working with the SwissKnife CLI codebase. Following these guidelines ensures consistency across the development team and facilitates efficient collaboration. The recommended approach involves using Node.js 18 LTS, pnpm, VS Code with specified extensions, and ideally the provided Dev Container configuration for maximum consistency.

For questions or clarifications about this specification, please contact the development team lead.
