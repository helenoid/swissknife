# CLI Development Environment Specification

This document defines the development environment specifications for CLI-focused development of the SwissKnife tool. It outlines the required tools, configurations, and practices to ensure consistent development across the team.

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
| Linux | Ubuntu 20.04+ / Debian 11+ | Full | Primary development environment |
| Linux | Other major distributions | Good | Most features work but may require additional setup |
| macOS | 11.0 (Big Sur)+ | Full | Fully supported |
| Windows | 10/11 | Good | Via WSL2 (recommended) or native with some limitations |

## 2. Runtime Environment

### 2.1 Node.js Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 18.x LTS | Primary supported version |
| Node.js | 20.x LTS | Secondary supported version |
| npm | 8.x+ | For dependency management |
| pnpm | 7.x+ | Preferred package manager |
| yarn | 1.22+ | Supported but not preferred |

### 2.2 Python Requirements (for Neural Network Integration)

| Component | Version | Notes |
|-----------|---------|-------|
| Python | 3.9+ | For ML model utilities |
| pip | 21.0+ | For Python dependencies |
| virtualenv | 20.0+ | For Python environment isolation |

### 2.3 Build Tools

| Component | Version | Purpose |
|-----------|---------|---------|
| gcc/g++ | 9.0+ | For native module compilation |
| make | 4.0+ | For build scripts |
| node-gyp | latest | For native module building |
| python-build-essentials | - | For Python extension compilation |

## 3. Development Tools

### 3.1 Version Control

| Tool | Version | Configuration |
|------|---------|---------------|
| Git | 2.30+ | With LFS support |
| Git LFS | 3.0+ | For managing large files |
| GitHub CLI | latest | For workflow integration |

**Git Configuration**:
```bash
git config --global core.autocrlf input
git config --global pull.rebase true
git config --global rebase.autoStash true
```

### 3.2 Code Editor

| Editor | Version | Required Extensions |
|--------|---------|---------------------|
| VS Code | Latest | Primary recommended editor |
| JetBrains IDEs | Latest | Supported alternative |
| Other editors | - | With TypeScript and ESLint support |

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

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | 8.x | Static code analysis |
| Prettier | 2.x | Code formatting |
| TypeScript | 4.9+ | Type checking |
| Jest | 29.x | Unit testing |
| Husky | 8.x | Git hooks |
| lint-staged | 13.x | Pre-commit linting |

## 4. Containerization

### 4.1 Docker Environment

| Component | Version | Purpose |
|-----------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | 2.x | Container orchestration |
| BuildKit | Enabled | Optimized builds |

### 4.2 Standard Images

| Image | Purpose |
|-------|---------|
| `node:18-alpine` | Lightweight Node.js runtime |
| `node:18` | Full Node.js environment |
| `python:3.9-slim` | Python for ML tools |

### 4.3 Development Container

A `devcontainer.json` configuration is provided for consistent development environments:

```json
{
  "name": "SwissKnife Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:0-18",
  "features": {
    "python": "3.9",
    "github-cli": "latest"
  },
  "runArgs": ["--cap-add=SYS_PTRACE", "--security-opt", "seccomp=unconfined"],
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "orta.vscode-jest",
        "github.vscode-pull-request-github",
        "yzhang.markdown-all-in-one"
      ]
    }
  },
  "postCreateCommand": "pnpm install",
  "remoteUser": "node"
}
```

## 5. Environment Setup

### 5.1 Initial Setup Script

A setup script is provided to initialize the development environment:

```bash
#!/bin/bash
# setup-dev.sh

# Check Node.js version
node_version=$(node -v)
if [[ ! $node_version =~ ^v18 && ! $node_version =~ ^v20 ]]; then
  echo "Error: Node.js v18 or v20 required"
  exit 1
fi

# Install global dependencies
npm install -g pnpm@latest
pnpm install -g typescript ts-node jest

# Clone repository (if not already done)
if [ ! -d "swissknife" ]; then
  git clone https://github.com/organization/swissknife.git
  cd swissknife
else
  cd swissknife
  git pull
fi

# Install dependencies
pnpm install

# Set up git hooks
pnpm husky install

# Build initial version
pnpm build

echo "Development environment successfully set up"
```

### 5.2 Environment Variables

