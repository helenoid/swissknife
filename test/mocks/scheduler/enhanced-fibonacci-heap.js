/**
 * Enhanced mock implementation of the Fibonacci Heap Scheduler
 * 
 * This implementation provides a more realistic simulation of the Fibonacci
 * Heap Scheduler with actual heap operations and dependency tracking for
 * comprehensive testing of task scheduling in Phase 1.
 */

/**
 * Node Status enum
 */
const NodeStatus = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Fibonacci Heap Node - Represents a node in the Fibonacci Heap
 */
class FibonacciHeapNode {
  constructor(key, value, id) {
    this.key = key;                   // Priority value (lower is higher priority)
    this.value = value;               // Associated data
    this.id = id || value.id;         // Unique identifier
    
    this.parent = null;               // Parent node
    this.child = null;                // One of the children
    this.left = this;                 // Left sibling
    this.right = this;                // Right sibling
    this.degree = 0;                  // Number of children
    this.marked = false;              // Whether node has lost a child since becoming a child
    
    // Additional metadata for tracing and debugging
    this.insertTime = Date.now();
    this.updateHistory = [];
  }
  
  /**
   * Record a key update
   * @param {number} oldKey - Previous key value
   * @param {number} newKey - New key value
   */
  recordUpdate(oldKey, newKey) {
    this.updateHistory.push({
      timestamp: Date.now(),
      oldKey,
      newKey
    });
  }
}

/**
 * Enhanced Mock Fibonacci Heap Implementation
 */
class MockFibonacciHeap {
  constructor(options = {}) {
    this.minNode = null;              // Pointer to minimum node
    this.nodeCount = 0;               // Number of nodes in the heap
    this.nodeMap = new Map();         // Map of node IDs to nodes for quick lookup
    
    // Hook functions for testing
    this.hooks = {
      onInsert: options.onInsert || null,
      onExtractMin: options.onExtractMin || null,
      onDecreaseKey: options.onDecreaseKey || null,
      onDelete: options.onDelete || null
    };
    
    // Operation history for analysis
    this.operationHistory = [];
  }
  
  /**
   * Record an operation
   * @param {string} operation - Operation name
   * @param {object} details - Operation details
   */
  recordOperation(operation, details = {}) {
    this.operationHistory.push({
      operation,
      timestamp: Date.now(),
      details: {
        ...details,
        nodeCount: this.nodeCount
      }
    });
  }
  
  /**
   * Insert a new node into the heap
   * @param {number} key - Priority value (lower is higher priority)
   * @param {any} value - Associated data
   * @param {string} id - Node identifier (optional, defaults to value.id)
   * @returns {FibonacciHeapNode} The inserted node
   */
  insert(key, value, id) {
    const node = new FibonacciHeapNode(key, value, id);
    
    // Add to node map
    this.nodeMap.set(node.id, node);
    
    // Insert into the root list
    if (this.minNode === null) {
      // First node
      this.minNode = node;
    } else {
      // Add to root list
      this.insertIntoRootList(node);
      
      // Update min if needed
      if (node.key < this.minNode.key) {
        this.minNode = node;
      }
    }
    
    this.nodeCount++;
    this.recordOperation('insert', { key, valueId: node.id });
    
    // Call hook if provided
    if (this.hooks.onInsert) {
      this.hooks.onInsert(node);
    }
    
    return node;
  }
  
  /**
   * Insert a node into the root list
   * @param {FibonacciHeapNode} node - Node to insert
   */
  insertIntoRootList(node) {
    if (this.minNode === null) {
      // Empty heap
      this.minNode = node;
      return;
    }
    
    // Insert between min and min's right
    node.right = this.minNode.right;
    node.left = this.minNode;
    this.minNode.right.left = node;
    this.minNode.right = node;
  }
  
  /**
   * Find a node by ID
   * @param {string} id - Node ID
   * @returns {FibonacciHeapNode|null} Node if found, null otherwise
   */
  findNodeById(id) {
    return this.nodeMap.get(id) || null;
  }
  
