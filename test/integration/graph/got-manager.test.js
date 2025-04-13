/**
 * Tests for the Graph-of-Thought Manager
 */

import { GoTManager } from '../../../src/tasks/graph/manager';
import { GoTNode } from '../../../src/tasks/graph/node';

// Mock the MCPClient
jest.mock('../../../src/storage/ipfs/mcp-client', () => {
  return {
    MCPClient: jest.fn().mockImplementation(() => {
      return {
        isConnectedToServer: jest.fn().mockReturnValue(true),
        connect: jest.fn().mockResolvedValue(true),
        addNode: jest.fn().mockImplementation((data, links = []) => {
          return Promise.resolve({ cid: `cid-${Math.random().toString(36).substring(2, 9)}` });
        }),
        getNode: jest.fn().mockImplementation((cid) => {
          return Promise.resolve({
            cid,
            data: { test: 'data' },
            links: []
          });
        })
      };
    })
  };
});

// Mock the LogManager
jest.mock('../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    })
  }
}));

describe('GoTManager', () => {
  let manager;
  
  beforeEach(() => {
    manager = GoTManager.getInstance();
    jest.clearAllMocks();
  });
  
  test('should create a graph with a unique ID', () => {
    const graphId = manager.createGraph();
    expect(graphId).toBeDefined();
    expect(typeof graphId).toBe('string');
  });
  
  test('should create nodes in a graph', () => {
    const graphId = manager.createGraph();
    
    // Create a node
    const node1 = manager.createNode(graphId, {
      type: 'question',
      content: 'What is the capital of France?',
      data: { source: 'user' }
    });
    
    expect(node1).toBeInstanceOf(GoTNode);
    expect(node1.type).toBe('question');
    expect(node1.content).toBe('What is the capital of France?');
    expect(node1.data).toEqual({ source: 'user' });
    
    // Create another node with the first as parent
    const node2 = manager.createNode(graphId, {
      type: 'thought',
      content: 'I need to find the capital of France',
      parentIds: [node1.id]
    });
    
    expect(node2.parentIds).toContain(node1.id);
    
    // Verify node1 now has node2 as a child
    const updatedNode1 = manager.getNode(node1.id);
    expect(updatedNode1.childIds).toContain(node2.id);
  });
  
  test('should get graph nodes', () => {
    const graphId = manager.createGraph();
    
    // Create some nodes
    const node1 = manager.createNode(graphId, { type: 'question' });
    const node2 = manager.createNode(graphId, { type: 'thought' });
    const node3 = manager.createNode(graphId, { type: 'action' });
    
    // Get all nodes for the graph
    const nodes = manager.getGraphNodes(graphId);
    
    expect(nodes.length).toBe(3);
    expect(nodes.map(n => n.id)).toEqual(expect.arrayContaining([node1.id, node2.id, node3.id]));
    
    // Test getNodesByType
    const thoughtNodes = manager.getNodesByType(graphId, 'thought');
    expect(thoughtNodes.length).toBe(1);
    expect(thoughtNodes[0].id).toBe(node2.id);
  });
  
  test('should find root and leaf nodes', () => {
    const graphId = manager.createGraph();
    
    // Create node structure:
    // root1 → child1 → leaf1
    //      ↘ child2 → leaf2
    // root2 (alone)
    
    const root1 = manager.createNode(graphId, { type: 'question' });
    const child1 = manager.createNode(graphId, { type: 'thought', parentIds: [root1.id] });
    const child2 = manager.createNode(graphId, { type: 'thought', parentIds: [root1.id] });
    const leaf1 = manager.createNode(graphId, { type: 'action', parentIds: [child1.id] });
    const leaf2 = manager.createNode(graphId, { type: 'action', parentIds: [child2.id] });
    const root2 = manager.createNode(graphId, { type: 'question' });
    
    // Check root nodes
    const rootNodes = manager.getRootNodes(graphId);
    expect(rootNodes.length).toBe(2);
    expect(rootNodes.map(n => n.id)).toEqual(expect.arrayContaining([root1.id, root2.id]));
    
    // Check leaf nodes
    const leafNodes = manager.getLeafNodes(graphId);
    expect(leafNodes.length).toBe(3); // leaf1, leaf2, root2 (also a leaf)
    expect(leafNodes.map(n => n.id)).toEqual(expect.arrayContaining([leaf1.id, leaf2.id, root2.id]));
  });
  
  test('should update node status', () => {
    const graphId = manager.createGraph();
    const node = manager.createNode(graphId, { type: 'task' });
    
    manager.updateNodeStatus(node.id, 'active');
    
    const updatedNode = manager.getNode(node.id);
    expect(updatedNode.status).toBe('active');
  });
  
  test('should get parent and child nodes', () => {
    const graphId = manager.createGraph();
    
    const parent = manager.createNode(graphId, { type: 'question' });
    const child1 = manager.createNode(graphId, { type: 'thought', parentIds: [parent.id] });
    const child2 = manager.createNode(graphId, { type: 'action', parentIds: [parent.id] });
    
    // Get children of parent
    const children = manager.getChildNodes(parent.id);
    expect(children.length).toBe(2);
    expect(children.map(n => n.id)).toEqual(expect.arrayContaining([child1.id, child2.id]));
    
    // Get parents of child
    const parents = manager.getParentNodes(child1.id);
    expect(parents.length).toBe(1);
    expect(parents[0].id).toBe(parent.id);
  });
  
  test('should check if all parents are completed', () => {
    const graphId = manager.createGraph();
    
    const parent1 = manager.createNode(graphId, { type: 'task' });
    const parent2 = manager.createNode(graphId, { type: 'task' });
    const child = manager.createNode(graphId, { 
      type: 'action', 
      parentIds: [parent1.id, parent2.id] 
    });
    
    // Initially no parents are completed
    expect(manager.areAllParentsCompleted(child.id)).toBe(false);
    
    // Complete one parent
    manager.updateNodeStatus(parent1.id, 'completed');
    expect(manager.areAllParentsCompleted(child.id)).toBe(false);
    
    // Complete the other parent
    manager.updateNodeStatus(parent2.id, 'completed');
    expect(manager.areAllParentsCompleted(child.id)).toBe(true);
  });
  
  test('should get nodes that are ready to process', () => {
    const graphId = manager.createGraph();
    
    // Create a dependency chain
    const root = manager.createNode(graphId, { type: 'question' });
    const task1 = manager.createNode(graphId, { type: 'task', parentIds: [root.id] });
    const task2 = manager.createNode(graphId, { type: 'task', parentIds: [root.id] });
    const action = manager.createNode(graphId, { type: 'action', parentIds: [task1.id, task2.id] });
    
    // Initially only root is ready
    let readyNodes = manager.getReadyNodes(graphId);
    expect(readyNodes.length).toBe(1);
    expect(readyNodes[0].id).toBe(root.id);
    
    // Complete root - task1 and task2 should be ready
    manager.updateNodeStatus(root.id, 'completed');
    readyNodes = manager.getReadyNodes(graphId);
    expect(readyNodes.length).toBe(2);
    expect(readyNodes.map(n => n.id)).toEqual(expect.arrayContaining([task1.id, task2.id]));
    
    // Complete task1 - action is still not ready
    manager.updateNodeStatus(task1.id, 'completed');
    readyNodes = manager.getReadyNodes(graphId);
    expect(readyNodes.map(n => n.id)).toContain(task2.id);
    expect(readyNodes.map(n => n.id)).not.toContain(action.id);
    
    // Complete task2 - action should now be ready
    manager.updateNodeStatus(task2.id, 'completed');
    readyNodes = manager.getReadyNodes(graphId);
    expect(readyNodes.map(n => n.id)).toContain(action.id);
  });
  
  test('should add and remove edges between nodes', () => {
    const graphId = manager.createGraph();
    
    const node1 = manager.createNode(graphId, { type: 'thought' });
    const node2 = manager.createNode(graphId, { type: 'thought' });
    
    // Initially no connection
    expect(node1.childIds).not.toContain(node2.id);
    expect(node2.parentIds).not.toContain(node1.id);
    
    // Add edge
    manager.addEdge(node1.id, node2.id);
    
    // Verify edge exists
    const updatedNode1 = manager.getNode(node1.id);
    const updatedNode2 = manager.getNode(node2.id);
    
    expect(updatedNode1.childIds).toContain(node2.id);
    expect(updatedNode2.parentIds).toContain(node1.id);
    
    // Remove edge
    manager.removeEdge(node1.id, node2.id);
    
    // Verify edge is removed
    const finalNode1 = manager.getNode(node1.id);
    const finalNode2 = manager.getNode(node2.id);
    
    expect(finalNode1.childIds).not.toContain(node2.id);
    expect(finalNode2.parentIds).not.toContain(node1.id);
  });
  
  test('should persist a graph to IPFS', async () => {
    const graphId = manager.createGraph();
    
    // Create a simple graph
    const root = manager.createNode(graphId, { type: 'question', content: 'Test question' });
    const task = manager.createNode(graphId, { type: 'task', content: 'Test task', parentIds: [root.id] });
    
    // Set up MCP client
    const MCPClient = require('../../../src/storage/ipfs/mcp-client').MCPClient;
    const mockClient = new MCPClient();
    manager.setMCPClient(mockClient);
    
    // Persist the graph
    const graphCid = await manager.persistGraph(graphId);
    
    // Verify persistence
    expect(graphCid).toBeDefined();
    expect(typeof graphCid).toBe('string');
    
    // Check that methods were called correctly
    expect(mockClient.isConnectedToServer).toHaveBeenCalled();
    expect(mockClient.addNode).toHaveBeenCalledTimes(5); // 2 nodes + 1 for links + 1 graph metadata
  });
});