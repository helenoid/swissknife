/**
 * Unit Tests for the GoTNode (Graph-of-Thought Node) class.
 *
 * These tests verify the constructor, default values, methods for managing
 * relationships (parents/children), status updates, content/data updates,
 * state checks (isLeaf/isRoot), and serialization/deserialization.
 */

// --- Imports ---
// Import directly from our mock implementation
const { GoTNode, GoTNodeType, GoTNodeStatus } = require('../../mocks/graph/got-node.mock');

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

  it('should not add duplicate child ids', () => {
    // Arrange
    const parent = new GoTNode({ type: GoTNodeType.QUESTION });
    const childId = 'child-123';
    
    // Act
    parent.addChild(childId);
    parent.addChild(childId); // Try adding same id again
    
    // Assert
    expect(parent.childIds).toEqual([childId]);
    expect(parent.childIds.length).toBe(1);
  });

  it('should add a parent node correctly', () => {
    // Arrange
    const child = new GoTNode({ type: GoTNodeType.ANSWER });
    const parent = new GoTNode({ type: GoTNodeType.QUESTION });
    
    // Act
    child.addParent(parent.id);
    
    // Assert
    expect(child.parentIds).toContain(parent.id);
    expect(child.parentIds.length).toBe(1);
  });

  it('should not add duplicate parent ids', () => {
    // Arrange
    const child = new GoTNode({ type: GoTNodeType.ANSWER });
    const parentId = 'parent-123';
    
    // Act
    child.addParent(parentId);
    child.addParent(parentId); // Try adding same id again
    
    // Assert
    expect(child.parentIds).toEqual([parentId]);
    expect(child.parentIds.length).toBe(1);
  });

  it('should remove a child node correctly', () => {
    // Arrange
    const parent = new GoTNode({ type: GoTNodeType.QUESTION });
    const childId1 = 'child-1';
    const childId2 = 'child-2';
    parent.addChild(childId1);
    parent.addChild(childId2);
    
    // Act
    parent.removeChild(childId1);
    
    // Assert
    expect(parent.childIds).not.toContain(childId1);
    expect(parent.childIds).toContain(childId2);
    expect(parent.childIds.length).toBe(1);
  });

  it('should remove a parent node correctly', () => {
    // Arrange
    const child = new GoTNode({ type: GoTNodeType.ANSWER });
    const parentId1 = 'parent-1';
    const parentId2 = 'parent-2';
    child.addParent(parentId1);
    child.addParent(parentId2);
    
    // Act
    child.removeParent(parentId1);
    
    // Assert
    expect(child.parentIds).not.toContain(parentId1);
    expect(child.parentIds).toContain(parentId2);
    expect(child.parentIds.length).toBe(1);
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
  
  // --- Content and Data Management ---

  it('should update content correctly', () => {
    // Arrange
    const node = new GoTNode({ type: GoTNodeType.QUESTION });
    const newContent = 'Updated content';
    const originalTimestamp = node.updatedAt;
    
    // Small delay to ensure timestamp would change
    mockTime += 1000;
    
    // Act
    node.updateContent(newContent);
    
    // Assert
    expect(node.content).toBe(newContent);
    expect(node.updatedAt).toBeGreaterThan(originalTimestamp);
  });

  it('should update status correctly', () => {
    // Arrange
    const node = new GoTNode({ type: GoTNodeType.TASK });
    const newStatus = GoTNodeStatus.IN_PROGRESS;
    const originalTimestamp = node.updatedAt;
    
    // Small delay to ensure timestamp would change
    mockTime += 1000;
    
    // Act
    node.updateStatus(newStatus);
    
    // Assert
    expect(node.status).toBe(newStatus);
    expect(node.updatedAt).toBeGreaterThan(originalTimestamp);
  });

  it('should update data correctly', () => {
    // Arrange
    const node = new GoTNode({ 
      type: GoTNodeType.ANALYSIS,
      data: { existingKey: 'existingValue' } 
    });
    const newData = { newKey: 'newValue' };
    const originalTimestamp = node.updatedAt;
    
    // Small delay to ensure timestamp would change
    mockTime += 1000;
    
    // Act
    node.updateData(newData);
    
    // Assert
    expect(node.data).toEqual({
      existingKey: 'existingValue',
      newKey: 'newValue'
    });
    expect(node.updatedAt).toBeGreaterThan(originalTimestamp);
  });

  it('should properly serialize to JSON', () => {
    // Arrange
    const node = new GoTNode({
      id: 'test-id',
      graphId: 'graph-id',
      type: GoTNodeType.SYNTHESIS,
      content: 'Test content',
      status: GoTNodeStatus.COMPLETED,
      data: { testKey: 'testValue' },
      priority: 3,
      parentIds: ['parent1'],
      childIds: ['child1', 'child2']
    });
    
    // Act
    const json = node.toJSON();
    
    // Assert
    expect(json).toEqual({
      id: 'test-id',
      graphId: 'graph-id',
      type: GoTNodeType.SYNTHESIS,
      content: 'Test content',
      status: GoTNodeStatus.COMPLETED,
      data: { testKey: 'testValue' },
      priority: 3,
      parentIds: ['parent1'],
      childIds: ['child1', 'child2'],
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
    });
  });
  
  it('should create an equivalent node when deserializing from JSON', () => {
    // Arrange
    const originalNode = new GoTNode({
      id: 'test-id',
      graphId: 'graph-id',
      type: GoTNodeType.ANALYSIS,
      content: 'Test content',
      status: GoTNodeStatus.COMPLETED,
      data: { testKey: 'testValue' },
      priority: 2,
      parentIds: ['parent1', 'parent2'],
      childIds: ['child1']
    });
    
    // Act
    const json = originalNode.toJSON();
    const deserializedNode = GoTNode.fromJSON(json);
    
    // Assert
    expect(deserializedNode.id).toEqual(originalNode.id);
    expect(deserializedNode.graphId).toEqual(originalNode.graphId);
    expect(deserializedNode.type).toEqual(originalNode.type);
    expect(deserializedNode.content).toEqual(originalNode.content);
    expect(deserializedNode.status).toEqual(originalNode.status);
    expect(deserializedNode.data).toEqual(originalNode.data);
    expect(deserializedNode.priority).toEqual(originalNode.priority);
    expect(deserializedNode.parentIds).toEqual(originalNode.parentIds);
    expect(deserializedNode.childIds).toEqual(originalNode.childIds);
    expect(deserializedNode.createdAt).toEqual(originalNode.createdAt);
    expect(deserializedNode.updatedAt).toEqual(originalNode.updatedAt);
  });
});
