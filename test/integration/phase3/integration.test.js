/**
 * Integration tests for Phase 3 components - TaskNet Enhancement
 */
// Mock dependencies
jest.mock('../../../src/tasks/manager');
jest.mock('../../../src/ai/agent/agent');
jest.mock('../../../src/tasks/decomposition/index');
jest.mock('../../../src/tasks/synthesis.js');
describe('Phase 3: TaskNet Enhancement Integration', () => {
    describe('Task Decomposition, Scheduling, and Synthesis Workflow', () => {
        let scheduler;
        let got;
        let decomposer;
        let synthesizer;
        let taskManager;
        let agent;
        beforeEach(() => {
            jest.clearAllMocks();
            scheduler = new FibonacciHeapScheduler();
            got = new GraphOfThought();
            agent = {
                processMessage: jest.fn().mockResolvedValue({ content: 'Analysis' })
            };
            decomposer = new TaskDecomposer(agent);
            synthesizer = new TaskSynthesizer();
            taskManager = new TaskManager({});
            // Setup specific mocks
            decomposer.decomposeTask = jest.fn().mockResolvedValue([
                { id: 'subtask-1', title: 'Research', priority: 5 },
                { id: 'subtask-2', title: 'Analysis', priority: 10 },
                { id: 'subtask-3', title: 'Implementation', priority: 15 },
                { id: 'subtask-4', title: 'Testing', priority: 20 }
            ]);
            taskManager.executeTask = jest.fn().mockImplementation(async (taskId) => {
                return { id: taskId, result: `Result for ${taskId}` };
            });
            synthesizer.synthesizeResults = jest.fn().mockImplementation(async (results) => {
                return {
                    id: 'synthesis-result',
                    content: `Synthesized: ${results.map(r => r.result).join(', ')}`
                };
            });
        });
        it('should process a complex task through decomposition, scheduling, execution, and synthesis', async () => {
            // Arrange
            const complexTask = {
                id: 'complex-task',
                title: 'Build Feature X',
                description: 'Create a comprehensive implementation of Feature X'
            };
            // Act
            // 1. Decompose the task
            const subtasks = await decomposer.decomposeTask(complexTask);
            // 2. Add subtasks to Graph of Thought
            subtasks.forEach(task => got.addNode(task.id, task));
            // Define dependencies in the graph
            got.addEdge('subtask-1', 'subtask-2', { type: 'dependency' });
            got.addEdge('subtask-2', 'subtask-3', { type: 'dependency' });
            got.addEdge('subtask-3', 'subtask-4', { type: 'dependency' });
            // 3. Schedule subtasks according to priority
            subtasks.forEach(task => scheduler.insert(task.id, task.priority));
            // 4. Execute subtasks in priority order
            const results = [];
            while (scheduler.size() > 0) {
                const taskId = scheduler.extractMin();
                const result = await taskManager.executeTask(taskId);
                results.push(result);
            }
            // 5. Synthesize results
            const finalResult = await synthesizer.synthesizeResults(results);
            // Assert
            expect(decomposer.decomposeTask).toHaveBeenCalledWith(complexTask);
            expect(subtasks.length).toBe(4);
            expect(got.hasNode('subtask-1')).toBe(true);
            expect(got.hasNode('subtask-2')).toBe(true);
            expect(got.hasNode('subtask-3')).toBe(true);
            expect(got.hasNode('subtask-4')).toBe(true);
            expect(got.hasEdge('subtask-1', 'subtask-2')).toBe(true);
            expect(got.hasEdge('subtask-2', 'subtask-3')).toBe(true);
            expect(got.hasEdge('subtask-3', 'subtask-4')).toBe(true);
            expect(results.length).toBe(4);
            expect(finalResult.content).toBe('Synthesized: Result for subtask-1, Result for subtask-2, Result for subtask-3, Result for subtask-4');
        });
    });
    describe('Merkle Clock Coordination with Task Processing', () => {
        let clock1;
        let clock2;
        let taskManager1;
        let taskManager2;
        beforeEach(() => {
            jest.clearAllMocks();
            // Create clocks for two nodes
            clock1 = new MerkleClock('node-1');
            clock2 = new MerkleClock('node-2');
            // Create task managers with their respective clocks
            taskManager1 = new TaskManager({});
            taskManager2 = new TaskManager({});
            // Attach clocks to task managers (mocked implementation)
            taskManager1.clock = clock1;
            taskManager2.clock = clock2;
            // Mock task execution
            taskManager1.executeTask = jest.fn().mockImplementation(async (taskId) => {
                clock1.tick(); // Advance logical time
                return { id: taskId, result: `Result from node-1 for ${taskId}` };
            });
            taskManager2.executeTask = jest.fn().mockImplementation(async (taskId) => {
                clock2.tick(); // Advance logical time
                return { id: taskId, result: `Result from node-2 for ${taskId}` };
            });
        });
        it('should coordinate tasks execution across nodes using Merkle Clocks', async () => {
            // Arrange
            const task1 = { id: 'task-1', title: 'Task 1' };
            const task2 = { id: 'task-2', title: 'Task 2' };
            // Act
            // 1. Execute tasks on different nodes
            const result1 = await taskManager1.executeTask(task1.id);
            const result2 = await taskManager2.executeTask(task2.id);
            // 2. Synchronize clocks
            const clock1BeforeMerge = clock1.getTime();
            const clock2BeforeMerge = clock2.getTime();
            clock1.merge(clock2);
            clock2.merge(clock1);
            // Assert
            expect(result1.result).toBe(`Result from node-1 for ${task1.id}`);
            expect(result2.result).toBe(`Result from node-2 for ${task2.id}`);
            // Verify time advancement
            expect(clock1BeforeMerge).toBeGreaterThan(0);
            expect(clock2BeforeMerge).toBeGreaterThan(0);
            // Verify clock synchronization
            expect(clock1.getTime()).toBe(clock2.getTime());
            expect(clock1.getTime()).toBeGreaterThanOrEqual(Math.max(clock1BeforeMerge, clock2BeforeMerge));
        });
    });
});
//# sourceMappingURL=integration.test.js.map