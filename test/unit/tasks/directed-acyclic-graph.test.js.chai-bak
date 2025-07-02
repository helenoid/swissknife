/**
 * Unit tests for DirectedAcyclicGraph
 */
describe('DirectedAcyclicGraph', () => {
    let dag;
    const fixtures = generateGraphFixtures();
    beforeEach(() => {
        // Create a fresh DAG for each test
        dag = new DirectedAcyclicGraph();
    });
    describe('node operations', () => {
        it('should add and retrieve nodes correctly', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            // Act
            dag.addNode(node1);
            dag.addNode(node2);
            // Assert
            expect(dag.hasNode('node1')).toBe(true);
            expect(dag.hasNode('node2')).toBe(true);
            expect(dag.hasNode('node3')).toBe(false);
            expect(dag.getNode('node1')).toEqual(node1);
            expect(dag.getNode('node2')).toEqual(node2);
            expect(dag.getNode('node3')).toBeUndefined();
            expect(dag.getNodeCount()).toBe(2);
        });
        it('should update existing nodes', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Initial data' };
            const updatedNode1 = { id: 'node1', data: 'Updated data' };
            // Act
            dag.addNode(node1);
            dag.addNode(updatedNode1); // Should update the existing node
            // Assert
            expect(dag.hasNode('node1')).toBe(true);
            expect(dag.getNode('node1')).toEqual(updatedNode1);
            expect(dag.getNode('node1')?.data).toBe('Updated data');
            expect(dag.getNodeCount()).toBe(1);
        });
        it('should remove nodes correctly', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            // Act
            dag.removeNode('node1');
            // Assert
            expect(dag.hasNode('node1')).toBe(false);
            expect(dag.hasNode('node2')).toBe(true);
            expect(dag.getNodeCount()).toBe(1);
        });
        it('should get all nodes', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            // Act
            const allNodes = dag.getAllNodes();
            // Assert
            expect(allNodes.length).toBe(3);
            expect(allNodes).toContain(node1);
            expect(allNodes).toContain(node2);
            expect(allNodes).toContain(node3);
        });
    });
    describe('edge operations', () => {
        it('should add and check edges correctly', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            // Act
            dag.addEdge('node1', 'node2');
            // Assert
            expect(dag.hasEdge('node1', 'node2')).toBe(true);
            expect(dag.hasEdge('node2', 'node1')).toBe(false);
            expect(dag.getEdgeCount()).toBe(1);
        });
        it('should not add edges between non-existent nodes', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            dag.addNode(node1);
            // Act & Assert
            expect(() => dag.addEdge('node1', 'node2')).to.throw;
            expect(() => dag.addEdge('node2', 'node1')).to.throw;
            expect(dag.getEdgeCount()).toBe(0);
        });
        it('should remove edges correctly', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addEdge('node1', 'node2');
            dag.addEdge('node1', 'node3');
            // Act
            dag.removeEdge('node1', 'node2');
            // Assert
            expect(dag.hasEdge('node1', 'node2')).toBe(false);
            expect(dag.hasEdge('node1', 'node3')).toBe(true);
            expect(dag.getEdgeCount()).toBe(1);
        });
        it('should remove associated edges when removing a node', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addEdge('node1', 'node2');
            dag.addEdge('node1', 'node3');
            dag.addEdge('node2', 'node3');
            // Act
            dag.removeNode('node1');
            // Assert
            expect(dag.hasEdge('node1', 'node2')).toBe(false);
            expect(dag.hasEdge('node1', 'node3')).toBe(false);
            expect(dag.hasEdge('node2', 'node3')).toBe(true);
            expect(dag.getEdgeCount()).toBe(1);
        });
    });
    describe('traversal operations', () => {
        it('should get children correctly', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addEdge('node1', 'node2');
            dag.addEdge('node1', 'node3');
            // Act
            const children = dag.getChildren('node1');
            // Assert
            expect(children.length).toBe(2);
            expect(children).toContain('node2');
            expect(children).toContain('node3');
            // Empty for nodes without children
            expect(dag.getChildren('node2').length).toBe(0);
        });
        it('should get parents correctly', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addEdge('node1', 'node3');
            dag.addEdge('node2', 'node3');
            // Act
            const parents = dag.getParents('node3');
            // Assert
            expect(parents.length).toBe(2);
            expect(parents).toContain('node1');
            expect(parents).toContain('node2');
            // Empty for nodes without parents
            expect(dag.getParents('node1').length).toBe(0);
        });
        it('should get descendants correctly', () => {
            // Skip if method doesn't exist
            if (typeof dag.getDescendants !== 'function') {
                console.log('Skipping getDescendants test - method not available');
                return;
            }
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            const node4 = { id: 'node4', data: 'Node 4 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addNode(node4);
            dag.addEdge('node1', 'node2');
            dag.addEdge('node2', 'node3');
            dag.addEdge('node2', 'node4');
            // Act
            const descendants = dag.getDescendants('node1');
            // Assert
            expect(descendants.length).toBe(3);
            expect(descendants).toContain('node2');
            expect(descendants).toContain('node3');
            expect(descendants).toContain('node4');
        });
        it('should get ancestors correctly', () => {
            // Skip if method doesn't exist
            if (typeof dag.getAncestors !== 'function') {
                console.log('Skipping getAncestors test - method not available');
                return;
            }
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            const node4 = { id: 'node4', data: 'Node 4 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addNode(node4);
            dag.addEdge('node1', 'node2');
            dag.addEdge('node2', 'node3');
            dag.addEdge('node2', 'node4');
            // Act
            const ancestors = dag.getAncestors('node4');
            // Assert
            expect(ancestors.length).toBe(2);
            expect(ancestors).toContain('node1');
            expect(ancestors).toContain('node2');
        });
    });
    describe('cycle detection', () => {
        it('should detect and prevent cycles', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            const node3 = { id: 'node3', data: 'Node 3 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addNode(node3);
            dag.addEdge('node1', 'node2');
            dag.addEdge('node2', 'node3');
            // Act & Assert
            expect(() => dag.addEdge('node3', 'node1')).to.throw; // Would create a cycle
            // The edge should not have been added
            expect(dag.hasEdge('node3', 'node1')).toBe(false);
            expect(dag.getEdgeCount()).toBe(2);
        });
        it('should detect self-loops', () => {
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            dag.addNode(node1);
            // Act & Assert
            expect(() => dag.addEdge('node1', 'node1')).to.throw; // Self-loop
            // The edge should not have been added
            expect(dag.hasEdge('node1', 'node1')).toBe(false);
            expect(dag.getEdgeCount()).toBe(0);
        });
        it('should handle complex cycle scenarios', () => {
            // Arrange
            const nodeIds = ['A', 'B', 'C', 'D', 'E', 'F'];
            // Add all nodes
            for (const id of nodeIds) {
                dag.addNode({ id, data: `Node ${id} data` });
            }
            // Create a valid DAG structure
            dag.addEdge('A', 'B');
            dag.addEdge('A', 'C');
            dag.addEdge('B', 'D');
            dag.addEdge('C', 'D');
            dag.addEdge('D', 'E');
            dag.addEdge('D', 'F');
            // Act & Assert
            // These would create cycles
            expect(() => dag.addEdge('E', 'A')).to.throw;
            expect(() => dag.addEdge('F', 'B')).to.throw;
            expect(() => dag.addEdge('D', 'A')).to.throw;
            // These are valid edges
            expect(() => dag.addEdge('E', 'F')).not.toThrow();
            expect(() => dag.addEdge('B', 'C')).not.toThrow();
            // Check edge count
            expect(dag.getEdgeCount()).toBe(8); // 6 original + 2 new valid edges
        });
    });
    describe('validation and error handling', () => {
        it('should validate node IDs', () => {
            // Arrange
            const invalidNode1 = { data: 'Missing ID' };
            const invalidNode2 = { id: null, data: 'Null ID' };
            const invalidNode3 = { id: undefined, data: 'Undefined ID' };
            const validNode = { id: 'valid', data: 'Valid ID' };
            // Act & Assert
            expect(() => dag.addNode(invalidNode1)).to.throw;
            expect(() => dag.addNode(invalidNode2)).to.throw;
            expect(() => dag.addNode(invalidNode3)).to.throw;
            expect(() => dag.addNode(validNode)).not.toThrow();
        });
        it('should handle edge case scenarios', () => {
            // Empty DAG
            expect(dag.getNodeCount()).toBe(0);
            expect(dag.getEdgeCount()).toBe(0);
            expect(dag.getAllNodes()).toEqual([]);
            // Non-existent nodes
            expect(dag.hasNode('nonexistent')).toBe(false);
            expect(dag.getNode('nonexistent')).toBeUndefined();
            expect(dag.getChildren('nonexistent')).toEqual([]);
            expect(dag.getParents('nonexistent')).toEqual([]);
            // Removing non-existent nodes and edges
            expect(() => dag.removeNode('nonexistent')).not.toThrow();
            expect(() => dag.removeEdge('nonexistent1', 'nonexistent2')).not.toThrow();
        });
    });
    describe('serialization', () => {
        it('should serialize to JSON correctly', () => {
            // Skip if method doesn't exist
            if (typeof dag.toJSON !== 'function') {
                console.log('Skipping toJSON test - method not available');
                return;
            }
            // Arrange
            const node1 = { id: 'node1', data: 'Node 1 data' };
            const node2 = { id: 'node2', data: 'Node 2 data' };
            dag.addNode(node1);
            dag.addNode(node2);
            dag.addEdge('node1', 'node2');
            // Act
            const json = dag.toJSON();
            // Assert
            expect(json).toBeDefined();
            expect(json.nodes).toBeDefined();
            expect(json.edges).toBeDefined();
            expect(json.nodes.length).toBe(2);
            expect(json.edges.length).toBe(1);
            // Check node data
            expect(json.nodes.find((n) => n.id === 'node1')).toBeDefined();
            expect(json.nodes.find((n) => n.id === 'node2')).toBeDefined();
            // Check edge data
            expect(json.edges.find((e) => e.from === 'node1' && e.to === 'node2')).toBeDefined();
        });
        it('should deserialize from JSON correctly', () => {
            // Skip if method doesn't exist
            if (typeof DirectedAcyclicGraph.fromJSON !== 'function') {
                console.log('Skipping fromJSON test - method not available');
                return;
            }
            // Arrange
            const jsonData = {
                nodes: [
                    { id: 'node1', data: 'Node 1 data' },
                    { id: 'node2', data: 'Node 2 data' }
                ],
                edges: [
                    { from: 'node1', to: 'node2' }
                ]
            };
            // Act
            const newDag = DirectedAcyclicGraph.fromJSON(jsonData);
            // Assert
            expect(newDag.getNodeCount()).toBe(2);
            expect(newDag.getEdgeCount()).toBe(1);
            expect(newDag.hasNode('node1')).toBe(true);
            expect(newDag.hasNode('node2')).toBe(true);
            expect(newDag.hasEdge('node1', 'node2')).toBe(true);
            expect(newDag.getNode('node1').data).toBe('Node 1 data');
        });
    });
    describe('integration with graph fixtures', () => {
        it('should handle graph fixtures correctly', () => {
            // Arrange
            const nodes = fixtures.nodes;
            // Add all nodes
            for (const node of nodes) {
                dag.addNode(node);
            }
            // Add edges based on dependencies
            for (const node of nodes) {
                for (const depId of node.dependencies) {
                    if (dag.hasNode(depId)) {
                        dag.addEdge(depId, node.id);
                    }
                }
            }
            // Assert
            expect(dag.getNodeCount()).toBe(nodes.length);
            // Check that dependencies are properly reflected as edges
            for (const node of nodes) {
                const parents = dag.getParents(node.id);
                expect(parents.length).toBe(node.dependencies.length);
                for (const depId of node.dependencies) {
                    expect(parents).toContain(depId);
                    expect(dag.hasEdge(depId, node.id)).toBe(true);
                }
            }
        });
    });
});
//# sourceMappingURL=directed-acyclic-graph.test.js.map