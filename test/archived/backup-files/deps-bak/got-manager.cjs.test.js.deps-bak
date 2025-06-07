/**
 * Unit Tests for the GoTManager (Graph-of-Thought Manager) class - CommonJS Version
 */

// Import mock of the manager
const { GoTManager } = require('../../mocks/graph/got-manager.mock');
const { GoTNodeType } = require('../../mocks/graph/got-node.mock');

describe('GoTManager', () => {
  let manager;
  
  beforeEach(() => {
    // Get a fresh instance for each test to avoid state leakage
    manager = GoTManager.getInstance(true); // true to force new instance
  });
  
  afterEach(() => {
    // Clear the singleton instance between tests
    GoTManager.resetInstance();
  });

  // --- Basic tests ---

  it('should create a new graph', () => {
    // Create a new graph
    const graphId = manager.createGraph();
    
    // Verify graph was created
    expect(graphId).toEqual(expect.any(String));
    expect(manager.getGraphNodeIds(graphId)).toEqual([]);
  });

  it('should create and add nodes to a graph', () => {
    // Create a graph
    const graphId = manager.createGraph();
    
    // Create nodes in the graph
    const questionNode = manager.createNode({
      graphId,
      type: GoTNodeType.QUESTION,
      content: 'What is the capital of France?'
    });
    
    const answerNode = manager.createNode({
      graphId,
      type: GoTNodeType.ANSWER,
      content: 'Paris',
      parentIds: [questionNode.id]
    });
    
    // Check graph state
    const nodeIds = manager.getGraphNodeIds(graphId);
    expect(nodeIds).toContain(questionNode.id);
    expect(nodeIds).toContain(answerNode.id);
    expect(nodeIds.length).toBe(2);
    
    // Check node relationships
    expect(manager.getChildNodes(questionNode)).toEqual([answerNode]);
    expect(manager.getParentNodes(answerNode)).toEqual([questionNode]);
  });
});
