import { logger } from '../../utils/logger.js';

// Generic Node type constraint (must have an 'id' property)
type NodeWithId = { id: string };

/**
 * Represents a node within the DAG, storing the actual data
 * and adjacency information (outgoing edges).
 */
class DagNode<T extends NodeWithId> {
  id: string;
  data: T;
  successors = new Set<string>(); // IDs of nodes this node points to
  predecessors = new Set<string>(); // IDs of nodes pointing to this node

  constructor(data: T) {
    this.id = data.id;
    this.data = data;
  }
}

/**
 * Basic implementation of a Directed Acyclic Graph (DAG).
 * Stores nodes and their relationships.
 * Does not yet implement cycle detection on edge addition (crucial for a true DAG).
 */
export class DirectedAcyclicGraph<T extends NodeWithId> {
  private nodes = new Map<string, DagNode<T>>();

  constructor() {
    logger.debug('Initializing DirectedAcyclicGraph...');
  }

  /**
   * Adds a node to the graph.
   * @param nodeData The data for the node (must include an 'id').
   * @returns True if the node was added, false if a node with the same ID already exists.
   */
  addNode(nodeData: T): boolean {
    if (this.nodes.has(nodeData.id)) {
      logger.warn(`[DAG] Node with ID ${nodeData.id} already exists.`);
      return false;
    }
    const newNode = new DagNode(nodeData);
    this.nodes.set(nodeData.id, newNode);
    logger.debug(`[DAG] Added node: ${nodeData.id}`);
    return true;
  }

  /**
   * Adds a directed edge between two nodes.
   * @param fromId The ID of the source node.
   * @param toId The ID of the target node.
   * @returns True if the edge was added, false if nodes don't exist or edge already exists.
   * @throws Error if adding the edge would create a cycle (TODO: Implement cycle detection).
   */
  addEdge(fromId: string, toId: string): boolean {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) {
      logger.error(`[DAG] Cannot add edge: Node ${!fromNode ? fromId : toId} not found.`);
      return false;
    }

    if (fromNode.successors.has(toId)) {
      logger.warn(`[DAG] Edge from ${fromId} to ${toId} already exists.`);
      return false; // Edge already exists
    }

    // TODO: Implement cycle detection before adding the edge.
    // This is critical for maintaining the DAG property.
    // If adding this edge creates a cycle, throw an error.
    // Example (pseudo-code): if (this.detectCycle(fromId, toId)) { throw new Error(...) }

    fromNode.successors.add(toId);
    toNode.predecessors.add(fromId);
    logger.debug(`[DAG] Added edge from ${fromId} to ${toId}`);
    return true;
  }

  /**
   * Retrieves a node's data by its ID.
   * @param nodeId The ID of the node to retrieve.
   * @returns The node data, or undefined if not found.
   */
  getNode(nodeId: string): T | undefined {
    return this.nodes.get(nodeId)?.data;
  }
  
  /**
   * Checks if a node exists in the graph.
   * @param nodeId The ID of the node to check.
   * @returns True if the node exists, false otherwise.
   */
  hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  /**
   * Gets the IDs of the successor nodes for a given node.
   * @param nodeId The ID of the node.
   * @returns A Set of successor node IDs, or undefined if the node doesn't exist.
   */
  getSuccessors(nodeId: string): Set<string> | undefined {
     return this.nodes.get(nodeId)?.successors;
  }

  /**
   * Gets the IDs of the predecessor nodes for a given node.
   * @param nodeId The ID of the node.
   * @returns A Set of predecessor node IDs, or undefined if the node doesn't exist.
   */
  getPredecessors(nodeId: string): Set<string> | undefined {
     return this.nodes.get(nodeId)?.predecessors;
  }

  /**
   * Returns the total number of nodes in the graph.
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  // TODO: Implement cycle detection (e.g., using DFS)
  // private detectCycle(fromId: string, toId: string): boolean { ... }

  // TODO: Implement graph traversal methods (DFS, BFS, topological sort)
}
