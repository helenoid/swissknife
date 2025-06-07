# Phase 2: Storage System Implementation (VFS Foundation)

**Timeline:** Week 4 of Phase 2 (Aligned with Roadmap)

This document details the implementation plan for the foundational components of the Storage System (Virtual Filesystem - VFS) during Phase 2. The focus is on establishing the core VFS architecture, implementing the local filesystem backend, and creating the client for the external IPFS Kit MCP Server to enable the IPFS backend.

## Goals (Phase 2 Foundation)

-   Implement the core VFS interfaces: `StorageBackend`, `StorageRegistry`, `PathResolver`, `StorageOperations`.
-   Implement the `FilesystemBackend` for local disk storage, ensuring cross-platform compatibility and security.
-   Implement the `IPFSKitClient` (renamed from `MCPClient` for clarity) to communicate with the IPFS Kit MCP Server's HTTP API.
-   Implement a basic `IPFSBackend` that utilizes the `IPFSKitClient` and a simple (likely in-memory or basic file-based) `MappingStore` for path-to-CID translation.
-   Integrate the `StorageOperations` service into the `ExecutionContext`.
-   *Defer advanced caching, complex `MappingStore` implementations, and additional backends to later phases.*

## Implementation Details (Phase 2 Focus)

### 1. VFS Core Interfaces & Registry (`src/storage/backend.ts`, `src/storage/registry.ts`, `src/storage/path-resolver.ts`, `src/storage/operations.ts`) (Week 4, Day 1-2)

-   **`StorageBackend` Interface (`src/storage/backend.ts`):** Implement the interface as defined in `api_specifications.md`, including core methods (`readFile`, `writeFile`, `exists`, `stat`, `readdir`, `mkdir`, `unlink`, `rmdir`) and optional streaming methods (`createReadStream`, `createWriteStream`).
-   **`StorageRegistry` Service (`src/storage/registry.ts`):** Implement the registry to manage backend instances and mount points. Include logic for `registerBackend`, `mount`, `unmount`, and `getBackendForPath` (finding the longest matching mount point). Load initial mounts from `ConfigurationManager`.
-   **`PathResolver` Service (`src/storage/path-resolver.ts`):** Implement the resolver using the `StorageRegistry` to map virtual paths to the correct backend and relative path, ensuring POSIX normalization and preventing path traversal.
-   **`StorageOperations` Service (`src/storage/operations.ts`):** Implement the high-level VFS API. Methods should use `PathResolver` to find the correct backend and delegate the operation (e.g., `readFile(virtualPath)` resolves the path and calls `backend.readFile(relativePath)`). Implement basic file `copy` (read/write).

### 2. Filesystem Backend (`src/storage/backends/filesystem.ts`) (Week 4, Day 2-3)

-   **`FilesystemBackend` Class:** Implement the `StorageBackend` interface using Node.js `fs/promises`.
    -   Constructor takes `baseDir` configuration.
    -   Implement all core methods (`readFile`, `writeFile`, `exists`, `stat`, `readdir`, `mkdir`, `unlink`, `rmdir`).
    -   Implement `createReadStream` and `createWriteStream`.
    -   Ensure robust error handling (map `fs` errors to standard `StorageError` types).
    -   Implement secure path resolution (`_resolvePath`) to prevent path traversal.
-   **Testing:** Write comprehensive unit tests using `memfs` or `mock-fs` to simulate filesystem operations without touching the actual disk. Test edge cases and error conditions.

### 3. IPFS Kit Client (`src/ipfs/client.ts`) (Week 4, Day 3-4)

-   **`IPFSKitClient` Class:** Implement the client to interact with the IPFS Kit MCP Server's HTTP API.
    -   Use `axios` or Node.js `fetch` for making requests.
    -   Implement methods for core operations needed by `IPFSBackend`: `addContent`, `getContent` (`cat`), potentially `pinAdd`, `dagGet`, `filesLs` (if using MFS-like features on server).
    -   Handle configuration (API URL, timeout, auth) via constructor/`ConfigurationManager`.
    -   Implement robust error handling for network and API errors.
    -   Implement streaming for `addContent` and `getContent`.
-   **Testing:** Write integration tests that run against a *real* (local or test environment) IPFS Kit MCP Server or Kubo node to validate API interactions. Mocking can be used for specific error case unit tests.

### 4. IPFS Backend & Mapping Store (`src/storage/backends/ipfs.ts`, `src/storage/mapping-store.ts`) (Week 4, Day 4-5)

-   **`MappingStore` Interface & Basic Implementation (`src/storage/mapping-store.ts`):**
    -   Define the interface: `get(virtualPath): Promise<{cid: string} | null>`, `set(virtualPath, {cid})`, `delete(virtualPath)`, `list(prefix)` etc.
    -   **Phase 2:** Implement a *simple* version, e.g., using a single JSON file on disk (via `FilesystemBackend` or direct `fs`) or an in-memory `Map`. This is *not* robust but sufficient for initial functionality. Defer SQLite or more advanced implementations to later phases.
