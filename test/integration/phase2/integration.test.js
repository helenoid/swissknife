/**
 * Integration tests for Phase 2 components
 */
// Mock dependencies
jest.mock('../../../src/tasks/manager');
jest.mock('../../../src/ipfs/client.js');
jest.mock('../../../src/storage/mapping-store.js');
jest.mock('../../../src/storage/manager.js');
jest.mock('../../../src/ai/models/model');
describe('Phase 2: Integration Tests', () => {
    describe('Agent and Task Integration', () => {
        let agent;
        let taskManager;
        let model;
        let configManager;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock config and model
            configManager = {};
            model = {
                id: 'mock-model',
                getName: jest.fn().mockReturnValue('Mock Model'),
                getProvider: jest.fn().mockReturnValue('mock'),
                generate: jest.fn().mockResolvedValue({
                    content: 'Task analysis: This should be broken into subtasks.',
                    status: 'success'
                })
            };
            // Create agent and mock task manager
            agent = new Agent({ model });
            taskManager = new TaskManager(configManager);
            taskManager.createTask = jest.fn().mockResolvedValue({
                id: 'task-123',
                title: 'Analyzed Task',
                status: 'created',
                description: 'Task analysis: This should be broken into subtasks.'
            });
        });
        it('should use agent to analyze task content and create task', async () => {
            // Arrange
            const message = 'Analyze this complex problem';
            const createTaskSpy = jest.spyOn(taskManager, 'createTask');
            // Act
            // 1. Process message with agent
            const analysis = await agent.processMessage(message);
            // 2. Create task with analysis
            const task = await taskManager.createTask({
                title: 'Analyzed Task',
                description: analysis.content
            });
            // Assert
            expect(model.generate).toHaveBeenCalled();
            expect(createTaskSpy).toHaveBeenCalledWith({
                title: 'Analyzed Task',
                description: 'Task analysis: This should be broken into subtasks.'
            });
            expect(task.id).toBe('task-123');
            expect(task.description).toContain('Task analysis');
        });
    });
    describe('Storage and IPFS Integration', () => {
        let ipfsClient;
        let storageManager;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock IPFS client and storage manager
            ipfsClient = new IPFSKitClient();
            storageManager = new StorageManager({
                ipfs: ipfsClient
            });
            // Setup mock methods
            ipfsClient.addContent = jest.fn().mockResolvedValue('QmHash123');
            ipfsClient.getContent = jest.fn().mockResolvedValue('Retrieved content');
            storageManager.storeFile = jest.fn().mockResolvedValue({
                path: '/ipfs/QmHash123',
                cid: 'QmHash123'
            });
            storageManager.retrieveFile = jest.fn().mockResolvedValue({
                content: 'Retrieved content',
                path: '/ipfs/QmHash123'
            });
        });
        it('should store and retrieve content via storage manager and IPFS', async () => {
            // Arrange
            const content = 'Test content';
            const path = '/test/file.txt';
            // Act
            // 1. Store content using storage manager (which uses IPFS client)
            const stored = await storageManager.storeFile(path, content);
            // 2. Retrieve content using CID
            const retrieved = await storageManager.retrieveFile(stored.path);
            // Assert
            expect(storageManager.storeFile).toHaveBeenCalledWith(path, content);
            expect(storageManager.retrieveFile).toHaveBeenCalledWith('/ipfs/QmHash123');
            expect(retrieved.content).toBe('Retrieved content');
        });
    });
});
//# sourceMappingURL=integration.test.js.map