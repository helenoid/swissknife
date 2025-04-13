# CLI Development Environment Specification

This document specifies the recommended hardware, operating systems, runtime environments, tools, and configurations for developing the SwissKnife CLI application. Adhering to these specifications ensures a consistent and efficient development experience across the team.

## 1. System Requirements

### 1.1 Hardware Recommendations

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 2 GB free | 10+ GB free |
| Network | Regular internet connection | High-speed internet connection |

### 1.2 Operating System Support

| OS | Version | Support Level | Notes |
|----|---------|--------------|-------|
| Linux | Ubuntu 20.04+ / Debian 11+ / Fedora 36+ | Full | Primary development environment. |
| Linux | Other recent major distributions | Good | Most features expected to work, but may require additional setup for native dependencies. |
| macOS | 11.0 (Big Sur)+ (x64 & ARM64) | Full | Fully supported on both Intel and Apple Silicon. |
| Windows | 10 / 11 (x64) | Good | **WSL2 (Windows Subsystem for Linux 2) is strongly recommended** for a consistent Linux-like environment, better performance, and easier native dependency management. Native Windows development is possible but may encounter more compatibility hurdles. |

## 2. Runtime Environment

### 2.1 Node.js Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | **18.x LTS** | **Primary target version.** Use `nvm` (Node Version Manager) or similar to manage versions. |
| Node.js | 20.x LTS | Secondary supported version. Ensure compatibility. |
| npm | Bundled with Node.js | Used for installing global tools like `pnpm`. |
| **pnpm** | **^8.x** | **Preferred package manager** for managing dependencies via `pnpm install`. Ensures efficient disk usage and consistent installs. |
| yarn | 1.22+ / Berry | Supported if necessary, but `pnpm` is preferred. |

### 2.2 Python Requirements (for Neural Network Integration)

| Component | Version | Notes |
|-----------|---------|-------|
| Python | 3.9+ | For ML model utilities |
| pip | 21.0+ | For Python dependencies |
| virtualenv | 20.0+ | For Python environment isolation |

### 2.3 Build Tools

| Component | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| C++ Compiler | `gcc`/`g++` (Linux/macOS) or MS Visual C++ Build Tools (Windows) | 9.0+ / Latest | Required by `node-gyp` for compiling native Node.js modules. |
| `make` | 4.0+ | Common build utility used by some native modules. | Often included with build tools. |
| `node-gyp` | latest | Tool for compiling native addon modules for Node.js. Usually installed automatically with Node.js or npm/pnpm. | Ensure it's configured correctly (e.g., `npm config set msvs_version 2022` on Windows if needed). |
| Python | 3.7+ | `node-gyp` requires Python for its build scripts. | Ensure Python is in the system PATH. |

## 3. Development Tools

### 3.1 Version Control

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Git | 2.30+ | Version control | Essential. |
| Git LFS | 3.0+ | For managing large binary files (e.g., ML models if checked in) | Install via `git lfs install`. |
| GitHub CLI (`gh`) | latest | Optional: For interacting with GitHub (PRs, issues) from the CLI | Useful for streamlined workflow. |

**Git Configuration**:
```bash
git config --global core.autocrlf input
git config --global pull.rebase true
git config --global rebase.autoStash true
```

### 3.2 Code Editor

| Editor | Version | Notes |
|--------|---------|-------|
| **VS Code** | Latest | **Primary recommended editor** due to excellent TypeScript/Node.js support and extension ecosystem. |
| JetBrains IDEs (WebStorm, IntelliJ IDEA Ultimate) | Latest | Supported alternative with good TypeScript support. |
| Other editors (Vim, Neovim, Sublime Text, etc.) | - | Supported, provided they have robust TypeScript and ESLint/Prettier integration configured. |

**VS Code Extensions**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- EditorConfig
- GitHub Pull Requests
- Markdown All in One

