/**
 * Tests for the Graph-of-Thought Node
 */

import { GoTNode } from '../../../src/tasks/graph/node';

// Mock Date.now() to ensure different timestamps
const originalDateNow = Date.now;
let mockTime = 1000000000000;
global.Date.now = jest.fn(() => mockTime++);

describe('GoTNode', () => {
  // Restore the original Date.now after tests
  afterAll(() => {
    global.Date.now = originalDateNow;
  });
  
  test('should create a node with default values', () => {
    const node = new GoTNode({
      type: 'thought'
    });
    
    expect(node.id).toBeDefined();
    expect(node.type).toBe('thought');
    expect(node.status).toBe('pending');
    expect(node.content).toBe('');
    expect(node.data).toEqual({});
    expect(node.priority).toBe(1);
    expect(node.parentIds).toEqual([]);
    expect(node.childIds).toEqual([]);
    expect(node.createdAt).toBeDefined();
    expect(node.updatedAt).toBe(node.createdAt);
    expect(node.completedAt).toBeUndefined();
  });
  
  test('should create a node with custom values', () => {
    const nodeData = {
      id: 'test-node-id',
      type: 'task',
      status: 'active',
      content: 'Test content',
      data: { key: 'value' },
      priority: 5,
      parentIds: ['parent-id-1', 'parent-id-2'],
      childIds: ['child-id-1', 'child-id-2']
    };
    
    const node = new GoTNode(nodeData);
    
    expect(node.id).toBe(nodeData.id);
    expect(node.type).toBe(nodeData.type);
    expect(node.status).toBe(nodeData.status);
    expect(node.content).toBe(nodeData.content);
    expect(node.data).toEqual(nodeData.data);
    expect(node.priority).toBe(nodeData.priority);
    expect(node.parentIds).toEqual(nodeData.parentIds);
    expect(node.childIds).toEqual(nodeData.childIds);
  });
  
  test('should add and remove parent IDs', () => {
    const node = new GoTNode({ type: 'thought' });
    
    // Add parent
    node.addParent('parent-id-1');
    expect(node.parentIds).toContain('parent-id-1');
    
    // Add another parent
    node.addParent('parent-id-2');
    expect(node.parentIds).toEqual(['parent-id-1', 'parent-id-2']);
    
    // Try adding a duplicate parent (should not add)
    node.addParent('parent-id-1');
    expect(node.parentIds).toEqual(['parent-id-1', 'parent-id-2']);
    
    // Remove parent
    node.removeParent('parent-id-1');
    expect(node.parentIds).toEqual(['parent-id-2']);
    
    // Remove non-existent parent (should not error)
    node.removeParent('non-existent');
    expect(node.parentIds).toEqual(['parent-id-2']);
  });
  
  test('should add and remove child IDs', () => {
    const node = new GoTNode({ type: 'thought' });
    
    // Add child
    node.addChild('child-id-1');
    expect(node.childIds).toContain('child-id-1');
    
    // Add another child
    node.addChild('child-id-2');
    expect(node.childIds).toEqual(['child-id-1', 'child-id-2']);
    
    // Try adding a duplicate child (should not add)
    node.addChild('child-id-1');
    expect(node.childIds).toEqual(['child-id-1', 'child-id-2']);
    
    // Remove child
    node.removeChild('child-id-1');
    expect(node.childIds).toEqual(['child-id-2']);
    
    // Remove non-existent child (should not error)
    node.removeChild('non-existent');
    expect(node.childIds).toEqual(['child-id-2']);
  });
  
  test('should update status and set completedAt for completed state', () => {
    const node = new GoTNode({ type: 'thought' });
    const createdAt = node.createdAt;
    
    expect(node.status).toBe('pending');
    expect(node.completedAt).toBeUndefined();
    
    node.updateStatus('active');
    expect(node.status).toBe('active');
    expect(node.completedAt).toBeUndefined();
    expect(node.updatedAt).toBeGreaterThan(createdAt); // Using incrementing mock time
    
    node.updateStatus('completed');
    expect(node.status).toBe('completed');
    expect(node.completedAt).toBeDefined();
  });
  
  test('should update content and data', () => {
    const node = new GoTNode({ type: 'thought' });
    const createdAt = node.createdAt;
    
    // Update content
    node.updateContent('New content');
    expect(node.content).toBe('New content');
    expect(node.updatedAt).toBeGreaterThan(createdAt);
    
    // Update data
    const initialUpdatedAt = node.updatedAt;
    node.updateData({ key1: 'value1' });
    expect(node.data).toEqual({ key1: 'value1' });
    expect(node.updatedAt).toBeGreaterThan(initialUpdatedAt);
    
    // Update data with additional keys
    node.updateData({ key2: 'value2' });
    expect(node.data).toEqual({ key1: 'value1', key2: 'value2' });
    
    // Override existing keys
    node.updateData({ key1: 'new-value' });
    expect(node.data).toEqual({ key1: 'new-value', key2: 'value2' });
  });
  
  test('should correctly identify leaf and root nodes', () => {
    const node = new GoTNode({ type: 'thought' });
    
    // Initially both leaf and root
    expect(node.isLeaf()).toBe(true);
    expect(node.isRoot()).toBe(true);
    
    // Add parent - no longer a root
    node.addParent('parent-id');
    expect(node.isLeaf()).toBe(true);
    expect(node.isRoot()).toBe(false);
    
    // Add child - no longer a leaf
    node.addChild('child-id');
    expect(node.isLeaf()).toBe(false);
    expect(node.isRoot()).toBe(false);
    
    // Remove parent - now a root again
    node.removeParent('parent-id');
    expect(node.isLeaf()).toBe(false);
    expect(node.isRoot()).toBe(true);
    
    // Remove child - now a leaf again
    node.removeChild('child-id');
    expect(node.isLeaf()).toBe(true);
    expect(node.isRoot()).toBe(true);
  });
  
  test('should serialize and deserialize correctly', () => {
    const originalNode = new GoTNode({
      type: 'task',
      content: 'Test task',
      data: { key: 'value', nested: { foo: 'bar' } },
      priority: 3,
      parentIds: ['parent-1'],
      childIds: ['child-1', 'child-2']
    });
    
    // Mark as completed to test completedAt
    originalNode.updateStatus('completed');
    
    // Serialize to JSON
    const json = originalNode.toJSON();
    
    // Deserialize from JSON
    const deserializedNode = GoTNode.fromJSON(json);
    
    // Check that all properties match
    expect(deserializedNode.id).toBe(originalNode.id);
    expect(deserializedNode.type).toBe(originalNode.type);
    expect(deserializedNode.status).toBe(originalNode.status);
    expect(deserializedNode.content).toBe(originalNode.content);
    expect(deserializedNode.data).toEqual(originalNode.data);
    expect(deserializedNode.priority).toBe(originalNode.priority);
    expect(deserializedNode.parentIds).toEqual(originalNode.parentIds);
    expect(deserializedNode.childIds).toEqual(originalNode.childIds);
    expect(deserializedNode.createdAt).toBe(originalNode.createdAt);
    expect(deserializedNode.updatedAt).toBe(originalNode.updatedAt);
    expect(deserializedNode.completedAt).toBe(originalNode.completedAt);
  });
});