Required environment variables for development:

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging detail | `debug` |
| `DEBUG` | Debug namespaces | `swissknife:*` |
| `API_KEYS_PATH` | Path to API keys | `~/.swissknife/api_keys.json` |
| `CACHE_DIR` | Cache directory | `~/.swissknife/cache` |

Create a `.env.local` file with these variables for local development.

## 6. Build System

### 6.1 Build Scripts

| Script | Purpose |
|--------|---------|
| `pnpm build` | Build production version |
| `pnpm build:dev` | Build development version |
| `pnpm watch` | Watch mode for development |
| `pnpm clean` | Clean build artifacts |

### 6.2 Build Configuration

TypeScript configuration (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### 6.3 Package Configuration

Expected `package.json` configuration:

```json
{
  "name": "swissknife",
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "tsc",
    "build:dev": "tsc --sourceMap",
    "watch": "tsc --watch",
    "clean": "rimraf dist",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "start": "node dist/cli.js",
    "dev": "ts-node src/cli.ts"
  },
  "dependencies": {
    // Core dependencies here
  },
  "devDependencies": {
    // Development dependencies here
  }
}
```

## 7. Testing Environment

### 7.1 Testing Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Jest | 29.x | Unit and integration testing |
| Supertest | 6.x | HTTP testing |
| ts-jest | 29.x | TypeScript integration |
| @testing-library/react | 13.x | React component testing |

### 7.2 Test Configuration

Jest configuration (`jest.config.js`):

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/**/*.test.{ts,tsx}'
  ],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)']
};
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

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push, PR | Build and test code |
| `release.yml` | Tag | Create release |
| `publish.yml` | Release | Publish package |

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

VS Code debug configuration (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch CLI",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/cli.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "pnpm: build",
      "sourceMaps": true,
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasenameNoExtension}", "--config", "jest.config.js"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 9.2 Logging

| Level | Use Case |
|-------|----------|
| `error` | Errors that prevent operation |
| `warn` | Potential issues or deprecated usage |
| `info` | General operational information |
| `debug` | Detailed information for debugging |
| `trace` | Very detailed tracing information |

Configuration in code:
```typescript
import debug from 'debug';

// Create namespaced loggers
const logError = debug('swissknife:error');
const logWarn = debug('swissknife:warn');
const logInfo = debug('swissknife:info');
const logDebug = debug('swissknife:debug');
const logTrace = debug('swissknife:trace');

// Usage
logInfo('Starting process: %s', processName);
```

## 10. Documentation Environment

### 10.1 Documentation Tools

| Tool | Version | Purpose |
|------|---------|---------|
| TypeDoc | 0.24+ | API documentation |
| markdownlint | latest | Markdown linting |
| Docsify | latest | Documentation site |

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
# Generate API documentation
pnpm typedoc --out docs/api src/

# Check markdown
pnpm markdownlint docs/**/*.md

# Serve documentation site locally
pnpm docsify serve docs
```

## 11. Dependency Management

### 11.1 Dependency Policy

- Direct dependencies must specify exact versions or compatible ranges
- Development dependencies should use ^ for minor version flexibility
- Major version upgrades require explicit approval
- All dependencies must pass security audit

### 11.2 Recommended Libraries

| Category | Recommended Libraries |
|----------|----------------------|
| CLI | commander, chalk, inquirer, ora |
| Filesystem | fs-extra, globby, chokidar |
| HTTP | node-fetch, axios |
| Testing | jest, supertest |
| Utilities | lodash-es, date-fns |
| Streams | streamx, node:stream/promises |
| Concurrency | p-limit, p-queue |

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

Commands should follow a consistent pattern:

```typescript
import { Command } from 'commander';

export interface MyCommandOptions {
  verbose?: boolean;
  format?: 'json' | 'text';
}

export default function registerMyCommand(program: Command): void {
  program
    .command('my-command <required-arg>')
    .description('Description of my command')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-f, --format <format>', 'Output format (json or text)', 'text')
    .action(async (requiredArg: string, options: MyCommandOptions) => {
      // Command implementation
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

CLI error handling pattern:

```typescript
try {
  // Command implementation
} catch (error) {
  if (error instanceof SomeSpecificError) {
    console.error(chalk.red(`Specific error: ${error.message}`));
    // Handle specific error
    process.exit(1);
  } else {
    console.error(chalk.red(`Unexpected error: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(2);
  }
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