/**
 * Mock implementation of GraphOfThought
 */

export class GraphOfThought {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }
  
  addNode(id, data) {
    this.nodes.set(id, data);
    if (!this.edges.has(id)) {
      this.edges.set(id, new Map());
    }
    return this;
  }
  
  addEdge(from, to, data = {}) {
    if (!this.nodes.has(from)) this.addNode(from, {});
    if (!this.nodes.has(to)) this.addNode(to, {});
    
    if (!this.edges.has(from)) {
      this.edges.set(from, new Map());
    }
    this.edges.get(from).set(to, data);
    return this;
  }
  
  hasNode(id) {
    return this.nodes.has(id);
  }
  
  hasEdge(from, to) {
    return this.edges.has(from) && this.edges.get(from).has(to);
  }
  
  getNode(id) {
    return this.nodes.get(id);
  }
  
  getNeighbors(id) {
    if (!this.edges.has(id)) return [];
    return Array.from(this.edges.get(id).keys());
  }
  
  traverse(startId) {
    // Implement breadth-first traversal
    const visited = new Set();
    const result = [];
    const queue = [startId];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      const nodeData = this.nodes.get(current);
      result.push({ id: current, value: nodeData });
      
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
    
    return result;
  }
}

export default GraphOfThought;