**VS Code Configuration**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "javascript.updateImportsOnFileMove.enabled": "always"
}
```

### 3.3 Code Quality Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| ESLint | ^8.x | Static code analysis, enforcing coding style | Configured via `.eslintrc.js`. |
| Prettier | ^2.x / ^3.x | Automatic code formatting | Configured via `.prettierrc`. Integrated with ESLint. |
| TypeScript | ^5.x | Language, type checking | Configured via `tsconfig.json`. |
| Jest | ^29.x | Unit and integration testing framework | Configured via `jest.config.js`. |
| Husky | ^8.x | Git hooks management (e.g., pre-commit) | Configured in `package.json` or `.husky/`. |
| lint-staged | ^13.x | Run linters/formatters on staged files before commit | Configured in `package.json`. Used with Husky. |

## 4. Containerization

### 4.1 Docker Environment

| Component | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Docker Engine | 20.10+ | Container runtime | For running services (e.g., mock IPFS), build environments, or the dev container. |
| Docker Compose | v2.x | Container orchestration | For defining and running multi-container setups (if needed). |
| BuildKit | Enabled | Docker build feature | Should be enabled by default in recent Docker versions for faster, more efficient builds. |

### 4.2 Standard Images

| Image | Purpose |
|-------|---------|
| `node:18-alpine` | Lightweight Node.js runtime |
| `node:18` | Full Node.js environment |
| `python:3.9-slim` | Python for ML tools |

### 4.3 Development Container

A `.devcontainer/devcontainer.json` configuration is provided for use with VS Code Dev Containers or GitHub Codespaces, ensuring a fully pre-configured and consistent Linux-based environment.

```json
// .devcontainer/devcontainer.json (Example Snippet)
{
  "name": "SwissKnife Dev Container",
  // Use a base image with Node.js pre-installed
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18", // Specify Node 18 LTS

  // Add features needed for development (e.g., Python, Docker, GitHub CLI)
  "features": {
    "ghcr.io/devcontainers/features/python:1": { // Example Python feature
      "version": "3.9"
    },
    "ghcr.io/devcontainers/features/github-cli:1": {}, // Example GitHub CLI
    "ghcr.io/devcontainers/features/docker-in-docker:2": {} // If Docker needed inside container
  },

  // Forward necessary ports (if running services)
  // "forwardPorts": [3000],

  // Set container environment variables if needed
  // "containerEnv": { "MY_VARIABLE": "value" },

  // Run commands after container is created
  "postCreateCommand": "sudo apt-get update && sudo apt-get install -y build-essential || echo 'apt failed, continuing...' && pnpm install && pnpm husky install",

  // Configure VS Code settings and extensions within the container
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        // ... other settings ...
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "orta.vscode-jest", // Jest runner
        "ms-vscode.vscode-typescript-next", // Use workspace TS version
        "github.vscode-pull-request-github",
        "eamodio.gitlens", // GitLens
        "yzhang.markdown-all-in-one" // Markdown utilities
        // Add other useful extensions
      ]
    }
  },

  // Use non-root user
  "remoteUser": "node"
}
```

## 5. Environment Setup

Steps to set up the development environment manually (if not using Dev Containers).

### 5.1 Initial Setup Steps

1.  **Install Node.js:** Install Node.js LTS version 18.x. Using a version manager like `nvm` is highly recommended:
    ```bash
    nvm install 18
    nvm use 18
    nvm alias default 18
    ```
2.  **Install pnpm:** Install the preferred package manager globally:
    ```bash
    npm install -g pnpm
    ```
3.  **Install Build Tools:** Ensure necessary build tools (C++ compiler, make, Python 3) are installed for native module compilation (refer to `node-gyp` documentation for platform specifics).
4.  **Clone Repository:** Clone the SwissKnife repository:
    ```bash
    git clone https://github.com/organization/swissknife.git
    cd swissknife
    ```
5.  **Install Dependencies:** Install project dependencies using pnpm:
    ```bash
    pnpm install
    ```
6.  **Setup Git Hooks:** Initialize Husky git hooks:
    ```bash
    pnpm husky install
    ```
7.  **Build Project:** Perform an initial build:
    ```bash
    pnpm build
    ```
8.  **Environment Variables:** Create a `.env.local` file (copied from `.env.example`) for local environment variables (API keys, etc.). **Do not commit `.env.local`**.
    ```bash
    cp .env.example .env.local
    # Edit .env.local with your specific settings/keys
    ```
9.  **(Optional) Install Editor Extensions:** Install recommended VS Code extensions listed in Section 3.2.

*Note: The `setup-dev.sh` script mentioned previously could automate some of these steps.*

### 5.2 Environment Variables

Key environment variables used during development (typically set in `.env.local` which is gitignored):

| Variable | Purpose | Example Value | Notes |
|----------|---------|---------------|-------|
| `NODE_ENV` | Sets runtime environment | `development` | Affects logging, potentially other behaviors. Use `test` for testing. |
| `LOG_LEVEL` | Controls logging verbosity | `debug` | e.g., `error`, `warn`, `info`, `debug`, `trace`. |
| `DEBUG` | Enables specific debug namespaces | `swissknife:*` | For use with the `debug` library. |
| `OPENAI_API_KEY` | API Key for OpenAI | `sk-...` | Loaded by config/credential manager. **Do not commit.** |
| `ANTHROPIC_API_KEY` | API Key for Anthropic | `sk-ant-...` | Loaded by config/credential manager. **Do not commit.** |
| `IPFS_API_URL` | URL for IPFS Kit Server | `http://localhost:5001` | Loaded by config. |
| `SWISSKNIFE_CONFIG_DIR` | Override default config dir | `/path/to/alt/config` | Optional override. |
| `SWISSKNIFE_CACHE_DIR` | Override default cache dir | `/path/to/alt/cache` | Optional override. |

