// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Example test for the Graph-of-Thought system
 * 
 * This demonstrates testing the Graph-of-Thought (GoT) reasoning system,
 * including the graph structure, scheduler, and overall reasoning flow.
 */
const { 
  ThoughtNodeType, 
  NodeStatus, 
  MockGoTNode, 
  MockDirectedAcyclicGraph, 
  MockFibonacciHeapScheduler, 
  MockGraphOfThoughtEngine 
} = require('../../mocks/graph/mock-graph-of-thought');
const { MockStorageService } = require('../../mocks/services/mock-services');
const { waitForCondition } = require('../../utils/test-helpers');

/**
 * This test demonstrates how to test the Graph-of-Thought system
 * which is a key component in Phase 1 of the SwissKnife development
 */
describe('Graph-of-Thought System', () => {
  // Test the DAG implementation
  describe('Directed Acyclic Graph', () => {
    let dag;
    
    beforeEach(() => {
      dag = new MockDirectedAcyclicGraph();
    });
    
    test('should add nodes and edges', () => {
      // Create nodes
      const node1 = new MockGoTNode({ content: 'Node 1' });
      const node2 = new MockGoTNode({ content: 'Node 2' });
      const node3 = new MockGoTNode({ content: 'Node 3' });
      
      // Add nodes
      expect(dag.addNode(node1)).toBe(true);
      expect(dag.addNode(node2)).toBe(true);
      expect(dag.addNode(node3)).toBe(true);
      
      // Verify nodes were added
      expect(dag.getNode(node1.id)).toBe(node1);
      expect(dag.getNode(node2.id)).toBe(node2);
      expect(dag.getNode(node3.id)).toBe(node3);
      
      // Add edges
      expect(dag.addEdge(node1.id, node2.id)).toBe(true);
      expect(dag.addEdge(node2.id, node3.id)).toBe(true);
      
      // Verify edges were added
      expect(dag.getChildren(node1.id)).toContain(node2.id);
      expect(dag.getChildren(node2.id)).toContain(node3.id);
      
      // Verify parents
      expect(dag.getParents(node2.id)).toContain(node1.id);
      expect(dag.getParents(node3.id)).toContain(node2.id);
      
      // Verify root and leaf nodes
      expect(dag.getRootNodes()).toContain(node1);
      expect(dag.getLeafNodes()).toContain(node3);
    });
    
    test('should prevent cycles', () => {
      // Create nodes
      const node1 = new MockGoTNode({ content: 'Node 1' });
      const node2 = new MockGoTNode({ content: 'Node 2' });
      const node3 = new MockGoTNode({ content: 'Node 3' });
      
      // Add nodes
      dag.addNode(node1);
      dag.addNode(node2);
      dag.addNode(node3);
      
      // Add valid edges
      dag.addEdge(node1.id, node2.id);
      dag.addEdge(node2.id, node3.id);
      
      // Try to add edge that would create a cycle
      expect(dag.addEdge(node3.id, node1.id)).toBe(false);
      
      // Verify the edge wasn't added
      expect(dag.getChildren(node3.id)).not.toContain(node1.id);
    });
    
    test('should filter nodes by type and status', () => {
      // Create nodes of different types and statuses
      const questionNode = new MockGoTNode({ 
        type: ThoughtNodeType.QUESTION,
        status: NodeStatus.COMPLETED
      });
      
      const analysisNode1 = new MockGoTNode({ 
        type: ThoughtNodeType.ANALYSIS,
        status: NodeStatus.COMPLETED
      });
      
      const analysisNode2 = new MockGoTNode({ 
        type: ThoughtNodeType.ANALYSIS,
        status: NodeStatus.PENDING
      });
      
      const conclusionNode = new MockGoTNode({ 
        type: ThoughtNodeType.CONCLUSION,
        status: NodeStatus.PENDING
      });
      
      // Add nodes
      dag.addNode(questionNode);
      dag.addNode(analysisNode1);
      dag.addNode(analysisNode2);
      dag.addNode(conclusionNode);
      
      // Filter by type
      const analysisNodes = dag.getNodesByType(ThoughtNodeType.ANALYSIS);
      expect(analysisNodes).toHaveLength(2);
      expect(analysisNodes).toContain(analysisNode1);
      expect(analysisNodes).toContain(analysisNode2);
      
      // Filter by status
      const pendingNodes = dag.getNodesByStatus(NodeStatus.PENDING);
      expect(pendingNodes).toHaveLength(2);
      expect(pendingNodes).toContain(analysisNode2);
      expect(pendingNodes).toContain(conclusionNode);
      
      const completedNodes = dag.getNodesByStatus(NodeStatus.COMPLETED);
      expect(completedNodes).toHaveLength(2);
      expect(completedNodes).toContain(questionNode);
      expect(completedNodes).toContain(analysisNode1);
    });
  });
  
  // Test the Fibonacci Heap Scheduler
  describe('Fibonacci Heap Scheduler', () => {
    let scheduler;
    
    beforeEach(() => {
      scheduler = new MockFibonacciHeapScheduler();
    });
    
    test('should schedule tasks in priority order', () => {
      // Create nodes with different priorities
      const highPriorityNode = new MockGoTNode({ 
        content: 'High priority',
        priority: 1
      });
      
      const mediumPriorityNode = new MockGoTNode({ 
        content: 'Medium priority',
        priority: 5
      });
      
      const lowPriorityNode = new MockGoTNode({ 
        content: 'Low priority',
        priority: 10
      });
      
      // Add tasks in random order
      scheduler.addTask(mediumPriorityNode);
      scheduler.addTask(lowPriorityNode);
      scheduler.addTask(highPriorityNode);
      
      // Verify next task is the highest priority (lowest value)
      expect(scheduler.getNextTask()).toBe(highPriorityNode);
      
      // Execute task and verify next task
      return scheduler.executeNextTask()
        .then(() => {
          expect(scheduler.getNextTask()).toBe(mediumPriorityNode);
          return scheduler.executeNextTask();
        })
        .then(() => {
          expect(scheduler.getNextTask()).toBe(lowPriorityNode);
          return scheduler.executeNextTask();
        })
        .then(() => {
          expect(scheduler.isEmpty()).toBe(true);
        });
    });
    
    test('should handle dependencies correctly', () => {
      // Create nodes with dependencies
      const node1 = new MockGoTNode({ 
        id: 'node1',
        content: 'Node 1',
        priority: 1
      });
      
      const node2 = new MockGoTNode({ 
        id: 'node2',
        content: 'Node 2',
        priority: 2,
        dependencies: ['node1']
      });
      
      const node3 = new MockGoTNode({ 
        id: 'node3',
        content: 'Node 3',
        priority: 3,
        dependencies: ['node2']
      });
      
      // Add tasks
      expect(scheduler.addTask(node1)).toBe(true);
      
      // Node2 depends on node1, which is not completed yet
      expect(scheduler.addTask(node2)).toBe(false);
      
      // Execute node1
      return scheduler.executeNextTask()
        .then(() => {
          // Now node1 is completed, so node2 should be schedulable
          expect(scheduler.addTask(node2)).toBe(true);
          
          // Node3 depends on node2, which is not completed yet
          expect(scheduler.addTask(node3)).toBe(false);
          
          return scheduler.executeNextTask();
        })
        .then(() => {
          // Now node2 is completed, so node3 should be schedulable
          expect(scheduler.addTask(node3)).toBe(true);
          return scheduler.executeNextTask();
        })
        .then(() => {
          expect(scheduler.isEmpty()).toBe(true);
        });
    });
  });
  
  // Test the complete Graph-of-Thought engine
  describe('Graph-of-Thought Engine', () => {
    let mockStorage;
    let gotEngine;
    
    beforeEach(() => {
      mockStorage = new MockStorageService();
      gotEngine = new MockGraphOfThoughtEngine({
        storage: mockStorage
      });
    });
    
    test('should process a query through graph-of-thought reasoning', async () => {
      // Process a test query
      const result = await gotEngine.processQuery('What is the impact of quantum computing on cryptography?');
      
      // Verify result structure
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      
      // Verify graph structure
      const graph = gotEngine.getGraph();
      
      // Should have created multiple node types
      expect(graph.getNodesByType(ThoughtNodeType.QUESTION)).toHaveLength(1);
      expect(graph.getNodesByType(ThoughtNodeType.DECOMPOSITION).length).toBeGreaterThan(0);
      expect(graph.getNodesByType(ThoughtNodeType.ANALYSIS).length).toBeGreaterThan(0);
      
      // Verify graph connectivity
      const questionNode = graph.getNodesByType(ThoughtNodeType.QUESTION)[0];
      expect(graph.getChildren(questionNode.id).length).toBeGreaterThan(0);
      
      // All nodes should be completed
      const pendingNodes = graph.getNodesByStatus(NodeStatus.PENDING);
      expect(pendingNodes).toHaveLength(0);
      
      // Scheduler should be empty
      expect(gotEngine.getScheduler().isEmpty()).toBe(true);
      
      // Output the reasoning structure for debugging
      console.log(`Graph has ${graph.getAllNodes().length} nodes and ${result.reasoning.edges} edges`);
      console.log(`Node types: ${Object.values(ThoughtNodeType).map(type => 
        `${type}: ${graph.getNodesByType(type).length}`
      ).join(', ')}`);
    });
    
    test('should build a complex reasoning graph for difficult queries', async () => {
      // Process a complex query
      const result = await gotEngine.processQuery(
        'Compare and contrast the efficiency of different sorting algorithms for various input distributions'
      );
      
      // Verify a more complex graph was created
      const graph = gotEngine.getGraph();
      
      // Should have created a reasonable number of nodes
      expect(graph.getAllNodes().length).toBeGreaterThan(5);
      
      // Verify reasoning structure
      const analysisNodes = graph.getNodesByType(ThoughtNodeType.ANALYSIS);
      const synthesisNodes = graph.getNodesByType(ThoughtNodeType.SYNTHESIS);
      
      expect(analysisNodes.length).toBeGreaterThan(0);
      expect(synthesisNodes.length).toBeGreaterThan(0);
      
      // Verify result incorporates multiple nodes
      expect(result.answer.length).toBeGreaterThan(100);
    });
    
    test('should handle parallel reasoning paths', async () => {
      // Create a custom processing function that adds parallel paths
      const originalDecompose = gotEngine.decomposeProblem.bind(gotEngine);
      
      gotEngine.decomposeProblem = async (query) => {
        // Create more subproblems than the default implementation
        const baseSubproblems = await originalDecompose(query);
        
        // Add parallel paths with different priorities
        baseSubproblems.push(
          new MockGoTNode({
            type: ThoughtNodeType.DECOMPOSITION,
            content: `Parallel path 1: ${query.substring(0, 15)}...`,
            priority: 3
          }),
          new MockGoTNode({
            type: ThoughtNodeType.DECOMPOSITION,
            content: `Parallel path 2: ${query.substring(0, 15)}...`,
            priority: 3
          }),
          new MockGoTNode({
            type: ThoughtNodeType.RESEARCH,
            content: `Additional research: ${query.substring(0, 15)}...`,
            priority: 2
          })
        );
        
        return baseSubproblems;
      };
      
      // Process a query that should create parallel reasoning paths
      const result = await gotEngine.processQuery(
        'What are the economic implications of artificial general intelligence?'
      );
      
      // Verify parallel paths were created and processed
      const graph = gotEngine.getGraph();
      
      // Should have created multiple parallel paths
      const decompositionNodes = graph.getNodesByType(ThoughtNodeType.DECOMPOSITION);
      expect(decompositionNodes.length).toBeGreaterThan(3);
      
      // Verify graph breadth - children of question node
      const questionNode = graph.getNodesByType(ThoughtNodeType.QUESTION)[0];
      expect(graph.getChildren(questionNode.id).length).toBeGreaterThan(3);
      
      // Verify reasoning incorporates multiple paths
      expect(result.answer).toContain('path');
    });
  });
});