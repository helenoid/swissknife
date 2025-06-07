/**
 * Graph-of-Thought Node Mock Implementation (CommonJS Version)
 * 
 * This provides a simplified test-friendly version of the GoTNode class.
 */

const { v4: uuidv4 } = require('uuid');

// Node type enum as a simple object
const GoTNodeType = {
  QUESTION: 'question',
  TASK: 'task',
  RESEARCH: 'research',
  ANALYSIS: 'analysis',
  ANSWER: 'answer',
  ERROR: 'error',
  INTERMEDIATE: 'intermediate',
  HYPOTHESIS: 'hypothesis',
  SYNTHESIS: 'synthesis'
};

// Node status enum as a simple object
const GoTNodeStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  IN_PROGRESS: 'in_progress',
  COMPLETED_SUCCESS: 'completed_success'
};

/**
 * Graph-of-Thought Node class
 * 
 * Represents a node in the reasoning graph.
 */
class GoTNode {
  /**
   * Create a new GoT node
   * 
   * @param {Object} options - Node creation options
   */
  constructor(options) {
    this.id = options.id || uuidv4();
    this.graphId = options.graphId;
    this.type = options.type;
    this.content = options.content || '';
    this.status = options.status || GoTNodeStatus.PENDING;
    this.data = options.data || {};
    this.priority = options.priority || 1;
    
    // Initialize timestamps
    this.createdAt = options.createdAt || Date.now();
    this.updatedAt = options.updatedAt || this.createdAt;
    this.completedAt = options.completedAt;
    
    // Initialize relationships
    this._parentIds = new Set(options.parentIds || []);
    this._childIds = new Set(options.childIds || []);
  }

  // Getters for parentIds and childIds as arrays
  get parentIds() {
    return Array.from(this._parentIds);
  }

  get childIds() {
    return Array.from(this._childIds);
  }
  
  /**
   * Update the status of the node
   * 
   * @param {string} status - New status
   * @param {string} [error] - Optional error message for failed status
   */
  updateStatus(status, error) {
    // Don't update timestamps if status hasn't changed
    if (this.status === status) {
      return;
    }
    
    this.status = status;
    this.updatedAt = Date.now();
    
    if (status === GoTNodeStatus.COMPLETED || status === GoTNodeStatus.COMPLETED_SUCCESS) {
      this.completedAt = this.updatedAt;
    } else if (status === GoTNodeStatus.FAILED && error) {
      this.error = error;
    }
  }
  
  /**
   * Update the content of the node
   * 
   * @param {string} content - New content
   */
  updateContent(content) {
    this.content = content;
    this.updatedAt = Date.now();
  }
  
  /**
   * Set the result of the node
   * 
   * @param {*} result - Node result
   */
  setResult(result) {
    this.result = result;
    this.updatedAt = Date.now();
    
    // Automatically update status to completed if not already
    if (this.status !== GoTNodeStatus.COMPLETED && this.status !== GoTNodeStatus.COMPLETED_SUCCESS) {
      this.status = GoTNodeStatus.COMPLETED;
      this.completedAt = this.updatedAt;
    }
  }
  
  /**
   * Add a parent node ID
   * 
   * @param {string} parentId - Parent node ID
   */
  addParent(parentId) {
    this._parentIds.add(parentId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Remove a parent node ID
   * 
   * @param {string} parentId - Parent node ID
   */
  removeParent(parentId) {
    this._parentIds.delete(parentId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Add a child node ID
   * 
   * @param {string} childId - Child node ID
   */
  addChild(childId) {
    this._childIds.add(childId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Remove a child node ID
   * 
   * @param {string} childId - Child node ID
   */
  removeChild(childId) {
    this._childIds.delete(childId);
    this.updatedAt = Date.now();
  }
  
  /**
   * Check if the node is blocked by any parents
   * 
   * @returns {boolean} True if blocked, false otherwise
   */
  isBlocked() {
    return this.status === GoTNodeStatus.BLOCKED;
  }
  
  /**
   * Check if the node is completed
   * 
   * @returns {boolean} True if completed, false otherwise
   */
  isCompleted() {
    return this.status === GoTNodeStatus.COMPLETED || this.status === GoTNodeStatus.COMPLETED_SUCCESS;
  }
  
  /**
   * Check if the node is a root node (has no parents)
   * 
   * @returns {boolean} True if root, false otherwise
   */
  isRoot() {
    return this._parentIds.size === 0;
  }
  
  /**
   * Check if the node is a leaf node (has no children)
   * 
   * @returns {boolean} True if leaf, false otherwise
   */
  isLeaf() {
    return this._childIds.size === 0;
  }
  
  /**
   * Update node data
   * 
   * @param {Object} data - New data to merge
   */
  updateData(data) {
    this.data = {
      ...this.data,
      ...data
    };
    this.updatedAt = Date.now();
  }
  
  /**
   * Serialize the node to a plain object
   * 
   * @returns {Object} Serialized node
   */
  toJSON() {
    return {
      id: this.id,
      graphId: this.graphId,
      type: this.type,
      content: this.content,
      status: this.status,
      data: this.data,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      parentIds: this.parentIds,
      childIds: this.childIds,
      result: this.result,
      error: this.error
    };
  }
  
  /**
   * Create a node from a serialized object
   * 
   * @param {Object} json - JSON representation of the node
   * @returns {GoTNode} Deserialized node
   */
  static fromJSON(json) {
    const node = new GoTNode({
      id: json.id,
      graphId: json.graphId,
      type: json.type,
      content: json.content,
      status: json.status,
      data: json.data,
      priority: json.priority,
      parentIds: json.parentIds,
      childIds: json.childIds,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      completedAt: json.completedAt
    });
    
    node.result = json.result;
    node.error = json.error;
    
    return node;
  }
}

// Export everything using CommonJS
module.exports = {
  GoTNode,
  GoTNodeType,
  GoTNodeStatus
};