  /**
   * Extract the minimum node from the heap
   * @returns {FibonacciHeapNode|null} Minimum node or null if heap is empty
   */
  extractMin() {
    if (this.minNode === null) {
      return null;
    }
    
    const minNode = this.minNode;
    
    // Record operation before we modify the heap
    this.recordOperation('extractMin', { key: minNode.key, valueId: minNode.id });
    
    // Remove from node map
    this.nodeMap.delete(minNode.id);
    
    // Decrement node count
    this.nodeCount--;
    
    // Add min's children to root list
    if (minNode.child !== null) {
      let child = minNode.child;
      const startChild = child;
      
      do {
        const nextChild = child.right;
        
        // Insert into root list
        this.insertIntoRootList(child);
        
        // Clear parent
        child.parent = null;
        
        child = nextChild;
      } while (child !== startChild);
    }
    
    // Remove min from root list
    minNode.left.right = minNode.right;
    minNode.right.left = minNode.left;
    
    // If heap is now empty
    if (minNode === minNode.right) {
      this.minNode = null;
    } else {
      this.minNode = minNode.right;
      this.consolidate();
    }
    
    // Call hook if provided
    if (this.hooks.onExtractMin) {
      this.hooks.onExtractMin(minNode);
    }
    
    return minNode;
  }
  
  /**
   * Consolidate the heap after extractMin
   */
  consolidate() {
    // Create array for nodes indexed by degree
    const degreeArray = [];
    
    // Collect all roots
    let root = this.minNode;
    const roots = [];
    
    if (!root) return;
    
    do {
      roots.push(root);
      root = root.right;
    } while (root !== this.minNode);
    
    // Process each root
    for (const root of roots) {
      let node = root;
      let degree = node.degree;
      
      // Consolidate nodes of same degree
      while (degreeArray[degree]) {
        let other = degreeArray[degree];
        
        // Ensure node has the smaller key (higher priority)
        if (node.key > other.key) {
          [node, other] = [other, node];
        }
        
        // Link other as child of node
        this.link(other, node);
        
        // Clear degreeArray slot
        degreeArray[degree] = null;
        
        // Increase degree
        degree++;
      }
      
      degreeArray[degree] = node;
    }
    
    // Find new minimum
    this.minNode = null;
    
    for (let i = 0; i < degreeArray.length; i++) {
      if (degreeArray[i]) {
        // Add to root list if not already there
        if (this.minNode === null) {
          this.minNode = degreeArray[i];
        } else {
          // Insert into root list
          let node = degreeArray[i];
          
          // Root might already be in linked list, remove first
          node.left.right = node.right;
          node.right.left = node.left;
          
          this.insertIntoRootList(node);
          
          // Update min if needed
          if (node.key < this.minNode.key) {
            this.minNode = node;
          }
        }
      }
    }
  }
  
  /**
   * Link two nodes, making other a child of node
   * @param {FibonacciHeapNode} other - Node to become child
   * @param {FibonacciHeapNode} node - Node to become parent
   */
  link(other, node) {
    // Remove other from root list
    other.left.right = other.right;
    other.right.left = other.left;
    
    // Make other a child of node
    if (node.child === null) {
      node.child = other;
      other.left = other;
      other.right = other;
    } else {
      other.right = node.child.right;
      other.left = node.child;
      node.child.right.left = other;
      node.child.right = other;
    }
    
    // Update parent reference
    other.parent = node;
    
    // Increase degree
    node.degree++;
    
    // Reset marked flag
    other.marked = false;
  }
  