-   **`IPFSBackend` Class (`src/storage/backends/ipfs.ts`):**
    -   Implement the `StorageBackend` interface.
    -   Constructor takes `IPFSKitClient` and `MappingStore` instances.
    -   `readFile`: Call `mappingStore.get()` then `ipfsClient.getContent()`.
    -   `writeFile`: Call `ipfsClient.addContent()` then `mappingStore.set()`.
    -   `exists`: Check `mappingStore.get()`.
    -   `stat`: May need `ipfsClient.filesStat` or `dagGet` depending on how directories/metadata are stored. Requires defining the mapping strategy.
    -   `readdir`, `mkdir`, `unlink`, `rmdir`: Implement basic versions interacting primarily with the `MappingStore`. Define how directories are represented in the mapping (e.g., a mapped object listing links).
    -   Implement streaming methods using `ipfsClient` streams.
-   **Testing:** Write integration tests for `IPFSBackend` using a mock `IPFSKitClient` and the simple `MappingStore` to verify the logic.

## Key Interfaces (Phase 2 VFS Focus)

```typescript
// src/storage/backend.ts
/** Common interface for storage backends. */
export interface StorageBackend {
  readonly id: string;
  readonly name: string;
  readonly isReadOnly: boolean;
  readFile(relativePath: string): Promise<Buffer>;
  writeFile(relativePath: string, data: Buffer | string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  stat(relativePath: string): Promise<FileStat>;
  readdir(relativePath: string): Promise<DirEntry[]>;
  mkdir(relativePath: string, options?: { recursive?: boolean }): Promise<void>;
  unlink(relativePath: string): Promise<void>;
  rmdir(relativePath: string, options?: { recursive?: boolean }): Promise<void>;
  // Optional methods (implement if feasible for backend)
  rename?(oldRelativePath: string, newRelativePath: string): Promise<void>;
  copyFile?(srcRelativePath: string, destRelativePath: string): Promise<void>;
  createReadStream?(relativePath: string, options?: any): Promise<NodeJS.ReadableStream>;
  createWriteStream?(relativePath: string, options?: any): Promise<NodeJS.WritableStream>;
  getAvailableSpace?(): Promise<SpaceInfo>;
}
// FileStat, DirEntry, SpaceInfo defined in api_specifications.md

// src/storage/registry.ts
/** Manages storage backends and mount points. */
export interface StorageRegistry {
  registerBackend(backend: StorageBackend): void;
  getBackend(backendId: string): StorageBackend | undefined;
  mount(mountPoint: string, backendId: string): void;
  unmount(mountPoint: string): void;
  getMounts(): Map<string, string>;
  getBackendForPath(absoluteVirtualPath: string): { backend: StorageBackend; relativePath: string; mountPoint: string };
}

// src/storage/path-resolver.ts
/** Resolves virtual paths to backends and relative paths. */
export interface PathResolver {
  resolvePath(virtualPath: string): { backend: StorageBackend; relativePath: string; mountPoint: string };
}

// src/storage/operations.ts
/** High-level VFS API. */
export interface StorageOperations {
  readFile(virtualPath: string): Promise<Buffer>;
  writeFile(virtualPath: string, data: Buffer | string): Promise<void>;
  // ... other core methods mirroring StorageBackend but using virtual paths ...
  copy(sourceVirtualPath: string, destVirtualPath: string, options?: { recursive?: boolean }): Promise<void>;
  createReadStream(virtualPath: string, options?: any): Promise<NodeJS.ReadableStream>;
  createWriteStream(virtualPath: string, options?: any): Promise<NodeJS.WritableStream>;
  resolve(virtualPath: string): { backend: StorageBackend; relativePath: string; mountPoint: string };
}

// src/ipfs/client.ts (Simplified - see ipfs_kit_commands.md for more)
/** Client for IPFS Kit MCP Server HTTP API. */
export interface IPFSKitClient {
  addContent(content: string | Buffer | Blob): Promise<{ cid: string }>;
  getContent(cid: string): Promise<Buffer>;
  // Add other methods as needed by IPFSBackend (pinAdd, filesLs, dagGet...)
}

// src/storage/mapping-store.ts (Phase 2 Simple Version)
/** Interface for storing path-to-CID mappings for IPFSBackend. */
export interface MappingStore {
  /** Retrieves the mapping for a virtual path. */
  get(virtualPath: string): Promise<{ cid: string; timestamp?: number } | null>;
  /** Sets or updates the mapping for a virtual path. */
  set(virtualPath: string, mapping: { cid: string; timestamp: number }): Promise<void>;
  /** Deletes the mapping for a virtual path. */
  delete(virtualPath: string): Promise<void>;
  /** Lists mappings under a given prefix (for readdir). */
  list(prefix: string): Promise<Array<{ path: string; cid: string }>>;
}
```

## Deliverables (Phase 2 Foundation)

-   Implemented core VFS interfaces (`StorageBackend`, `StorageRegistry`, `PathResolver`, `StorageOperations`).
-   Functional `FilesystemBackend` implementation using Node.js `fs/promises`.
-   Functional `IPFSKitClient` capable of core `add` and `get` operations via HTTP API.
-   Basic `IPFSBackend` implementation using `IPFSKitClient` and a simple file/memory-based `MappingStore`.
-   `StorageOperations` service integrated and accessible via `ExecutionContext`.
-   Unit tests for `FilesystemBackend` (using `memfs`), `PathResolver`, `StorageRegistry`.
-   Integration tests for `StorageOperations` interacting with `FilesystemBackend`.
-   Integration tests for `IPFSBackend` using a mock `IPFSKitClient`.
-   Initial integration tests for `IPFSKitClient` against a real IPFS node (if feasible).