*See `.env.example` for a full list.*

## 6. Build System

### 6.1 Build Scripts

| Script (`package.json`) | Purpose |
|-------------------------|---------|
| `pnpm build` | Compile TypeScript to JavaScript (`dist` folder) for production. |
| `pnpm build:dev` | Compile TypeScript with source maps for development/debugging. |
| `pnpm watch` | Run `tsc` in watch mode for continuous compilation during development. |
| `pnpm clean` | Remove the `dist` directory and other build artifacts. |
| `pnpm lint` | Run ESLint to check for code style issues and potential errors. |
| `pnpm format` | Run Prettier to automatically format code. |
| `pnpm test` | Run Jest test suite (unit, integration). |
| `pnpm test:watch` | Run Jest in watch mode. |
| `pnpm test:e2e` | Run End-to-End CLI tests (requires build). |
| `pnpm test:cov` | Run tests and generate code coverage report. |
| `pnpm start` | Run the compiled CLI from the `dist` folder (requires build). |
| `pnpm dev` | Run the CLI directly using `ts-node` for development (no build needed). |
| `pnpm husky install` | Setup Git hooks (run once after install). |

### 6.2 Build Configuration

TypeScript configuration (`tsconfig.json`): *Ensure alignment with Node.js version and module system.*

```json
// tsconfig.json (Key Settings)
{
  "compilerOptions": {
  "compilerOptions": {
    "target": "ES2022", // Target modern Node.js versions
    "module": "NodeNext", // Use modern Node.js module system
    "moduleResolution": "NodeNext", // Module resolution strategy
    "esModuleInterop": true, // Improve interoperability with CommonJS
    "sourceMap": true, // Generate source maps for debugging
    "declaration": true, // Generate .d.ts files
    "declarationMap": true, // Generate source maps for .d.ts files
    "strict": true, // Enable all strict type-checking options
    "skipLibCheck": true, // Skip type checking of declaration files
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist", // Output directory for compiled JS
    "rootDir": "./src", // Root directory of source files
    "baseUrl": ".", // Base directory for path mapping
    "paths": { // Path aliases
      "@/*": ["src/*"]
    },
    "lib": ["ES2022", "DOM"] // Include DOM lib for types used by some dependencies (like MCP SDK) even if not directly used
  },
  "include": ["src/**/*.ts"], // Files to include in compilation
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
  "type": "module", // Use ES Modules
  "engines": {
    "node": ">=18.0.0" // Specify minimum Node.js version
  },
  "bin": { // Define the CLI command
    "swissknife": "./dist/cli.js"
  },
  "scripts": {
    // Build scripts (build, build:dev, watch, clean)
    // Linting & Formatting (lint, format)
    // Testing (test, test:watch, test:e2e, test:cov)
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
  "files": [ // Files included in published package
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": { // Optional: npm publish settings
    "access": "public"
  }
  // Lint-staged and Husky config might also be here
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

Jest configuration (`jest.config.js` or `jest.config.ts`):

```typescript
// jest.config.ts (Example)
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset for NodeNext modules
  testEnvironment: 'node',
  moduleNameMapper: {
    // Handle path aliases defined in tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle ESM module imports correctly if needed
    // Example: '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // Use ts-jest for TypeScript files
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Important for ESM
        tsconfig: 'tsconfig.json', // Ensure it uses the correct tsconfig
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat these as ESM
  collectCoverage: true, // Enable coverage collection
  coverageDirectory: 'coverage', // Output directory for reports
  coverageProvider: 'v8', // Use V8's built-in coverage
  collectCoverageFrom: [ // Specify files to include in coverage
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts', // Exclude declaration files
    '!src/types/**', // Exclude type definitions
    '!src/cli.ts', // Exclude main entry point if simple
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/test/**',
  ],
  testMatch: [ // Patterns for test files
    '**/test/unit/**/*.test.[jt]s?(x)',
    '**/test/integration/**/*.test.[jt]s?(x)',
    // E2E tests might be run separately
  ],
  // setupFilesAfterEnv: ['./test/setup.ts'], // Optional setup file
  // testTimeout: 30000, // Increase timeout if needed
};