  /**
   * Decrease the key of a node
   * @param {string|FibonacciHeapNode} idOrNode - Node ID or the node itself
   * @param {number} newKey - New key value (must be less than current key)
   * @returns {boolean} True if successful, false otherwise
   */
  decreaseKey(idOrNode, newKey) {
    // Get node from ID if needed
    const node = typeof idOrNode === 'string' ? this.findNodeById(idOrNode) : idOrNode;
    
    if (!node) {
      return false;
    }
    
    // New key must be less than current key
    if (newKey >= node.key) {
      return false;
    }
    
    // Record old key for tracking
    const oldKey = node.key;
    
    // Update key
    node.key = newKey;
    node.recordUpdate(oldKey, newKey);
    
    // Record operation
    this.recordOperation('decreaseKey', { 
      nodeId: node.id, 
      oldKey, 
      newKey 
    });
    
    // Call hook if provided
    if (this.hooks.onDecreaseKey) {
      this.hooks.onDecreaseKey(node, oldKey, newKey);
    }
    
    // Get parent
    const parent = node.parent;
    
    // If node is not a root and key violates heap property
    if (parent !== null && node.key < parent.key) {
      // Cut the node from its parent
      this.cut(node, parent);
      
      // Cascade cut the parent
      this.cascadingCut(parent);
    }
    
    // Update min if needed
    if (node.key < this.minNode.key) {
      this.minNode = node;
    }
    
    return true;
  }
  
  /**
   * Cut a node from its parent and add to root list
   * @param {FibonacciHeapNode} node - Node to cut
   * @param {FibonacciHeapNode} parent - Parent of the node
   */
  cut(node, parent) {
    // Remove node from parent's child list
    if (node.right === node) {
      // Node is only child
      parent.child = null;
    } else {
      if (parent.child === node) {
        parent.child = node.right;
      }
      
      node.right.left = node.left;
      node.left.right = node.right;
    }
    
    // Decrement parent's degree
    parent.degree--;
    
    // Add node to root list
    this.insertIntoRootList(node);
    
    // Clear parent and marked flag
    node.parent = null;
    node.marked = false;
  }
  
  /**
   * Perform cascading cut of a node
   * @param {FibonacciHeapNode} node - Node to cut
   */
  cascadingCut(node) {
    const parent = node.parent;
    
    if (parent !== null) {
      if (!node.marked) {
        node.marked = true;
      } else {
        // Cut node from parent
        this.cut(node, parent);
        
        // Recursively cascade cut parent
        this.cascadingCut(parent);
      }
    }
  }
  
  /**
   * Delete a node from the heap
   * @param {string|FibonacciHeapNode} idOrNode - Node ID or the node itself
   * @returns {boolean} True if successful, false otherwise
   */
  delete(idOrNode) {
    // Get node from ID if needed
    const node = typeof idOrNode === 'string' ? this.findNodeById(idOrNode) : idOrNode;
    
    if (!node) {
      return false;
    }
    
    // Record operation
    this.recordOperation('delete', { nodeId: node.id, key: node.key });
    
    // Decrease key to negative infinity to make it the minimum
    const oldKey = node.key;
    node.key = Number.NEGATIVE_INFINITY;
    
    // Call hook if provided
    if (this.hooks.onDelete) {
      this.hooks.onDelete(node);
    }
    
    // Update node's parent or minNode if needed
    const parent = node.parent;
    
    if (parent !== null) {
      // Cut the node from its parent
      this.cut(node, parent);
      
      // Cascade cut the parent
      this.cascadingCut(parent);
    }
    
    // Update min
    this.minNode = node;
    
    // Extract min to remove the node
    this.extractMin();
    
    return true;
  }
  
  /**
   * Check if the heap is empty
   * @returns {boolean} True if heap is empty
   */
  isEmpty() {
    return this.minNode === null;
  }
  
  /**
   * Get the minimum node without removing it
   * @returns {FibonacciHeapNode|null} Minimum node or null if heap is empty
   */
  findMin() {
    return this.minNode;
  }
  
  /**
   * Get the number of nodes in the heap
   * @returns {number} Node count
   */
  size() {
    return this.nodeCount;
  }
  
