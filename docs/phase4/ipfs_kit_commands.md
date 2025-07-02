# Phase 4: IPFS Kit Commands Implementation

**Timeline:** Week 11 of Phase 4

This document details the implementation plan for the CLI commands specifically designed for direct interaction with the IPFS network via the `IPFSKitClient` service (which connects to the IPFS Kit MCP Server). These commands offer lower-level access compared to the VFS (`storage`/`file`) commands and expose IPFS-specific concepts like CIDs, pinning, and DAGs.

## Goals

-   Implement core IPFS content management commands (`ipfs add`, `ipfs get`, `ipfs ls`) using the `IPFSKitClient`, supporting streaming and progress indication.
-   Develop commands for managing the pinning status of CIDs (`ipfs pin add/rm/ls`) via the client or a configured pinning service API.
-   Create commands for inspecting the IPFS server connection (`ipfs server status`) and managing related configuration (`ipfs server config`).
-   Implement commands for advanced IPFS data structures (`ipfs dag get/resolve`).
-   Ensure commands provide clear output (including CIDs), handle IPFS-specific errors gracefully, and integrate seamlessly with the `ExecutionContext`.

## Command Structure

Commands will be organized under the `ipfs` namespace:

```bash
# Content Management
swissknife ipfs add <local_path> [--pin] [--progress] [--cid-version <1|0>] [--output json]
swissknife ipfs get <cid> [<local_output_path>] [--progress] [--output <path>]
swissknife ipfs ls <cid_or_ipns_path> [--long] [--headers] [--output json]
# Note: 'ipfs rm' is complex; focus on 'pin rm' initially.

# Pinning Management (via IPFSKitClient or Pinning Service API)
swissknife ipfs pin add <cid...> [--name <alias>] [--recursive]
swissknife ipfs pin rm <cid...> [--force]
swissknife ipfs pin ls [--status <status>] [--cid <cid>] [--output json]

# Server / Configuration
swissknife ipfs server status
swissknife ipfs config get <key> # Alias for 'config get ipfs.<key>'
swissknife ipfs config set <key> <value> # Alias for 'config set ipfs.<key>'
swissknife ipfs config list # Alias for 'config list --prefix ipfs.'

# Advanced Data Structures
swissknife ipfs dag get <cid> [--output json]
swissknife ipfs dag resolve <ipfs_path>
# swissknife ipfs files ... # MFS commands if supported by server
# swissknife ipfs key ... # Key management if needed locally
# swissknife ipfs name ... # IPNS commands if supported
```
*(Note: `ipfs config` commands might be integrated into the main `config` command.)*

## Implementation Details

### 1. Content Management Commands (`src/cli/commands/ipfs/content/`)

-   **`ipfs add <local_path>`:**
    -   Input: Path to a local file or directory.
    -   Action: Reads the local file/directory (using `fs` or `StorageOperations` for the local backend). Uses `IPFSKitClient.addContent` (potentially leveraging streaming uploads via `ipfsClient.add` if the client supports it directly).
    -   Output: Prints the root CID of the added content. If `--output json`, prints structured info `{ cid: string, size: number, ... }`.
    -   Options:
        -   `--pin`: Automatically call `ipfs pin add` on the resulting CID.
        -   `--progress`: Display a progress bar during upload (requires client support for progress events or streaming upload monitoring). Use `formatter.progressBar`.
        -   `--cid-version <0|1>`: Specify CID version for added content.
        -   `--wrap-directory`: Wrap added directory in an additional directory layer.
        -   `--output json`: Output result as JSON.
-   **`ipfs get <cid> [<local_output_path>]`:**
    -   Input: IPFS CID. Optional local path to save to.
    -   Action: Uses `IPFSKitClient.getContent` (or streaming equivalent). If `local_output_path` is provided, saves the content to that file (using `fs` or `StorageOperations`). If not, streams content to `process.stdout`. Handle potential directory CIDs (requires client support for recursive gets or TAR export).
    -   Output: Status message on success/failure. File content to stdout if no output path.
    -   Options:
        -   `--output <path>`: Explicitly specify output file path (alternative to positional arg).
        -   `--progress`: Display download progress bar.
        -   `--archive`: (If supported by client/server) Download directory as a TAR archive.
-   **`ipfs ls <cid_or_ipns_path>`:**
    -   Input: IPFS CID or IPNS path (e.g., `/ipns/k51...`).
    -   Action: Uses `IPFSKitClient.ls` or equivalent (e.g., `files.ls` if MFS-like).
    -   Output: Uses `formatter.table` to display directory entries (name, CID, size, type). Supports `--output json`.
    -   Options:
        -   `--long`, `-l`: Show more details (e.g., full CID).
        -   `--headers`: Show table headers (might be default).
        -   `--output json`: Output result as JSON array.
-   **`ipfs rm <cid>`:** **Deferred/Removed.** Direct removal of blocks is not a standard IPFS operation. Functionality is covered by `ipfs pin rm`. Local node garbage collection (`ipfs repo gc`) is a separate administrative task, potentially exposed via `ipfs server gc` if the client/server supports it.

### 2. Pin Management Commands (`src/cli/commands/ipfs/pin/`)

-   **`ipfs pin add <cid...>`:**
    -   Input: One or more CIDs.
    -   Action: Calls `IPFSKitClient.pinAdd(cid)` for each CID. Handles potential pinning service integration if configured.
    -   Output: Reports success/failure for each CID.
    -   Options: `--name <alias>` (Assign a name to the pin, if supported), `--recursive` (Default true, pin linked blocks).
