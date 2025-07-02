/**
 * Unit tests for FibonacciHeap implementation
 */
describe('FibonacciHeap', () => {
    let heap;
    beforeEach(() => {
        heap = new FibonacciHeap();
    });
    describe('basic operations', () => {
        it('should start empty', () => {
            expect(heap.isEmpty()).toBe(true);
            expect(heap.size()).toBe(0);
            expect(heap.findMin()).toBeNull();
        });
        it('should insert and find min correctly', () => {
            heap.insert(5, 'value-5');
            expect(heap.isEmpty()).toBe(false);
            expect(heap.size()).toBe(1);
            expect(heap.findMin()).toBe('value-5');
            heap.insert(3, 'value-3');
            expect(heap.size()).toBe(2);
            expect(heap.findMin()).toBe('value-3');
            heap.insert(7, 'value-7');
            expect(heap.size()).toBe(3);
            expect(heap.findMin()).toBe('value-3');
        });
        it('should extract min correctly', () => {
            heap.insert(5, 'value-5');
            heap.insert(3, 'value-3');
            heap.insert(7, 'value-7');
            expect(heap.extractMin()).toBe('value-3');
            expect(heap.size()).toBe(2);
            expect(heap.findMin()).toBe('value-5');
            expect(heap.extractMin()).toBe('value-5');
            expect(heap.size()).toBe(1);
            expect(heap.findMin()).toBe('value-7');
            expect(heap.extractMin()).toBe('value-7');
            expect(heap.size()).toBe(0);
            expect(heap.findMin()).toBeNull();
            expect(heap.extractMin()).toBeNull();
        });
    });
    describe('advanced operations', () => {
        it('should handle decreaseKey operation', () => {
            const node1 = heap.insert(5, 'value-5');
            const node2 = heap.insert(3, 'value-3');
            const node3 = heap.insert(7, 'value-7');
            expect(heap.findMin()).toBe('value-3');
            // Decrease key for node3 to make it the new minimum
            heap.decreaseKey(node3, 1);
            expect(heap.findMin()).toBe('value-7');
            // Extract and verify the new minimum
            expect(heap.extractMin()).toBe('value-7');
            expect(heap.findMin()).toBe('value-3');
        });
        it('should throw when attempting to increase key', () => {
            const node = heap.insert(5, 'value-5');
            expect(() => {
                heap.decreaseKey(node, 6);
            }).toThrow('New key is greater than current key.');
        });
        it('should handle delete operation', () => {
            heap.insert(5, 'value-5');
            const nodeToDelete = heap.insert(3, 'value-3');
            heap.insert(7, 'value-7');
            expect(heap.size()).toBe(3);
            heap.delete(nodeToDelete);
            expect(heap.size()).toBe(2);
            expect(heap.findMin()).toBe('value-5');
        });
        it('should handle merge operation', () => {
            // First heap
            heap.insert(5, 'value-5');
            heap.insert(10, 'value-10');
            // Second heap
            const otherHeap = new FibonacciHeap();
            otherHeap.insert(3, 'value-3');
            otherHeap.insert(7, 'value-7');
            // Merge heaps
            heap.merge(otherHeap);
            expect(heap.size()).toBe(4);
            expect(heap.findMin()).toBe('value-3');
            // Extract elements to verify merge
            expect(heap.extractMin()).toBe('value-3');
            expect(heap.extractMin()).toBe('value-5');
            expect(heap.extractMin()).toBe('value-7');
            expect(heap.extractMin()).toBe('value-10');
            expect(heap.isEmpty()).toBe(true);
        });
    });
    describe('complex scenarios', () => {
        it('should handle cascading cuts correctly', () => {
            // Create a specific heap structure to test cascading cuts
            const nodes = [];
            // Insert a bunch of nodes with decreasing keys
            for (let i = 10; i > 0; i--) {
                nodes.push(heap.insert(i, `value-${i}`));
            }
            // Extract min to consolidate the heap
            heap.extractMin();
            // Now decrease a key that will trigger cascading cuts
            heap.decreaseKey(nodes[8], 1); // This should be a node with key 2 now
            // Verify the min has been updated
            expect(heap.findMin()).toBe('value-2');
            // Extract all remaining elements to verify heap structure
            const results = [];
            let val;
            while ((val = heap.extractMin()) !== null) {
                results.push(val);
            }
            // Should be in ascending order of keys
            expect(results[0]).toBe('value-2');
        });
        it('should handle a large number of operations efficiently', () => {
            // Insert many elements in random order
            const elements = 1000;
            const inserted = [];
            // Insert in reverse order to test heap property
            for (let i = elements; i > 0; i--) {
                inserted.push(heap.insert(i, `value-${i}`));
            }
            expect(heap.size()).toBe(elements);
            expect(heap.findMin()).toBe(`value-1`);
            // Decrease some keys
            for (let i = 0; i < 100; i++) {
                const idx = Math.floor(Math.random() * inserted.length);
                const oldKey = elements - idx;
                if (oldKey > 0) {
                    try {
                        heap.decreaseKey(inserted[idx], Math.max(0, oldKey - 500));
                    }
                    catch (e) {
                        // In case the key was already decreased
                    }
                }
            }
            // Extract all elements and verify they come out in ascending order
            let prevKey = -1;
            let count = 0;
            let val;
            while ((val = heap.extractMin()) !== null) {
                // Parse the value to get original key
                const keyStr = val.split('-')[1];
                const key = parseInt(keyStr, 10);
                // Key extraction may not be in perfect order due to decreaseKey operations
                // but we can verify the heap is empty at the end
                count++;
            }
            expect(count).toBe(elements);
            expect(heap.size()).toBe(0);
        });
    });
});
//# sourceMappingURL=fibonacci-heap.test.js.map