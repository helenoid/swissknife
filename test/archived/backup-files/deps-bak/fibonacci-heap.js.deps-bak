/**
 * Test fixtures for the Fibonacci Heap Scheduler
 * 
 * These fixtures provide sample data and scenarios for testing
 * the Fibonacci Heap Scheduler implementation, which is a key
 * component in the Phase 1 task processing system.
 */

/**
 * Sample nodes with different priorities for testing heap operations
 */
const sampleHeapNodes = {
  // Nodes with different priorities
  byPriority: [
    { id: 'node-1', priority: 1, data: { name: 'Highest Priority' } },
    { id: 'node-2', priority: 2, data: { name: 'High Priority' } },
    { id: 'node-3', priority: 5, data: { name: 'Medium Priority' } },
    { id: 'node-4', priority: 8, data: { name: 'Low Priority' } },
    { id: 'node-5', priority: 10, data: { name: 'Lowest Priority' } }
  ],
  
  // Nodes with equal priorities
  equalPriority: [
    { id: 'equal-1', priority: 5, data: { name: 'Equal Priority 1' } },
    { id: 'equal-2', priority: 5, data: { name: 'Equal Priority 2' } },
    { id: 'equal-3', priority: 5, data: { name: 'Equal Priority 3' } }
  ],
  
  // Nodes with decreasing priorities
  decreasingPriority: [
    { id: 'desc-1', priority: 10, data: { name: 'Priority 10' } },
    { id: 'desc-2', priority: 8, data: { name: 'Priority 8' } },
    { id: 'desc-3', priority: 5, data: { name: 'Priority 5' } },
    { id: 'desc-4', priority: 3, data: { name: 'Priority 3' } },
    { id: 'desc-5', priority: 1, data: { name: 'Priority 1' } }
  ],
  
  // Nodes with priorities for decrease-key operations
  forDecreaseKey: [
    { id: 'decrease-1', priority: 10, data: { name: 'Will decrease to 2' } },
    { id: 'decrease-2', priority: 8, data: { name: 'Will decrease to 1' } },
    { id: 'decrease-3', priority: 5, data: { name: 'Will decrease to 3' } }
  ],
  
  // Large set of nodes for performance testing
  large: Array.from({ length: 100 }, (_, i) => ({
    id: `large-${i + 1}`,
    priority: Math.floor(Math.random() * 100),
    data: { name: `Large Node ${i + 1}` }
  }))
};

/**
 * Sample nodes with dependencies for testing dependency-aware scheduling
 */
const sampleDependencyNodes = {
  // Simple dependency chain A -> B -> C
  simpleChain: [
    { id: 'A', priority: 1, dependencies: [], data: { name: 'Node A' } },
    { id: 'B', priority: 2, dependencies: ['A'], data: { name: 'Node B' } },
    { id: 'C', priority: 3, dependencies: ['B'], data: { name: 'Node C' } }
  ],
  
  // Diamond dependency pattern A -> B, A -> C, B -> D, C -> D
  diamond: [
    { id: 'A', priority: 1, dependencies: [], data: { name: 'Node A' } },
    { id: 'B', priority: 2, dependencies: ['A'], data: { name: 'Node B' } },
    { id: 'C', priority: 3, dependencies: ['A'], data: { name: 'Node C' } },
    { id: 'D', priority: 4, dependencies: ['B', 'C'], data: { name: 'Node D' } }
  ],
  
  // Complex dependency graph
  complex: [
    { id: 'A', priority: 1, dependencies: [], data: { name: 'Node A' } },
    { id: 'B', priority: 2, dependencies: [], data: { name: 'Node B' } },
    { id: 'C', priority: 3, dependencies: ['A'], data: { name: 'Node C' } },
    { id: 'D', priority: 4, dependencies: ['A'], data: { name: 'Node D' } },
    { id: 'E', priority: 5, dependencies: ['B', 'C'], data: { name: 'Node E' } },
    { id: 'F', priority: 6, dependencies: ['C'], data: { name: 'Node F' } },
    { id: 'G', priority: 7, dependencies: ['D', 'F'], data: { name: 'Node G' } },
    { id: 'H', priority: 8, dependencies: ['E', 'G'], data: { name: 'Node H' } }
  ],
  
  // Nodes with circular dependencies (should be detected and rejected)
  circular: [
    { id: 'X', priority: 1, dependencies: ['Z'], data: { name: 'Node X' } },
    { id: 'Y', priority: 2, dependencies: ['X'], data: { name: 'Node Y' } },
    { id: 'Z', priority: 3, dependencies: ['Y'], data: { name: 'Node Z' } }
  ]
};

/**
 * Sample priority calculation functions for testing dynamic priority adjustment
 */
const samplePriorityCalculators = {
  // Basic priority calculator using just the node's base priority
  basic: (node) => node.priority,
  
  // Priority calculator that factors in waiting time to prevent starvation
  withWaitingTime: (node, currentTime, insertTime) => {
    const waitingTime = currentTime - insertTime;
    const waitingFactor = Math.min(waitingTime / 10000, 1); // Cap at 1
    return node.priority - (waitingFactor * 5); // Gradually increase priority (decrease value)
  },
  
  // Priority calculator that factors in dependency count
  withDependencies: (node) => {
    return node.priority + (node.dependencies.length * 0.5);
  },
  
  // Complex priority calculator with multiple factors
  complex: (node, currentTime, insertTime, dependencyCount, completedDependencies) => {
    const waitingTime = currentTime - insertTime;
    const waitingFactor = Math.min(waitingTime / 10000, 1);
    const dependencyFactor = dependencyCount === 0 ? 0 : completedDependencies / dependencyCount;
    
    // Composite priority:
    // - Base priority
    // - Waiting time bonus (negative adjustment = higher priority)
    // - Dependency completion bonus
    return node.priority - (waitingFactor * 5) - (dependencyFactor * 2);
  }
};

