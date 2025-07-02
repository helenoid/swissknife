describe('TaskManager', () => {
    let taskManager;
    let workerPool;
    let modelRegistry;
    beforeEach(() => {
        WorkerPool.instance = null;
        workerPool = WorkerPool.getInstance();
        ModelRegistry.instance = null;
        modelRegistry = ModelRegistry.getInstance();
        taskManager = new TaskManager(workerPool, modelRegistry);
    });
    it('should create a task successfully', async () => {
        // Arrange
        const description = 'Test task';
        const priority = 5;
        // Act
        const taskId = await taskManager.createTask(description, priority);
        // Assert
        expect(taskId).toBeDefined();
        const task = taskManager.getTask(taskId);
        expect(task).toBeDefined();
        expect(task.description).toBe(description);
        expect(task.priority).toBe(priority);
    });
    // Additional tests...
});
//# sourceMappingURL=manager.test.js.map