export default config;
```

### 7.3 Test Organization

```
test/
├── unit/             # Unit tests
│   ├── commands/     # Command tests
│   ├── tools/        # Tool tests
│   └── utils/        # Utility tests
├── integration/      # Integration tests
│   ├── api/          # API tests
│   ├── cli/          # CLI tests
│   └── storage/      # Storage tests
├── e2e/              # End-to-end tests
│   ├── scenarios/    # Test scenarios
│   └── fixtures/     # Test fixtures
└── mocks/            # Mock implementations
    ├── services/     # Service mocks
    └── data/         # Test data
```

## 8. CI/CD Environment

### 8.1 GitHub Actions Workflows

| Workflow File | Trigger | Purpose | Key Steps |
|---------------|---------|---------|-----------|
| `ci.yml` | `pull_request` to `main`/`develop` | Core validation | Lint, Type Check, Build, Unit Tests, Integration Tests (Primary OS) |
| `main.yml` | `push` to `main`/`develop` | Full validation & Coverage | Lint, Type Check, Build, Unit/Integration/E2E Tests (Matrix: Linux, macOS, Win), Coverage Upload |
| `release.yml` | `push` tag `v*.*.*` | Create GitHub Release | Build Artifacts (Binaries/Installers), Generate Checksums, Upload Artifacts, Create Release Notes |
| `publish.yml` | `release` published | Publish to npm | Download Artifacts (optional), `npm publish` |

Example CI workflow:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### 8.2 Continuous Integration Requirements

- All tests must pass before merging
- Code coverage must be at least 80%
- ESLint must report no errors
- TypeScript must compile without errors
- Builds must succeed on all supported platforms

### 8.3 Release Process

1. Create release branch `release/vX.Y.Z`
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Create PR and merge to main
5. Tag with version `vX.Y.Z`
6. CI automatically builds and publishes

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
      "name": "Launch CLI",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/ts-node/dist/bin.js", // Use ts-node for direct TS execution
      "args": ["${workspaceFolder}/src/cli.ts", /* Add CLI args here */ "agent", "chat"], // Example args
      "runtimeArgs": ["--loader", "ts-node/esm"], // Needed for ESM with ts-node
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "sourceMaps": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen" // Don't open separate debug console
    },
    {
      // Configuration to debug the currently open Jest test file
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}", // Run only the current file
        "--config", "jest.config.js",
        "--runInBand" // Run tests serially in the same process for easier debugging
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
if (config.verbose) { // Example conditional logging
    log('Detailed context: %O', context);
}
```

