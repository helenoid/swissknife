# Phase 3: Graph-of-Thought (GoT) Implementation

**Timeline:** Week 7 of Phase 3

This document details the implementation plan and architecture for the Graph-of-Thought (GoT) system within SwissKnife, a core component of the enhanced TaskNet functionality introduced in Phase 3. GoT enables non-linear, graph-based reasoning for complex problem-solving.

## Goals

-   Implement a robust and flexible Directed Acyclic Graph (DAG) structure for representing thought processes.
-   Define and implement various specialized `ThoughtNode` types and their processors.
-   Develop multiple reasoning strategies for traversing and expanding the thought graph.
-   Integrate seamlessly with IPFS/IPLD for persistent, content-addressable storage of graph components.

## Architecture

The Graph-of-Thought (GoT) system enables complex, non-linear reasoning by representing the problem-solving process as a Directed Acyclic Graph (DAG). Each node represents a unit of thought or work, and edges define dependencies or relationships.

The key architectural components are:

1.  **Graph Data Structure (`ThoughtGraph`, `ThoughtNode`, `ThoughtEdge`):** The in-memory representation of the reasoning graph, ensuring acyclicity and managing node/edge properties (content, status, results, metadata).
2.  **Thought Node Types:** A taxonomy of specialized node classes (e.g., `InputNode`, `QuestionNode`, `HypothesisNode`, `AnalysisNode`, `DecompositionNode`, `SynthesisNode`, `SolutionNode`) representing different kinds of reasoning steps or sub-problems.
3.  **Node Processors:** Specific logic modules associated with each `ThoughtNode` type. A processor takes a node as input and executes the corresponding action (e.g., calling an LLM, running a tool, performing analysis), potentially generating new child nodes or updating the node's result/status. Processors are typically executed via the Task System.
4.  **Reasoning Engine:** The orchestrator that manages the overall GoT process. It initializes the graph, selects and applies reasoning strategies (e.g., BFS, DFS) to decide which nodes to process next, interacts with the Task System to schedule node processors, and determines when the process is complete.
5.  **Persistence Layer (IPLD/IPFS):** Handles serialization of the graph structure and node content/results into IPLD blocks stored on IPFS via the `IPFSKitClient`. This provides content addressing, immutability, and persistence.
6.  **Caching Layer:** An optional in-memory cache (e.g., LRU) to reduce redundant deserialization of frequently accessed IPLD blocks (nodes) from IPFS.

```mermaid
graph TD
    subgraph GoT System
        A[Reasoning Engine] -- Manages --> B(Graph Data Structure);
        A -- Selects & Triggers --> D[Node Processors];
        D -- Operates on --> C{Thought Nodes};
        B -- Contains --> C;
        C -- Defines --> D;
        B -- Persisted via --> E[Persistence (IPLD/IPFS)];
        C -- Persisted via --> E;
        E -- Accessed via --> F[Cache];
        F -- Populates --> B;
    end

    G[Task System] -- Executes --> D;
    A -- Schedules via --> G;
    D -- Calls --> H(AI Model / Tools);

    style E fill:#ddd, stroke:#333
    style H fill:#ccf, stroke:#333
```
*The Reasoning Engine drives the process, using the Task System to execute Node Processors which operate on Thought Nodes within the Graph Data Structure. Persistence uses IPFS/IPLD, potentially with a Cache.*

## Implementation Details

### 1. Graph Data Structures (`src/graph/graph.ts`, `src/graph/node.ts`, `src/graph/edge.ts`)

-   **Core Classes:**
    -   `ThoughtGraph`: Represents the overall graph instance, holding nodes and edges. Contains methods for adding/removing nodes/edges, finding nodes, serialization, and potentially validation (e.g., cycle detection, though DAG structure should prevent cycles if built correctly).
    -   `ThoughtNode`: Base class/interface for all nodes. Includes common properties: `id` (unique, potentially CID of content), `type` (enum `NodeType`), `content` (or CID pointing to content), `status` (`Pending`, `Ready`, `InProgress`, `CompletedSuccess`, `CompletedFailure`, `Cancelled`), `result` (or CID pointing to result), `metadata` (timestamps, confidence, creator, etc.).
    -   `ThoughtEdge`: Represents a directed link between two nodes (`sourceId`, `targetId`). Includes `type` (e.g., 'dependency', 'elaboration', 'contradiction') and optional `weight` or metadata.
