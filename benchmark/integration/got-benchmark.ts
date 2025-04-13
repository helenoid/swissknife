/**
 * Performance benchmarks for the Graph-of-Thought system
 * 
 * This file contains benchmarks to measure the performance of key operations
 * in the Graph-of-Thought system under various loads.
 */

import { GoTManager, GoTNode } from '../../src/integration';
import { benchmarkFunction, runBenchmarkSuite, randomString, randomObject } from '../utils';

async function main() {
  // Get the GoT manager instance
  const manager = GoTManager.getInstance();
  
  // Benchmark suite
  await runBenchmarkSuite('Graph-of-Thought System', [
    {
      name: 'Create graph',
      fn: async () => {
        return manager.createGraph();
      },
      iterations: 100
    },
    
    {
      name: 'Create single node',
      fn: async () => {
        const graphId = manager.createGraph();
        return manager.createNode(graphId, {
          type: 'thought',
          content: 'Test thought content',
          data: { test: 'data' }
        });
      },
      iterations: 100
    },
    
    {
      name: 'Create small graph (10 nodes)',
      fn: async () => {
        const graphId = manager.createGraph();
        
        // Create root node
        const root = manager.createNode(graphId, {
          type: 'question',
          content: 'Root question node'
        });
        
        // Create 9 child nodes with connections
        const nodes = [];
        for (let i = 0; i < 9; i++) {
          const node = manager.createNode(graphId, {
            type: 'thought',
            content: `Thought node ${i}`,
            parentIds: i < 3 ? [root.id] : [nodes[i % 3].id]
          });
          nodes.push(node);
        }
        
        return graphId;
      },
      iterations: 50
    },
    
    {
      name: 'Create medium graph (100 nodes)',
      fn: async () => {
        const graphId = manager.createGraph();
        
        // Create 10 root nodes
        const roots = [];
        for (let i = 0; i < 10; i++) {
          const root = manager.createNode(graphId, {
            type: 'question',
            content: `Root question ${i}`
          });
          roots.push(root);
        }
        
        // Create 90 child nodes with connections
        for (let i = 0; i < 90; i++) {
          const parentIndex = Math.floor(i / 9);
          const node = manager.createNode(graphId, {
            type: 'thought',
            content: `Thought node ${i}`,
            parentIds: [roots[parentIndex % 10].id]
          });
        }
        
        return graphId;
      },
      iterations: 10
    },
    
    {
      name: 'Create large graph (1000 nodes)',
      fn: async () => {
        const graphId = manager.createGraph();
        
        // Create 10 root nodes
        const roots = [];
        for (let i = 0; i < 10; i++) {
          const root = manager.createNode(graphId, {
            type: 'question',
            content: `Root question ${i}`
          });
          roots.push(root);
        }
        
        // Create 90 mid-level nodes
        const midNodes = [];
        for (let i = 0; i < 90; i++) {
          const parentIndex = i % 10;
          const node = manager.createNode(graphId, {
            type: 'task',
            content: `Task node ${i}`,
            parentIds: [roots[parentIndex].id]
          });
          midNodes.push(node);
        }
        
        // Create 900 leaf nodes
        for (let i = 0; i < 900; i++) {
          const parentIndex = i % 90;
          const node = manager.createNode(graphId, {
            type: 'action',
            content: `Action node ${i}`,
            parentIds: [midNodes[parentIndex].id]
          });
        }
        
        return graphId;
      },
      iterations: 5
    },
    
    {
      name: 'Get all nodes in small graph (10 nodes)',
      fn: async () => {
        // Create test graph
        const graphId = manager.createGraph();
        const root = manager.createNode(graphId, { type: 'question' });
        for (let i = 0; i < 9; i++) {
          manager.createNode(graphId, { 
            type: 'thought',
            parentIds: [root.id]
          });
        }
        
        // Benchmark getting all nodes
        return manager.getGraphNodes(graphId);
      },
      iterations: 100
    },
    
    {
      name: 'Get nodes by type in medium graph (100 nodes)',
      fn: async () => {
        // Create test graph
        const graphId = manager.createGraph();
        const root = manager.createNode(graphId, { type: 'question' });
        
        // Create mixed node types
        for (let i = 0; i < 33; i++) {
          manager.createNode(graphId, { type: 'task', parentIds: [root.id] });
        }
        
        for (let i = 0; i < 33; i++) {
          manager.createNode(graphId, { type: 'thought', parentIds: [root.id] });
        }
        
        for (let i = 0; i < 33; i++) {
          manager.createNode(graphId, { type: 'action', parentIds: [root.id] });
        }
        
        // Benchmark getting nodes by type
        return manager.getNodesByType(graphId, 'thought');
      },
      iterations: 100
    },
    
    {
      name: 'Get ready nodes in complex graph',
      fn: async () => {
        // Create test graph with dependencies
        const graphId = manager.createGraph();
        
        // Root nodes
        const root1 = manager.createNode(graphId, { type: 'question' });
        const root2 = manager.createNode(graphId, { type: 'question' });
        
        // Level 1 nodes
        const nodes1 = [];
        for (let i = 0; i < 10; i++) {
          const parentId = i < 5 ? root1.id : root2.id;
          const node = manager.createNode(graphId, { 
            type: 'task',
            parentIds: [parentId]
          });
          nodes1.push(node);
          
          // Mark some as completed
          if (i % 2 === 0) {
            manager.updateNodeStatus(node.id, 'completed');
          }
        }
        
        // Level 2 nodes with multiple dependencies
        for (let i = 0; i < 20; i++) {
          const parentIds = [
            nodes1[i % 10].id,
            nodes1[(i + 1) % 10].id
          ];
          
          manager.createNode(graphId, { 
            type: 'action',
            parentIds
          });
        }
        
        // Benchmark getting ready nodes
        return manager.getReadyNodes(graphId);
      },
      iterations: 100
    },
    
    {
      name: 'Update node status',
      fn: async () => {
        // Create test node
        const graphId = manager.createGraph();
        const node = manager.createNode(graphId, { type: 'task' });
        
        // Benchmark status update
        manager.updateNodeStatus(node.id, 'active');
        manager.updateNodeStatus(node.id, 'completed');
        
        return node.id;
      },
      iterations: 100
    },
    
    {
      name: 'Serialize and deserialize node',
      fn: async () => {
        // Create complex node
        const node = new GoTNode({
          type: 'task',
          content: randomString(100),
          data: randomObject(3, 5),
          priority: 5,
          parentIds: [randomString(10), randomString(10)],
          childIds: [randomString(10), randomString(10), randomString(10)]
        });
        
        // Serialize
        const json = node.toJSON();
        
        // Deserialize
        return GoTNode.fromJSON(json);
      },
      iterations: 1000
    }
  ]);
}

// Run the benchmarks
main().catch(console.error);