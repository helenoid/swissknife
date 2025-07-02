/**
 * Unit tests for PerformanceOptimizer
 */
// Mock dependencies
jest.mock('../../../../src/tasks/manager.ts', () => ({
    TaskManager: jest.fn().mockImplementation(() => ({
        listTasks: jest.fn().mockResolvedValue([])
    }))
}));
jest.mock('../../../../src/ipfs/client.ts', () => ({
    IPFSKitClient: jest.fn().mockImplementation(() => ({
        getContent: jest.fn().mockResolvedValue('test content')
    }))
}));
jest.mock('../../../../src/ai/agent/agent.ts', () => ({
    Agent: jest.fn().mockImplementation(() => ({
        processMessage: jest.fn().mockResolvedValue({ content: 'response' })
    }))
}));
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
describe('PerformanceOptimizer', () => {
    let optimizer;
    let taskManager;
    let ipfsClient;
    let agent;
    let model;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Create mocked instances
        const configManager = {
            get: jest.fn()
        };
        taskManager = {
            listTasks: jest.fn().mockResolvedValue([])
        };
        ipfsClient = {
            getContent: jest.fn().mockResolvedValue('test content')
        };
        // Create model and agent
        const modelOptions = {
            id: 'mock-model',
            name: 'Mock Model',
            provider: 'mock'
        };
        model = new MockModel(modelOptions);
        agent = new Agent({ model });
        // Create optimizer instance
        optimizer = new PerformanceOptimizer(taskManager, ipfsClient, agent);
        // Mock performance.now() for consistent timing
        jest.spyOn(performance, 'now')
            .mockImplementationOnce(() => 1000) // start time
            .mockImplementationOnce(() => 1500); // end time
    });
    describe('profileTaskManager', () => {
        it('should profile TaskManager operations', async () => {
            // Arrange
            taskManager.listTasks = jest.fn().mockResolvedValue([]);
            // Act
            await optimizer.profileTaskManager();
            // Assert
            expect(taskManager.listTasks).toHaveBeenCalled();
        });
    });
    describe('profileIPFSClient', () => {
        it('should profile IPFSClient operations', async () => {
            // Arrange
            ipfsClient.getContent = jest.fn().mockResolvedValue('test content');
            // Act
            await optimizer.profileIPFSClient();
            // Assert
            expect(ipfsClient.getContent).toHaveBeenCalledWith('example-cid');
        });
    });
    describe('profileAgent', () => {
        it('should profile Agent operations', async () => {
            // Arrange
            agent.processMessage = jest.fn().mockResolvedValue({ content: 'response' });
            // Act
            await optimizer.profileAgent();
            // Assert
            expect(agent.processMessage).toHaveBeenCalledWith('Test message');
        });
    });
    describe('optimize', () => {
        it('should run all profiling methods', async () => {
            // Arrange
            const profileTaskManagerSpy = jest.spyOn(optimizer, 'profileTaskManager');
            const profileIPFSClientSpy = jest.spyOn(optimizer, 'profileIPFSClient');
            const profileAgentSpy = jest.spyOn(optimizer, 'profileAgent');
            // Act
            await optimizer.optimize();
            // Assert
            expect(profileTaskManagerSpy).toHaveBeenCalled();
            expect(profileIPFSClientSpy).toHaveBeenCalled();
            expect(profileAgentSpy).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=optimizer.test.js.map