-   **Acyclicity:** Ensure that `addEdge` operations prevent the introduction of cycles, maintaining the DAG property. This might involve a quick traversal check or relying on the construction logic within node processors.
-   **Immutability (Conceptual):** While the in-memory graph might be mutable during processing, the persisted representation via IPLD should leverage immutability. Updating a node conceptually creates a *new* node version linked to the old one. The `ThoughtGraph` might manage different versions or states.
-   **Metadata:** Standardize metadata fields: `createdAt`, `updatedAt`, `creatorId` (user or agent ID), `confidenceScore` (0-1), `cost` (estimated/actual compute cost).
-   **Traversal & Query:** Implement efficient graph traversal (DFS, BFS, topological sort) and query methods (e.g., `getParents(nodeId)`, `getChildren(nodeId)`, `findNodesByType(type)`, `getReadyNodes()`). Consider using adjacency lists (`Map<string, string[]>`) internally for faster traversals.
-   **Manipulation API:** Provide a clear API on `ThoughtGraph` for modifications, ensuring consistency (e.g., updating node status might trigger checks on dependent nodes).

### 2. Thought Node System (`src/graph/nodes/`)

-   **Base `ThoughtNode` Interface/Class:** Define common properties (`id`, `type`, `content`, `status`, `result`, `metadata`).
-   **Specialized Node Types (Enum `NodeType` & potentially subclasses):** Define a clear taxonomy. Examples:
    -   `InputNode`: The root node containing the initial problem or query.
    -   `DecompositionNode`: Represents breaking a problem into sub-problems. Its processor interacts with the `DecompositionEngine` and creates child nodes representing the sub-problems.
    -   `PlanNode`: Outlines a sequence of steps or sub-goals.
    -   `QuestionNode`: Poses a specific question needed to proceed.
    -   `HypothesisNode`: Formulates a potential answer, solution, or intermediate conclusion.
    -   `EvidenceNode`/`ResearchNode`: Represents the need to gather information (e.g., via a `web_search` or `file_read` tool). Its result contains the gathered information.
    -   `AnalysisNode`: Processes information from parent nodes (e.g., summarizing evidence, comparing hypotheses).
    -   `CodeNode`: Generates, analyzes, or executes code.
    -   `CritiqueNode`: Evaluates or critiques the content of a parent node (e.g., a hypothesis or a generated plan).
    -   `SynthesisNode`: Combines results from multiple parent nodes into a unified summary or conclusion. Interacts with the `SynthesisEngine`.
    -   `SolutionNode`: Represents a final proposed solution or answer to the original input.
-   **Node Status State Machine:** Define clear transitions:
    -   `Pending`: Created but dependencies (parent nodes) are not yet `CompletedSuccess`.
    -   `Ready`: All dependencies met, ready for its processor to be scheduled.
    -   `InProgress`: Processor is currently executing (via Task System).
    -   `CompletedSuccess`: Processor finished successfully, `result` is available.
    -   `CompletedFailure`: Processor failed, `error` details are available.
    -   `Cancelled`: Processing was explicitly cancelled.

### 3. Node Processors (`src/graph/processors/`)

-   **Processor Interface:** Define a standard interface, likely executed as a Task by the Task System. Example: `interface NodeProcessor { execute(node: ThoughtNode, context: ExecutionContext): Promise<NodeProcessorResult>; }` where `NodeProcessorResult` might contain `{ status: 'CompletedSuccess' | 'CompletedFailure', result?: any, error?: Error, newNodes?: ThoughtNode[], newEdges?: ThoughtEdge[] }`.
-   **Processor Registry:** A map or factory function associating `NodeType` enums with their corresponding processor implementations or task types.
-   **Processor Logic:** Each processor implements the specific action for its node type. Examples:
    -   `AnalysisNodeProcessor`: Takes results from parent nodes, constructs a prompt for an LLM (via `AgentService`), calls the LLM to perform analysis, updates the node's result with the analysis.
    -   `ResearchNodeProcessor`: Takes the research query from the node content, calls a `web_search` tool (via `ToolExecutor`), updates the node's result with search findings.
    -   `DecompositionNodeProcessor`: Calls the `DecompositionEngine` to generate sub-problems, creates new child `ThoughtNode`s for these sub-problems, and adds corresponding edges.
