/**
 * Unit Tests for the GoTNode (Graph-of-Thought Node) class - CommonJS Version
 */

// Import directly from our mock implementation
const { GoTNode, GoTNodeType, GoTNodeStatus } = require('../../mocks/graph/got-node.mock');

// --- Mock Setup ---

// Mock Date.now() for tests
const originalDateNow = Date.now;
let mockTime = 1000000000000; // Starting mock timestamp
global.Date.now = jest.fn(() => mockTime++);

// --- Test Suite ---

describe('GoTNode', () => {

  // Restore the original Date.now after all tests
  afterAll(() => {
    global.Date.now = originalDateNow;
  });

  // --- Basic tests ---

  it('should create a node with correct default values', () => {
    // Create a node with just type specified
    const nodeType = GoTNodeType.HYPOTHESIS;
    const node = new GoTNode({ type: nodeType });

    // Check properties
    expect(node.id).toEqual(expect.any(String));
    expect(node.id).toHaveLength(36); // UUID length
    expect(node.type).toBe(nodeType);
    expect(node.status).toBe(GoTNodeStatus.PENDING);
    expect(node.content).toBe('');
    expect(node.data).toEqual({});
    expect(node.parentIds).toEqual([]);
    expect(node.childIds).toEqual([]);
  });

  it('should correctly identify root and leaf nodes', () => {
    const rootNode = new GoTNode({ type: GoTNodeType.QUESTION });
    const childNode = new GoTNode({ 
      type: GoTNodeType.ANSWER,
      parentIds: [rootNode.id] 
    });

    expect(rootNode.isRoot()).toBe(true);
    expect(childNode.isRoot()).toBe(false);
    
    const parentNode = new GoTNode({ 
      type: GoTNodeType.QUESTION,
      childIds: ['some-child-id']
    });
    const leafNode = new GoTNode({ type: GoTNodeType.ANSWER });
    
    expect(parentNode.isLeaf()).toBe(false);
    expect(leafNode.isLeaf()).toBe(true);
  });
});
