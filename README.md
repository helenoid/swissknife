# SwissKnife

![SwissKnife Logo](https://github.com/user-attachments/assets/7a9253a7-8bb0-40d5-a3f3-5e6096d7c789)

A powerful, terminal-based AI coding tool with unified architecture that combines agent capabilities, ML acceleration, advanced task processing, and IPFS integration into one cohesive TypeScript codebase.

## Key Features

- **Unified TypeScript Codebase**: All components integrated into a single, seamless TypeScript codebase
- **AI Agent Capabilities**: Clean room implementation of Goose features with advanced coding assistance
- **ML Acceleration**: Hardware-accelerated machine learning integrated directly into the CLI
- **Graph-of-Thought Processing**: Sophisticated reasoning with non-linear, graph-based problem solving
- **Fibonacci Heap Scheduling**: Efficient task prioritization and management
- **IPFS Kit Integration**: Content-addressable storage via the Python-based IPFS Kit MCP Server
- **Rich Terminal UI**: Interactive, responsive CLI experience with advanced formatting

See our [Unified Integration Plan](unified_integration_plan.md) and [Unified Architecture Documentation](docs/UNIFIED_ARCHITECTURE.md) for more details.

## HOW TO USE

### Option 1: Install from NPM (stable release)

```bash
npm install -g swissknife
cd your-project
kode
```

### Option 2: Install from source (latest development version)

```bash
# Clone the repository
git clone https://github.com/endomorphosis/swissknife.git
cd swissknife

# Run the installer script (this will install dependencies, build, and install globally)
./install.sh
# OR
npm run install-global

# Use the tool
cd swissknife
```

## Installation by Operating System

### macOS

1. Prerequisites:
   - Install Node.js 18+ via [official website](https://nodejs.org/) or using homebrew: `brew install node`
   - Make sure you have Git installed: `brew install git`

2. Install from NPM:
   ```bash
   npm install -g anon-kode
   cd your-project
   kode
   ```

3. Or build from source:
   ```bash
   git clone https://github.com/endomorphosis/swissknife.git
   cd swissknife
   ./install.sh
   ```

### Windows

1. Prerequisites:
   - Install Node.js 18+ from the [official website](https://nodejs.org/)
   - Install Git from [git-scm.com](https://git-scm.com/download/win)
   - Consider using Windows Terminal for best experience

2. Install from NPM:
   ```bash
   npm install -g anon-kode
   cd your-project
   kode
   ```

3. Or build from source (in PowerShell or Command Prompt):
   ```bash
   git clone https://github.com/endomorphosis/swissknife.git
   cd swissknife
   # On Windows, install dependencies and build manually:
   npm install --legacy-peer-deps
   npm install -g bun
   bun run build
   npm install -g . --force
   ```

### Linux

1. Prerequisites:
   - Install Node.js 18+ via package manager or [NodeSource](https://github.com/nodesource/distributions)
   - Example for Ubuntu/Debian:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs git
     ```

2. Install from NPM:
   ```bash
   npm install -g anon-kode
   cd your-project
   kode
   ```

3. Or build from source:
   ```bash
   git clone https://github.com/endomorphosis/swissknife.git
   cd swissknife
   ./install.sh
   ```

The installer script will:
- Check your Node.js version (requires Node.js 18+)
- Install Bun if not already installed
- Install dependencies with appropriate flags
- Build the project
- Install the tool globally
- Create `swissknife` commands

For more information, run `./install.sh --help`

You can use the onboarding to set up the model, or `/model`.
If you don't see the models you want on the list, you can manually set them in `/config`
As long as you have an openai-like endpoint, it should work.

## Advanced Features

### Graph-of-Thought Reasoning

SwissKnife implements advanced Graph-of-Thought reasoning that represents problem-solving as a directed acyclic graph (DAG) instead of a linear sequence. This enables:

- Parallel exploration of multiple reasoning paths
- Sophisticated problem decomposition
- Dynamic reprioritization of tasks
- Resilience against reasoning dead-ends

Enable Graph-of-Thought with the `/got` command or in settings.

### Fibonacci Heap Scheduler

Our task scheduler uses a Fibonacci heap implementation for optimal task prioritization:

- O(1) amortized insertion time
- O(1) amortized decrease-key operations
- Dynamic priority adjustment based on dependencies
- Intelligent workload balancing

### IPFS Integration

SwissKnife directly integrates with the Python-based IPFS Kit MCP Server for:

- Content-addressed storage
- IPLD data structures
- Persistent knowledge graphs
- Multi-tier caching

## USE AS MCP SERVER

Find the full path to `swissknife` with `which swissknife` then add the config to Claude Desktop:

```json
{
  "mcpServers": {
    "claude-code": {
      "command": "/path/to/swissknife",
      "args": ["mcp", "serve"]
    }
  }
}
```

## Developer Documentation

### Project Structure

SwissKnife follows a domain-driven directory structure:

```
/src
├── ai/                      # AI capabilities
│   ├── agent/               # Core agent functionality
│   ├── tools/               # Tool system and implementations
│   └── models/              # Model providers and execution
├── cli/                     # CLI and UI components
├── ml/                      # Machine learning acceleration
├── tasks/                   # Task processing system with Graph-of-Thought
├── storage/                 # Storage systems with IPFS integration
└── utils/                   # Shared utilities
```

See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for more details.

### Development Workflow

```bash
# Install dependencies
pnpm i  # or npm install --legacy-peer-deps

# Make sure Bun is installed (required for build)
# If not installed: npm install -g bun

# Development (run in development mode)
pnpm run dev  # or npm run dev

# Build (creates the executable)
bun run build

# Install globally for testing
npm run install-global  # or ./install.sh
```

Get more logs while debugging:
```bash
NODE_ENV=development pnpm run dev --verbose --debug
# or
NODE_ENV=development npm run dev -- --verbose --debug
```

### Workflow

1. Make changes to the code
2. Test locally with `pnpm run dev` or `npm run dev`
3. Build with `bun run build`
4. Install globally with `npm run install-global`
5. Test the global installation with `swissknife`

## Bug Reporting

You can submit a bug from within the app with `/bug`, which generates a detailed bug report for GitHub issues with information about your environment.

## Privacy

- No telemetry or backend servers other than the AI providers you choose
- All data processing happens locally except for AI model inference

## Uninstallation

To uninstall the tool:

```bash
# Uninstall the global package
npm uninstall -g swissknife

# If you installed Bun just for this project and don't need it anymore
npm uninstall -g bun
```

## License

[License terms](LICENSE.md)