-   **Execution via Task System:** The `ReasoningEngine` identifies `Ready` nodes and submits corresponding tasks (e.g., `'processThoughtNode'`) to the `TaskManager`, passing the `nodeId` and necessary context. The `TaskExecutor` (or worker) then retrieves the node, finds its processor via the registry, and executes it.
-   **Dependency Handling:** The `ReasoningEngine` or `TaskManager` is responsible for tracking node dependencies. A node's status only changes to `Ready` when all its parent nodes (connected by 'dependency' edges) reach `CompletedSuccess`.

### 4. Reasoning Strategies (`src/graph/strategies/`)

-   **Strategy Interface:** Define an interface for reasoning strategies, likely managed by the `ReasoningEngine`. Example: `interface ReasoningStrategy { getNextNodesToProcess(graph: ThoughtGraph): ThoughtNode[]; }`.
-   **Implementation Examples:**
    -   **BFS (Breadth-First Search):** Prioritize processing nodes level by level. Useful for exploring multiple options broadly. Returns all `Ready` nodes at the lowest depth.
    -   **DFS (Depth-First Search):** Prioritize exploring one line of reasoning completely before exploring alternatives. Returns a `Ready` node from the deepest path.
    -   **Heuristic-Based:** Prioritize nodes based on confidence scores, estimated value, or other heuristics. Returns `Ready` nodes with the highest scores.
    -   **Parallel Exploration:** Identify independent branches (nodes with no shared unprocessed ancestors) and return multiple `Ready` nodes from different branches to be processed concurrently by the Task System.
-   **Strategy Selection:** The `ReasoningEngine` might select a strategy based on the initial task type, user configuration (`--strategy bfs`), or dynamically adapt based on the graph's state (e.g., switch to DFS if a promising path emerges).

### 5. IPFS/IPLD Integration (`src/graph/persistence/`)

-   **IPLD Schema Design:** Carefully design the IPLD schemas (likely using CBOR encoding) for `ThoughtNode` and `ThoughtGraph`.
    -   `ThoughtNode` Schema: Include `type`, `status`, `metadata`. Store large `content` and `result` data in separate IPFS blocks and link their CIDs within the node block (e.g., `content: CID`, `result: CID`). Link parent/child relationships via CIDs as well (e.g., `parents: [CID, ...]`).
    -   `ThoughtGraph` Schema: Might store the root node CID, graph metadata, and potentially a map or list representing the overall structure (linking node CIDs), although the structure can often be inferred by traversing from the root node via links within node blocks.
-   **Serialization/Deserialization:** Implement functions using libraries like `@ipld/dag-cbor` and `multiformats` to encode/decode graph objects to/from IPLD blocks.
-   **Persistence Logic:** Create a `GraphPersistence` service that uses the `IPFSKitClient` (`addContent`, `getContent`) to save/load IPLD blocks representing nodes and the graph structure. Node processors update the in-memory node, and the persistence service saves the updated node block to IPFS (generating a new CID due to immutability). The graph structure referencing the node might also need updating.
-   **Content Addressing:** The CID of a node's IPLD block serves as its unique, verifiable identifier.
-   **Versioning:** Immutability naturally provides versioning. Saving an updated node creates a new block with a new CID. The parent graph structure needs to be updated to point to the new node CID, creating a new version of the graph state. Managing these versions might require additional mechanisms (e.g., storing graph head CIDs in a list or using IPNS).

### 6. Caching (`src/graph/cache.ts`)

-   **Cache Strategy:** Implement an in-memory LRU cache (`lru-cache` library) within the `GraphPersistence` service. The cache stores deserialized `ThoughtNode` objects, keyed by their CID string representation.
-   **Cache Invalidation:** Primarily relies on LRU eviction based on size or item count limits defined in configuration. Since IPLD data is immutable, explicit invalidation based on content change isn't needed.
-   **Integration:** Before attempting to load a node block from IPFS (`ipfsClient.getContent(cid)`), the `GraphPersistence` service first checks the in-memory cache using the node's CID. If found, the cached object is returned directly. If not found, it's loaded from IPFS, deserialized, stored in the cache, and then returned.

