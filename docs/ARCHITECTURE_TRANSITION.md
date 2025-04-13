# Architecture Transition Guide: From Multi-Component to Unified

This document outlines the key architectural changes as we transition from a multi-component integration approach to the new unified architecture in SwissKnife. Understanding these changes will help developers migrate code and adapt to the new unified TypeScript codebase.

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Key Architectural Changes](#key-architectural-changes)
3. [Codebase Organization Changes](#codebase-organization-changes)
4. [Integration Approach Changes](#integration-approach-changes)
5. [Cross-Component Communication Changes](#cross-component-communication-changes)
6. [Code Migration Patterns](#code-migration-patterns)
7. [Testing Strategy Changes](#testing-strategy-changes)
8. [External Integration Changes](#external-integration-changes)

## Architectural Overview

### Previous Architecture

The previous architecture consisted of multiple separate components with varying degrees of coupling:

- **Multiple Codebases**: Different components in separate repositories or directories
- **Language Diversity**: Components implemented in TypeScript, Rust, etc.
- **Integration Layer**: Bridges and adapters connecting components
- **Component-Based Structure**: Code organized by source component
- **Multiple External Dependencies**: Several external systems for different functionalities

### New Unified Architecture

The new architecture unifies all components into a single TypeScript codebase:

- **Single Codebase**: All functionality in one unified TypeScript codebase
- **Domain-Driven Organization**: Code organized by functional domain
- **Direct TypeScript Integration**: Components communicate through typed interfaces
- **Single External Dependency**: IPFS Kit MCP Server as the only external component
- **Clean Room Implementation**: All functionality reimplemented directly in TypeScript

## Key Architectural Changes

| Aspect | Previous Architecture | Unified Architecture |
|--------|----------------------|---------------------|
| **Code Organization** | By source component | By functional domain |
| **Language** | Multiple (TypeScript, Rust) | TypeScript only |
| **Component Boundaries** | Repository/package boundaries | Domain boundaries within a single codebase |
| **Cross-Component Communication** | Integration bridges | Direct TypeScript imports |
| **External Dependencies** | Multiple systems | Single MCP Server |
| **Type Safety** | Limited across components | Full TypeScript type safety |
| **Testing Approach** | Component-specific | Domain and cross-domain testing |
| **Extension Mechanism** | Component-specific | Unified plugin system |

## Codebase Organization Changes

### Previous Directory Structure

```
/
├── typescript-implementations/
│   ├── ai/                  # TypeScript AI implementations
│   └── tools/               # TypeScript tool implementations
├── ipfs-accelerate-js/      # IPFS/ML acceleration package
├── swissknife-old/          # Legacy code with TaskNet functionality
├── src/                     # Main SwissKnife code
│   ├── components/          # UI Components
│   ├── services/            # API Services
│   ├── integration/         # Cross-component bridges
│   └── utils/               # Utilities
└── rust/                    # Rust components
```

### New Directory Structure

```
/src
├── ai/                      # AI capabilities domain
│   ├── agent/               # Core agent functionality
│   ├── tools/               # Tool system and implementations
│   ├── models/              # Model providers and execution
│   └── thinking/            # Enhanced thinking patterns
├── cli/                     # CLI and UI components
├── ml/                      # Machine learning acceleration
├── tasks/                   # Task processing system
├── storage/                 # Storage systems
├── workers/                 # Worker thread system
├── config/                  # Configuration system
├── utils/                   # Shared utilities
└── types/                   # Shared TypeScript types
```

## Integration Approach Changes

### Previous Integration Approach

1. **Bridge-Based Integration**
   - Components communicated through specialized bridges
   - Serialization/deserialization between components
   - FFI for Rust component integration
   - Limited type safety across boundaries

2. **Integration Layer**
   - Dedicated integration code in `src/integration/`
   - Adapters for different components
   - Complex coordination logic

3. **Component Loading**
   - Dynamic loading of different implementations
   - Environment-based feature detection
   - Fallback mechanisms for missing components

### New Integration Approach

1. **Direct TypeScript Integration**
   - Components communicate directly through TypeScript imports
   - Type-safe interfaces for all cross-domain communication
   - No serialization between domains
   - Unified error handling and logging

2. **Domain-Driven Design**
   - Clear domain boundaries with well-defined interfaces
   - Shared type definitions for cross-domain communication
   - Consistent error handling across domains
   - Unified configuration system

3. **MCP Server API Integration**
   - Well-defined API client for IPFS Kit MCP Server
   - Type-safe API interfaces
   - REST and WebSocket communication
   - CID-based content addressing

## Cross-Component Communication Changes

### Previous Communication Model

```
Component A → Integration Bridge → Serialization → Component B
```

Example of previous cross-component communication:

```typescript
// Previous approach with bridges
import { AIBridge } from '../integration/ai-bridge';
import { IPFSBridge } from '../integration/ipfs-bridge';

async function processWithAI(input: string) {
  const aiBridge = new AIBridge();
  const ipfsBridge = new IPFSBridge();
  
  // Store input in IPFS
  const cid = await ipfsBridge.storeContent(input);
  
  // Process with AI via bridge
  const result = await aiBridge.processContent(cid);
  
  // Retrieve result from IPFS
  return ipfsBridge.retrieveContent(result.outputCid);
}
```

### New Communication Model

```
Domain A → TypeScript Import → Type-Safe Interface → Domain B
```

Example of new cross-domain communication:

```typescript
// New approach with direct imports
import { Agent } from '../ai/agent';
import { StorageProvider } from '../storage/provider';
import { ModelRegistry } from '../ai/models/registry';

async function processWithAI(input: string, storageProvider: StorageProvider) {
  // Store input using storage provider
  const cid = await storageProvider.add(input);
  
  // Process with AI via direct interface
  const agent = new Agent({
    model: ModelRegistry.getInstance().getDefaultModel()
  });
  
  const result = await agent.processMessage(`Process content from CID: ${cid}`);
  
  // Store result
  const resultCid = await storageProvider.add(result);
  
  return { resultCid, result };
}
```

## Code Migration Patterns

Here are common patterns to follow when migrating code from the previous architecture to the unified architecture:

### 1. Component to Domain Migration

**Previous Code (in component-specific location):**

```typescript
// typescript-implementations/ai/agent.ts
export class Agent {
  async processMessage(message: string): Promise<string> {
    // Implementation
    return 'Response';
  }
}

// Usage via bridge
import { AIBridge } from '../integration/ai-bridge';
const bridge = new AIBridge();
const result = await bridge.processMessage('Hello');
```

**New Code (in domain-specific location):**

```typescript
// src/ai/agent/agent.ts
export class Agent {
  constructor(private options: AgentOptions) {}
  
  async processMessage(message: string): Promise<string> {
    // Implementation
    return 'Response';
  }
}

// Direct usage
import { Agent } from '../ai/agent';
import { ModelRegistry } from '../ai/models/registry';

const agent = new Agent({
  model: ModelRegistry.getInstance().getDefaultModel()
});

const result = await agent.processMessage('Hello');
```

### 2. Bridge Elimination

**Previous Code (with bridge):**

```typescript
// src/integration/ipfs-bridge.ts
export class IPFSBridge {
  async storeContent(content: string): Promise<string> {
    // Bridge implementation to IPFS service
    return 'cid';
  }
}

// Usage
import { IPFSBridge } from '../integration/ipfs-bridge';
const bridge = new IPFSBridge();
const cid = await bridge.storeContent('Hello');
```

**New Code (direct domain access):**

```typescript
// src/storage/ipfs/mcp-client.ts
export class MCPClient {
  constructor(private options: MCPClientOptions) {}
  
  async addContent(content: string): Promise<{ cid: string }> {
    // Direct implementation using API
    return { cid: 'example-cid' };
  }
}

// Usage
import { MCPClient } from '../storage/ipfs/mcp-client';
import { ConfigManager } from '../config/manager';

const config = ConfigManager.getInstance();
const mcpClient = new MCPClient({
  baseUrl: config.get('storage.mcp.baseUrl')
});

const result = await mcpClient.addContent('Hello');
const cid = result.cid;
```

### 3. Centralized Configuration

**Previous Code (component-specific config):**

```typescript
// Different configuration for each component
import { loadAIConfig } from '../ai/config';
import { loadIPFSConfig } from '../ipfs/config';

const aiConfig = loadAIConfig();
const ipfsConfig = loadIPFSConfig();
```

**New Code (unified configuration):**

```typescript
// Centralized configuration for all domains
import { ConfigManager } from '../config/manager';

const config = ConfigManager.getInstance();
const aiSettings = config.get('ai');
const storageSettings = config.get('storage');
```

## Testing Strategy Changes

### Previous Testing Approach

- Separate tests for each component
- Bridge tests for cross-component functionality
- Mocking of external components
- Component-specific test runners

### New Testing Approach

- Domain-specific unit tests
- Cross-domain integration tests
- End-to-end tests for complete workflows
- Consistent test patterns across all domains

**Example of new domain test:**

```typescript
// test/unit/ai/agent.test.ts
import { Agent } from '../../../src/ai/agent';
import { ModelMock } from '../../mocks/model-mock';

describe('Agent', () => {
  let agent: Agent;
  let modelMock: ModelMock;
  
  beforeEach(() => {
    modelMock = new ModelMock();
    agent = new Agent({ model: modelMock });
  });
  
  test('should process message correctly', async () => {
    modelMock.setNextResponse('Hello, world!');
    
    const result = await agent.processMessage('Hi');
    
    expect(result).toBe('Hello, world!');
    expect(modelMock.getLastInput()).toContain('Hi');
  });
});
```

**Example of cross-domain integration test:**

```typescript
// test/integration/ai-storage.test.ts
import { Agent } from '../../src/ai/agent';
import { MCPClient } from '../../src/storage/ipfs/mcp-client';
import { ModelRegistry } from '../../src/ai/models/registry';
import { TestMCPServer } from '../mocks/mcp-server';

describe('AI and Storage Integration', () => {
  let agent: Agent;
  let mcpClient: MCPClient;
  let mcpServer: TestMCPServer;
  
  beforeAll(async () => {
    // Start mock MCP server
    mcpServer = new TestMCPServer();
    await mcpServer.start();
    
    // Create real MCP client with mock server URL
    mcpClient = new MCPClient({
      baseUrl: mcpServer.url
    });
    
    // Create agent with default model
    agent = new Agent({
      model: ModelRegistry.getInstance().getDefaultModel()
    });
  });
  
  afterAll(async () => {
    await mcpServer.stop();
  });
  
  test('should store agent results in IPFS', async () => {
    // Process message with agent
    const response = await agent.processMessage('Store this in IPFS');
    
    // Store in IPFS via MCP client
    const result = await mcpClient.addContent(response);
    
    // Verify storage
    expect(result.cid).toBeDefined();
    
    // Retrieve and verify content
    const retrieved = await mcpClient.getContent(result.cid);
    expect(retrieved.toString()).toBe(response);
  });
});
```

## External Integration Changes

### Previous External Integrations

- Multiple external dependencies for different functionalities
- Component-specific external integrations
- Mixed API patterns for different external systems

### New External Integration

- Single external dependency: IPFS Kit MCP Server
- Unified API client for all IPFS operations
- Consistent error handling and response processing
- Clean separation through well-defined interfaces

**Example of MCP Server integration:**

```typescript
// src/storage/ipfs/mcp-client.ts
export class MCPClient {
  constructor(private options: MCPClientOptions) {}
  
  private getAuthHeaders(): Record<string, string> {
    // Auth header implementation
    return {};
  }
  
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    try {
      const response = await fetch(`${this.options.baseUrl}/api/v0/add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: this.createFormData(content)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add content: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { cid: data.Hash };
    } catch (error) {
      console.error('Error adding content to IPFS:', error);
      throw error;
    }
  }
  
  async getContent(cid: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.options.baseUrl}/api/v0/cat?arg=${cid}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve content: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error(`Error retrieving content for CID ${cid}:`, error);
      throw error;
    }
  }
  
  private createFormData(content: string | Buffer): FormData {
    const formData = new FormData();
    const blob = content instanceof Buffer 
      ? new Blob([content]) 
      : new Blob([Buffer.from(content)]);
    formData.append('file', blob);
    return formData;
  }
}
```

## Conclusion

The transition from a multi-component integration approach to a unified TypeScript architecture offers numerous benefits:

1. **Simplified Architecture**: Direct communication between domains reduces complexity
2. **Improved Type Safety**: Full TypeScript type checking across all domains
3. **Enhanced Developer Experience**: Consistent patterns and single codebase for development
4. **Better Maintainability**: Clear domain boundaries with well-defined interfaces
5. **Streamlined Testing**: Consistent testing patterns across all domains
6. **Performance Improvements**: Reduced serialization and direct method calls

By following the patterns and guidance in this document, developers can successfully migrate code from the previous architecture to the new unified approach, while maintaining functionality and improving code quality.

For more detailed information on the unified architecture, refer to:
- [Unified Integration Plan](./unified_integration_plan.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Migration Guide](./MIGRATION_GUIDE.md)