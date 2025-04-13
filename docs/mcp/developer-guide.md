# Model Context Protocol (MCP) Server Developer Guide

This guide provides comprehensive documentation for the MCP server implementation, covering its architecture, integration points, and testing procedures.

## Overview

The Model Context Protocol (MCP) server enables communication between AI assistants and external tools. It allows integration with various tools that extend the capabilities of the AI assistant through a standardized protocol.

## Architecture

The MCP system consists of the following components:

### Core Components

1. **MCP Server** (`src/entrypoints/mcp.ts`)
   - Entry point for starting the MCP server
   - Registers tools with the MCP framework
   - Handles tool request/response lifecycle

2. **MCP Client** (`src/services/mcpClient.ts`)
   - Connects to MCP servers
   - Discovers available tools
   - Manages server configurations

3. **MCP Transport** (`src/services/mcp-transport.ts`)
   - Provides transport abstractions (stdio, sse, etc.)
   - Handles communication between clients and servers

4. **MCPTool** (`src/tools/MCPTool/MCPTool.tsx`)
   - Base implementation for MCP-compatible tools
   - Provides rendering and interaction patterns for tools

### Configuration Systems

1. **Server Configuration**
   - Project-level: Stored in project config
   - Global: Stored in global user config
   - MCPRC: Stored in `.mcprc` files within projects

2. **Approval System**
   - Project-specific approval for `.mcprc` servers
   - Interactive approval dialog for new servers

## Integration Points

### CLI Integration

The MCP server integrates with the CLI system through the following commands:

1. `mcp serve` - Starts an MCP server
2. `mcp add <name> <command> [args...]` - Adds a stdio MCP server
3. `mcp add-sse <name> <url>` - Adds an SSE MCP server
4. `mcp add-json <name> <json>` - Adds a server with JSON configuration
5. `mcp remove <name>` - Removes an MCP server
6. `mcp list` - Lists all configured MCP servers
7. `mcp get <name>` - Shows details for a specific server

### Tool Integration

Tools are integrated into the MCP server in `src/entrypoints/mcp.ts`:

```typescript
const MCP_TOOLS: Tool[] = [
  AgentTool,
  BashTool,
  FileEditTool,
  FileReadTool,
  GlobTool,
  GrepTool,
  FileWriteTool,
  LSTool,
]
```

Tools must implement the `Tool` interface and provide:
- Input schema validation
- Permission handling
- Execution logic
- Result formatting

## Testing

### Unit Tests

Unit tests cover individual components of the MCP system:

1. **MCPTool Tests** (`test/unit/tools/MCPTool/MCPTool.test.tsx`)
   - Tests tool rendering and interaction behavior

2. **MCP Client Tests** (`test/unit/services/mcp/mcpClient.test.ts`)
   - Tests client configuration and server discovery

3. **MCP Transport Tests** (`test/unit/services/mcp/mcpTransport.test.ts`)
   - Tests transport abstraction and connection handling

4. **MCP Entrypoint Tests** (`test/unit/entrypoints/mcp.test.ts`)
   - Tests server initialization and request handling

### Integration Tests

Integration tests verify that components work together correctly:

1. **MCP Integration Tests** (`test/integration/mcp/mcp-integration.test.ts`)
   - Tests client-server interactions
   - Tests tool discovery and invocation

2. **System Integration Tests** (`test/integration/mcp/mcp-system-integration.test.ts`)
   - Tests end-to-end functionality
   - Verifies actual tool execution and result handling

### E2E Tests

End-to-end tests validate CLI functionality:

1. **CLI Integration Tests** (`test/e2e/cli/mcp/mcp-cli-integration.test.ts`)
   - Tests MCP server CLI commands
   - Verifies configuration persistence

## Running Tests

To run all MCP-related tests:

```bash
npm test -- --testPathPattern="(unit|integration|e2e)/(.*\/)?mcp"
```

To run specific test suites:

```bash
# Unit tests only
npm test -- --testPathPattern="unit/(.*\/)?mcp"

# Integration tests only
npm test -- --testPathPattern="integration/mcp"

# E2E tests only
npm test -- --testPathPattern="e2e/cli/mcp"
```

## Common Issues and Troubleshooting

### Connection Issues

If the MCP server fails to connect:

1. Check that the server is running
2. Verify the transport configuration
3. Check for permission issues
4. Check for network connectivity (for SSE servers)

### Tool Execution Failures

If tools fail to execute:

1. Check that the tool is properly registered
2. Verify input schema validation
3. Check permissions for file-based operations
4. Inspect error logs for detailed messages

### Configuration Issues

If server configurations aren't being recognized:

1. Check the scope of the configuration (project vs. global)
2. Verify JSON syntax in configuration files
3. Check for permission issues with config files
4. Restart the server after configuration changes

## Best Practices

1. **Naming Tools**
   - Use clear, descriptive names for tools
   - Follow the pattern `mcp__serverName__toolName`

2. **Error Handling**
   - Provide detailed error messages
   - Handle failures gracefully
   - Validate inputs thoroughly

3. **Performance**
   - Minimize connection overhead
   - Use efficient serialization
   - Implement timeouts for long-running operations

4. **Security**
   - Implement appropriate permission checks
   - Validate and sanitize inputs
   - Limit tool scope to necessary capabilities

## Future Enhancements

1. **Additional Transport Types**
   - WebSocket support
   - libp2p protocol support
   - WebRTC for browser-based tools

2. **Tool Discovery**
   - Dynamic tool registration
   - Capability negotiation
   - Tool versioning

3. **Enhanced Security**
   - Fine-grained permissions model
   - Sandboxed execution environments
   - Credential management

4. **Performance Optimizations**
   - Connection pooling
   - Request batching
   - Persistent connections