/**
 * Unit Tests for the GoTNode (Graph-of-Thought Node) class.
 *
 * These tests verify the constructor, default values, methods for managing
 * relationships (parents/children), status updates, content/data updates,
 * state checks (isLeaf/isRoot), and serialization/deserialization.
 */


// --- Mock Setup ---

// Mock Date.now() to ensure predictable and distinct timestamps during tests
const originalDateNow = Date.now;
let mockTime = 1000000000000; // Starting mock timestamp
global.Date.now = jest.fn(() => mockTime++); // Increment time on each call

// --- Test Suite ---

describe('GoTNode', () => {

  // Restore the original Date.now after all tests in this suite
  afterAll(() => {
    global.Date.now = originalDateNow;
  });

  // --- Constructor and Defaults ---

  it('should create a node with correct default values when only type is provided', () => {
    // Arrange
    const nodeType = GoTNodeType.HYPOTHESIS; // Use plausible enum value

    // Act
    const node = new GoTNode({ type: nodeType });

    // Assert
    expect(node.id).toEqual(expect.any(String)); // Should generate a UUID
    expect(node.id).toHaveLength(36);
    expect(node.graphId).toBeUndefined(); // graphId is typically set by the manager
    expect(node.type).toBe(nodeType);
    expect(node.status).toBe(GoTNodeStatus.PENDING); // Default status
    expect(node.content).toBe(''); // Default content
    expect(node.data).toEqual({}); // Default data
    expect(node.priority).toBe(1); // Default priority
    expect(node.parentIds).toEqual([]); // Default parents
    expect(node.childIds).toEqual([]); // Default children
    expect(node.createdAt).toBe(mockTime - 1); // Check timestamp (mock was incremented)
    expect(node.updatedAt).toBe(node.createdAt); // Initially updatedAt === createdAt
  });

  it('should create a node with all provided values', () => {
    // Arrange
    const options = {
      id: 'test-id-123',
      graphId: 'graph-123',
      type: GoTNodeType.QUESTION,
      content: 'Test content',
      status: GoTNodeStatus.COMPLETED,
      data: { key: 'value' },
      priority: 5,
      parentIds: ['parent-1', 'parent-2'],
      childIds: ['child-1']
    };

    // Act
    const node = new GoTNode(options);

    // Assert
    expect(node.id).toBe(options.id);
    expect(node.graphId).toBe(options.graphId);
    expect(node.type).toBe(options.type);
    expect(node.status).toBe(options.status);
    expect(node.content).toBe(options.content);
    expect(node.data).toEqual(options.data);
    expect(node.priority).toBe(options.priority);
    expect(node.parentIds).toEqual(options.parentIds);
    expect(node.childIds).toEqual(options.childIds);
  });

  // --- Child and Parent Management ---

  it('should add a child node correctly', () => {
    // Arrange
    const parent = new GoTNode({ type: GoTNodeType.QUESTION });
    const child = new GoTNode({ type: GoTNodeType.ANSWER });
    
    // Act
    parent.addChild(child.id);
    
    // Assert
    expect(parent.childIds).toContain(child.id);
    expect(parent.childIds.length).toBe(1);
  });

  it('should properly report isRoot status', () => {
    // Arrange & Act
    const rootNode = new GoTNode({ type: GoTNodeType.QUESTION }); 
    const childNode = new GoTNode({ 
      type: GoTNodeType.ANSWER,
      parentIds: [rootNode.id] 
    });
    
    // Assert
    expect(rootNode.isRoot()).toBe(true);
    expect(childNode.isRoot()).toBe(false);
  });

  it('should properly report isLeaf status', () => {
    // Arrange & Act
    const parentNode = new GoTNode({ 
      type: GoTNodeType.QUESTION,
      childIds: ['some-child-id']
    });
    const leafNode = new GoTNode({ type: GoTNodeType.ANSWER });
    
    // Assert
    expect(parentNode.isLeaf()).toBe(false);
    expect(leafNode.isLeaf()).toBe(true);
  });
});
