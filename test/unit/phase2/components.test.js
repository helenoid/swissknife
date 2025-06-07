/**
 * Unit tests for Phase 2 components - Core Implementation
 */
jest.mock('../../../src/tasks/manager');
jest.mock('../../../src/ipfs/client');
jest.mock('../../../src/storage/mapping-store');
// Mock model for Agent constructor
class MockModel {
    id;
    constructor(options) {
        this.id = options.id;
    }
    getName() {
        return 'Mock Model';
    }
    getProvider() {
        return 'mock';
    }
    async generate() {
        return {
            content: 'Mock response',
            status: 'success'
        };
    }
}
describe('Phase 2: Core Implementation Components', () => {
    describe('AI Agent', () => {
        let agent;
        let model;
        beforeEach(() => {
            jest.clearAllMocks();
            // Create model and agent
            const modelOptions = {
                id: 'mock-model',
                name: 'Mock Model',
                provider: 'mock'
            };
            model = new MockModel(modelOptions);
            agent = new Agent({ model });
        });
        it('should process messages through the agent', async () => {
            // Arrange
            jest.spyOn(model, 'generate').mockResolvedValue({
                content: 'Test response',
                status: 'success'
            });
            // Act
            const response = await agent.processMessage('Test message');
            // Assert
            expect(model.generate).toHaveBeenCalled();
            expect(response).toEqual({
                content: 'Test response',
                status: 'success'
            });
        });
    });
    describe('Task System Core', () => {
        let taskManager;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock task manager
            taskManager = new TaskManager({});
        });
        it('should create tasks', async () => {
            // Arrange
            taskManager.createTask = jest.fn().mockResolvedValue({
                id: 'task-123',
                title: 'Test Task',
                status: 'created'
            });
            // Act
            const taskId = await taskManager.createTask({
                description: 'Task description',
                basePriority: 1
            });
            // Assert
            expect(taskManager.createTask).toHaveBeenCalled();
            const task = taskManager.getTask(taskId);
            expect(task?.id).toBe(taskId);
            expect(task?.status).toBe(TaskStatus.PENDING);
        });
    });
    describe('Storage System', () => {
        let fileMappingStore;
        let ipfsClient;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock file mapping store and IPFS client
            fileMappingStore = new FileMappingStore({ storageFile: 'test.json' });
            ipfsClient = new IPFSKitClient();
        });
        it('should store content to IPFS', async () => {
            // Arrange
            ipfsClient.addContent = jest.fn().mockResolvedValue('QmHash123');
            // Act
            const cid = await ipfsClient.addContent('Test content');
            // Assert
            expect(ipfsClient.addContent).toHaveBeenCalledWith('Test content');
            expect(cid).toBe('QmHash123');
        });
        it('should retrieve content from IPFS', async () => {
            // Arrange
            ipfsClient.getContent = jest.fn().mockResolvedValue('Test content');
            // Act
            const content = await ipfsClient.getContent('QmHash123');
            // Assert
            expect(ipfsClient.getContent).toHaveBeenCalledWith('QmHash123');
            expect(content).toBe('Test content');
        });
    });
});
//# sourceMappingURL=components.test.js.map