# Getting Started with SwissKnife

This guide helps new developers get started with the SwissKnife project, a powerful CLI tool with AI capabilities, built on a unified TypeScript architecture.

## Project Overview

SwissKnife is a powerful, terminal-based AI coding tool built entirely in TypeScript. It provides a unified interface to interact with various AI models (OpenAI, Anthropic, local models, etc.) for coding assistance, content generation, and complex task execution.

The core architecture integrates several advanced components:
- **AI Agent**: Manages conversations, uses tools, and orchestrates complex reasoning.
- **Graph-of-Thought (GoT) Engine**: Enables non-linear problem-solving for complex tasks.
- **Enhanced TaskNet**: Features a high-performance Fibonacci Heap scheduler and advanced task decomposition/synthesis. Includes coordination mechanisms (Merkle Clock, Hamming Distance) for potential future distributed execution.
- **ML Engine**: Integrates local model inference capabilities using Node.js bindings (e.g., ONNX Runtime).
- **Virtual Filesystem (VFS)**: Abstracts storage operations over multiple backends (local filesystem, IPFS).
- **IPFS Integration**: Uses an IPFS client (e.g., connecting to IPFS Kit MCP Server) for content-addressable storage.
- **MCP Integration**: Supports acting as an MCP server and managing connections to other MCP servers.
- **Rich CLI**: Interactive terminal UI built with Ink/React.

All functionality is implemented in TypeScript following clean room principles, based on requirements derived from previous projects like Goose and IPFS Accelerate, but without direct code translation or Rust dependencies. See [CLEAN_ROOM_IMPLEMENTATION.md](./CLEAN_ROOM_IMPLEMENTATION.md).

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Basic knowledge of TypeScript and React
- Access to API keys for the models you want to use

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/endomorphosis/swissknife.git
   cd swissknife
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

## Configuration

There are two main ways to configure the application:

1. **Environment Variables**: Set API keys directly in your environment:
   ```bash
   export OPENAI_API_KEY=your_openai_api_key
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   export SWISSKNIFE_MCP_URL=your_mcp_server_url
   # etc.
   ```

2. **In-App Configuration**: Use the `/config` command in the app to configure providers, API keys, and other settings. The application saves these in a configuration file.

## Understanding the Codebase

The codebase is organized by domain rather than by source component, creating clear boundaries between different areas of functionality:

### Domain Organization

The project follows a domain-driven structure within `src/`:

- `src/`
  - `ai/`: Core AI agent logic, model interactions, tool execution, thinking processes (GoT).
    - `agent/`: The main `Agent` class and related components.
    - `models/`: `ModelRegistry`, `ModelProvider` interfaces and implementations, `ModelExecutionService`.
    - `tools/`: `ToolExecutor`, `Tool` interface, specific tool implementations.
    - `thinking/`: `ThinkingManager`, `GoTEngine`, graph structures (`node.ts`, `graph.ts`).
  - `auth/`: Authentication, authorization, API key management (`api-key-manager.ts`), UCAN logic.
  - `cli/`: CLI entry point (`cli.ts`), command parsing, execution context, help generation, output formatting.
  - `commands/`: Implementations of specific CLI commands (e.g., `agent.ts`, `config.ts`, `mcp.ts`, `task.ts`). Uses Ink/React for UI.
  - `components/`: Reusable React components for the Ink-based CLI UI.
  - `config/`: `ConfigurationManager` for handling settings.
  - `constants/`: Shared constants, product info, potentially default model definitions.
  - `entrypoints/`: Secondary entry points (e.g., `mcp.ts` for running as an MCP server).
  - `ml/`: Machine Learning engine, model loading, inference execution, hardware detection (Node.js specific).
  - `services/`: Higher-level services coordinating multiple components (e.g., `mcpClient.ts` managing MCP connections).
  - `storage/`: Virtual Filesystem (VFS) abstraction (`operations.ts`, `backend.ts`, `registry.ts`, `path-resolver.ts`) and backends (`filesystem.ts`, `ipfs.ts`). Includes IPFS client (`mcp-client.ts` or `ipfs-client.ts`).
  - `tasks/`: Enhanced TaskNet system.
    - `manager.ts`: `TaskManager` for creating and tracking tasks.
    - `scheduler/`: `TaskScheduler` using `FibonacciHeap`.
    - `execution/`: `TaskExecutor` for running tasks locally or delegating.
    - `workers/`: Local worker pool using `worker_threads`.
    - `coordination/`: Merkle Clock and Hamming Distance logic for distribution.
    - `decomposition/`: Task decomposition strategies.
    - `synthesis/`: Result synthesis strategies.
    - `graph/`: GoT structures (`node.ts`, `graph.ts`, `manager.ts` might live here or top-level tasks).
  - `types/`: Shared TypeScript type definitions (e.g., `ai.ts`, `cli.ts`, `tasks.ts`).
  - `utils/`: Common utilities (logging, encryption, environment detection, etc.).

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for more details.

