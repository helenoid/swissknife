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

The new architecture unifies all core components into a single TypeScript codebase, emphasizing domain-driven design and direct integration:

- **Single Codebase**: All core functionality resides in the `src/` directory as TypeScript.
- **Domain-Driven Organization**: Code is structured by functional domains (AI, Tasks, Storage, CLI, etc.). See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).
- **Direct TypeScript Integration**: Internal components communicate directly via TypeScript imports and interfaces.
- **API-Based External Integration**: External services (like AI models or the IPFS Kit MCP Server) are accessed via dedicated client classes using network APIs (HTTP/WS).
- **Clean Room Implementation**: Functionality is reimplemented based on requirements, not direct code porting. See [CLEAN_ROOM_IMPLEMENTATION.md](./CLEAN_ROOM_IMPLEMENTATION.md).

#### High-Level Architecture Diagram (New)

```mermaid
graph TD
    subgraph SwissKnife CLI Application (TypeScript / Node.js)
        A[CLI Interface (Ink/React)] --> B(Command System);
        B --> C(Execution Context);
        C --> D[AI Service (Agent, GoT)];
        C --> E[Task Service (TaskNet)];
        C --> F[Storage Service (VFS)];
        C --> G[ML Service (Engine)];
        C --> H[Auth Service];
        C --> I[Config Service];
        C --> J[Logging Service];
        C --> K[MCP Service];

        D --> G; D --> E; D --> F; # AI uses ML, Tasks, Storage
        E --> D; E --> F; # Tasks use AI(GoT), Storage
        F --> L((IPFS Kit Client)); # Storage uses IPFS Client
        G --> F; # ML uses Storage
        H --> I; # Auth uses Config
        K --> I; # MCP uses Config
    end

    style L fill:#ddd, stroke:#333
```
*This diagram shows the main service domains accessible via the `ExecutionContext`.*

## Key Architectural Changes

| Aspect | Previous Architecture | Unified Architecture |
|--------|----------------------|---------------------|
| **Code Organization** | By source component | By functional domain |
| **Language** | Multiple (TypeScript, Rust) | TypeScript only |
| **Component Boundaries** | Repository/package boundaries | Domain boundaries within a single codebase |
| **Cross-Component Communication** | Integration bridges | Direct TypeScript imports |
| **External Dependencies** | Multiple systems | Single MCP Server (via IPFS Kit Client) |
| **Type Safety** | Limited across components | Full TypeScript type safety |
| **Testing Approach** | Component-specific | Domain and cross-domain testing |
| **Extension Mechanism** | Component-specific | (Future: Unified plugin system) |

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

### New Directory Structure (Simplified)

