/**
 * Unit Tests for the GoTNode (Graph-of-Thought Node) class.
 *
 * These tests verify the constructor, default values, methods for managing
 * relationships (parents/children), status updates, content/data updates,
 * state checks (isLeaf/isRoot), and serialization/deserialization.
 */

// --- Imports ---
// Import directly from our mock implementation with require
import { GoTNode, GoTNodeType, GoTNodeStatus } from '../../mocks/graph/got-node.mock';

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
    expect(node.completedAt).toBeUndefined(); // Not completed by default
  });

  it('should create a node with all custom values provided', () => {
    // Arrange
    const nodeData = {
      id: 'custom-node-id-123',
      graphId: 'custom-graph-id-456',
      type: GoTNodeType.TASK, // Assuming TASK type exists
      status: GoTNodeStatus.IN_PROGRESS, // Using plausible status
      content: 'Custom task content',
      data: { key: 'value', nested: true },
      priority: 5,
      parentIds: ['parent-1', 'parent-2'],
      childIds: ['child-1'],
      createdAt: 900000000000, // Explicit timestamps
      updatedAt: 900000000005,
      completedAt: undefined,
    };

    // Act
    const node = new GoTNode(nodeData);

    // Assert
    expect(node.id).toBe(nodeData.id);
    expect(node.graphId).toBe(nodeData.graphId);
    expect(node.type).toBe(nodeData.type);
    expect(node.status).toBe(nodeData.status);
    expect(node.content).toBe(nodeData.content);
    expect(node.data).toEqual(nodeData.data);
    expect(node.priority).toBe(nodeData.priority);
    expect(node.parentIds).toEqual(nodeData.parentIds);
    expect(node.childIds).toEqual(nodeData.childIds);
    expect(node.createdAt).toBe(nodeData.createdAt);
    expect(node.updatedAt).toBe(nodeData.updatedAt);
    expect(node.completedAt).toBe(nodeData.completedAt);
  });

  // --- Relationship Management ---

  describe('Parent/Child ID Management', () => {
    let node: any;

    beforeEach(() => {
      node = new GoTNode({ type: GoTNodeType.ANALYSIS }); // Plausible type
    });

    it('should add parent IDs correctly, avoiding duplicates', () => {
      // Act
      node.addParent('parent-1');
      node.addParent('parent-2');
      node.addParent('parent-1'); // Add duplicate

      // Assert
      expect(node.parentIds).toEqual(['parent-1', 'parent-2']);
    });

    it('should remove parent IDs correctly', () => {
      // Arrange
      node.addParent('parent-1');
      node.addParent('parent-2');

      // Act
      node.removeParent('parent-1');

      // Assert
      expect(node.parentIds).toEqual(['parent-2']);
    });

    it('should not error when removing a non-existent parent ID', () => {
      // Arrange
      node.addParent('parent-1');

      // Act & Assert
      expect(() => node.removeParent('non-existent-parent')).not.toThrow();
      expect(node.parentIds).toEqual(['parent-1']);
    });

    it('should add child IDs correctly, avoiding duplicates', () => {
      // Act
      node.addChild('child-1');
      node.addChild('child-2');
      node.addChild('child-1'); // Add duplicate

      // Assert
      expect(node.childIds).toEqual(['child-1', 'child-2']);
    });

    it('should remove child IDs correctly', () => {
      // Arrange
      node.addChild('child-1');
      node.addChild('child-2');

      // Act
      node.removeChild('child-1');

      // Assert
      expect(node.childIds).toEqual(['child-2']);
    });

    it('should not error when removing a non-existent child ID', () => {
      // Arrange
      node.addChild('child-1');

      // Act & Assert
      expect(() => node.removeChild('non-existent-child')).not.toThrow();
      expect(node.childIds).toEqual(['child-1']);
    });
  });

  // --- Status and Content Updates ---

  describe('Status and Content Updates', () => {
    let node: any;
    let initialTimestamp: number;

    beforeEach(() => {
      mockTime = 1000000000000; // Reset mock time
      node = new GoTNode({ type: GoTNodeType.SYNTHESIS }); // Plausible type
      initialTimestamp = node.createdAt; // Capture initial timestamp
    });

    it('should update status and updatedAt timestamp', () => {
      // Arrange
      expect(node.status).toBe(GoTNodeStatus.PENDING);
      expect(node.updatedAt).toBe(initialTimestamp);

      // Act
      node.updateStatus(GoTNodeStatus.IN_PROGRESS); // Plausible status

      // Assert
      expect(node.status).toBe(GoTNodeStatus.IN_PROGRESS);
      expect(node.updatedAt).toBeGreaterThan(initialTimestamp);
      expect(node.completedAt).toBeUndefined(); // Should not set completedAt yet
    });

    it('should set completedAt timestamp only when status becomes completed', () => {
      // Arrange
      const firstUpdateTime = node.updatedAt;

      // Act: Update to non-completed status
      node.updateStatus(GoTNodeStatus.IN_PROGRESS);
      const secondUpdateTime = node.updatedAt;

      // Assert: completedAt still undefined
      expect(node.completedAt).toBeUndefined();
      expect(secondUpdateTime).toBeGreaterThan(firstUpdateTime);

      // Act: Update to completed status
      node.updateStatus(GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
      const finalUpdateTime = node.updatedAt;

      // Assert: completedAt should now be set
      expect(node.status).toBe(GoTNodeStatus.COMPLETED_SUCCESS);
      expect(node.completedAt).toBeDefined();
      expect(node.completedAt).toBe(finalUpdateTime); // completedAt should match last update time
      expect(finalUpdateTime).toBeGreaterThan(secondUpdateTime);
    });

     it('should handle updating to the same status without changing timestamps', () => {
      // Arrange
      node.updateStatus(GoTNodeStatus.IN_PROGRESS); // Update once
      const firstUpdateTime = node.updatedAt;

      // Act: Update to the same status again
      node.updateStatus(GoTNodeStatus.IN_PROGRESS);
      const secondUpdateTime = node.updatedAt;

      // Assert: Timestamps should not have changed
      expect(secondUpdateTime).toBe(firstUpdateTime);
    });

    it('should update content and updatedAt timestamp', () => {
      // Arrange
      expect(node.content).toBe('');

      // Act
      node.updateContent('Updated node content.');

      // Assert
      expect(node.content).toBe('Updated node content.');
      expect(node.updatedAt).toBeGreaterThan(initialTimestamp);
    });

    it('should update data (merge) and updatedAt timestamp', () => {
      // Arrange
      expect(node.data).toEqual({});

      // Act 1: Set initial data
      node.updateData({ key1: 'value1', key2: 123 });
      const firstUpdateTime = node.updatedAt;

      // Assert 1
      expect(node.data).toEqual({ key1: 'value1', key2: 123 });
      expect(firstUpdateTime).toBeGreaterThan(initialTimestamp);

      // Act 2: Update existing and add new data
      node.updateData({ key1: 'new-value', key3: true });
      const secondUpdateTime = node.updatedAt;

      // Assert 2: Data should be merged
      expect(node.data).toEqual({ key1: 'new-value', key2: 123, key3: true });
      expect(secondUpdateTime).toBeGreaterThan(firstUpdateTime);
    });
  });

  // --- State Checks ---

  describe('State Checks (isLeaf, isRoot)', () => {
    let node: any;

    beforeEach(() => {
      node = new GoTNode({ type: GoTNodeType.HYPOTHESIS }); // Plausible type
    });

    it('should be both root and leaf initially', () => {
      expect(node.isRoot()).toBe(true);
      expect(node.isLeaf()).toBe(true);
    });

    it('should not be root after adding a parent', () => {
      node.addParent('parent-1');
      expect(node.isRoot()).toBe(false);
      expect(node.isLeaf()).toBe(true); // Still a leaf
    });

    it('should not be leaf after adding a child', () => {
      node.addChild('child-1');
      expect(node.isRoot()).toBe(true); // Still a root
      expect(node.isLeaf()).toBe(false);
    });

    it('should not be root or leaf after adding parent and child', () => {
      node.addParent('parent-1');
      node.addChild('child-1');
      expect(node.isRoot()).toBe(false);
      expect(node.isLeaf()).toBe(false);
    });

    it('should become root again after removing all parents', () => {
      node.addParent('parent-1');
      node.addChild('child-1'); // Not a root initially
      node.removeParent('parent-1');
      expect(node.isRoot()).toBe(true);
      expect(node.isLeaf()).toBe(false); // Still has child
    });

    it('should become leaf again after removing all children', () => {
      node.addParent('parent-1');
      node.addChild('child-1'); // Not a leaf initially
      node.removeChild('child-1');
      expect(node.isRoot()).toBe(false); // Still has parent
      expect(node.isLeaf()).toBe(true);
    });
  });

  // --- Serialization ---

  describe('Serialization (toJSON, fromJSON)', () => {
    it('should serialize and deserialize a node correctly', () => {
      // Arrange
      const originalNode = new GoTNode({
        graphId: 'g1',
        type: GoTNodeType.TASK, // Assuming TASK type exists
        content: 'Serialize me',
        data: { complex: { nested: [1, 2] } },
        priority: 7,
        parentIds: ['p1'],
        childIds: ['c1'],
      });
      originalNode.updateStatus(GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
      const completedTime = originalNode.completedAt; // Capture time if set

      // Act: Serialize
      const json = originalNode.toJSON();

      // Assert: Check JSON structure (basic)
      expect(json.id).toBe(originalNode.id);
      expect(json.graphId).toBe(originalNode.graphId);
      expect(json.type).toBe(originalNode.type);
      expect(json.status).toBe(originalNode.status);
      expect(json.content).toBe(originalNode.content);
      expect(json.data).toEqual(originalNode.data);
      expect(json.priority).toBe(originalNode.priority);
      expect(json.parentIds).toEqual(originalNode.parentIds);
      expect(json.childIds).toEqual(originalNode.childIds);
      expect(json.createdAt).toBe(originalNode.createdAt);
      expect(json.updatedAt).toBe(originalNode.updatedAt);
      expect(json.completedAt).toBe(completedTime);

      // Act: Deserialize
      const deserializedNode = GoTNode.fromJSON(json);

      // Assert: Check deserialized object
      expect(deserializedNode).toBeInstanceOf(GoTNode);
      expect(deserializedNode).toEqual(originalNode); // Check deep equality
      // Optional: Check specific properties again
      expect(deserializedNode.id).toBe(originalNode.id);
      expect(deserializedNode.completedAt).toBe(completedTime);
    });

    it('should handle deserialization of minimal data', () => {
        // Arrange
        const minimalJson = {
            id: 'min-id',
            graphId: 'min-graph',
            type: GoTNodeType.QUESTION,
            status: GoTNodeStatus.PENDING,
            content: '',
            data: {},
            priority: 1,
            parentIds: [],
            childIds: [],
            createdAt: 1600000000000,
            updatedAt: 1600000000000,
            // completedAt is undefined
        };

        // Act
        const deserializedNode = GoTNode.fromJSON(minimalJson);

        // Assert
        expect(deserializedNode).toBeInstanceOf(GoTNode);
        expect(deserializedNode.id).toBe('min-id');
        expect(deserializedNode.type).toBe(GoTNodeType.QUESTION);
        expect(deserializedNode.status).toBe(GoTNodeStatus.PENDING);
        expect(deserializedNode.completedAt).toBeUndefined();
    });
  });
});
