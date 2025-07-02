/**
 * Mock implementation of the Graph-of-Thought system for testing
 */

/**
 * Enumeration of thought node types
 */
const ThoughtNodeType = {
  QUESTION: 'question',
  DECOMPOSITION: 'decomposition',
  RESEARCH: 'research',
  ANALYSIS: 'analysis',
  SYNTHESIS: 'synthesis',
  CONCLUSION: 'conclusion'
};

/**
 * Enumeration of node statuses
 */
const NodeStatus = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Mock implementation of a Graph-of-Thought node
 */
class MockGoTNode {
  constructor(options = {}) {
    this.id = options.id || `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.content = options.content || '';
    this.type = options.type || ThoughtNodeType.QUESTION;
    this.dependencies = options.dependencies || [];
    this.priority = options.priority || 0;
    this.status = options.status || NodeStatus.PENDING;
    this.result = options.result;
    this.metadata = {
      createdAt: options.createdAt || Date.now(),
      completedAt: options.completedAt,
      confidence: options.confidence || 0.5,
      executionTimeMs: options.executionTimeMs
    };
    this.storage = {
      instructionsCid: options.instructionsCid,
      dataCid: options.dataCid,
      resultCid: options.resultCid
    };
  }
  
  /**
   * Update node status
   * @param {string} status - New status
   */
  updateStatus(status) {
    this.status = status;
    
    if (status === NodeStatus.COMPLETED && !this.metadata.completedAt) {
      this.metadata.completedAt = Date.now();
      this.metadata.executionTimeMs = this.metadata.completedAt - this.metadata.createdAt;
    }
  }
  
  /**
   * Set node result
   * @param {any} result - Node result
   * @param {number} confidence - Result confidence (0-1)
   */
  setResult(result, confidence = 0.9) {
    this.result = result;
    this.metadata.confidence = confidence;
    this.updateStatus(NodeStatus.COMPLETED);
  }
}

/**
 * Mock implementation of a Directed Acyclic Graph
 */
class MockDirectedAcyclicGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }
  
  /**
   * Add a node to the graph
   * @param {MockGoTNode} node - Node to add
   * @returns {boolean} - True if node was added, false if node already exists
   */
  addNode(node) {
    if (this.nodes.has(node.id)) {
      return false;
    }
    
    this.nodes.set(node.id, node);
    this.edges.set(node.id, []);
    return true;
  }
  
  /**
   * Add an edge between nodes
   * @param {string} fromId - Source node ID
   * @param {string} toId - Target node ID
   * @returns {boolean} - True if edge was added, false if nodes don't exist or edge creates a cycle
   */
  addEdge(fromId, toId) {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      return false;
    }
    
    // Check if adding this edge would create a cycle
    if (this.wouldCreateCycle(fromId, toId)) {
      return false;
    }
    
    // Add the edge
    this.edges.get(fromId).push(toId);
    
    // Update dependencies
    const toNode = this.nodes.get(toId);
    if (!toNode.dependencies.includes(fromId)) {
      toNode.dependencies.push(fromId);
    }
    
    return true;
  }
  
  /**
   * Check if adding an edge would create a cycle
   * @param {string} fromId - Source node ID
   * @param {string} toId - Target node ID
   * @returns {boolean} - True if a cycle would be created
   */
  wouldCreateCycle(fromId, toId) {
    // If they're the same node, it would create a self-loop
    if (fromId === toId) {
      return true;
    }
    
    // Do a DFS to see if we can reach fromId from toId
    const visited = new Set();
    const visit = (nodeId) => {
      if (nodeId === fromId) {
        return true;
      }
      
      visited.add(nodeId);
      
      for (const neighbor of this.edges.get(nodeId) || []) {
        if (!visited.has(neighbor) && visit(neighbor)) {
          return true;
        }
      }
      
      return false;
    };
    
    return visit(toId);
  }
  
  /**
   * Get a node by ID
   * @param {string} nodeId - Node ID
   * @returns {MockGoTNode|undefined} - Node or undefined if not found
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get all nodes
   * @returns {MockGoTNode[]} - Array of all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
  
  /**
   * Get node children
   * @param {string} nodeId - Parent node ID
   * @returns {string[]} - Array of child node IDs
   */
  getChildren(nodeId) {
    return this.edges.get(nodeId) || [];
  }
  
  /**
   * Get node parents
   * @param {string} nodeId - Child node ID
   * @returns {string[]} - Array of parent node IDs
   */
  getParents(nodeId) {
    const parents = [];
    
    for (const [parentId, children] of this.edges.entries()) {
      if (children.includes(nodeId)) {
        parents.push(parentId);
      }
    }
    
    return parents;
  }
  
  /**
   * Get nodes with no dependencies
   * @returns {MockGoTNode[]} - Array of root nodes
   */
  getRootNodes() {
    return this.getAllNodes().filter(node => node.dependencies.length === 0);
  }
  
  /**
   * Get nodes with no children
   * @returns {MockGoTNode[]} - Array of leaf nodes
   */
  getLeafNodes() {
    return this.getAllNodes().filter(node => 
      (this.edges.get(node.id) || []).length === 0
    );
  }
  
  /**
   * Get nodes by type
   * @param {string} type - Node type
   * @returns {MockGoTNode[]} - Array of nodes of the specified type
   */
  getNodesByType(type) {
    return this.getAllNodes().filter(node => node.type === type);
  }
  
  /**
   * Get nodes by status
   * @param {string} status - Node status
   * @returns {MockGoTNode[]} - Array of nodes with the specified status
   */
  getNodesByStatus(status) {
    return this.getAllNodes().filter(node => node.status === status);
  }
}

/**
 * Mock implementation of a Fibonacci Heap for task scheduling
 */
class MockFibonacciHeapScheduler {
  constructor() {
    this.tasks = [];
    this.nodeMap = new Map();
  }
  
  /**
   * Add a task to the scheduler
   * @param {MockGoTNode} node - Node to schedule
   */
  addTask(node) {
    // Only add if dependencies are met or if this is a root node
    if (this.areDependenciesMet(node)) {
      this.tasks.push(node);
      this.nodeMap.set(node.id, node);
      
      // Sort by priority (lowest first)
      this.tasks.sort((a, b) => a.priority - b.priority);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if all dependencies are met
   * @param {MockGoTNode} node - Node to check
   * @returns {boolean} - True if all dependencies are completed
   */
  areDependenciesMet(node) {
    // If no dependencies, they're met by default
    if (!node.dependencies || node.dependencies.length === 0) {
      return true;
    }
    
    // Check each dependency
    return node.dependencies.every(depId => {
      const depNode = this.nodeMap.get(depId);
      return depNode && depNode.status === NodeStatus.COMPLETED;
    });
  }
  
  /**
   * Get the next task to execute
   * @returns {MockGoTNode|null} - Next task or null if none available
   */
  getNextTask() {
    if (this.tasks.length === 0) {
      return null;
    }
    
    return this.tasks[0];
  }
  
  /**
   * Execute the next task
   * @returns {Promise<MockGoTNode|null>} - Executed task or null if none available
   */
  async executeNextTask() {
    const node = this.getNextTask();
    if (!node) {
      return null;
    }
    
    // Remove from tasks list
    this.tasks.shift();
    
    // Update status
    node.updateStatus(NodeStatus.PROCESSING);
    
    try {
      // Simulate execution
      node.setResult({ data: `Result for ${node.id}` });
      return node;
    } catch (error) {
      node.updateStatus(NodeStatus.FAILED);
      throw error;
    }
  }
  
  /**
   * Check if the scheduler is empty
   * @returns {boolean} - True if no tasks are pending
   */
  isEmpty() {
    return this.tasks.length === 0;
  }
  
  /**
   * Get all pending tasks
   * @returns {MockGoTNode[]} - Array of pending tasks
   */
  getPendingTasks() {
    return [...this.tasks];
  }
  
  /**
   * Get task count
   * @returns {number} - Number of pending tasks
   */
  getTaskCount() {
    return this.tasks.length;
  }
}

/**
 * Mock implementation of the Graph-of-Thought engine
 */
class MockGraphOfThoughtEngine {
  constructor(options = {}) {
    this.dag = new MockDirectedAcyclicGraph();
    this.scheduler = new MockFibonacciHeapScheduler();
    this.storage = options.storage;
    
    // Track method calls
    this.processCalls = [];
  }
  
  /**
   * Process a query through the graph of thought
   * @param {string} query - Query text
   * @returns {Promise<any>} - Query result
   */
  async processQuery(query) {
    // Record the call
    this.processCalls.push({ query });
    
    // Initialize with root query node
    const rootNode = new MockGoTNode({
      type: ThoughtNodeType.QUESTION,
      content: query
    });
    
    this.dag.addNode(rootNode);
    
    // Decompose into subproblems
    const subproblems = await this.decomposeProblem(query);
    
    // Add subproblem nodes
    for (const subproblem of subproblems) {
      this.dag.addNode(subproblem);
      this.dag.addEdge(rootNode.id, subproblem.id);
      this.scheduler.addTask(subproblem);
    }
    
    // Process the graph until completion
    while (!this.scheduler.isEmpty()) {
      try {
        const nextNode = await this.scheduler.executeNextTask();
        
        if (nextNode) {
          // Generate new nodes based on the result
          const newNodes = await this.processNodeResult(nextNode);
          
          for (const node of newNodes) {
            this.dag.addNode(node);
            this.dag.addEdge(nextNode.id, node.id);
            this.scheduler.addTask(node);
          }
        }
      } catch (error) {
        console.error('Error executing node:', error);
        // Continue with next node
      }
    }
    
    // Synthesize final result
    return this.synthesizeResult();
  }
  
  /**
   * Decompose a problem into subproblems
   * @param {string} query - Query text
   * @returns {Promise<MockGoTNode[]>} - Subproblem nodes
   */
  async decomposeProblem(query) {
    // In a real implementation, this would use a model to decompose the problem
    // For testing, we'll create synthetic subproblems
    
    const subproblems = [
      new MockGoTNode({
        type: ThoughtNodeType.DECOMPOSITION,
        content: `Subproblem 1: ${query.substring(0, 20)}...`,
        priority: 1
      }),
      new MockGoTNode({
        type: ThoughtNodeType.DECOMPOSITION,
        content: `Subproblem 2: ${query.substring(0, 20)}...`,
        priority: 2
      }),
      new MockGoTNode({
        type: ThoughtNodeType.RESEARCH,
        content: `Research needed: ${query.substring(0, 20)}...`,
        priority: 1
      })
    ];
    
    return subproblems;
  }
  
  /**
   * Process a node result to generate new nodes
   * @param {MockGoTNode} node - Completed node
   * @returns {Promise<MockGoTNode[]>} - New nodes to add
   */
  async processNodeResult(node) {
    // Generate different types of nodes depending on the parent node type
    const newNodes = [];
    
    switch (node.type) {
      case ThoughtNodeType.DECOMPOSITION:
        // Decomposition nodes generate analysis nodes
        newNodes.push(new MockGoTNode({
          type: ThoughtNodeType.ANALYSIS,
          content: `Analysis of ${node.content}`,
          priority: 3
        }));
        break;
        
      case ThoughtNodeType.RESEARCH:
        // Research nodes generate analysis nodes
        newNodes.push(new MockGoTNode({
          type: ThoughtNodeType.ANALYSIS,
          content: `Analysis of research: ${node.content}`,
          priority: 3
        }));
        break;
        
      case ThoughtNodeType.ANALYSIS:
        // Analysis nodes generate synthesis nodes
        newNodes.push(new MockGoTNode({
          type: ThoughtNodeType.SYNTHESIS,
          content: `Synthesis of ${node.content}`,
          priority: 4
        }));
        break;
        
      case ThoughtNodeType.SYNTHESIS:
        // Synthesis nodes may generate conclusion nodes
        if (Math.random() > 0.5) {
          newNodes.push(new MockGoTNode({
            type: ThoughtNodeType.CONCLUSION,
            content: `Conclusion from ${node.content}`,
            priority: 5
          }));
        }
        break;
    }
    
    return newNodes;
  }
  
  /**
   * Synthesize the final result from the graph
   * @returns {any} - Synthesized result
   */
  synthesizeResult() {
    // Get all conclusion nodes
    const conclusionNodes = this.dag.getNodesByType(ThoughtNodeType.CONCLUSION);
    
    // If no conclusion nodes, get synthesis nodes
    const synthesisNodes = conclusionNodes.length > 0 
      ? conclusionNodes 
      : this.dag.getNodesByType(ThoughtNodeType.SYNTHESIS);
    
    // If still no nodes, get analysis nodes
    const resultNodes = synthesisNodes.length > 0 
      ? synthesisNodes 
      : this.dag.getNodesByType(ThoughtNodeType.ANALYSIS);
    
    // Combine results from all nodes
    const combinedResult = {
      answer: resultNodes.map(node => node.content).join('\n\n'),
      confidence: resultNodes.reduce((avg, node) => avg + node.metadata.confidence, 0) / Math.max(1, resultNodes.length),
      reasoning: {
        nodes: this.dag.getAllNodes().length,
        edges: Array.from(this.dag.edges.values()).reduce((sum, edges) => sum + edges.length, 0),
        questionNode: this.dag.getNodesByType(ThoughtNodeType.QUESTION)[0]?.content,
        conclusionNodes: conclusionNodes.length
      }
    };
    
    return combinedResult;
  }
  
  /**
   * Get the graph
   * @returns {MockDirectedAcyclicGraph} - The DAG
   */
  getGraph() {
    return this.dag;
  }
  
  /**
   * Get the scheduler
   * @returns {MockFibonacciHeapScheduler} - The scheduler
   */
  getScheduler() {
    return this.scheduler;
  }
}

module.exports = {
  ThoughtNodeType,
  NodeStatus,
  MockGoTNode,
  MockDirectedAcyclicGraph,
  MockFibonacciHeapScheduler,
  MockGraphOfThoughtEngine
};