## Interaction with Other Systems

-   **Task System:** The `ReasoningEngine` submits tasks to the `TaskManager` to execute `NodeProcessors`. The `TaskExecutor` (potentially using the `WorkerPool`) runs these processors. `DecompositionNodeProcessor` interacts with the `DecompositionEngine` (part of Task System) to create new sub-tasks. `SynthesisNodeProcessor` interacts with the `SynthesisEngine`.
-   **AI Agent / Model System:** Many `NodeProcessors` (e.g., for `AnalysisNode`, `HypothesisNode`, `CritiqueNode`) will need to call an AI model. They achieve this by accessing the `AgentService` or `ModelExecutor` via the `ExecutionContext` passed to the task.
-   **Storage System / IPFS Kit Client:** The `GraphPersistence` layer uses the `StorageOperations` service (specifically the `IPFSBackend` which uses the `IPFSKitClient`) to save and load the IPLD blocks representing the graph to/from IPFS.
-   **Tool System:** `NodeProcessors` (like `ResearchNodeProcessor`) can invoke tools by accessing the `ToolExecutor` service via the `ExecutionContext`.

## Example Workflow

1.  User issues a complex query via a CLI command (e.g., `swissknife agent execute --use-got "Plan a trip"`).
2.  The command handler initiates a main GoT task via the `TaskManager`.
3.  The `TaskManager` might trigger the `ReasoningEngine` (or the task executor does).
4.  The `ReasoningEngine` creates a `ThoughtGraph` with an `InputNode` containing the query. It saves the initial graph state via `GraphPersistence` (IPFS).
5.  The `ReasoningEngine` selects a strategy (e.g., BFS) and identifies the first `Ready` node (the `InputNode`).
6.  It submits a task to the `TaskManager` to process the `InputNode`.
7.  The `TaskScheduler` queues the task.
8.  The `TaskExecutor` picks up the task, retrieves the `InputNode` (via `GraphPersistence`, checking cache first), finds its `InputNodeProcessor`, and executes it.
9.  The `InputNodeProcessor` might call an LLM (via `AgentService`) to generate initial questions or a plan, creating new child `QuestionNode`s or `PlanNode`s and linking them. It updates the `InputNode` status to `CompletedSuccess` and returns the new nodes/edges.
10. The `TaskExecutor` reports completion to the `TaskManager`.
11. The `TaskManager` updates the `InputNode` status and checks dependencies. The new child nodes become `Ready`.
12. The `TaskManager` notifies the `TaskScheduler` about the newly `Ready` nodes.
13. The `ReasoningEngine` (potentially triggered by task completion or running in a loop) asks the `TaskScheduler` for the next `Ready` node(s) based on its strategy.
14. Steps 6-13 repeat: nodes are processed, potentially calling tools (`ToolExecutor`) or LLMs (`AgentService`), generating results (stored on IPFS via `GraphPersistence`), creating new nodes, and updating statuses until a `SolutionNode` is reached or termination conditions apply.
15. A `SynthesisNodeProcessor` might be triggered to combine results from different branches before generating the final `SolutionNode`.
16. The `ReasoningEngine` detects completion, retrieves the final result from the `SolutionNode` (via `GraphPersistence`), and reports it back to the original main task.
17. The `TaskManager` marks the main task as `CompletedSuccess`.
18. The CLI command receives the final result and displays it using the `OutputFormatter`.

## Deliverables

-   Fully implemented `ThoughtGraph`, `ThoughtNode`, and `ThoughtEdge` classes.
-   A suite of specialized `ThoughtNode` types and their corresponding `NodeProcessors`.
-   Multiple implemented `Reasoning Strategies`.
-   Working IPLD serialization/deserialization integrated with the `IPFSKitClient`.
-   In-memory caching layer for graph nodes.
-   Unit and integration tests covering graph manipulation, node processing, strategies, and persistence.
-   API documentation for the GoT system.