## 10. Documentation Environment

### 10.1 Documentation Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| TypeDoc | ^0.24+ | Generate API reference from TSDoc comments | Configured via `typedoc.json`. |
| `markdownlint-cli` | latest | Lint Markdown files for style consistency | Configured via `.markdownlint.jsonc`. |
| Static Site Generator | Optional | e.g., Docusaurus, MkDocs, Docsify | For hosting browsable documentation online. |

### 10.2 Documentation Structure

```
docs/
├── api/              # API documentation (generated)
├── guides/           # User guides
│   ├── getting-started.md
│   ├── commands.md
│   └── advanced.md
├── development/      # Developer documentation
│   ├── contributing.md
│   ├── architecture.md
│   └── testing.md
├── references/       # Reference documentation
│   ├── cli.md
│   ├── config.md
│   └── api.md
└── index.md          # Documentation home
```

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

- Direct dependencies must specify exact versions or compatible ranges
- Development dependencies should use ^ for minor version flexibility
- Major version upgrades require explicit approval
- All dependencies must pass security audit

### 11.2 Recommended Libraries

| Category | Recommended Libraries | Notes |
|----------|-----------------------|-------|
| CLI Framework | `commander` or `yargs` | For parsing, options, help |
| Styling | `chalk` | Terminal colors/styles |
| Interactive | `inquirer` | Prompts (list, confirm, input) |
| Progress | `ora` (spinners), `cli-progress` (bars) | Visual feedback |
| Filesystem | `fs-extra` (enhancements), `globby` (glob patterns) | Use `fs/promises` where possible |
| HTTP Client | `axios` or built-in `fetch` | For API interactions |
| Testing | `jest`, `ts-jest` | Core testing framework |
| Async/Concurrency | `p-queue`, `p-limit` | Rate limiting, concurrency control |
| Utilities | `lodash` (or specific methods), `date-fns` | General helpers |
| Config | `conf`, `env-paths` | Config file management |
| Logging | `pino` or `winston`, `debug` | Structured & debug logging |
| Native Deps | `keytar` (keychain), `onnxruntime-node` (ML), `better-sqlite3` (DB) | Use cautiously, check compatibility |

### 11.3 Dependency Auditing

Regular security audit requirements:
- Run `pnpm audit` before releases
- Address all high and critical vulnerabilities
- Document and plan for medium vulnerabilities
- Use `.pnpmfile.cjs` for dependency resolution overrides

## 12. Development Workflow

### 12.1 Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development
- `bugfix/*`: Bug fixes
- `release/*`: Release preparation

### 12.2 Pull Request Process

1. Create branch from `develop`
2. Develop and test locally
3. Push branch and create PR
4. Ensure CI passes
5. Request code review
6. Address feedback
7. Merge to `develop`

### 12.3 Code Review Guidelines

- All code must be reviewed before merging
- Reviews should focus on:
  - Code correctness
  - Test coverage
  - Documentation
  - Performance considerations
  - Security implications
- Use PR templates to ensure complete information

## 13. CLI-Specific Development Guidelines

### 13.1 Command Implementation

Commands should be implemented as modules that export a registration function, typically using `commander` or `yargs`.

