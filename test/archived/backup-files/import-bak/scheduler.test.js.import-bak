// Mock logger and dependencies
jest.mock('@/utils/logger.js', () => ({
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// Mock the internal FibonacciHeap class used by the scheduler
const mockInsert = jest.fn();
const mockExtractMin = jest.fn();
const mockIsEmpty = jest.fn().mockReturnValue(true); // Start empty
const mockDecreaseKey = jest.fn();
// Mock DAG
const mockGetNode = jest.fn();
// Create a simplified mock object
const mockDAG = {
    getNode: mockGetNode,
    // Add other methods only if strictly needed by tested code paths
    getSuccessors: jest.fn().mockReturnValue(new Set()),
    getPredecessors: jest.fn().mockReturnValue(new Set()),
};
import { FibonacciHeapScheduler } from '@/tasks/scheduler/fibonacci-heap-scheduler.js';
import { TaskStatus, ThoughtNodeType } from '@/types/task.js';
// Helper function to create a mock GoTNode
const createMockNode = (id, priority, dependencies = [], status = TaskStatus.PENDING) => ({
    id,
    content: `Node ${id}`,
    type: ThoughtNodeType.ANALYSIS,
    dependencies,
    priority,
    status,
    metadata: { createdAt: Date.now() },
    storage: {},
});
describe('FibonacciHeapScheduler', () => {
    let scheduler;
    let mockStorage;
    let mockInternalHeap;
    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage = new MockStorageProvider();
        mockGetNode.mockClear();
        mockIsEmpty.mockReturnValue(true);
        mockExtractMin.mockReturnValue(null);
        // Pass the simplified mock DAG, casting to 'any' to bypass strict type check
        scheduler = new FibonacciHeapScheduler({ storage: mockStorage, dag: mockDAG });
        mockInternalHeap = scheduler.heap;
        jest.spyOn(mockInternalHeap, 'insert').mockImplementation(mockInsert);
        jest.spyOn(mockInternalHeap, 'extractMin').mockImplementation(mockExtractMin);
        jest.spyOn(mockInternalHeap, 'isEmpty').mockImplementation(mockIsEmpty);
        jest.spyOn(mockInternalHeap, 'decreaseKey').mockImplementation(mockDecreaseKey);
    });
    it('should initialize correctly', () => {
        expect(scheduler).toBeInstanceOf(FibonacciHeapScheduler);
        expect(mockInternalHeap).toBeDefined();
    });
    it('should add a task with no dependencies to the heap', () => {
        const node = createMockNode('node1', 5);
        mockGetNode.mockReturnValue(undefined);
        scheduler.addTask(node);
        expect(mockInternalHeap.insert).toHaveBeenCalledTimes(1);
        expect(mockInternalHeap.insert).toHaveBeenCalledWith(expect.objectContaining({ data: node, priority: 5 }));
        expect(node.status).toBe(TaskStatus.SCHEDULED);
        expect(scheduler.pendingNodes.has('node1')).toBe(false);
    });
    it('should mark a task as PENDING if dependencies are not met', () => {
        const depNode = createMockNode('dep1', 1, [], TaskStatus.PENDING);
        const node = createMockNode('node2', 5, ['dep1']);
        mockGetNode.mockImplementation((id) => (id === 'dep1' ? depNode : undefined));
        scheduler.addTask(node);
        expect(mockInternalHeap.insert).not.toHaveBeenCalled();
        expect(node.status).toBe(TaskStatus.PENDING);
        expect(scheduler.pendingNodes.has('node2')).toBe(true);
    });
    it('should add a task if dependencies are met (COMPLETED)', () => {
        const depNode = createMockNode('dep1', 1, [], TaskStatus.COMPLETED);
        const node = createMockNode('node2', 5, ['dep1']);
        mockGetNode.mockImplementation((id) => (id === 'dep1' ? depNode : undefined));
        scheduler.addTask(node);
        expect(mockInternalHeap.insert).toHaveBeenCalledTimes(1);
        expect(mockInternalHeap.insert).toHaveBeenCalledWith(expect.objectContaining({ data: node, priority: 5 }));
        expect(node.status).toBe(TaskStatus.SCHEDULED);
        expect(scheduler.pendingNodes.has('node2')).toBe(false);
    });
    it('should not add a task that is already tracked', () => {
        const node = createMockNode('node1', 5);
        scheduler.nodeMap.set('node1', { data: node, priority: 5 });
        scheduler.addTask(node);
        expect(mockInternalHeap.insert).not.toHaveBeenCalled();
    });
    it('should get the next task from the heap', async () => {
        const node1 = createMockNode('node1', 5);
        const node2 = createMockNode('node2', 3);
        const mockHeapNode2 = { data: node2, priority: 3 };
        mockIsEmpty.mockReturnValue(false);
        mockExtractMin.mockReturnValueOnce(mockHeapNode2);
        const nextTask = await scheduler.getNextTask();
        expect(nextTask).toBe(node2);
        expect(node2.status).toBe(TaskStatus.PROCESSING);
        expect(mockInternalHeap.extractMin).toHaveBeenCalledTimes(1);
        expect(scheduler.nodeMap.has('node2')).toBe(false);
    });
    it('should return null if the heap is empty', async () => {
        mockIsEmpty.mockReturnValue(true);
        const nextTask = await scheduler.getNextTask();
        expect(nextTask).toBeNull();
        expect(mockInternalHeap.extractMin).not.toHaveBeenCalled();
    });
    it('should call decreaseKey when updating priority lower', () => {
        const node = createMockNode('node1', 10);
        const heapNodeRef = { data: node, priority: 10 };
        scheduler.nodeMap.set('node1', heapNodeRef);
        scheduler.updatePriority('node1', 5);
        expect(mockInternalHeap.decreaseKey).toHaveBeenCalledTimes(1);
        expect(mockInternalHeap.decreaseKey).toHaveBeenCalledWith(heapNodeRef, 5);
    });
    it('should warn when trying to increase priority (not implemented)', () => {
        const node = createMockNode('node1', 5);
        const heapNodeRef = { data: node, priority: 5 };
        scheduler.nodeMap.set('node1', heapNodeRef);
        scheduler.updatePriority('node1', 10);
        expect(mockInternalHeap.decreaseKey).not.toHaveBeenCalled();
    });
    it('should not call decreaseKey if priority is not lower', () => {
        const node = createMockNode('node1', 5);
        const heapNodeRef = { data: node, priority: 5 };
        scheduler.nodeMap.set('node1', heapNodeRef);
        scheduler.updatePriority('node1', 5);
        expect(mockInternalHeap.decreaseKey).not.toHaveBeenCalled();
    });
    // --- reschedulePending Tests ---
    it('should re-add pending node when dependencies become met', () => {
        const depNode = createMockNode('dep1', 1, [], TaskStatus.PENDING);
        const node = createMockNode('node2', 5, ['dep1']);
        mockGetNode.mockImplementation((id) => {
            if (id === 'dep1')
                return depNode;
            if (id === 'node2')
                return node;
            return undefined;
        });
        scheduler.addTask(node);
        expect(scheduler.pendingNodes.has('node2')).toBe(true);
        expect(mockInternalHeap.insert).not.toHaveBeenCalled();
        depNode.status = TaskStatus.COMPLETED;
        scheduler.reschedulePending();
        expect(mockInternalHeap.insert).toHaveBeenCalledTimes(1);
        expect(mockInternalHeap.insert).toHaveBeenCalledWith(expect.objectContaining({ data: node }));
        expect(node.status).toBe(TaskStatus.SCHEDULED);
        expect(scheduler.pendingNodes.has('node2')).toBe(false);
    });
    it('should not re-add pending node if dependencies are still not met', () => {
        const depNode = createMockNode('dep1', 1, [], TaskStatus.PENDING);
        const node = createMockNode('node2', 5, ['dep1']);
        mockGetNode.mockImplementation((id) => (id === 'dep1' ? depNode : (id === 'node2' ? node : undefined)));
        scheduler.addTask(node);
        expect(scheduler.pendingNodes.has('node2')).toBe(true);
        mockInternalHeap.insert.mockClear();
        scheduler.reschedulePending();
        expect(mockInternalHeap.insert).not.toHaveBeenCalled();
        expect(node.status).toBe(TaskStatus.PENDING);
        expect(scheduler.pendingNodes.has('node2')).toBe(true);
    });
    it('should remove node from pending if it no longer exists in DAG', () => {
        const node = createMockNode('node2', 5, ['dep1']);
        scheduler.pendingNodes.add('node2');
        mockGetNode.mockReturnValue(undefined);
        scheduler.reschedulePending();
        expect(scheduler.pendingNodes.has('node2')).toBe(false);
        expect(mockInternalHeap.insert).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=scheduler.test.js.map