/**
 * Sample operation sequences for testing heap behavior
 */
const sampleOperationSequences = {
  // Basic insert and extract sequence
  basicSequence: [
    { operation: 'insert', nodeId: 'node-1', priority: 3 },
    { operation: 'insert', nodeId: 'node-2', priority: 1 },
    { operation: 'insert', nodeId: 'node-3', priority: 4 },
    { operation: 'insert', nodeId: 'node-4', priority: 2 },
    { operation: 'extractMin' }, // Should extract node-2
    { operation: 'extractMin' }, // Should extract node-4
    { operation: 'extractMin' }, // Should extract node-1
    { operation: 'extractMin' }  // Should extract node-3
  ],
  
  // Sequence with decrease-key operations
  decreaseKeySequence: [
    { operation: 'insert', nodeId: 'node-1', priority: 5 },
    { operation: 'insert', nodeId: 'node-2', priority: 3 },
    { operation: 'insert', nodeId: 'node-3', priority: 7 },
    { operation: 'decreaseKey', nodeId: 'node-3', newPriority: 1 },
    { operation: 'extractMin' }, // Should extract node-3
    { operation: 'decreaseKey', nodeId: 'node-1', newPriority: 2 },
    { operation: 'extractMin' }, // Should extract node-1
    { operation: 'extractMin' }  // Should extract node-2
  ],
  
  // Sequence with a mix of operations
  mixedSequence: [
    { operation: 'insert', nodeId: 'node-1', priority: 5 },
    { operation: 'insert', nodeId: 'node-2', priority: 3 },
    { operation: 'extractMin' }, // Should extract node-2
    { operation: 'insert', nodeId: 'node-3', priority: 1 },
    { operation: 'insert', nodeId: 'node-4', priority: 4 },
    { operation: 'extractMin' }, // Should extract node-3
    { operation: 'decreaseKey', nodeId: 'node-1', newPriority: 2 },
    { operation: 'extractMin' }, // Should extract node-1
    { operation: 'extractMin' }  // Should extract node-4
  ],
  
  // Sequence for testing consolidation
  consolidationSequence: [
    // Insert many nodes
    ...Array.from({ length: 20 }, (_, i) => ({
      operation: 'insert',
      nodeId: `consolidate-${i}`,
      priority: Math.floor(Math.random() * 100)
    })),
    // Extract some
    { operation: 'extractMin' },
    { operation: 'extractMin' },
    { operation: 'extractMin' },
    // Insert more
    ...Array.from({ length: 10 }, (_, i) => ({
      operation: 'insert',
      nodeId: `consolidate-new-${i}`,
      priority: Math.floor(Math.random() * 100)
    })),
    // Decrease some keys
    { operation: 'decreaseKey', nodeId: 'consolidate-5', newPriority: 1 },
    { operation: 'decreaseKey', nodeId: 'consolidate-10', newPriority: 2 },
    { operation: 'decreaseKey', nodeId: 'consolidate-15', newPriority: 3 },
    // Extract remaining nodes
    ...Array.from({ length: 27 }, () => ({ operation: 'extractMin' }))
  ]
};

/**
 * Utility function to create a dependency graph from a list of nodes
 * @param {Array} nodes - Array of nodes with dependencies
 * @returns {Object} Dependency graph
 */
function createDependencyGraph(nodes) {
  const graph = {};
  
  // Initialize graph
  for (const node of nodes) {
    graph[node.id] = {
      node,
      dependencies: node.dependencies || [],
      dependents: []
    };
  }
  
  // Add dependents
  for (const node of nodes) {
    for (const depId of node.dependencies || []) {
      if (graph[depId]) {
        graph[depId].dependents.push(node.id);
      }
    }
  }
  
  return graph;
}

/**
 * Utility function to detect cycles in a dependency graph
 * @param {Object} graph - Dependency graph
 * @returns {boolean} True if cycles detected
 */
function hasCycles(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  
  function dfs(nodeId) {
    // Mark node as visited
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    // Visit all dependencies
    for (const depId of graph[nodeId].dependencies) {
      // Skip if dependency doesn't exist in graph
      if (!graph[depId]) continue;
      
      // If dependency is in recursion stack, we found a cycle
      if (recursionStack.has(depId)) {
        return true;
      }
      
      // If dependency hasn't been visited, visit it
      if (!visited.has(depId) && dfs(depId)) {
        return true;
      }
    }
    
    // Remove node from recursion stack
    recursionStack.delete(nodeId);
    return false;
  }
  
  // Check each unvisited node
  for (const nodeId in graph) {
    if (!visited.has(nodeId) && dfs(nodeId)) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  sampleHeapNodes,
  sampleDependencyNodes,
  samplePriorityCalculators,
  sampleOperationSequences,
  createDependencyGraph,
  hasCycles
};