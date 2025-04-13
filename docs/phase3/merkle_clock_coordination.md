# Phase 3: Merkle Clock Coordination & Distributed Task Delegation

**Timeline:** Week 8 of Phase 3 (Concurrent with Fibonacci Heap Scheduler)

This document details the implementation plan and architecture for the distributed coordination components of the enhanced TaskNet system, specifically focusing on Merkle Clocks for causal event ordering and Hamming distance for decentralized task responsibility assignment. This enables tasks selected by the local scheduler to be potentially executed by other capable peers on the network.

## Goals

-   Implement a `MerkleClock` data structure in TypeScript capable of tracking causal history across distributed nodes via logical timestamps and Merkle hashing.
-   Develop mechanisms for efficient clock synchronization (e.g., head exchange) and merging using LibP2P.
-   Implement Hamming distance calculation between normalized Peer IDs and Task IDs (or clock heads).
-   Define and implement the logic for determining task responsibility based on minimum Hamming distance and tie-breaking rules.
-   Integrate with a LibP2P service (`NetworkService`) for PubSub-based task announcement and completion notifications.
-   Modify the `TaskExecutor` to interact with this coordination layer when deciding to distribute a task.

## Architecture

This system enables decentralized task distribution without a central coordinator.

1.  **Causal Ordering (Merkle Clocks):** Each peer maintains a `MerkleClock`, which is essentially a vector clock (mapping PeerIDs to logical timestamps) combined with a Merkle root hash calculated over the clock's state. Ticking the clock for local events increments the local timestamp. Merging clocks involves taking the maximum timestamp for each peer and recalculating the hash. Comparing clock heads allows peers to efficiently determine if they have causally newer information than others, triggering synchronization. This ensures a partial ordering of events across the network.
2.  **Responsibility Assignment (Hamming Distance):** When a task is distributed, a target identifier (e.g., the Task ID or the announcer's clock head) is broadcast. Each peer calculates the Hamming distance (number of differing bits) between its own normalized PeerID and the target ID. The peer(s) with the minimum distance are deterministically responsible for executing the task. This distributes load without explicit assignment.
3.  **Communication (LibP2P):** A `NetworkService` managing a LibP2P node handles peer discovery and communication. Task announcements and completion notifications are broadcast using LibP2P's PubSub mechanism over specific topics. Clock synchronization might use direct peer messages or PubSub.

```mermaid
graph TD
    subgraph Peer A (Originator)
        A1[TaskExecutor] -- Decide to Distribute --> A2(Coordinator);
        A2 -- Tick Local Clock --> A3[MerkleClock A];
        A3 -- Get Head --> A2;
        A2 -- Announce Task(ID, CID, Head) --> A4(NetworkService: PubSub);
        A4 -- Receives Completion --> A2;
        A2 -- Merge Clock & Notify --> A1;
    end

    subgraph Peer B (Potential Executor)
        B1(NetworkService: PubSub) -- Receives Announcement --> B2(Coordinator);
        B2 -- Calculate Hamming(PeerID_B, TargetID) --> B3{Is Responsible?};
        B3 -- Yes --> B4[Execute Task (via TaskExecutor)];
        B4 -- Task Done --> B5(Coordinator);
        B5 -- Tick Local Clock --> B6[MerkleClock B];
        B6 -- Get Head --> B5;
        B5 -- Announce Completion(TaskID, ResultCID, Head) --> B1;
        B3 -- No --> B7(Ignore / Wait);
    end

    subgraph Peer C (Potential Executor)
        C1(NetworkService: PubSub) -- Receives Announcement --> C2(Coordinator);
        C2 -- Calculate Hamming(PeerID_C, TargetID) --> C3{Is Responsible?};
        C3 -- No --> C4(Ignore / Wait);
    end

    A4 -- Broadcast --> B1;
    A4 -- Broadcast --> C1;
    B1 -- Broadcast Completion --> A4;
    B1 -- Broadcast Completion --> C1;

    %% Clock Sync (Conceptual)
    A3 <-.->|Sync via NetworkService| B6;
    A3 <-.->|Sync via NetworkService| C_Clock[MerkleClock C];
    B6 <-.->|Sync via NetworkService| C_Clock;

    style A4 fill:#9cf, stroke:#333
    style B1 fill:#9cf, stroke:#333
    style C1 fill:#9cf, stroke:#333
```

## Implementation Details

### 1. Merkle Clock Implementation (`src/tasks/coordination/merkle_clock.ts`)

-   **Data Structure (`MerkleClock` Class):**
    -   `timestamps: Map<string, number>`: Stores logical time for each known PeerID string.
    -   `localPeerId: string`: The PeerID of the node owning this clock.
    -   `head: string`: The current Merkle root hash (hex string) of the clock state.
    -   `_calculateHead()`: Private method to compute the Merkle root. This involves:
        1.  Converting the `timestamps` map into a sorted list of key-value pairs (e.g., `['peerA:10', 'peerB:5']`).
        2.  Hashing each entry individually (e.g., using SHA-256).
        3.  Building a Merkle tree from these leaf hashes.
        4.  Returning the root hash of the tree. Use a standard Merkle tree library (e.g., `merkletreejs`).
-   **Core Operations:**
    -   `tick()`: Increments `timestamps[this.localPeerId]` and calls `_calculateHead()`.
    -   `merge(otherClockData: Record<string, number>)`: Iterates through `otherClockData`. For each `peerId`, sets `this.timestamps[peerId] = Math.max(this.timestamps[peerId] || 0, otherClockData[peerId])`. Calls `_calculateHead()`.
    -   `getHead(): string`: Returns the cached `head` string.
    -   `getTimestamps(): Record<string, number>`: Returns a copy of the internal timestamp map for serialization.
    -   `compare(otherHead: string, otherTimestamps: Record<string, number>): 'before' | 'after' | 'concurrent' | 'equal'`:
        1.  If `this.head === otherHead`, return `'equal'`.
        2.  Check if `this` clock causally descends `other` (all timestamps in `other` are <= timestamps in `this`). If yes, return `'after'`.
        3.  Check if `other` clock causally descends `this`. If yes, return `'before'`.
        4.  Otherwise, return `'concurrent'`.
-   **Serialization:** Implement `toJSON()` returning `{ timestamps: this.getTimestamps(), head: this.getHead() }` and `static fromJSON(json)` for reconstruction. Use efficient binary serialization (e.g., CBOR) for network transmission if needed.
-   **Testing:** Rigorous unit tests for `tick`, `merge`, `compare` (covering all causal relationships), `_calculateHead` (consistency), and serialization.

### 2. Distributed Coordination Logic (`src/tasks/coordination/coordinator.ts`)

-   **`Coordinator` Service:** Manages the local `MerkleClock` instance and interacts with the `NetworkService` (LibP2P).
-   **Clock Synchronization:**
    -   Periodically (e.g., every few seconds), broadcast the local clock head via PubSub or gossip.
    -   On receiving a head from a peer, use `MerkleClock.compare`.
    -   If the remote clock is `'after'` or `'concurrent'`, request the full remote clock data (timestamps) via a direct message or another PubSub topic.
    -   On receiving full clock data, call `localClock.merge(remoteClockData)`.
-   **Event Tracking:** Before broadcasting any significant event (Task Announcement, Task Completion), the `Coordinator` calls `localClock.tick()`. The current `localClock.getHead()` is included in the broadcast message.
-   **Conflict Resolution:** Merkle Clocks establish causality but don't resolve application-level conflicts directly (like two peers starting the same task due to concurrent announcements). The Hamming distance responsibility assignment aims to prevent this by being deterministic. If conflicts still occur (e.g., due to network partitions), strategies like "first completion wins" or originator-based resolution might be needed, potentially using the clock timestamps for tie-breaking.

### 3. Hamming Distance Peer Selection (`src/tasks/coordination/responsibility.ts`)

-   **ID Normalization:** Define a standard way to represent PeerIDs and Task IDs (or Clock Heads) as fixed-length binary strings or buffers suitable for Hamming distance calculation. This might involve hashing the original IDs (e.g., SHA-256) and taking a prefix, or using the binary representation of LibP2P PeerIDs directly if appropriate.
-   **Hamming Distance Function:** Implement `calculateHammingDistance(buffer1: Buffer, buffer2: Buffer): number`. This involves XORing the two buffers byte-by-byte and counting the set bits (popcount) in the result. Ensure buffers have equal length.
-   **Responsibility Logic (`Coordinator` Service):**
    -   On receiving a Task Announcement:
        1.  Get the local normalized PeerID.
        2.  Get the normalized Target ID from the announcement message.
        3.  Calculate `distance = calculateHammingDistance(localPeerId, targetId)`.
        4.  Maintain a short-term record (e.g., in memory with TTL) of the minimum distance seen *so far* for this Task ID from other peers (potentially learned via gossip or direct observation, though simpler initially is just local calculation).
        5.  If `distance` is less than the minimum seen, the current peer is *potentially* responsible. If `distance` equals the minimum, apply tie-breaking (e.g., lexicographical comparison of the full PeerIDs).
        6.  If determined responsible, proceed to claim/execute the task.
-   **Target ID Selection:** Decide whether the Target ID for Hamming distance should be the Task ID itself (static assignment) or the Clock Head of the announcer (dynamic assignment based on causal state). Using the Task ID is simpler.
-   **Peer Reliability:** Defer incorporating reliability scores until the basic mechanism is working.

### 4. Task Distribution Workflow (`src/tasks/execution/executor.ts`, `src/tasks/coordination/coordinator.ts`)

-   **Triggering Distribution (`TaskExecutor`):** When `TaskExecutor` gets a task from the scheduler, it checks criteria (e.g., task metadata flags, configuration settings, estimated complexity) to decide if distribution is desired/allowed. If yes, it calls `Coordinator.distributeTask(task)`.
-   **Task Announcement (`Coordinator`):**
    1.  Calls `localClock.tick()`.
    2.  Constructs `TaskAnnouncement` message: `{ taskId: task.id, taskCid: task.inputCid, announcerId: localPeerId, announcerHead: localClock.getHead(), targetId: normalize(task.id) }`.
    3.  Calls `NetworkService.publish('task-announce-topic', message)`.
-   **Peer Reception (`Coordinator`):**
    1.  `NetworkService` receives message from PubSub topic.
    2.  `Coordinator` calculates Hamming distance and determines responsibility (as described in 3.3).
    3.  If responsible:
        a.  Optionally publish a short-lived "Task Claim" message to reduce redundant work (best-effort).
        b.  Notify local `TaskExecutor` to execute the task (passing Task ID and CID). The `TaskExecutor` then handles data retrieval (via `StorageOperations`) and execution (via `WorkerPool` or direct).
-   **Task Completion (`TaskExecutor` -> `Coordinator`):**
    1.  After local execution finishes, `TaskExecutor` notifies `Coordinator` with the result (or error) and result CID.
    2.  `Coordinator` calls `localClock.tick()`.
    3.  Constructs `TaskCompletion` message: `{ taskId: task.id, resultCid: resultCid, executerId: localPeerId, executerHead: localClock.getHead(), status: 'Succeeded' | 'Failed', error?: string }`.
    4.  Calls `NetworkService.publish('task-complete-topic', message)`.
-   **Receiving Completion (`Coordinator`):**
    1.  `NetworkService` receives completion message.
    2.  `Coordinator` merges the clock data (`executerHead`, timestamps if included) from the message using `localClock.merge()`.
    3.  If the local node is the originator of the task, it notifies the local `TaskManager` of the completion (`TaskManager.completeTask` or `TaskManager.failTask`).
-   **Failure Handling:**
    -   **Timeouts:** The originating `Coordinator` should set a timeout when announcing a task. If no `TaskCompletion` is received within the timeout, it should mark the task as failed locally via `TaskManager.failTask` (potentially with a 'timeout' error code).
    -   **Re-Announcement/Re-Assignment:** Consider strategies if the responsible peer appears offline (e.g., originator re-announces after timeout, potentially excluding the presumed-failed peer from responsibility calculation temporarily). This adds complexity.
    -   **Heartbeats:** A separate heartbeat mechanism managed by `NetworkService` can help maintain an active peer list for more reliable responsibility calculation.

### 5. LibP2P Integration (`src/network/libp2p_service.ts`)

-   **`NetworkService` (`src/network/service.ts`):** A dedicated service responsible for managing the LibP2P node lifecycle (creation, start, stop).
-   **LibP2P Modules:** Configure LibP2P with necessary modules:
    -   Transport (TCP, WebSockets, WebRTC - depending on target environments).
    -   Peer Discovery (mDNS, Bootstrap, PubSub Peer Discovery).
    -   PubSub (GossipSub recommended).
    -   Potentially Request/Response protocols for direct clock sync requests.
-   **PubSub Topics:** Define constants for topic strings (e.g., `/swissknife/task-announce/v1`, `/swissknife/task-complete/v1`).
-   **Serialization:** Use an efficient and standard serialization format for PubSub messages (e.g., CBOR or Protocol Buffers) rather than JSON to minimize network overhead. Implement serialization/deserialization logic within the `Coordinator` or `NetworkService`.

## Interaction with Scheduler

-   **Scheduler:** Provides the *next highest priority task* (`Task`) to the `TaskExecutor` via the `TaskManager`. It is unaware of distribution.
-   **Executor:** Receives a `Task`. Checks if distribution is enabled/appropriate.
    -   If **No:** Executes locally (e.g., via `WorkerPool`). Reports result/error to `TaskManager`.
    -   If **Yes:** Passes the `Task` to the `Coordinator`.
-   **Coordinator:** Receives `Task` for distribution. Performs Merkle Clock tick, PubSub announcement. Listens for announcements from others, calculates responsibility. If responsible for a remote task, notifies local `TaskExecutor` to run it. If receives completion for an originated task, notifies `TaskManager`.

## Deliverables

-   Robust TypeScript implementation of `MerkleClock` class, including Merkle hashing and comparison logic.
-   `Coordinator` service implementing clock synchronization (head exchange, merge on request) via `NetworkService`.
-   Implementation of normalized ID generation and `calculateHammingDistance` function.
-   `Coordinator` logic for determining task responsibility based on Hamming distance and tie-breaking.
-   Integration with `NetworkService` (LibP2P) for publishing/subscribing to task announcement and completion topics using efficient serialization (e.g., CBOR).
-   Modification of `TaskExecutor` to conditionally call `Coordinator.distributeTask`.
-   Comprehensive unit tests for `MerkleClock` operations, Hamming distance, and responsibility calculation.
-   Integration tests simulating a multi-peer environment (e.g., using multiple LibP2P nodes in the same process or via test containers) to validate the announcement -> responsibility -> execution -> completion workflow.
-   Updated API documentation for relevant services.
