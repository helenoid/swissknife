# Phase 2: Storage System Implementation

**Timeline:** Week 4 of Phase 2 (Days 1-4)

This document details the implementation plan for the Storage System domain during Phase 2. The focus is on establishing the core storage provider interface, implementing local file storage, and integrating with the external IPFS Kit MCP Server.

## Goals

-   Define a common `StorageProvider` interface for all storage backends.
-   Implement a `FileStorage` provider for local disk storage.
-   Develop an `MCPClient` to communicate with the IPFS Kit MCP Server API (REST and WebSocket).
-   Implement an `IPFSStorage` provider that uses the `MCPClient`.
-   Set up basic caching mechanisms (local memory/disk).

## Implementation Details

### 1. Local Storage Implementation (Day 1-2)

-   **`StorageProvider` Interface (`src/storage/provider.ts`):**
    -   Defines the standard methods for storage operations: `add`, `get`, `list`, `delete`.
    -   Specifies common `StorageOptions` (e.g., `metadata`, `pin` for IPFS).
-   **`FileStorage` Class (`src/storage/local/file-storage.ts`):**
    -   Implements the `StorageProvider` interface for local file system storage.
    -   Uses content hashing (e.g., SHA-256) for content addressing/IDs.
    -   Manages files within a configured `basePath`.
    -   Handles metadata persistence (e.g., in a `metadata.json` file).
    -   Includes options for directory creation (`createDir`).
-   **Local Caching:**
    -   Implement basic in-memory caching (e.g., LRU cache).
    -   (Optional) Implement a simple disk-based cache layer.

### 2. IPFS Kit MCP Client Implementation (Day 3-4)

-   **`MCPClient` Class (`src/storage/ipfs/mcp-client.ts`):**
    -   Handles communication with the IPFS Kit MCP Server.
    -   Uses `axios` for REST API calls (`/api/v0/add`, `/api/v0/cat`, `/api/v0/pin/add`, `/api/v0/pin/ls`).
    -   Configurable `baseUrl`, `timeout`, and `authentication` (API Key or Bearer Token).
    -   Includes methods for core IPFS operations: `addContent`, `getContent`, `pinContent`, `listPins`.
    -   Implements WebSocket connection logic (`connectWebSocket`, `disconnect`, `isConnected`) using `ws` library for real-time updates (if needed in later phases).
-   **`IPFSStorage` Class (`src/storage/ipfs/ipfs-storage.ts`):**
    -   Implements the `StorageProvider` interface using the `MCPClient`.
    -   Maps provider methods (`add`, `get`, `list`, `delete`) to MCP client calls.
    -   Handles the `pin` option during the `add` operation.
    -   Note: `delete` typically maps to `unpin` in IPFS context (may require additional MCP API endpoint).

## Key Interfaces

```typescript
// src/storage/provider.ts
export interface StorageOptions {
  metadata?: Record<string, any>;
  pin?: boolean; // Specific to IPFS
}

export interface StorageProvider {
  add(content: Buffer | string, options?: StorageOptions): Promise<string>; // Returns content ID (hash or CID)
  get(id: string): Promise<Buffer>;
  list(query?: any): Promise<string[]>; // Returns list of IDs
  delete(id: string): Promise<boolean>;
}

// src/types/storage.ts (or provider.ts)
export interface FileStorageOptions {
  basePath: string;
  createDir?: boolean;
}

// src/storage/ipfs/mcp-client.ts
export interface MCPClientOptions {
  baseUrl: string;
  timeout?: number;
  authentication?: {
    type: 'apiKey' | 'token';
    value: string;
  };
}

export declare class MCPClient {
  constructor(options: MCPClientOptions);
  addContent(content: string | Buffer): Promise<{ cid: string }>;
  getContent(cid: string): Promise<Buffer>;
  pinContent(cid: string): Promise<boolean>;
  listPins(): Promise<string[]>;
  connectWebSocket(): Promise<any>; // Returns WebSocket instance
  disconnect(): void;
  isConnected(): boolean;
}

// src/storage/ipfs/ipfs-storage.ts
export declare class IPFSStorage implements StorageProvider {
  constructor(options: MCPClientOptions);
  // Implements StorageProvider methods using MCPClient
}

// src/storage/local/file-storage.ts
export declare class FileStorage implements StorageProvider {
  constructor(options: FileStorageOptions);
  // Implements StorageProvider methods using local filesystem
}
```

## Deliverables

-   Defined `StorageProvider` interface.
-   Functional `FileStorage` implementation with metadata handling.
-   Working `MCPClient` capable of basic add, get, and pin operations via REST API.
-   Functional `IPFSStorage` implementation using the `MCPClient`.
-   Basic in-memory caching layer.
-   Unit tests for `FileStorage` and `MCPClient`.
-   Integration tests for `IPFSStorage` (requires a running MCP server instance).
