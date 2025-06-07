/**
 * Fixed Unit tests for Phase 3 components - TaskNet Enhancement
 */

describe('Phase 3: TaskNet Enhancement Components', () => {
    describe('Fibonacci Heap Scheduler', () => {
        let scheduler;
        beforeEach(() => {
            scheduler = new FibonacciHeapScheduler();
        });
        
        it('should insert tasks with priorities', () => {
            // Act
            scheduler.insert('task1', 10);
            scheduler.insert('task2', 5);
            scheduler.insert('task3', 20);
            // Assert
            expect(scheduler.size()).toBe(3);
        });
        
        it('should extract tasks in priority order', () => {
            // Arrange
            scheduler.insert('task1', 10);
            scheduler.insert('task2', 5); // Highest priority (lowest value)
            scheduler.insert('task3', 20);
            // Act & Assert
            expect(scheduler.extractMin()).toBe('task2');
            expect(scheduler.extractMin()).toBe('task1');
            expect(scheduler.extractMin()).toBe('task3');
            expect(scheduler.size()).toBe(0);
        });
        
        it('should decrease key and adjust priority', () => {
            // Arrange
            scheduler.insert('task1', 10);
            scheduler.insert('task2', 20);
            scheduler.insert('task3', 30);
            // Act
            scheduler.decreaseKey('task3', 5); // Now highest priority
            // Assert
            expect(scheduler.extractMin()).toBe('task3');
        });
    });
    
    describe('Graph of Thought', () => {
        let got;
        beforeEach(() => {
            got = new GraphOfThought();
        });
        
        it('should add nodes to the graph', () => {
            // Act
            got.addNode('node1', { value: 'Node 1 data' });
            got.addNode('node2', { value: 'Node 2 data' });
            // Assert
            expect(got.hasNode('node1')).toBe(true);
            expect(got.hasNode('node2')).toBe(true);
        });
        
        it('should connect nodes with edges', () => {
            // Arrange
            got.addNode('node1', { value: 'Node 1 data' });
            got.addNode('node2', { value: 'Node 2 data' });
            // Act
            got.addEdge('node1', 'node2', { type: 'dependency' });
            // Assert
            expect(got.hasEdge('node1', 'node2')).toBe(true);
        });
        
        it('should traverse the graph', () => {
            // Arrange
            got.addNode('start', { value: 'Start node' });
            got.addNode('middle', { value: 'Middle node' });
            got.addNode('end', { value: 'End node' });
            got.addEdge('start', 'middle', { type: 'next' });
            got.addEdge('middle', 'end', { type: 'next' });
            // Act
            const traversal = got.traverse('start');
            // Assert
            expect(traversal).toEqual([
                { id: 'start', value: { value: 'Start node' } },
                { id: 'middle', value: { value: 'Middle node' } },
                { id: 'end', value: { value: 'End node' } }
            ]);
        });
    });
    
    describe('Merkle Clock Coordination', () => {
        let merkleClock;
        beforeEach(() => {
            merkleClock = new MerkleClock('node-1');
        });
        
        it('should initialize with a node ID', () => {
            // Assert
            expect(merkleClock.getNodeId()).toBe('node-1');
        });
        
        it('should increment logical time', () => {
            // Arrange
            const initialTime = merkleClock.getTime();
            // Act
            merkleClock.tick();
            // Assert
            expect(merkleClock.getTime()).toBe(initialTime + 1);
        });
        
        it('should merge with another clock', () => {
            // Arrange
            const clock2 = new MerkleClock('node-2');
            // Advance clock2 further than the main clock
            clock2.tick();
            clock2.tick();
            clock2.tick();
            // Act
            merkleClock.merge(clock2);
            // Assert
            expect(merkleClock.getTime()).toBeGreaterThanOrEqual(clock2.getTime());
        });
        
        it('should generate a hash representation', () => {
            // Act
            const hash = merkleClock.getHash();
            // Assert
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });
    });
});