### Key Components

- **AI Agent System**: Core agent implementation with tool execution capabilities
- **Model Registry**: Management of different AI models from various providers
- **Graph-of-Thought**: Advanced non-linear reasoning system
- **Fibonacci Heap Scheduler**: Efficient task prioritization and execution
- **IPFS Client**: API-based integration with an IPFS node (e.g., IPFS Kit MCP Server).
- **CLI Command System**: Rich terminal interface with command registry, parsing, and execution logic.

## Detailed Documentation

For in-depth information about the architecture and implementation details for each development phase, refer to the following documents:

- **Phase 1:** [Analysis & Planning](./phase1/) (Includes component inventory, mapping, architecture definition, integration strategy)
- **Phase 2:** [Core Implementation](./phase2/) (Covers AI, ML, Task, Storage, CLI core implementations)
- **Phase 3:** [TaskNet Enhancement](./phase3/) (Details GoT, Scheduler, Coordination, Decomposition/Synthesis)
- **Phase 4:** [CLI Integration](./phase4/) (Details command implementations and cross-component workflows)
- **Phase 5:** [Optimization & Finalization](./phase5/) (Covers performance, testing, final docs, release prep)

See also:
- [Unified Architecture](./UNIFIED_ARCHITECTURE.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Making Changes

When making changes to the codebase, follow these guidelines:

1. **Domain Boundaries**: Respect domain boundaries and use well-defined interfaces for cross-domain communication
2. **TypeScript Patterns**: Follow TypeScript best practices and leverage the type system for safety
3. **Testing**: Add tests for new functionality, including unit tests for components and integration tests for cross-domain functionality
4. **Documentation**: Update relevant documentation in the `docs/` directory

## Common Development Tasks

### Adding a New Model Provider

1. Create a new provider implementation in `src/ai/models/providers/`
2. Implement the `ModelProvider` interface
3. Register the provider in the model registry
4. Add configuration handling in the config system
5. Update relevant CLI commands

```typescript
// Example: src/ai/models/providers/custom-provider.ts
import { ModelProvider, Model, ModelResponse } from '../../types/model';

export class CustomProvider implements ModelProvider {
  id = 'custom-provider';
  name = 'Custom AI Provider';
  
  constructor(private apiKey: string) {}
  
  getAvailableModels(): string[] {
    return ['standard', 'advanced'];
  }
  
  createModel(modelId: string): Model {
    return {
      id: modelId,
      provider: this.id,
      name: `${this.name} ${modelId}`,
      
      async generate(options) {
        // Implementation details...
        return { content: 'Response text' };
      }
    };
  }
  
  getDefaultModel(): Model {
    return this.createModel('standard');
  }
}
```

### Implementing a Custom Tool

1. Create a new tool implementation in `src/ai/tools/implementations/`
2. Implement the `Tool` interface
3. Register the tool with the agent

```typescript
// Example: src/ai/tools/implementations/custom-tool.ts
import { Tool } from '../tool';

export class CustomTool implements Tool {
  name = 'custom.tool';
  description = 'A custom tool for specific operations';
  parameters = {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input to process'
      }
    },
    required: ['input']
  };
  
  async execute(args: any): Promise<any> {
    // Tool implementation...
    return {
      result: `Processed: ${args.input}`,
      success: true
    };
  }
}
```

### Adding a New CLI Command

1. Create a command implementation in `src/cli/commands/`
2. Register the command with the command registry

```typescript
// Example: src/cli/commands/custom-command.ts
import { Command } from '../types/command';

export function registerCustomCommands() {
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'custom.command',
    name: 'custom command',
    description: 'Performs a custom operation',
    args: [
      {
        name: 'input',
        description: 'Input to process',
        required: true
      }
    ],
    
    async handler(args, context) {
      try {
        // Command implementation...
        context.ui.success(`Processed: ${args.input}`);
        return 0;
      } catch (error) {
        context.ui.error(`Error: ${error.message}`);
        return 1;
      }
    }
  });
}
```

## Interacting with Storage (including IPFS)

SwissKnife uses a Virtual Filesystem (VFS) accessed via `StorageOperations` to interact with different storage backends.

```typescript
// Example: Using StorageOperations
import { StorageOperations } from '../storage/operations'; // Adjust path
import { ConfigManager } from '../config/manager'; // Adjust path

async function storeAndReadFile(filePath: string, virtualDestPath: string) {
  // StorageOperations instance (likely obtained via ExecutionContext)
  const storageOps = new StorageOperations(/* registry, resolver */);

  // Read local file
  const content = await fs.readFile(filePath); // Use Node fs for local read

  // Write to the virtual path (which might resolve to IPFS backend)
  await storageOps.writeFile(virtualDestPath, content);
  console.log(`File written to ${virtualDestPath}`);

  // Read back from the virtual path
  const retrievedContent = await storageOps.readFile(virtualDestPath);
  console.log(`Read back ${retrievedContent.length} bytes.`);
  return retrievedContent;
}

// Example usage:
// storeAndReadFile('./local-data.txt', '/ipfs/my-data.txt');
// storeAndReadFile('./image.png', '/local/images/image.png');
```

```typescript
// Example: Using the MCP client
import { MCPClient } from '../../storage/ipfs/mcp-client';
import { ConfigManager } from '../../config/manager';

async function storeFile(filePath: string) {
  // Get MCP client configuration
  const config = ConfigManager.getInstance();
  const mcpClient = new MCPClient({
    baseUrl: config.get('storage.mcp.baseUrl'),
    authentication: {
      type: config.get('storage.mcp.authType'),
      value: config.get('storage.mcp.authValue')
    }
  });
  
  // Read file and store in IPFS
  const content = await fs.readFile(filePath);
  const result = await mcpClient.addContent(content);
  
  console.log(`File stored with CID: ${result.cid}`);
  return result.cid;
}
```

## Running Tests

Run the tests using:
```bash
npm test
# or
pnpm test
```

The testing system includes:
- Unit tests for individual components
- Integration tests for cross-domain functionality
- End-to-end tests for complete workflows

## Need Help?

- Check the existing documentation in the `docs/` directory
- Look at the tests in the `test/` directory for examples
- Review existing code patterns for similar functionality

## Conclusion

This guide provides a starting point for new developers working on the SwissKnife project. By understanding the domain-driven organization and unified TypeScript architecture, you can effectively contribute to the project while maintaining consistency with the existing codebase.

For more detailed information, refer to:
- `docs/UNIFIED_ARCHITECTURE.md` for architecture details
- `docs/UNIFIED_INTEGRATION_PLAN.md` for integration approach
- `docs/PROJECT_STRUCTURE.md` for project organization
- `docs/CONTRIBUTING.md` for contribution guidelines
