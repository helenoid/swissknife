# Getting Started with SwissKnife

This guide helps new developers get started with the SwissKnife project, a powerful CLI tool with AI capabilities, built on a unified TypeScript architecture.

## Project Overview

SwissKnife is a command-line interface built with a unified TypeScript codebase organized by domain. It provides advanced capabilities including:

- AI agent with Graph-of-Thought reasoning
- ML acceleration for efficient neural network execution
- Advanced task management with Fibonacci heap scheduling
- IPFS storage integration via MCP Server
- Rich terminal UI using React/Ink

The application follows a domain-driven design with all functionality implemented directly in TypeScript, creating a cohesive, maintainable system.

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

```
/src
├── ai/                      # AI capabilities domain
│   ├── agent/               # Core agent functionality
│   ├── tools/               # Tool system and implementations
│   ├── models/              # Model providers and execution
│   └── thinking/            # Enhanced thinking patterns
│
├── cli/                     # CLI and UI components
│   ├── commands/            # Command definitions
│   ├── ui/                  # React/Ink components
│   ├── screens/             # Screen definitions
│   └── formatters/          # Output formatting
│
├── ml/                      # Machine learning acceleration
│   ├── tensor/              # Tensor operations
│   ├── optimizers/          # Model optimization
│   ├── hardware/            # Hardware acceleration
│   └── inference/           # Inference execution
│
├── tasks/                   # Task processing system
│   ├── scheduler/           # Fibonacci heap scheduler
│   ├── decomposition/       # Task decomposition
│   ├── delegation/          # Task delegation
│   └── graph/               # Graph-of-thought implementation
│
├── storage/                 # Storage systems
│   ├── local/               # Local storage
│   ├── ipfs/                # IPFS client integration with MCP server
│   ├── cache/               # Multi-tier caching
│   └── indexing/            # Content indexing
│
├── workers/                 # Worker thread system
├── config/                  # Configuration system
├── utils/                   # Shared utilities
└── types/                   # Shared TypeScript types
```

### Key Components

- **AI Agent System**: Core agent implementation with tool execution capabilities
- **Model Registry**: Management of different AI models from various providers
- **Graph-of-Thought**: Advanced non-linear reasoning system
- **Fibonacci Heap Scheduler**: Efficient task prioritization and execution
- **IPFS Kit MCP Client**: API-based integration with IPFS Kit MCP Server
- **CLI Command System**: Rich terminal interface with command registry

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

## Interacting with IPFS Kit MCP Server

SwissKnife integrates with the IPFS Kit MCP Server through a client API:

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