  /**
   * Get all nodes in the heap
   * @returns {FibonacciHeapNode[]} Array of all nodes
   */
  getAllNodes() {
    return Array.from(this.nodeMap.values());
  }
  
  /**
   * Clear the heap
   */
  clear() {
    this.minNode = null;
    this.nodeCount = 0;
    this.nodeMap.clear();
    this.operationHistory.push({
      operation: 'clear',
      timestamp: Date.now(),
      details: { nodeCount: 0 }
    });
  }
}

/**
 * Enhanced Mock Fibonacci Heap Scheduler
 * 
 * This scheduler uses the Fibonacci Heap implementation to schedule tasks
 * while respecting dependencies and dynamically adjusting priorities.
 */
class MockEnhancedFibonacciHeapScheduler {
  constructor(options = {}) {
    // Create heap
    this.heap = new MockFibonacciHeap();
    
    // Track nodes by ID
    this.nodes = new Map();
    
    // Track node dependencies
    this.dependencies = new Map();
    this.dependents = new Map();
    
    // Track node status
    this.status = new Map();
    
    // Track execution results
    this.results = new Map();
    
    // Configuration
    this.options = {
      priorityFunction: options.priorityFunction || ((node) => node.priority),
      processingTime: options.processingTime || 50,
      errorRate: options.errorRate || 0
    };
    
    // Operation history
    this.operationHistory = [];
  }
  
  /**
   * Record an operation
   * @param {string} operation - Operation name
   * @param {object} details - Operation details
   */
  recordOperation(operation, details = {}) {
    this.operationHistory.push({
      operation,
      timestamp: Date.now(),
      details
    });
  }
  