-   **`ipfs pin rm <cid...>`:**
    -   Input: One or more CIDs.
    -   Action: Calls `IPFSKitClient.pinRm(cid)` for each CID.
    -   Output: Reports success/failure.
    -   Options: `--force` (Ignore errors if CID not pinned).
-   **`ipfs pin ls`:**
    -   Input: Optional filters.
    -   Action: Calls `IPFSKitClient.pinLs(options)`.
    -   Output: Uses `formatter.table` to list pinned CIDs, status (queued, pinning, pinned, failed), and names. Supports `--output json`.
    -   Options: `--status <status>` (Filter by pin status), `--cid <cid>` (Filter by specific CID(s)), `--output json`.

### 3. Server Management Commands (`src/cli/commands/ipfs/server/`)

-   **`ipfs server status`:**
    -   Action: Calls a method on `IPFSKitClient` (e.g., `getStatus()` or a simple API check like `version()`) to verify connectivity.
    -   Output: Displays configured API URL, connection status (Connected/Disconnected/Error), and potentially server version or peer count if available.
-   **`ipfs config get|set|list`:**
    -   Action: These are likely aliases for `swissknife config get|set|list` but potentially pre-filtered or scoped to the `ipfs.` configuration path (e.g., `ipfs.apiUrl`, `ipfs.pinningService.apiKey`). Uses `ConfigurationManager`.
-   **`ipfs server connect|disconnect`:** **Removed.** Client connection should ideally be managed automatically on demand or via the service lifecycle, not manual CLI commands. Status command provides visibility.

### 4. Advanced IPFS Commands (`src/cli/commands/ipfs/dag/`, etc.)

-   **`ipfs dag get <cid>`:**
    -   Action: Calls `IPFSKitClient.dagGet(cid)`.
    -   Output: Prints the decoded block data, typically as JSON.
    -   Options: `--output-codec <codec>` (Specify codec for output, e.g., `dag-json`, `dag-cbor`), `--output <file>` (Save raw block bytes to file).
-   **`ipfs dag resolve <ipfs_path>`:**
    -   Action: Calls `IPFSKitClient.dagResolve(ipfsPath)`.
    -   Output: Prints the final resolved CID and any remaining path.
    -   Options: `--output json`.
-   **Other Potential Commands (Lower Priority):**
    -   `ipfs files ...`: Commands mirroring the IPFS Mutable File System (MFS) API, if supported by the IPFS Kit Server and needed for VFS path mapping.
    -   `ipfs name ...`: Commands for publishing and resolving IPNS names (requires server support).
    -   `ipfs key ...`: Commands for managing IPFS keys locally (if needed for IPNS or other features).
    -   `ipfs repo gc`: Trigger garbage collection on the connected node (requires server support/permissions).

## Integration Points

-   **`IPFSKitClient`:** The core service providing methods to interact with the IPFS Kit MCP Server API. Accessed via `ExecutionContext`.
-   **`ConfigurationManager`:** Used to retrieve IPFS API URL, authentication details (API keys for client or pinning service), and other related settings. Accessed via `ExecutionContext`.
-   **`OutputFormatter`:** Used by all commands to display results (CIDs, tables, status messages), progress indicators, and errors. Accessed via `ExecutionContext`.
-   **Node.js `fs/promises`:** Used by `ipfs add` (to read local files) and `ipfs get` (to write to local files).
-   **`StorageOperations` (Indirect):** While these commands use `IPFSKitClient` directly, `ipfs add/get` might interact with the local filesystem part of the VFS via `StorageOperations` if paths like `/local/...` are given as input/output arguments.

## User Experience Considerations

-   **Progress Indicators:** Crucial for `ipfs add` and `ipfs get` with large files. Use `formatter.progressBar`, leveraging streaming capabilities of the `IPFSKitClient` if possible to report progress accurately.
-   **CID Display:** Always display full CIDs clearly. Consider adding a `--cid-only` or similar flag for easy scripting capture. An option like `--copy-cid` could copy the primary resulting CID to the clipboard.
-   **Error Handling:** Provide specific, actionable error messages for common IPFS issues: connection refused, invalid CID format, block not found, pinning service errors, timeouts. Use `formatter.error`.
-   **Configuration Clarity:** Ensure `ipfs server status` clearly shows the currently configured API endpoint. Provide helpful messages if configuration (like API URL or auth) is missing when required by a command. Use `ipfs config list` to show relevant settings.
-   **Streaming:** Use streaming for `ipfs add` (reading from local file) and `ipfs get` (writing to local file or stdout) to handle large files efficiently.

## Deliverables

-   Functional `ipfs add`, `ipfs get`, `ipfs ls` commands using `IPFSKitClient`, with support for file/directory paths, streaming, and progress indication.
-   Functional `ipfs pin add`, `ipfs pin rm`, `ipfs pin ls` commands interacting with the client/pinning service.
-   Functional `ipfs server status` and `ipfs config` (or main `config ipfs.`) commands.
-   Functional `ipfs dag get` and `ipfs dag resolve` commands.
-   Commands integrated with `ExecutionContext` to access `IPFSKitClient`, `ConfigurationManager`, `OutputFormatter`.
-   E2E tests validating the primary functionality and options of each implemented `ipfs` command against a test IPFS node/server.
-   Integration tests for the `IPFSKitClient` service itself (tested in Phase 2).
-   Comprehensive help text (`--help`) for all commands and options.
-   Updated user documentation (command reference, guides) for IPFS features.