```typescript
// Example using commander: src/cli/commands/sample.ts
import { Command } from 'commander';
import { ExecutionContext } from '../context'; // Assuming context definition
// Import necessary services

interface SampleCommandOptions {
  verbose?: boolean;
  count: number; // Example with default
}

// Function to register the command with the main program instance
export function registerSampleCommand(program: Command): void {
  program
    .command('sample <input>') // Define command name and required arg
    .description('A sample command description.')
    .option('-v, --verbose', 'Enable verbose output', false) // Boolean flag, default false
    .option('-c, --count <number>', 'Specify a count', (value) => parseInt(value, 10), 1) // Number option with default
    .action(async (input: string, options: SampleCommandOptions /* Parsed options */) => {
      // Access services via a context factory or global mechanism
      // const context = createExecutionContext(options);
      // const logger = context.logger;
      // const myService = context.getService<MyService>('myService');

      console.log(`Executing sample command with input: ${input}`);
      console.log(`Options: ${JSON.stringify(options)}`);

      // --- Command Logic ---
      try {
        // await myService.doSomething(input, options.count);
        // context.formatter.success('Operation successful.');
        process.exitCode = 0; // Explicitly set success code
      } catch (error) {
        // context.formatter.error(error); // Use centralized error formatting
        console.error("Command failed:", error);
        process.exitCode = 1; // Set failure code
      }
      // --- End Command Logic ---
    });
}
```

### 13.2 Output Formatting

CLI output should follow these guidelines:

- Use colors for enhanced readability but ensure they can be disabled
- Provide structured output option (JSON) for machine consumption
- Clear error messages with actionable information
- Progress indicators for long-running operations

### 13.3 Error Handling

CLI error handling should be centralized where possible, typically in the `CommandExecutor` or via the `OutputFormatter`. Command handlers should generally let errors propagate.

```typescript
// Within CommandExecutor.execute() or similar central point:
try {
  // ... find command, parse args, create context ...
  await command.handler(context);
  process.exitCode = process.exitCode ?? 0; // Ensure success code if not set
} catch (error) {
  context.formatter.error(error as Error); // Delegate formatting to the formatter
  process.exitCode = process.exitCode ?? 1; // Ensure failure code if not set by formatter.error
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

    console.error(chalk.red(message));
    if (details) {
        console.error(chalk.gray(`  Details: ${details}`));
    }
    // Check global verbose flag from config or args
    const isVerbose = /* context.args.verbose || context.config.get('verbose') */;
    if (isVerbose && stack) {
        console.error(chalk.dim(stack));
    }
    // Set exit code if not already set to a different non-zero value
    process.exitCode = process.exitCode && process.exitCode !== 0 ? process.exitCode : exitCode;
}
```

## 14. Environment Setup Instructions

### 14.1 Linux Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install development tools
sudo apt-get install -y build-essential git

# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/organization/swissknife.git
cd swissknife

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your settings

# Build
pnpm build
```

### 14.2 macOS Setup

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/organization/swissknife.git
cd swissknife

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your settings

# Build
pnpm build
```

### 14.3 Windows Setup (WSL2)

```bash
# Install WSL2 (run in PowerShell as Administrator)
wsl --install

# After restart, install Node.js in WSL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install development tools
sudo apt-get install -y build-essential git

# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/organization/swissknife.git
cd swissknife

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your settings

# Build
pnpm build
```

## 15. Troubleshooting Common Issues

### 15.1 Build Issues

| Issue | Resolution |
|-------|------------|
| TypeScript errors | Update types, fix type errors in code |
| Missing dependencies | Run `pnpm install` to update dependencies |
| Native module build failures | Install required system packages, check node-gyp setup |

### 15.2 Runtime Issues

| Issue | Resolution |
|-------|------------|
| Permission errors | Check file/directory permissions |
| Missing environment variables | Verify .env file is properly set up |
| Network errors | Check connectivity, proxy settings |

### 15.3 Testing Issues

| Issue | Resolution |
|-------|------------|
| Failing tests | Check test environment setup, mock dependencies |
| Timeout errors | Increase timeout settings, optimize test performance |
| Coverage issues | Ensure tests cover all code paths |

## Conclusion

This development environment specification provides a comprehensive guide for setting up and working with the SwissKnife CLI codebase. Following these guidelines ensures consistency across the development team and facilitates efficient collaboration.

For questions or clarifications about this specification, please contact the development team lead.