  /**
   * Add a task to the scheduler
   * @param {object} task - Task to schedule
   * @returns {boolean} True if task was added successfully
   */
  addTask(task) {
    const taskId = task.id;
    
    // Check if task already exists
    if (this.nodes.has(taskId)) {
      return false;
    }
    
    // Record operation
    this.recordOperation('addTask', { taskId, task });
    
    // Store task
    this.nodes.set(taskId, task);
    
    // Set status to pending
    this.status.set(taskId, NodeStatus.PENDING);
    
    // Store dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      this.dependencies.set(taskId, new Set(task.dependencies));
      
      // Add as dependent to each dependency
      for (const depId of task.dependencies) {
        if (!this.dependents.has(depId)) {
          this.dependents.set(depId, new Set());
        }
        this.dependents.get(depId).add(taskId);
      }
      
      // Check if dependencies are met
      const canSchedule = this.areDependenciesMet(taskId);
      
      if (canSchedule) {
        // Schedule the task
        return this.scheduleTask(taskId);
      }
      
      return true; // Successfully added but not scheduled yet
    } else {
      // No dependencies, can schedule immediately
      return this.scheduleTask(taskId);
    }
  }
  
  /**
   * Schedule a task in the heap
   * @param {string} taskId - Task ID to schedule
   * @returns {boolean} True if task was scheduled successfully
   */
  scheduleTask(taskId) {
    const task = this.nodes.get(taskId);
    
    if (!task) {
      return false;
    }
    
    // Calculate priority
    const priority = this.options.priorityFunction(task);
    
    // Add to heap
    const node = this.heap.insert(priority, task, taskId);
    
    // Update status
    this.status.set(taskId, NodeStatus.SCHEDULED);
    
    // Record operation
    this.recordOperation('scheduleTask', { taskId, priority });
    
    return true;
  }
  
  /**
   * Check if all dependencies of a task are met
   * @param {string} taskId - Task ID to check
   * @returns {boolean} True if all dependencies are completed
   */
  areDependenciesMet(taskId) {
    const deps = this.dependencies.get(taskId);
    
    // If no dependencies, they're met by default
    if (!deps || deps.size === 0) {
      return true;
    }
    
    // Check each dependency
    for (const depId of deps) {
      const status = this.status.get(depId);
      
      if (status !== NodeStatus.COMPLETED) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get the next task to execute without removing it
   * @returns {object|null} Next task or null if none available
   */
  getNextTask() {
    const minNode = this.heap.findMin();
    
    if (!minNode) {
      return null;
    }
    
    return minNode.value;
  }
  
  /**
   * Execute the next task
   * @returns {Promise<object|null>} Executed task with result or null if none available
   */
  async executeNextTask() {
    const minNode = this.heap.extractMin();
    
    if (!minNode) {
      return null;
    }
    
    const task = minNode.value;
    const taskId = task.id;
    
    // Update status
    this.status.set(taskId, NodeStatus.PROCESSING);
    
    // Record operation
    this.recordOperation('executeTask', { taskId, task });
    
    // Simulate execution
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Simulate error based on error rate
          if (Math.random() < this.options.errorRate) {
            // Task failed
            this.status.set(taskId, NodeStatus.FAILED);
            this.results.set(taskId, { error: 'Simulated task failure' });
            
            // Record operation
            this.recordOperation('taskFailed', { taskId, error: 'Simulated task failure' });
            
            resolve({
              ...task,
              status: NodeStatus.FAILED,
              error: 'Simulated task failure'
            });
          } else {
            // Task completed successfully
            const result = { data: `Result for task ${taskId}` };
            this.status.set(taskId, NodeStatus.COMPLETED);
            this.results.set(taskId, result);
            
            // Record operation
            this.recordOperation('taskCompleted', { taskId, result });
            
            // Check dependents
            this.processDependents(taskId);
            
            resolve({
              ...task,
              status: NodeStatus.COMPLETED,
              result
            });
          }
        } catch (error) {
          // Unexpected error
          this.status.set(taskId, NodeStatus.FAILED);
          this.results.set(taskId, { error: error.message });
          
          // Record operation
          this.recordOperation('taskError', { taskId, error: error.message });
          
          resolve({
            ...task,
            status: NodeStatus.FAILED,
            error: error.message
          });
        }
      }, this.options.processingTime);
    });
  }
  
  /**
   * Process dependents after a task completes
   * @param {string} taskId - Task ID that completed
   */
  processDependents(taskId) {
    const deps = this.dependents.get(taskId);
    
    if (!deps || deps.size === 0) {
      return;
    }
    
    // Check each dependent
    for (const depId of deps) {
      const canSchedule = this.areDependenciesMet(depId);
      
      if (canSchedule) {
        // Schedule dependent task
        this.scheduleTask(depId);
      }
    }
  }
  
  /**
   * Check if the scheduler is empty
   * @returns {boolean} True if no tasks are pending or scheduled
   */
  isEmpty() {
    return this.heap.isEmpty();
  }
  
  /**
   * Get all pending tasks
   * @returns {object[]} Array of pending tasks
   */
  getPendingTasks() {
    return this.heap.getAllNodes().map(node => node.value);
  }
  
  /**
   * Get tasks by status
   * @param {string} status - Status to filter by
   * @returns {object[]} Array of tasks with the specified status
   */
  getTasksByStatus(status) {
    const result = [];
    
    for (const [taskId, taskStatus] of this.status.entries()) {
      if (taskStatus === status) {
        result.push(this.nodes.get(taskId));
      }
    }
    
    return result;
  }
  
  /**
   * Get task result
   * @param {string} taskId - Task ID to get result for
   * @returns {object|null} Task result or null if not completed
   */
  getTaskResult(taskId) {
    return this.results.get(taskId) || null;
  }
  
  /**
   * Clear the scheduler
   */
  clear() {
    this.heap.clear();
    this.nodes.clear();
    this.dependencies.clear();
    this.dependents.clear();
    this.status.clear();
    this.results.clear();
    
    // Record operation
    this.recordOperation('clear', {});
  }
}

module.exports = {
  NodeStatus,
  FibonacciHeapNode,
  MockFibonacciHeap,
  MockEnhancedFibonacciHeapScheduler
};