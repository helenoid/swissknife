/**
 * Integration Tests for the Graph-of-Thought (GoT) Manager.
 *
 * These tests verify the core functionalities of the GoTManager, including
 * graph and node creation, relationship management, status updates,
 * traversal logic (finding roots, leaves, ready nodes), and persistence
 * using a mocked MCPClient/Storage layer.
 */
// --- Mock Setup ---
// Add .js extension to paths
// Mock the MCPClient (assuming this is used for persistence via IPFS/IPLD)
// If GoTManager uses StorageOperations directly, mock that instead.
const mockMcpClientInstance = {
    isConnectedToServer: jest.fn().mockReturnValue(true),
    connect: jest.fn().mockResolvedValue(true),
    addNode: jest.fn().mockImplementation(async (data, links = []) => {
        // Simulate CID generation based on content hash for determinism if needed
        // const hash = crypto.createHash('sha256').update(JSON.stringify({ data, links })).digest('hex');
        // return { cid: `mock-cid-${hash.substring(0, 8)}` };
        return { cid: `mock-cid-${Math.random().toString(16).slice(2)}` };
    }),
    getNode: jest.fn().mockImplementation(async (cid) => {
        // Simulate retrieving some mock data if needed for specific tests
        return { cid, data: { mockContent: `Content for ${cid}` }, links: [] };
    }),
    // Add other methods if GoTManager uses them (e.g., updateNode, query)
};
jest.mock('../../../src/storage/ipfs/mcp-client.js', () => ({
    MCPClient: jest.fn().mockImplementation(() => mockMcpClientInstance),
}));
// Mock LogManager
jest.mock('../../../src/utils/logging/manager.js', () => ({
    LogManager: {
        getInstance: jest.fn().mockReturnValue({
            info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn(),
        }),
    },
}));
// Mock ConfigurationManager (if GoTManager uses it)
jest.mock('../../../src/config/manager.js', () => ({
    ConfigurationManager: {
        getInstance: jest.fn().mockReturnValue({
            get: jest.fn((key, defaultValue) => defaultValue),
        }),
    },
}));
// --- Imports ---
// Add .js extension
// --- Test Suite ---
describe('GoTManager', () => {
    let manager;
    let mockMcpClient; // Use mocked type
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Reset GoTManager singleton instance if applicable (depends on its implementation)
        GoTManager.instance = undefined;
        // Get/Create instances
        manager = GoTManager.getInstance(); // Assuming singleton pattern
        // Get the mocked MCPClient instance used by the manager
        // This assumes GoTManager gets/creates its client internally.
        // If MCPClient is injected, provide the mock directly.
        mockMcpClient = new MCPClient(); // Get the instance created by the mock
        manager.setMCPClient(mockMcpClient); // Assuming a setter exists for testing
    });
    // --- Graph Creation ---
    it('should create a new graph with a unique ID', () => {
        // Act
        const graphId1 = manager.createGraph();
        const graphId2 = manager.createGraph();
        // Assert
        expect(graphId1).toBeDefined();
        expect(typeof graphId1).toBe('string');
        expect(graphId2).toBeDefined();
        expect(typeof graphId2).toBe('string');
        expect(graphId1).not.toEqual(graphId2);
        expect(manager.getGraphNodes(graphId1)).toEqual([]); // New graph should be empty
    });
    // --- Node Creation and Relationships ---
    describe('Node Management', () => {
        let graphId;
        beforeEach(() => {
            graphId = manager.createGraph(); // Create a graph for node tests
        });
        it('should create a node with specified properties', () => {
            // Arrange
            const nodeData = {
                type: GoTNodeType.QUESTION,
                content: 'What is the capital of France?',
                data: { source: 'user', timestamp: 12345 },
            };
            // Act
            const node = manager.createNode(graphId, nodeData);
            // Assert
            expect(node).toBeInstanceOf(GoTNode);
            expect(node.id).toEqual(expect.any(String));
            expect(node.graphId).toBe(graphId);
            expect(node.type).toBe(nodeData.type);
            expect(node.content).toBe(nodeData.content);
            expect(node.data).toEqual(nodeData.data);
            expect(node.status).toBe(GoTNodeStatus.PENDING); // Check default status
            expect(node.parentIds).toEqual([]);
            expect(node.childIds).toEqual([]);
        });
        it('should correctly link parent and child nodes upon creation', () => {
            // Arrange
            const parentNode = manager.createNode(graphId, { type: GoTNodeType.QUESTION });
            // Act
            const childNode = manager.createNode(graphId, {
                type: GoTNodeType.HYPOTHESIS,
                parentIds: [parentNode.id],
            });
            // Assert: Check child's parents
            expect(childNode.parentIds).toContain(parentNode.id);
            // Assert: Check parent's children (need to retrieve updated parent)
            const updatedParentNode = manager.getNode(parentNode.id);
            expect(updatedParentNode).toBeDefined();
            expect(updatedParentNode.childIds).toContain(childNode.id);
        });
        it('should retrieve a specific node by ID', () => {
            // Arrange
            const node = manager.createNode(graphId, { type: GoTNodeType.RESEARCH }); // Using plausible type
            // Act
            const retrievedNode = manager.getNode(node.id);
            // Assert
            expect(retrievedNode).toBeDefined();
            expect(retrievedNode.id).toBe(node.id);
            expect(retrievedNode).toBe(node); // Should be the same instance in memory
        });
        it('should return undefined when getting a non-existent node ID', () => {
            // Act
            const retrievedNode = manager.getNode('non-existent-node-id');
            // Assert
            expect(retrievedNode).toBeUndefined();
        });
        it('should retrieve all nodes for a specific graph', () => {
            // Arrange
            const node1 = manager.createNode(graphId, { type: GoTNodeType.QUESTION });
            const node2 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS }); // Using plausible type
            const node3 = manager.createNode(graphId, { type: GoTNodeType.RESEARCH }); // Using plausible type
            const otherGraphId = manager.createGraph(); // Create another graph
            manager.createNode(otherGraphId, { type: GoTNodeType.QUESTION }); // Add node to other graph
            // Act
            const nodes = manager.getGraphNodes(graphId);
            // Assert
            expect(nodes).toHaveLength(3);
            expect(nodes.map(n => n.id)).toEqual(expect.arrayContaining([node1.id, node2.id, node3.id]));
            expect(nodes.every(n => n.graphId === graphId)).toBe(true); // Ensure only nodes from this graph
        });
        it('should retrieve nodes by type within a specific graph', () => {
            // Arrange
            manager.createNode(graphId, { type: GoTNodeType.QUESTION });
            const hypothesisNode1 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS }); // Using plausible type
            const hypothesisNode2 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS }); // Using plausible type
            manager.createNode(graphId, { type: GoTNodeType.RESEARCH }); // Using plausible type
            // Act
            const hypothesisNodes = manager.getNodesByType(graphId, GoTNodeType.HYPOTHESIS); // Using plausible type
            // Assert
            expect(hypothesisNodes).toHaveLength(2);
            expect(hypothesisNodes.map(n => n.id)).toEqual(expect.arrayContaining([hypothesisNode1.id, hypothesisNode2.id]));
            expect(hypothesisNodes.every(n => n.type === GoTNodeType.HYPOTHESIS)).toBe(true);
        });
        it('should update the status of a node', () => {
            // Arrange
            const node = manager.createNode(graphId, { type: GoTNodeType.TASK }); // Assuming TASK type exists
            expect(node.status).toBe(GoTNodeStatus.PENDING); // Initial status
            // Act
            const updated = manager.updateNodeStatus(node.id, GoTNodeStatus.IN_PROGRESS); // Using plausible status
            const retrievedNode = manager.getNode(node.id);
            // Assert
            expect(updated).toBe(true);
            expect(retrievedNode.status).toBe(GoTNodeStatus.IN_PROGRESS); // Using plausible status
        });
        it('should return false when updating status for a non-existent node', () => {
            // Act
            const updated = manager.updateNodeStatus('non-existent-id', GoTNodeStatus.COMPLETED_SUCCESS); // Using plausible status
            // Assert
            expect(updated).toBe(false);
        });
        it('should add an edge between two existing nodes', () => {
            // Arrange
            const node1 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS }); // Using plausible type
            const node2 = manager.createNode(graphId, { type: GoTNodeType.RESEARCH }); // Using plausible type
            // Act
            const added = manager.addEdge(node1.id, node2.id);
            // Assert
            expect(added).toBe(true);
            const updatedNode1 = manager.getNode(node1.id);
            const updatedNode2 = manager.getNode(node2.id);
            expect(updatedNode1.childIds).toContain(node2.id);
            expect(updatedNode2.parentIds).toContain(node1.id);
        });
        it('should remove an edge between two connected nodes', () => {
            // Arrange
            const node1 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS }); // Using plausible type
            const node2 = manager.createNode(graphId, { type: GoTNodeType.RESEARCH, parentIds: [node1.id] }); // Using plausible type
            expect(manager.getNode(node1.id).childIds).toContain(node2.id); // Verify initial state
            // Act
            const removed = manager.removeEdge(node1.id, node2.id);
            // Assert
            expect(removed).toBe(true);
            const finalNode1 = manager.getNode(node1.id);
            const finalNode2 = manager.getNode(node2.id);
            expect(finalNode1.childIds).not.toContain(node2.id);
            expect(finalNode2.parentIds).not.toContain(node1.id);
        });
        it('should return false when trying to add/remove edges with non-existent nodes', () => {
            // Arrange
            const node1 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS }); // Using plausible type
            // Act & Assert
            expect(manager.addEdge(node1.id, 'fake-id')).toBe(false);
            expect(manager.addEdge('fake-id', node1.id)).toBe(false);
            expect(manager.removeEdge(node1.id, 'fake-id')).toBe(false);
            expect(manager.removeEdge('fake-id', node1.id)).toBe(false);
        });
    });
    // --- Graph Traversal and State ---
    describe('Graph Traversal and State Logic', () => {
        let graphId;
        let root1, child1, child2, leaf1, leaf2, root2;
        beforeEach(() => {
            graphId = manager.createGraph();
            // Create node structure:
            // root1 → child1 → leaf1
            //      ↘ child2 → leaf2
            // root2 (alone)
            root1 = manager.createNode(graphId, { type: GoTNodeType.QUESTION });
            child1 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS, parentIds: [root1.id] }); // Plausible type
            child2 = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS, parentIds: [root1.id] }); // Plausible type
            leaf1 = manager.createNode(graphId, { type: GoTNodeType.RESEARCH, parentIds: [child1.id] }); // Plausible type
            leaf2 = manager.createNode(graphId, { type: GoTNodeType.RESEARCH, parentIds: [child2.id] }); // Plausible type
            root2 = manager.createNode(graphId, { type: GoTNodeType.QUESTION });
        });
        it('should correctly identify root nodes (nodes with no parents)', () => {
            // Act
            const rootNodes = manager.getRootNodes(graphId);
            // Assert
            expect(rootNodes).toHaveLength(2);
            expect(rootNodes.map(n => n.id)).toEqual(expect.arrayContaining([root1.id, root2.id]));
        });
        it('should correctly identify leaf nodes (nodes with no children)', () => {
            // Act
            const leafNodes = manager.getLeafNodes(graphId);
            // Assert
            expect(leafNodes).toHaveLength(3); // leaf1, leaf2, and root2 (which has no children)
            expect(leafNodes.map(n => n.id)).toEqual(expect.arrayContaining([leaf1.id, leaf2.id, root2.id]));
        });
        it('should retrieve correct parent nodes for a given node', () => {
            // Act
            const parentsOfChild1 = manager.getParentNodes(child1.id);
            const parentsOfLeaf2 = manager.getParentNodes(leaf2.id);
            const parentsOfRoot1 = manager.getParentNodes(root1.id);
            // Assert
            expect(parentsOfChild1).toHaveLength(1);
            expect(parentsOfChild1[0].id).toBe(root1.id);
            expect(parentsOfLeaf2).toHaveLength(1);
            expect(parentsOfLeaf2[0].id).toBe(child2.id);
            expect(parentsOfRoot1).toHaveLength(0);
        });
        it('should retrieve correct child nodes for a given node', () => {
            // Act
            const childrenOfRoot1 = manager.getChildNodes(root1.id);
            const childrenOfChild1 = manager.getChildNodes(child1.id);
            const childrenOfLeaf1 = manager.getChildNodes(leaf1.id);
            // Assert
            expect(childrenOfRoot1).toHaveLength(2);
            expect(childrenOfRoot1.map(n => n.id)).toEqual(expect.arrayContaining([child1.id, child2.id]));
            expect(childrenOfChild1).toHaveLength(1);
            expect(childrenOfChild1[0].id).toBe(leaf1.id);
            expect(childrenOfLeaf1).toHaveLength(0);
        });
        it('should correctly determine if all parent nodes are completed', () => {
            // Arrange
            const actionNode = manager.getNode(leaf1.id); // Depends on child1 which depends on root1
            // Assert initial state
            expect(manager.areAllParentsCompleted(actionNode.id)).toBe(false);
            // Act: Complete root1
            manager.updateNodeStatus(root1.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            // Assert: Still false, child1 is not complete
            expect(manager.areAllParentsCompleted(actionNode.id)).toBe(false);
            // Act: Complete child1
            manager.updateNodeStatus(child1.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            // Assert: Now true
            expect(manager.areAllParentsCompleted(actionNode.id)).toBe(true);
        });
        it('should return true for areAllParentsCompleted if node has no parents', () => {
            // Arrange
            const nodeWithNoParents = manager.getNode(root1.id);
            // Act & Assert
            expect(manager.areAllParentsCompleted(nodeWithNoParents.id)).toBe(true);
        });
        it('should identify ready nodes based on parent completion status', () => {
            // Assert initial state: Only roots are ready (Pending status is considered ready if no parents)
            let readyNodes = manager.getReadyNodes(graphId);
            expect(readyNodes).toHaveLength(2);
            expect(readyNodes.map(n => n.id)).toEqual(expect.arrayContaining([root1.id, root2.id]));
            // Act: Complete root1
            manager.updateNodeStatus(root1.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            // Assert: child1 and child2 should now be ready (plus root2)
            readyNodes = manager.getReadyNodes(graphId);
            expect(readyNodes).toHaveLength(3); // child1, child2, root2
            expect(readyNodes.map(n => n.id)).toEqual(expect.arrayContaining([child1.id, child2.id, root2.id]));
            // Act: Complete child1
            manager.updateNodeStatus(child1.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            // Assert: leaf1 is ready, child2 and root2 still ready
            readyNodes = manager.getReadyNodes(graphId);
            expect(readyNodes).toHaveLength(3); // leaf1, child2, root2
            expect(readyNodes.map(n => n.id)).toEqual(expect.arrayContaining([leaf1.id, child2.id, root2.id]));
            // Act: Complete child2
            manager.updateNodeStatus(child2.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            // Assert: leaf1 and leaf2 should now be ready (plus root2)
            readyNodes = manager.getReadyNodes(graphId);
            expect(readyNodes).toHaveLength(3); // leaf1, leaf2, root2
            expect(readyNodes.map(n => n.id)).toEqual(expect.arrayContaining([leaf1.id, leaf2.id, root2.id]));
        });
    });
    // --- Persistence ---
    describe('Graph Persistence', () => {
        it('should persist a graph using the MCPClient', async () => {
            // Arrange
            const graphId = manager.createGraph();
            const root = manager.createNode(graphId, { type: GoTNodeType.QUESTION, content: 'Q' });
            const thought = manager.createNode(graphId, { type: GoTNodeType.HYPOTHESIS, content: 'T', parentIds: [root.id] }); // Plausible type
            // Mark nodes as completed for persistence (assuming this is required)
            manager.updateNodeStatus(root.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            manager.updateNodeStatus(thought.id, GoTNodeStatus.COMPLETED_SUCCESS); // Plausible status
            // Act
            const graphCid = await manager.persistGraph(graphId);
            // Assert
            expect(graphCid).toBeDefined();
            expect(typeof graphCid).toBe('string');
            expect(mockMcpClient.isConnectedToServer).toHaveBeenCalled();
            // Expect addNode to be called for each node, plus links, plus graph metadata
            // Exact number depends on persistence implementation details.
            expect(mockMcpClient.addNode).toHaveBeenCalled();
            // Check if graph metadata node was added (last call?)
            const addNodeCalls = mockMcpClient.addNode.mock.calls;
            const lastCallArgs = addNodeCalls[addNodeCalls.length - 1]; // Get last call arguments
            expect(lastCallArgs[0]).toHaveProperty('rootNodeId', root.id);
            expect(lastCallArgs[0]).toHaveProperty('nodeCids'); // Check if node CIDs are included
            expect(lastCallArgs[0].nodeCids).toHaveLength(2);
        });
        it('should throw error if trying to persist with no MCP client connected', async () => {
            // Arrange
            manager.setMCPClient(undefined); // Remove client
            const graphId = manager.createGraph();
            manager.createNode(graphId, { type: GoTNodeType.QUESTION });
            // Act & Assert
            await expect(manager.persistGraph(graphId))
                .rejects.toThrow('MCPClient not set or not connected.');
        });
    });
});
//# sourceMappingURL=got-manager.test.js.map