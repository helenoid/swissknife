/**
 * Graph-of-Thought Manager Mock Implementation (CommonJS Version)
 * 
 * This provides a simplified test-friendly version of the GoTManager class.
 */

const { GoTNode, GoTNodeStatus } = require('./got-node.mock');
const EventEmitter = require('events');

/**
 * Mock implementation of the Graph-of-Thought Manager
 */
class GoTManager extends EventEmitter {
  static instance;
  
  /**
   * Create a new GoTManager instance
   * @param {boolean} forceNew - Force creation of a new instance (for testing)
   */
  constructor() {
    super();
    this.nodes = new Map();
    this.graphs = new Map();
    this.logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  }
  
  /**
   * Get the singleton instance of GoTManager
   * @param {boolean} forceNew - Force creation of a new instance (for testing)
   */
  static getInstance(forceNew = false) {
    if (!GoTManager.instance || forceNew) {
      GoTManager.instance = new GoTManager();
    }
    return GoTManager.instance;
  }
  
  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance() {
    GoTManager.instance = null;
  }
  
  /**
   * Create a new Graph-of-Thought graph
   */
  createGraph() {
    const graphId = `graph-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.graphs.set(graphId, new Set());
    
    this.logger.info(`Created new Graph-of-Thought graph: ${graphId}`);
    this.emit('graphCreated', { graphId });
    
    return graphId;
  }
  
  /**
   * Get all node IDs in a graph
   * @param {string} graphId - Graph ID
   */
  getGraphNodeIds(graphId) {
    const nodeIds = this.graphs.get(graphId);
    if (!nodeIds) {
      return [];
    }
    return Array.from(nodeIds);
  }
  
  /**
   * Create a node and add it to the specified graph
   * @param {Object} options - Node options
   */
  createNode(options) {
    const node = new GoTNode(options);
    
    if (options.graphId) {
      // Add node to graph
      const nodeIds = this.graphs.get(options.graphId);
      if (nodeIds) {
        nodeIds.add(node.id);
        node.graphId = options.graphId;
      }
    }
    
    // Store node
    this.nodes.set(node.id, node);
    
    // Add bidirectional connections
    if (options.parentIds) {
      options.parentIds.forEach(parentId => {
        const parent = this.getNode(parentId);
        if (parent) {
          parent.addChild(node.id);
        }
      });
    }
    
    this.emit('nodeCreated', { nodeId: node.id, graphId: options.graphId });
    return node;
  }
  
  /**
   * Get a node by ID
   * @param {string} nodeId - Node ID
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get all child nodes of a node
   * @param {GoTNode} node - Parent node
   */
  getChildNodes(node) {
    if (!node || !node.childIds || node.childIds.length === 0) {
      return [];
    }
    return node.childIds.map(id => this.getNode(id)).filter(n => n !== null);
  }
  
  /**
   * Get all parent nodes of a node
   * @param {GoTNode} node - Child node
   */
  getParentNodes(node) {
    if (!node || !node.parentIds || node.parentIds.length === 0) {
      return [];
    }
    return node.parentIds.map(id => this.getNode(id)).filter(n => n !== null);
  }
}

module.exports = {
  GoTManager
};