```mermaid
graph TD
    subgraph src/
        A(ai/);
        B(auth/);
        C(cli/);
        D(commands/);
        E(components/);
        F(config/);
        G(constants/);
        H(entrypoints/);
        I(graph/); # Added for GoT
        J(hooks/);
        K(inference/);
        L(integration/);
        M(ml/);
        N(models/); # Separate from ai/models? Review structure doc
        O(patches/);
        P(screens/);
        Q(services/);
        R(storage/);
        S(tasks/);
        T(tools/); # Agent tools likely under ai/tools
        U(types/);
        V(utils/);
        W(vector/);
        X(workers/); # Node.js worker threads likely under tasks/workers
    end
    style src/ fill:#def
```
*(Refer to [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the definitive, detailed breakdown)*. This structure organizes code by functional domain, replacing the previous component-source-based organization.

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

1. **Internal Integration (Direct TypeScript)**:
   - Services within different domains (`src/ai`, `src/tasks`, etc.) communicate directly via imported TypeScript classes and interfaces, using standard `import`/`export`.
   - Dependency injection is primarily handled by passing the `ExecutionContext` (defined in `src/cli/context.ts`) into command handlers. This context object provides access methods (e.g., `getService()`) to retrieve singleton or request-scoped instances of core services (Agent, Storage, Config, etc.).
   - Shared types are defined in `src/types/`.
   - This eliminates serialization overhead and the complexity of language bridges found in the previous architecture.

2. **External Integration (API Clients)**:
   - External systems like AI Model APIs (OpenAI, Anthropic, Lilypad) or the IPFS Kit MCP Server are accessed through dedicated client classes (e.g., `OpenAIProvider` in `src/ai/models/providers/`, `IPFSClient` in `src/storage/ipfs/`).
   - These clients encapsulate the network communication (HTTP/WS), API specifics (endpoints, request/response formats), and authentication (retrieving keys via `ApiKeyManager`).
   - This maintains loose coupling, meaning changes to external APIs ideally only require updates within the corresponding client class.

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

```mermaid
graph LR
    A[Domain A Service] -- Imports & Calls --> B(Domain B Interface);
    B -- Implemented By --> C[Domain B Service];
```
*Internal communication uses standard TypeScript imports and method calls against defined interfaces.*

```mermaid
graph LR
    A[Domain Service (e.g., Storage)] --> B(API Client Class);
    B -- HTTP/WS Request --> C((External Service API));
    C -- Response --> B;
    B -- Processed Data --> A;
```
*External communication is mediated by client classes.*

Example of new cross-domain communication (Conceptual):

```typescript
// New approach using ExecutionContext and Services (Conceptual)
import type { ExecutionContext } from '@/cli/context.js'; // Use correct path
import { Agent } from '@/ai/agent/agent.js'; // Use Agent class or a Service wrapper
import { StorageOperations } from '@/storage/operations.js'; // Use VFS Operations

async function processWithAI(context: ExecutionContext, input: string, storagePath: string) {
  // Get services from context
  const storageOps = context.getService(StorageOperations);
  const agent = context.getService(Agent); // Assuming Agent is registered as a service

  // Store input using storage service
  await storageOps.writeFile(storagePath, input);
  context.formatter.info(`Input stored at ${storagePath}`);

  // Process with AI agent service
  const response = await agent.processMessage(`Process content from ${storagePath}`); // Assuming processMessage returns structured response

  // Store result (example assumes result is string content)
  const resultPath = storagePath + '.result';
  await storageOps.writeFile(resultPath, response.content); // Access content property
  context.formatter.success(`Result stored at ${resultPath}`);

  return { resultPath };
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
// src/storage/ipfs/ipfs-client.ts (Conceptual - Matches API Key Mgmt Doc)
export class IPFSClient { // Renamed from MCPClient for clarity
  private apiKeyManager: ApiKeyManager;
  private configManager: ConfigManager;
  private apiUrl: string;

  constructor(options?: { apiUrl?: string }) {
    this.apiKeyManager = ApiKeyManager.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.apiUrl = options?.apiUrl || this.configManager.get('storage.ipfs.apiUrl', 'http://127.0.0.1:5001');
  }

  private _getAuthHeaders(): Record<string, string> { /* ... */ }

  async addContent(content: string | Buffer): Promise<{ cid: string }> { // Renamed method
    const headers = this._getAuthHeaders();
    // Make request using this.apiUrl and headers via fetch/axios
    console.log(`Adding content via ${this.apiUrl}...`);
    // ... implementation ...
    return { cid: "example-cid-from-api" };
  }
  async getContent(cid: string): Promise<Buffer> { // Renamed method
     const headers = this._getAuthHeaders();
     // Make request using this.apiUrl and headers via fetch/axios
     // ... implementation ...
     return Buffer.from("example");
  }
  // ... other IPFS methods
}

// Usage (likely within IPFSBackend)
import { IPFSClient } from '@/storage/ipfs/ipfs-client.js'; // Adjust path
import { ConfigManager } from '@/config/manager.js'; // Adjust path

const config = ConfigManager.getInstance();
const ipfsClient = new IPFSClient({ // Instantiated by StorageRegistry based on config
  apiUrl: config.get('storage.ipfs.apiUrl', 'http://127.0.0.1:5001')
});

// IPFSBackend would call ipfsClient.addContent(...) or ipfsClient.getContent(...)
// const result = await ipfsClient.addContent('Hello');
// const cid = result.cid;
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

- **Unit Tests (`test/unit/`)**: Focus on individual modules/classes within each domain (e.g., `src/ai/agent/agent.test.ts`), mocking internal and external dependencies using Jest (`jest.mock`).
- **Integration Tests (`test/integration/`)**: Verify interactions between different services *within* the SwissKnife codebase (e.g., `AgentService` using `StorageOperations`). External API calls (to AI models, IPFS server) should still be mocked (e.g., using `msw` or `nock`).
- **End-to-End Tests (`test/e2e/`)**: Execute the compiled CLI application (`dist/cli.mjs`) as a subprocess to test full user workflows from the command line, potentially interacting with real (or containerized) external services like a local IPFS node.
- **Consistent Tooling**: Use Jest as the primary test runner, configured via `jest.config.cjs`. Use `pnpm test` to run the full suite.

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
// test/integration/ai-storage.test.ts (Conceptual - Updated)
import { Agent } from '@/ai/agent/agent.js'; // Use Agent class directly or Service
import { StorageOperations } from '@/storage/operations.js';
import { MockModel } from '@/test/mocks/ai.js'; // Mock AI Model
import { InMemoryStorageBackend } from '@/storage/backends/memory.js';
import { StorageRegistry } from '@/storage/registry.js';
import { PathResolver } from '@/storage/path-resolver.js';
import { ToolExecutor } from '@/ai/tools/executor.js';
import type { Tool } from '@/ai/tools/tool.js';

// Mock Storage Tool
const mockStorageTool: Tool = {
    name: 'save_to_storage',
    description: 'Saves content to storage',
    parameters: [{ name: 'path', type: 'string', required: true }, { name: 'content', type: 'string', required: true }],
    async execute(args: { path: string; content: string }, context?: any) {
        const storageOps = context?.storageOps as StorageOperations; // Assume context provides storageOps
        if (!storageOps) throw new Error("StorageOperations not found in context");
        await storageOps.writeFile(args.path, args.content);
        return { success: true, path: args.path };
    }
};

describe('AI and Storage Integration', () => {
  let agent: Agent;
  let storageOps: StorageOperations;
  let memoryBackend: InMemoryStorageBackend;
  let toolExecutor: ToolExecutor;

  beforeEach(() => {
    // Setup in-memory storage
    memoryBackend = new InMemoryStorageBackend();
    const storageRegistry = new StorageRegistry();
    storageRegistry.registerBackend(memoryBackend);
    storageRegistry.mount('/mem', memoryBackend.id); // Mount in-memory backend
    const pathResolver = new PathResolver(storageRegistry);
    storageOps = new StorageOperations(storageRegistry, pathResolver);

    // Setup tool executor and register mock storage tool
    toolExecutor = new ToolExecutor();
    toolExecutor.registerTool(mockStorageTool);

    // Setup agent with mock model and the tool executor
    const mockModel = new MockModel();
    agent = new Agent({ model: mockModel, tools: [mockStorageTool], toolExecutor }); // Pass executor
    // Inject storageOps into tool context if needed (depends on ToolExecutor design)
    // toolExecutor.setContext({ storageOps });
  });

  it('should allow agent to use a tool to write results to storage', async () => {
    // Arrange
    const prompt = "Generate 'hello world' and save to /mem/output.txt";
    const mockModelResponse = { // Simulate model asking to use the tool
        content: null,
        toolCalls: [{ id: 'call1', type: 'function', function: { name: 'save_to_storage', arguments: JSON.stringify({ path: '/mem/output.txt', content: 'hello world' }) } }]
    };
    const mockModel = agent.getModel() as MockModel; // Get the mock model instance
    mockModel.setNextResponse(mockModelResponse);

    // Act
    await agent.processMessage(prompt); // Agent processes, calls model, executes tool

    // Assert
    const fileExists = await storageOps.exists('/mem/output.txt');
    expect(fileExists).toBe(true);
    const content = await storageOps.readFile('/mem/output.txt');
    expect(content.toString()).toBe("hello world");
  });
});
```

## External Integration Changes

### Previous External Integrations

- Multiple external dependencies for different functionalities
- Component-specific external integrations
- Mixed API patterns for different external systems

### New External Integration

- **Primary External Dependency**: AI Model APIs (OpenAI, Anthropic, Lilypad, etc.) accessed via `ModelProvider` implementations in `src/ai/models/providers/`.
- **Secondary External Dependency**: IPFS HTTP API (provided by the IPFS Kit MCP Server or a local Kubo daemon) accessed via the `IPFSClient` in `src/storage/ipfs/`.
- **Unified Clients**: Dedicated TypeScript clients (`IPFSClient`, specific `ModelProvider` classes) manage interactions with these external APIs, handling authentication, request formatting, and response parsing.
- **Loose Coupling**: Changes in external service APIs ideally require updates only within the corresponding client/provider class, minimizing impact on the rest of the SwissKnife application.

**Example of IPFS Client integration:**
*(See updated `IPFSClient` conceptual example in section 5.2)*

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
- [Unified Architecture](./UNIFIED_ARCHITECTURE.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- Detailed Phase Documentation (`./phase1/` to `./phase5/`)
